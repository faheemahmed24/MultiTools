import { GoogleGenAI, Type } from "@google/genai";
import type { Transcription } from '../types';

// Lazy initialization function for defensive programming
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error("Gemini API Key is missing. Please configure API_KEY in your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
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
  const ext = file.name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'm4a': 'audio/mp4', 'ogg': 'audio/ogg',
    'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime'
  };
  return map[ext || ''] || 'application/octet-stream';
}

export const transcribeAudio = async (file: File, languageHint: string = 'auto'): Promise<Omit<Transcription, 'id' | 'date'>> => {
  const ai = getAIClient();
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);

  const transcriptionSchema = {
    type: Type.OBJECT,
    properties: {
      language: { type: Type.STRING, description: "Detected language name." },
      languageCode: { type: Type.STRING, description: "BCP-47 code." },
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
    required: ["language", "languageCode", "segments"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { 
        parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: `System Command: Transcribe this file. 
              1. AUTO-DETECT: Global language Identification.
              2. DIARIZATION: Distinct speaker identification.
              3. CODE-SWITCHING: Native script preservation.
              4. HINT: User suggested ${languageHint}.
              Output valid JSON.` 
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
    const ai = getAIClient();
    const parts: any[] = [{ text: `Execute: ${command}` }];
    if (file) {
        const data = await fileToBase64(file);
        parts.unshift({ inlineData: { mimeType: getMimeType(file), data } });
    }
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: { parts } });
    return response.text || "";
};
