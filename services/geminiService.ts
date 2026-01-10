
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Transcription, SmartSummary } from '../types';

// Accessing the API key exclusively from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODELS = {
    primary: 'gemini-3-pro-preview',
    vision: 'gemini-3-flash-preview',
    lite: 'gemini-flash-lite-latest',
    speech: 'gemini-2.5-flash-preview-tts',
    flash: 'gemini-3-flash-preview'
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
    'mp3': 'audio/mp3', 'wav': 'audio/wav', 'm4a': 'audio/mp4', 'ogg': 'audio/ogg',
    'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime'
  };
  return map[ext || ''] || 'audio/mp3';
}

export const transcribeAudio = async (file: File, languageHint: string = 'auto'): Promise<Omit<Transcription, 'id' | 'date'>> => {
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);

  const transcriptionSchema = {
    type: Type.OBJECT,
    properties: {
      language: { type: Type.STRING },
      languageCode: { type: Type.STRING },
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
    model: MODELS.primary,
    contents: { 
        parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: `Transcribe with speaker diarization. Language hint: ${languageHint}` }
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
    detectedLanguage: parsed.language || 'Unknown',
    segments: parsed.segments || [],
  };
};

export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Translate from ${sourceLang} to ${targetLang}.` },
    });
    return response.text || "";
};

export const pureOrganizeData = async (text: string): Promise<any> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: `Organize this data verbatim into JSON categories: ${text}`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};

export const smartSummarize = async (text: string): Promise<SmartSummary> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: `Provide a smart summary and extract entities from: ${text}`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};

// Fix: Exporting summarizeText used in ImageAnalyzer.tsx
export const summarizeText = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: "Provide a concise summary of the following text." },
    });
    return response.text || "";
};

export const runStrategicPlanning = async (text: string, images: {data: string, mime: string}[] = []): Promise<any> => {
    const imageParts = images.map(img => ({ inlineData: { mimeType: img.mime, data: img.data } }));
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: { parts: [...imageParts, { text: `Generate a strategic plan for: ${text}` }] },
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};

export const correctGrammar = async (text: string, language: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Correct grammar and punctuation in ${language}.` },
    });
    return response.text || "";
};

export const analyzeImage = async (imageFile: File): Promise<string> => {
    const base64Data = await fileToBase64(imageFile);
    const response = await ai.models.generateContent({
        model: MODELS.vision,
        contents: { parts: [{ inlineData: { mimeType: imageFile.type, data: base64Data } }, { text: "Perform OCR." }] },
    });
    return response.text || "";
};

export const extractTextFromUrl = async (url: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: `Extract text from: ${url}`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "";
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
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
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
