
// Fix: Import GoogleGenAI from @google/genai
import { GoogleGenAI, Type } from "@google/genai";
import type { Transcription } from '../types';

// Lazy initialization to prevent crash on load if API Key is missing
let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = process.env.API_KEY || '';
    // We initialize even with empty key so the app loads. 
    // Specific calls will fail gracefully later if key is invalid.
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

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
  const client = getAiClient();
  try {
    return await client.models.generateContent({ model, ...params });
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

export const transcribeAudio = async (file: File): Promise<Omit<Transcription, 'id' | 'date'>> => {
  // Check for key at runtime when feature is used
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your deployment settings.");
  }

  const base64Data = await fileToBase64(file);

  const audioPart = {
    inlineData: {
      mimeType: file.type,
      data: base64Data,
    },
  };
  
  const textPart = {
      text: `Transcribe this audio with high accuracy. Include speaker diarization to differentiate speakers, labeling them sequentially (e.g., "SPEAKER_01", "SPEAKER_02"). Timestamps must be in "HH:MM:SS.ms" format. Do not include segments of silence longer than 2 seconds.`
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
            startTime: { type: Type.STRING, description: "Start time of the segment in HH:MM:SS.ms format" },
            endTime: { type: Type.STRING, description: "End time of the segment in HH:MM:SS.ms format" },
            speaker: { type: Type.STRING, description: "The speaker label (e.g., SPEAKER_01)" },
            text: { type: Type.STRING, description: "The transcribed text" },
          },
          required: ["startTime", "endTime", "speaker", "text"]
        }
      }
    },
    required: ["language", "segments"]
  };

  // Fix: Use retry helper with responseSchema
  const response = await generateContentWithRetry(MODELS.primary, {
    contents: { parts: [audioPart, textPart] },
    config: {
        responseMimeType: 'application/json',
        responseSchema: transcriptionSchema
    }
  });

  try {
    // Fix: Access text directly from response.text
    const resultText = response.text.trim();
    
    // Robust JSON extraction: find the first '{' and last '}'
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');
    
    let jsonString = resultText;
    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = resultText.substring(firstBrace, lastBrace + 1);
    }
    
    const parsed = JSON.parse(jsonString);

    if (!parsed.language || !Array.isArray(parsed.segments)) {
        throw new Error("Invalid JSON structure from Gemini API");
    }

    return {
      fileName: file.name,
      detectedLanguage: parsed.language,
      segments: parsed.segments,
    };
  } catch (error) {
    console.error("Error parsing Gemini response:", response.text, error);
    throw new Error("Failed to parse the transcription response. The AI might have returned an invalid format. Please try again.");
  }
};

export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing. Please check your deployment settings.");
    }

    const systemInstruction = `You are a world-class expert translator. Your task is to translate the given text from ${sourceLang === 'auto' ? 'the auto-detected language' : sourceLang} to ${targetLang}. Assume the context of the text is a spoken conversation or monologue, so prefer natural, conversational language where appropriate.
You must provide only the translated text as a response. Do not include any extra information, context, or explanations. Do not wrap the response in quotes or any other formatting.`;

    const response = await generateContentWithRetry(MODELS.primary, {
        contents: text,
        config: {
            systemInstruction,
        },
    });

    return response.text.trim();
};

export const correctGrammar = async (text: string, language: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing. Please check your deployment settings.");
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

    return response.text.trim();
};

export const analyzeImage = async (imageFile: File): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing. Please check your deployment settings.");
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
    
    return response.text.trim();
};
