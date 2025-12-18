
import { GoogleGenAI, Type } from "@google/genai";
import type { Transcription } from '../types';

// Initialize the Google GenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const MODELS = {
    // Primary model for complex tasks like transcription with speaker diarization.
    primary: 'gemini-3-pro-preview',
    // Multimodal model for analyzing images (OCR).
    vision: 'gemini-3-flash-preview',
    // Lightweight model for basic tasks.
    lite: 'gemini-flash-lite-latest'
};

/**
 * Handles content generation with exponential backoff for rate-limiting errors.
 */
async function generateContentWithRetry(
  model: string,
  params: any,
  retries = 3,
  delay = 2000
): Promise<any> {
  try {
    return await ai.models.generateContent({ model, ...params });
  } catch (error: any) {
    const isRetryable = error.status === 429 || error.status === 503 || (error.message && (error.message.includes('429') || error.message.includes('503')));
    
    if (retries > 0 && isRetryable) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return generateContentWithRetry(model, params, retries - 1, delay * 2);
    }
    
    throw new Error(error.message || "An unexpected error occurred.");
  }
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

function getMimeType(file: File): string {
  if (file.type && !file.type.includes('octet-stream')) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    'mp3': 'audio/mp3', 'wav': 'audio/wav', 'm4a': 'audio/mp4', 'ogg': 'audio/ogg',
    'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime'
  };
  return map[ext || ''] || 'audio/mp3';
}

/**
 * Transcribes audio using Gemini 3 Pro with structured JSON output.
 */
export const transcribeAudio = async (file: File, languageHint: string = 'auto'): Promise<Omit<Transcription, 'id' | 'date'>> => {
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);

  const transcriptionSchema = {
    type: Type.OBJECT,
    properties: {
      language: { type: Type.STRING, description: "Detected BCP-47 language code" },
      segments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.STRING },
            endTime: { type: Type.STRING },
            speaker: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ["startTime", "endTime", "speaker", "text"]
        }
      }
    },
    required: ["language", "segments"]
  };

  const response = await generateContentWithRetry(MODELS.primary, {
    contents: { 
        parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: `Transcribe this media file. Language strategy: ${languageHint === 'auto' ? 'Detect precisely (Urdu vs Hindi etc.)' : 'User suggests ' + languageHint}. Return valid JSON.` }
        ] 
    },
    config: {
        responseMimeType: 'application/json',
        responseSchema: transcriptionSchema,
    }
  });

  // Accessing text output via the .text property of GenerateContentResponse.
  const parsed = JSON.parse(response.text);
  return {
    fileName: file.name,
    detectedLanguage: parsed.language,
    segments: parsed.segments,
  };
};

/**
 * Translates text between source and target languages using Pro model for nuances.
 */
export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    const response = await generateContentWithRetry(MODELS.primary, {
        contents: text,
        config: { systemInstruction: `Translate from ${sourceLang} to ${targetLang}. Only return the translation.` },
    });
    return response.text?.trim() || "";
};

/**
 * Corrects grammar in the input text for the specified language.
 */
export const correctGrammar = async (text: string, language: string): Promise<string> => {
    const response = await generateContentWithRetry(MODELS.primary, {
        contents: text,
        config: { systemInstruction: `Fix grammar/punctuation in ${language}. Only return the corrected text.` },
    });
    return response.text?.trim() || "";
};

/**
 * Performs OCR on image files using multimodal Gemini 3 Flash.
 */
export const analyzeImage = async (imageFile: File): Promise<string> => {
    const base64Data = await fileToBase64(imageFile);
    const response = await generateContentWithRetry(MODELS.vision, {
        contents: { parts: [{ inlineData: { mimeType: imageFile.type, data: base64Data } }, { text: "Perform high-accuracy OCR." }] },
    });
    return response.text?.trim() || "";
};
