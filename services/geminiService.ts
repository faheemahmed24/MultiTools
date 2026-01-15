import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Transcription, SmartSummary } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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

/**
 * Organizes messy data verbatim into categories using Gemini 3 Pro.
 */
export const pureOrganizeData = async (text: string): Promise<any> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            categories: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        heading: { type: Type.STRING, description: "Category name e.g. Contact Details, Task List, Financials" },
                        items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Verbatim phrases or lines from the input text" }
                    },
                    required: ["heading", "items"]
                }
            },
            structuredTable: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        field: { type: Type.STRING },
                        value: { type: Type.STRING }
                    },
                    required: ["field", "value"]
                }
            }
        },
        required: ["categories", "structuredTable"]
    };

    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: `SYSTEM INSTRUCTION: You are a Pure Data Organizer. Your task is to take the provided messy text and organize it into logical categories. 
        CRITICAL RULE: DO NOT change, summarize, or paraphrase any words. Use the exact wording from the input. Only categorize and structure. 
        Input Text: ${text}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        }
    });

    return JSON.parse(response.text || '{}');
};

/**
 * Runs strategic planning analysis with support for text and multimodal image inputs.
 */
export const runStrategicPlanning = async (text: string, images: {data: string, mime: string}[] = []): Promise<any> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            mirror: { type: Type.STRING, description: "A verbatim reflection of the key data points provided." },
            executiveSummary: { type: Type.STRING },
            strategicAnalysis: { type: Type.STRING },
            missingWorkflows: { type: Type.ARRAY, items: { type: Type.STRING } },
            slides: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.ARRAY, items: { type: Type.STRING } },
                        visualSuggestion: { type: Type.STRING },
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
                        Task: { type: Type.STRING },
                        Owner: { type: Type.STRING },
                        Deadline: { type: Type.STRING },
                        Priority: { type: Type.STRING }
                    }
                }
            }
        },
        required: ["mirror", "executiveSummary", "strategicAnalysis", "missingWorkflows", "slides", "tableData"]
    };

    const imageParts = images.map(img => ({
        inlineData: { data: img.data, mimeType: img.mime }
    }));

    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: {
            parts: [
                ...imageParts,
                { text: `Analyze the following strategic input and generate a comprehensive blueprint.
                Text input: ${text}
                Requirements:
                1. Mirror the data exactly as provided in the 'mirror' field.
                2. Provide executive and strategic analysis.
                3. Identify gaps in workflows.
                4. Create a slide deck structure.
                5. Format key tasks into a table data array.` }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text || '{}');
};

/**
 * Transcribes audio or video media with diarization.
 */
export const transcribeAudio = async (file: File, languageHint: string = 'auto'): Promise<Omit<Transcription, 'id' | 'date'>> => {
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);

  const transcriptionSchema = {
    type: Type.OBJECT,
    properties: {
      language: { type: Type.STRING, description: "Full name of the detected language (e.g. English, Urdu, Hindi, Arabic)" },
      languageCode: { type: Type.STRING, description: "BCP-47 language code" },
      segments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.STRING, description: "Format MM:SS or HH:MM:SS" },
            endTime: { type: Type.STRING, description: "Format MM:SS or HH:MM:SS" },
            speaker: { type: Type.STRING, description: "Speaker identifier, e.g. Speaker 1, Speaker 2" },
            text: { type: Type.STRING, description: "The transcribed text for this segment" },
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
            { text: `Transcribe this media file with high precision. 
              1. Auto-detect the language. 
              2. Perform speaker diarization. 
              3. Language hint: ${languageHint}.
              Return JSON.` 
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
    detectedLanguage: parsed.language || 'Unknown',
    segments: parsed.segments || [],
  };
};

/**
 * Translates text between languages.
 */
export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Translate from ${sourceLang} to ${targetLang}. Only return the translation.` },
    });
    return response.text?.trim() || "";
};

/**
 * Summarizes text content concisely.
 */
export const summarizeText = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: `Summarize: ${text}`,
    });
    return response.text?.trim() || "";
};

/**
 * Extracts entities and structured data using Smart Summary.
 */
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

/**
 * Corrects grammar and punctuation in text.
 */
export const correctGrammar = async (text: string, language: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Fix grammar/punctuation in ${language}. Only return the corrected text.` },
    });
    return response.text?.trim() || "";
};

/**
 * Performs OCR analysis on image files.
 */
export const analyzeImage = async (imageFile: File): Promise<string> => {
    const base64Data = await fileToBase64(imageFile);
    const response = await ai.models.generateContent({
        model: MODELS.vision,
        contents: { parts: [{ inlineData: { mimeType: imageFile.type, data: base64Data } }, { text: "Perform high-accuracy OCR." }] },
    });
    return response.text?.trim() || "";
};

/**
 * Extracts primary text content from a URL using Google Search.
 */
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

/**
 * Decodes base64 string to Uint8Array.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer.
 */
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

/**
 * Generates speech audio from text using Gemini TTS.
 */
export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.speech,
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                },
            },
        },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned from AI");
    return base64Audio;
};