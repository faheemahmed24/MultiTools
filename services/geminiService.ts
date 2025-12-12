
// Fix: Import GoogleGenAI from @google/genai
import { GoogleGenAI, Type } from "@google/genai";
import type { Transcription } from '../types';

// Fix: Initialize GoogleGenAI with named apiKey parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const MODELS = {
    primary: 'gemini-2.5-flash',
    fallback: 'gemini-flash-lite-latest'
};

// Helper to handle API errors, retries, and model fallback
async function generateContentWithRetry(
  model: string,
  params: any,
  retries = 3,
  delay = 2000,
  allowFallback = true
): Promise<any> {
  try {
    return await ai.models.generateContent({ model, ...params });
  } catch (error: any) {
    const isQuotaError = error.status === 429 || (error.message && error.message.includes('429'));
    const isServerError = error.status === 503 || (error.message && error.message.includes('503'));
    
    // Retry with exponential backoff
    if (retries > 0 && (isQuotaError || isServerError)) {
      // If it's a quota error, wait a bit longer (minimum 5 seconds) to let the bucket refill
      const waitTime = isQuotaError ? Math.max(delay, 5000) : delay;
      console.warn(`API request to ${model} failed (Status: ${error.status || 'Unknown'}). Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return generateContentWithRetry(model, params, retries - 1, delay * 2, allowFallback);
    }
    
    // Fallback strategy: If primary model fails with quota/server error, try fallback model
    if (allowFallback && model === MODELS.primary && (isQuotaError || isServerError)) {
        console.warn(`Primary model ${model} exhausted. Switching to fallback model ${MODELS.fallback}.`);
        // Wait a moment before hitting the fallback to avoid immediate rejection if quotas are shared
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // Retry the fallback model with a fresh retry counter
        return generateContentWithRetry(MODELS.fallback, params, 2, 4000, false);
    }
    
    // Construct a user-friendly error message
    let message = error.message || "An unexpected error occurred.";
    
    if (isQuotaError) {
       message = "Daily or per-minute usage limit exceeded. The system is pacing requests, but you may need to wait a moment before trying again.";
    } else if (isServerError) {
       message = "The AI service is temporarily unavailable. Please try again in a few moments.";
    } else if (error.message && error.message.includes("413")) {
       message = "The file is too large for the AI to process directly. Please try a smaller file (under 20MB).";
    } else {
        try {
            // Attempt to parse JSON error response
            if (typeof message === 'string' && (message.startsWith('{') || message.startsWith('['))) {
                const parsed = JSON.parse(message);
                if (parsed.error && parsed.error.message) {
                    message = parsed.error.message;
                } else if (parsed.message) {
                    message = parsed.message;
                }
            }
        } catch (e) {
            // Fallback to original message if parsing fails
        }
    }
    
    throw new Error(message);
  }
}

// A utility function to convert a file to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // a base64 string is the part after "base64,"
      const result = (reader.result as string).split(',')[1];
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper to determine MIME type if missing or generic
function getMimeType(file: File): string {
  // If the browser detected a specific audio/video type, use it.
  if (file.type && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      return file.type;
  }
  
  // Fallback to extension-based detection
  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'mp3': return 'audio/mp3';
    case 'wav': return 'audio/wav';
    case 'ogg': return 'audio/ogg';
    case 'm4a': return 'audio/mp4'; 
    case 'aac': return 'audio/aac';
    case 'flac': return 'audio/flac';
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    case 'mov': return 'video/quicktime';
    case 'avi': return 'video/x-msvideo';
    case 'mpeg': return 'video/mpeg';
    case 'mpg': return 'video/mpeg';
    default: return 'audio/mp3'; // Safe default for unknown audio
  }
}

export const transcribeAudio = async (file: File): Promise<Omit<Transcription, 'id' | 'date'>> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  // Check file size (20MB limit for inline data)
  const MAX_SIZE_BYTES = 19 * 1024 * 1024; // ~19MB to be safe
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). The current limit for direct upload is 20MB.`);
  }

  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);

  const audioPart = {
    inlineData: {
      mimeType: mimeType,
      data: base64Data,
    },
  };
  
  const textPart = {
      text: `You are a professional transcription assistant. Your task is to transcribe the spoken content from the provided media file verbatim.
      
      Requirements:
      1. **Accuracy**: Transcribe every word exactly as spoken. Do not summarize or paraphrase.
      2. **Language Detection**: Automatically detect the primary language of the audio and provide the BCP-47 language code (e.g., 'en-US', 'hi-IN', 'es-ES', 'ar-SA', 'ur-PK') in the 'language' field.
      3. **Speaker Diarization**: Identify different speakers and label them consistently (e.g., Speaker 1, Speaker 2).
      4. **Timestamps**: Provide precise start and end times for each segment in "HH:MM:SS" format.
      5. **Segments**: Break down the transcription into logical segments based on speaker changes or natural pauses.
      
      Output must be strictly valid JSON matching the provided schema.`
  };

  // Define the strict schema for the response
  const transcriptionSchema = {
    type: Type.OBJECT,
    properties: {
      language: { 
        type: Type.STRING, 
        description: "The detected language code of the audio (e.g., 'en-US', 'hi-IN')." 
      },
      segments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.STRING, description: "Start time of the segment" },
            endTime: { type: Type.STRING, description: "End time of the segment" },
            speaker: { type: Type.STRING, description: "The speaker label" },
            text: { type: Type.STRING, description: "The transcribed text" },
          },
          required: ["startTime", "endTime", "speaker", "text"]
        }
      }
    },
    required: ["language", "segments"]
  };

  const safetySettings = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  ];

  // Fix: Use retry helper with responseSchema
  const response = await generateContentWithRetry(MODELS.primary, {
    contents: { parts: [audioPart, textPart] },
    config: {
        responseMimeType: 'application/json',
        responseSchema: transcriptionSchema,
    },
    safetySettings: safetySettings,
  });

  try {
    const resultText = response.text;
    
    if (!resultText) {
       // Check if there are other candidates or refusal reasons
       const candidate = response.candidates?.[0];
       if (candidate?.finishReason === 'SAFETY') {
          throw new Error("The content was blocked by safety filters. Please try a different file.");
       }
       throw new Error("Received empty response from AI.");
    }

    const cleanText = resultText.trim();
    
    // Robust JSON extraction: find the first '{' and last '}'
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    let jsonString = cleanText;
    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = cleanText.substring(firstBrace, lastBrace + 1);
    }
    
    const parsed = JSON.parse(jsonString);

    if (!parsed.language || !Array.isArray(parsed.segments)) {
        throw new Error("Invalid JSON structure: missing language or segments.");
    }

    return {
      fileName: file.name,
      detectedLanguage: parsed.language,
      segments: parsed.segments,
    };
  } catch (error: any) {
    console.error("Transcription Error:", error);
    if (error.message.includes("SAFETY")) {
        throw error;
    }
    throw new Error("Failed to process the transcription. The AI response might have been malformed or incomplete. Please try again with a clearer or shorter audio file.");
  }
};

