
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
              1. Auto-detect the language (it could be any language including Arabic, Urdu, Hindi, or English). 
              2. Perform speaker diarization to distinguish between different voices. 
              3. Break the text into logical segments based on pauses or speaker changes.
              4. Language strategy: ${languageHint === 'auto' ? 'Full Auto-detection' : 'The user suggests the language is ' + languageHint}.
              Return the result strictly in the provided JSON format.` 
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

export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Translate from ${sourceLang} to ${targetLang}. Only return the translation.` },
    });
    return response.text?.trim() || "";
};

export const summarizeText = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: `Summarize the following text concisely while preserving key information: ${text}`,
        config: { systemInstruction: `You are an expert summarizer. Provide a clear, bulleted summary if appropriate, or a concise paragraph. Use the same language as the input text.` },
    });
    return response.text?.trim() || "";
};

export const smartSummarize = async (text: string): Promise<SmartSummary> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "A concise paragraph summary of the text." },
            contacts: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        info: { type: Type.STRING, description: "The actual value: phone number, email, or role." },
                        type: { type: Type.STRING, description: "Contact type: email, phone, address, or mention." }
                    },
                    required: ["name", "info", "type"]
                }
            },
            languages: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of languages mentioned or used in the text." },
            keyInsights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key points, facts or findings." },
            numbers: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        label: { type: Type.STRING, description: "What the number represents (e.g. Total Revenue, Account No, Date)." },
                        value: { type: Type.STRING }
                    },
                    required: ["label", "value"]
                }
            }
        },
        required: ["summary", "contacts", "languages", "keyInsights", "numbers"]
    };

    const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: `Analyze the following text and extract structured information: ${text}`,
        config: {
            systemInstruction: "You are a data extraction expert. Identify contacts, people, languages, numerical values, and provide a summary. If some categories are missing, return empty arrays.",
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text || '{}');
};

export const correctGrammar = async (text: string, language: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.primary,
        contents: text,
        config: { systemInstruction: `Fix grammar/punctuation in ${language}. Only return the corrected text.` },
    });
    return response.text?.trim() || "";
};

export const analyzeImage = async (imageFile: File): Promise<string> => {
    const base64Data = await fileToBase64(imageFile);
    const response = await ai.models.generateContent({
        model: MODELS.vision,
        contents: { parts: [{ inlineData: { mimeType: imageFile.type, data: base64Data } }, { text: "Perform high-accuracy OCR." }] },
    });
    return response.text?.trim() || "";
};

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

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
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
