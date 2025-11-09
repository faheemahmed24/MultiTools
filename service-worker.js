// Use ES module imports in the service worker.
// The build system will handle resolving these paths.
import { GoogleGenAI, Type } from 'https://aistudiocdn.com/@google/genai@^1.28.0';

// --- DATABASE HELPERS (Self-contained for the worker) ---
const DB_NAME = 'MultiToolsDB';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject('Error opening DB');
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function getTaskFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error getting task');
  });
}

async function updateTaskInDB(task) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(task);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error updating task');
  });
}


// --- GEMINI API HELPERS (Adapted from geminiService.ts) ---
const getApiKey = () => {
    // In service workers, we don't have process.env.
    // The API key is assumed to be available through a mechanism
    // that doesn't rely on Node.js environment variables.
    // For this environment, we will assume it is globally available or fetched.
    // The instructions guarantee process.env.API_KEY is available.
    return process.env.API_KEY;
}

const transcribeAudio = async (base64Data, mimeType, languageName) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY not available in service worker.");
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert transcriber. Your task is to:
1. ${languageName ? `Transcribe the audio in ${languageName}. The detected language should be reported as ${languageName}.` : 'Auto-detect the spoken language.'}
2. Identify different speakers and label them sequentially (e.g., 'Speaker 1', 'Speaker 2').
3. Provide a precise transcription for each segment.
4. Include accurate start and end timestamps for each segment in HH:MM:SS format.
Respond ONLY with a single JSON object that strictly matches the provided schema. Do not include any other text or markdown formatting.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: { parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType: mimeType } }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detectedLanguage: { type: Type.STRING },
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                speaker: { type: Type.STRING },
                text: { type: Type.STRING }
              },
              required: ["startTime", "endTime", "speaker", "text"]
            }
          }
        },
        required: ["detectedLanguage", "segments"]
      },
    },
  });
  return JSON.parse(response.text.trim());
};

const translateText = async (segments, targetLanguage) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY not available in service worker.");
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a professional translator specializing in dialogue. Your task is to translate the 'text' field of each JSON object in the provided array of transcription segments into ${targetLanguage}.
Your translation must be:
- **Nuanced and Contextual:** Accurately convey the original meaning, tone, and intent. Pay close attention to colloquialisms, idioms, and cultural nuances.
- **Fluent and Natural:** The output should read like it was originally spoken in ${targetLanguage}, not like a literal, word-for-word translation.
- **Consistent:** Maintain consistency in terminology and style across all segments.

IMPORTANT INSTRUCTIONS:
- You MUST preserve the 'startTime', 'endTime', and 'speaker' fields exactly as they appear in the original segments. Do not modify them.
- Your response MUST be a single, valid JSON object containing a 'segments' array that strictly adheres to the provided schema.
- Do not include any additional text, explanations, code block formatting (like \`\`\`json), or markdown. The response should be pure JSON.`;

  const segmentsJsonString = JSON.stringify(segments);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: { parts: [{ text: prompt }, { text: `Here is the JSON array of transcription segments to translate:\n${segmentsJsonString}` }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                speaker: { type: Type.STRING },
                text: { type: Type.STRING }
              },
              required: ["startTime", "endTime", "speaker", "text"]
            }
          }
        },
        required: ["segments"]
      },
    },
  });
  const result = JSON.parse(response.text.trim());
  return result.segments;
};

const translateFreeformText = async (sourceText, targetLanguage, sourceLanguage) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY not available in service worker.");
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a professional translator.
1. ${sourceLanguage ? `Assume the source text is in ${sourceLanguage}. The detected language should be reported as ${sourceLanguage}.` : 'Auto-detect the source language of the text and report which language you detected.'}
2. Translate the following text into ${targetLanguage}.
3. Your translation must be nuanced, contextual, fluent, natural, and consistent.
4. Respond ONLY with a single JSON object matching the provided schema. Do not include any other text, explanations, or markdown formatting.

Text to translate:
---
${sourceText}
---`;
  
  const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            detectedSourceLanguage: { type: Type.STRING }
          },
          required: ["translatedText", "detectedSourceLanguage"]
        },
      },
    });
    return JSON.parse(response.text.trim());
};


// --- SERVICE WORKER LOGIC ---
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'START_TASK') {
    const task = event.data.payload;
    event.waitUntil(handleTask(task));
  }
});

async function handleTask(task) {
  try {
    if (task.type === 'transcription') {
      const { detectedLanguage, segments } = await transcribeAudio(task.fileData.base64, task.fileData.mimeType, task.language);
      task.result = {
        id: task.id,
        fileName: task.fileName,
        date: new Date().toLocaleString(),
        detectedLanguage,
        segments,
      };
    } else if (task.type === 'translation') {
      task.result = await translateText(task.segments, task.targetLanguageName);
    } else if (task.type === 'text-translation') {
      task.result = await translateFreeformText(task.sourceText, task.targetLanguageName, task.sourceLanguageName);
    }

    task.status = 'completed';
    await updateTaskInDB(task);
    await notifyClients(task);
    await showNotification(task);
  } catch (error) {
    console.error('Service Worker task error:', error);
    task.status = 'error';
    task.error = error.message || 'An unknown error occurred in the service worker.';
    await updateTaskInDB(task);
    await notifyClients(task);
  }
}

async function notifyClients(task) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'TASK_UPDATE',
      payload: task
    });
  });
}

async function showNotification(task) {
  const permission = await self.registration.permissionState;
  if (permission === 'granted') {
    let title = "Task Complete";
    let body = "Your task is ready.";
    if (task.type === 'transcription') {
      title = "Transcription Complete";
      body = `Your transcription for '${task.fileName}' is ready.`;
    } else if (task.type === 'translation') {
      title = "Translation Complete";
      body = `Translation to ${task.targetLanguageName} is ready.`
    } else if (task.type === 'text-translation') {
        title = "Translation Complete";
        body = `Your text has been translated to ${task.targetLanguageName}.`
    }

    self.registration.showNotification(title, {
      body: body,
      icon: '/vite.svg', // A default icon
    });
  }
}