export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const systemInstruction = `You are a world-class expert translator. Your task is to translate the given text from ${sourceLang === 'auto' ? 'the auto-detected language' : sourceLang} to ${targetLang}. Assume the context of the text is a spoken conversation or monologue, so prefer natural, conversational language where appropriate.
You must provide only the translated text as a response. Do not include any extra information, context, or explanations. Do not wrap the response in quotes or any other formatting.`;

    const response = await generateContentWithRetry(MODELS.primary, {
        contents: text,
        config: {
            systemInstruction,
        },
    });

    return response.text?.trim() || "";
};

export const correctGrammar = async (text: string, language: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const systemInstruction = `You are an expert proofreader. Your task is to correct any grammar, spelling, and punctuation errors in the given text. The text is in ${language === 'Auto-detect' ? 'an auto-detected language' : language}.
Your goal is to improve clarity and correctness while preserving the original meaning, tone, and style of the author.
You must provide only the corrected text as a response. Do not include any extra information, context, or explanations. Do not wrap the response in quotes or any other formatting. Just return the corrected text directly.`;

    const response = await generateContentWithRetry(MODELS.primary, {
        contents: text,
        config: {
            systemInstruction,
        },
    });

    return response.text?.trim() || "";
};

export const analyzeImage = async (imageFile: File): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const base64Data = await fileToBase64(imageFile);

    const imagePart = {
        inlineData: {
            mimeType: imageFile.type,
            data: base64Data,
        },
    };

    const textPart = { text: "Perform Optical Character Recognition (OCR) on this image with the highest possible accuracy. Extract all visible text, maintaining the original reading order and structure as much as possible. If the text is in columns, transcribe column by column. Do not add any commentary, just return the extracted text." };

    const response = await generateContentWithRetry(MODELS.primary, {
        contents: { parts: [imagePart, textPart] },
    });
    
    return response.text?.trim() || "";
};
