
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Transcription, SmartSummary } from '../types';

// API key obtained exclusively from environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const MODELS = {
    primary: 'gemini-3-pro-preview',
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
 * Universal Transcriber/Extractor Node
 * Processes Audio, Video, and Documents (PDF/Images)
 */
export const transcribeAudio = async (file: File, languageHint: string = 'auto'): Promise<Omit<Transcription, 'id' | 'date'>> => {
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);

  const transcriptionSchema = {
    type: Type.OBJECT,
    properties: {
      language: { type: Type.STRING, description: "Full name of the primary detected language" },
      languageCode: { type: Type.STRING, description: "BCP-47 language code" },
      segments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.STRING, description: "Timestamp (MM:SS) or Section Name" },
            endTime: { type: Type.STRING, description: "Timestamp (MM:SS) or Page Reference" },
            speaker: { type: Type.STRING, description: "Speaker ID or Content Category" },
            text: { type: Type.STRING, description: "Verbatim content" },
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
            { text: `System Protocol: 
              1. If Audio/Video: Transcribe with 99.9% verbal accuracy. Identify distinct speakers. Detect ALL languages automatically including code-switching (e.g. Hinglish, Arabish).
              2. If PDF/Image: Perform high-fidelity OCR. Preserve structure, headings, and lists as segments.
              3. Context: ${languageHint === 'auto' ? 'Global Universal Detection' : 'Priority given to ' + languageHint}.
              4. Respond ONLY with valid JSON.` 
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
    detectedLanguage: parsed.language || 'Detected Language',
    segments: parsed.segments || [],
  };
};

export const runAICommand = async (command: string, file?: File): Promise<string> => {
    const parts: any[] = [{ text: `Act as a High-Level Intelligence Copilot. Command: ${command}. Context: Process any provided data with professional rigor.` }];
    if (file) {
        const data = await fileToBase64(file);
        parts.unshift({ inlineData: { mimeType: getMimeType(file), data } });
    }
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: { parts }
    });
    return response.text || "Execution complete.";
};

export const processStructuredTask = async (text: string, taskType: string): Promise<any> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: `Architectural Task: ${taskType}\n\nDataset:\n${text}`,
        config: { 
            systemInstruction: "You are a professional business strategy node. Return high-fidelity structured analysis.",
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
                { text: `Morphic Regeneration: ${prompt}. Convert this sketch into a professional enterprise-grade diagram or asset.` }
            ]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Generative Vision Link Timeout.");
};

export const translateText = async (text: string, src: string, target: string) => {
    const res = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Translate from ${src} to ${target}. Return ONLY the translated string.` },
    });
    return res.text || "";
};

export const summarizeText = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: "Generate a high-density executive summary." },
    });
    return response.text || "";
};

export const correctGrammar = async (text: string, language: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Refine grammar/syntax for ${language}. Preserve the professional tone.` },
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
            { text: "Universal Vision Node: Extract text, identify objects, and analyze composition." }
        ] 
    },
  });
  return response.text || "";
};

export const extractTextFromUrl = async (url: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: `Scrape and extract intelligence from: ${url}`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "Node Scrape Failed.";
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
        contents: `Deep Extract: ${text}`,
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
        contents: `Verbatim Clustering: ${text}`,
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
        contents: { parts: [...imageParts, { text: `Full Strategic Blueprint: ${text}` }] },
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
