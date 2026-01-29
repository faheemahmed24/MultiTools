
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Transcription, SmartSummary } from '../types';

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
    'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'm4a': 'audio/mp4', 'ogg': 'audio/ogg',
    'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime', 'pdf': 'application/pdf'
  };
  return map[ext || ''] || 'application/octet-stream';
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
            { text: `Transcribe/Extract the provided media/document. Language Strategy: ${languageHint}. Use high-fidelity speaker diarization for audio/video.` }
        ] 
    },
    config: { responseMimeType: 'application/json', responseSchema: transcriptionSchema }
  });

  const parsed = JSON.parse(response.text || '{}');
  return {
    fileName: file.name,
    detectedLanguage: parsed.language || 'Unknown',
    segments: parsed.segments || [],
  };
};

export const runAICommand = async (command: string, file?: File): Promise<string> => {
    const parts: any[] = [{ text: `System: Act as an expert AI Copilot. Execute this command precisely: ${command}` }];
    if (file) {
        const data = await fileToBase64(file);
        parts.unshift({ inlineData: { mimeType: getMimeType(file), data } });
    }
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: { parts }
    });
    return response.text || "Command execution returned empty result.";
};

export const generateWhiteboardImage = async (canvasBase64: string, prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.image,
        contents: {
            parts: [
                { inlineData: { data: canvasBase64.split(',')[1], mimeType: 'image/png' } },
                { text: `Analyze this sketch and regenerate it as a high-fidelity professional digital asset. ${prompt}` }
            ]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Vision engine failed to generate image.");
};

export const translateText = async (text: string, src: string, target: string) => {
    const res = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Translate from ${src} to ${target}. Only return the translation.` },
    });
    return res.text || "";
};

// Fix: Added missing summarizeText export for ImageAnalyzer.tsx
export const summarizeText = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: "Summarize this text concisely." },
    });
    return response.text || "";
};

// Fix: Added missing correctGrammar export for GrammarCorrector.tsx
export const correctGrammar = async (text: string, language: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Fix grammar/punctuation in ${language}. Only return the corrected text.` },
    });
    return response.text || "";
};

// Fix: Added missing analyzeImage export for ImageAnalyzer, PdfToImage, and ImageToPdf components
export const analyzeImage = async (file: File): Promise<string> => {
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);
  const response = await ai.models.generateContent({
    model: MODELS.vision,
    contents: { 
        parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Perform high-accuracy OCR and extract all text from this image." }
        ] 
    },
  });
  return response.text || "";
};

// Fix: Added missing extractTextFromUrl export for TextToSpeech.tsx
export const extractTextFromUrl = async (url: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: `Fetch and extract the primary text content from this URL: ${url}. Return ONLY the extracted text in its original language.`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return response.text || "Failed to extract text content.";
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
        contents: `Categorize: ${text}`,
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
        contents: `Organize verbatim: ${text}`,
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
        contents: { parts: [...imageParts, { text: `Blueprint for: ${text}` }] },
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
