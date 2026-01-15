
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Transcription, SmartSummary } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const MODELS = {
    primary: 'gemini-3-pro-preview', // High reasoning
    vision: 'gemini-3-flash-preview', 
    lite: 'gemini-flash-lite-latest',
    speech: 'gemini-2.5-flash-preview-tts',
    flash: 'gemini-3-flash-preview'
};

// Helper function to convert File to base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

export const transcribeAudio = async (file: File, languageHint: string = 'auto'): Promise<Omit<Transcription, 'id' | 'date'>> => {
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);

  const transcriptionSchema = {
    type: Type.OBJECT,
    properties: {
      language: { type: Type.STRING, description: "Full name of the detected language" },
      languageCode: { type: Type.STRING, description: "BCP-47 language code" },
      segments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.STRING, description: "Format MM:SS" },
            endTime: { type: Type.STRING, description: "Format MM:SS" },
            speaker: { type: Type.STRING, description: "Speaker identifier" },
            text: { type: Type.STRING, description: "Transcribed text" },
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
            { text: `Transcribe with high precision. Auto-detect language. Distinguish voices. Return JSON.` }
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

export const runStrategicPlanning = async (text: string, images: {data: string, mime: string}[] = []): Promise<any> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            mirror: { 
                type: Type.STRING, 
                description: "A faithful restatement of every raw detail provided by the user, organized logically." 
            },
            executiveSummary: { type: Type.STRING },
            strategicAnalysis: { type: Type.STRING },
            missingWorkflows: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Workflows or details usually required for this plan that the user missed."
            },
            slides: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.ARRAY, items: { type: Type.STRING } },
                        visualSuggestion: { type: Type.STRING, description: "Chart type or icon suggestion" },
                        criticalDetail: { type: Type.STRING }
                    },
                    required: ["title", "content", "visualSuggestion"]
                }
            },
            tableData: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        department: { type: Type.STRING },
                        task: { type: Type.STRING },
                        deadline: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ["department", "task", "description"]
                }
            }
        },
        required: ["mirror", "executiveSummary", "strategicAnalysis", "missingWorkflows", "slides", "tableData"]
    };

    const parts = images.map(img => ({ inlineData: { mimeType: img.mime, data: img.data } }));
    parts.push({ text: `Act as a Strategic Data Architect. Analyze the provided content. Input: ${text}` } as any);

    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        }
    });

    return JSON.parse(response.text || '{}');
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

export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: text,
        config: { systemInstruction: `Translate from ${sourceLang} to ${targetLang}. Only return the translation.` },
    });
    return response.text?.trim() || "";
};

export const summarizeText = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: `Summarize: ${text}`,
    });
    return response.text?.trim() || "";
};

export const smartSummarize = async (text: string): Promise<SmartSummary> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            contacts: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        info: { type: Type.STRING },
                        type: { type: Type.STRING }
                    },
                    required: ["name", "info", "type"]
                }
            },
            languages: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            numbers: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        label: { type: Type.STRING },
                        value: { type: Type.STRING }
                    },
                    required: ["label", "value"]
                }
            }
        },
        required: ["summary", "contacts", "languages", "keyInsights", "numbers"]
    };

    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: `Analyze and extract data: ${text}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text || '{}');
};

export const correctGrammar = async (text: string, language: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: text,
        config: { systemInstruction: `Fix grammar in ${language}.` },
    });
    return response.text?.trim() || "";
};

export const analyzeImage = async (imageFile: File): Promise<string> => {
    const base64Data = await fileToBase64(imageFile);
    const response = await ai.models.generateContent({
        model: MODELS.vision,
        contents: { parts: [{ inlineData: { mimeType: imageFile.type, data: base64Data } }, { text: "Perform OCR." }] },
    });
    return response.text?.trim() || "";
};

export const extractTextFromUrl = async (url: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: `Extract text from: ${url}.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "Failed to extract.";
};

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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
    return response.candidates?.[0]?.content?.parts[0]?.inlineData?.data || "";
};
