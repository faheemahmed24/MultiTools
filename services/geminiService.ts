import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Transcription, SmartSummary } from '../types';

// API key obtained exclusively from environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const MODELS = {
    primary: 'gemini-3-pro-preview', // High-fidelity for complex transcription
    vision: 'gemini-3-flash-preview',
    lite: 'gemini-flash-lite-latest',
    speech: 'gemini-2.5-flash-preview-tts',
    flash: 'gemini-3-flash-preview',
    image: 'gemini-2.5-flash-image'
};

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
    'mp3': 'audio/mpeg', 
    'wav': 'audio/wav', 
    'm4a': 'audio/mp4', 
    'ogg': 'audio/ogg',
    'mp4': 'video/mp4', 
    'webm': 'video/webm', 
    'mov': 'video/quicktime',
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp'
  };
  return map[ext || ''] || 'application/octet-stream';
}

/**
 * Universal Transcription Engine
 * Optimized for 100+ languages, auto-detection, and high-fidelity speaker diarization.
 */
export const transcribeAudio = async (file: File, languageHint: string = 'auto'): Promise<Omit<Transcription, 'id' | 'date'>> => {
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);

  const transcriptionSchema = {
    type: Type.OBJECT,
    properties: {
      language: { type: Type.STRING, description: "Full name of the detected primary language." },
      languageCode: { type: Type.STRING, description: "BCP-47 language code." },
      segments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.STRING, description: "Timestamp in MM:SS format." },
            endTime: { type: Type.STRING, description: "Timestamp in MM:SS format." },
            speaker: { type: Type.STRING, description: "Identified speaker (e.g., Speaker 1, Speaker 2)." },
            text: { type: Type.STRING, description: "The verbatim transcript for this specific segment." },
          },
          required: ["startTime", "endTime", "speaker", "text"]
        }
      }
    },
    required: ["language", "languageCode", "segments"]
  };

  const response = await ai.models.generateContent({
    model: MODELS.primary,
    contents: { 
        parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: `Universal Transcription Protocol v4.0:
              1. ACTION: Transcribe the provided file with 99.9% verbal accuracy.
              2. LANGUAGE: Automatically detect the primary language from all 100+ global dialects.
              3. CODE-SWITCHING: If multiple languages are spoken (e.g., Mixing Hindi and English), transcribe each part accurately in its native script.
              4. DIARIZATION: Perform high-fidelity speaker separation and identification.
              5. STRUCTURE: Break the content into logical segments with precise timestamps.
              6. HINT: User suggested "${languageHint}". If "auto", strictly rely on the neural audio analysis for global detection.
              7. OUTPUT: Return strictly valid JSON.` 
            }
        ] 
    },
    config: {
        responseMimeType: 'application/json',
        responseSchema: transcriptionSchema,
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return {
    fileName: file.name,
    detectedLanguage: parsed.language || 'Auto-Detected',
    segments: parsed.segments || [],
  };
};

export const runAICommand = async (command: string, file?: File): Promise<string> => {
    const parts: any[] = [{ text: `Act as a senior system architect. Execute this command: ${command}` }];
    if (file) {
        const data = await fileToBase64(file);
        parts.unshift({ inlineData: { mimeType: getMimeType(file), data } });
    }
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: { parts }
    });
    return response.text || "Execution completed.";
};

export const processStructuredTask = async (text: string, taskType: string): Promise<any> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: `Task: ${taskType}\n\nInput Context:\n${text}`,
        config: { 
            systemInstruction: "You are a professional business strategist. Organize the input into a structured report.",
        }
    });
    return response.text || "";
};

export const generateWhiteboardImage = async (canvasBase64: string, prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.image,
        contents: {
            parts: [
                { inlineData: { data: canvasBase64.split(',')[1], mimeType: 'image/png' } },
                { text: `Synthesize this sketch into a high-fidelity digital diagram: ${prompt}` }
            ]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Vision Node Error.");
};

export const translateText = async (text: string, src: string, target: string) => {
    const res = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Translate from ${src} to ${target}.` },
    });
    return res.text || "";
};

export const summarizeText = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: "Provide a high-density summary." },
    });
    return response.text || "";
};

export const correctGrammar = async (text: string, language: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Correct grammar for ${language}.` },
    });
    return response.text || "";
};

export const analyzeImage = async (file: File): Promise<string> => {
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);
  const response = await ai.models.generateContent({
    model: MODELS.vision,
    contents: { 
        parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Universal Vision Node: Perform high-accuracy OCR." }
        ] 
    },
  });
  return response.text || "";
};

export const extractTextFromUrl = async (url: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: `Extract text intel from: ${url}`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "Extraction failed.";
};

export const smartSummarize = async (text: string): Promise<SmartSummary> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            contacts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, info: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["name", "info", "type"] } },
            languages: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            numbers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["label", "value"] } }
        },
        required: ["summary", "contacts", "languages", "keyInsights", "numbers"]
    };
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: `Process Data: ${text}`,
        config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(response.text || '{}');
};

export const pureOrganizeData = async (text: string): Promise<any> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            categories: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["heading", "items"] } },
            structuredTable: { type: Type.ARRAY, items: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } } }
        },
        required: ["categories", "structuredTable"]
    };
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: `Categorize Verbatim: ${text}`,
        config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(response.text || '{}');
};

export const runStrategicPlanning = async (text: string, images: {data: string, mime: string}[] = []): Promise<any> => {
    const imageParts = images.map(img => ({ inlineData: { mimeType: img.mime, data: img.data } }));
    const schema = {
        type: Type.OBJECT,
        properties: {
            mirror: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            strategicAnalysis: { type: Type.STRING },
            missingWorkflows: { type: Type.ARRAY, items: { type: Type.STRING } },
            slides: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.ARRAY, items: { type: Type.STRING } }, visualSuggestion: { type: Type.STRING }, criticalDetail: { type: Type.STRING } }, required: ["title", "content", "visualSuggestion"] } },
            tableData: { type: Type.ARRAY, items: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } } }
        },
        required: ["mirror", "executiveSummary", "strategicAnalysis", "missingWorkflows", "slides", "tableData"]
    };
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: { parts: [...imageParts, { text: `Synthesize Strategic Blueprint for: ${text}` }] },
        config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(response.text || '{}');
};

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.speech,
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};