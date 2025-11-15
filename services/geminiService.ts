// Fix: Import GoogleGenAI from @google/genai
import { GoogleGenAI } from "@google/genai";
import type { Transcription } from '../types';

// Fix: Initialize GoogleGenAI with named apiKey parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const base64Data = await fileToBase64(file);

  const audioPart = {
    inlineData: {
      mimeType: file.type,
      data: base64Data,
    },
  };
  
  const textPart = {
      text: `Transcribe this audio with high accuracy. The output must be a JSON object with two keys: "language" (the detected language code, e.g., "en-US") and "segments". The "segments" value must be an array of objects, each with "startTime", "endTime", "speaker", and "text" keys. Include speaker diarization to differentiate speakers, labeling them sequentially (e.g., "SPEAKER_01", "SPEAKER_02"). Timestamps must be in "HH:MM:SS.ms" format. Do not include segments of silence longer than 2 seconds.`
  };

  // Fix: Use correct method to generate content and specify a model
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro', // Using a powerful model for complex tasks like this
    contents: { parts: [audioPart, textPart] },
    config: {
        responseMimeType: 'application/json'
    }
  });

  try {
    // Fix: Access text directly from response.text
    const resultText = response.text.trim();
    // Gemini sometimes wraps JSON in ```json ... ```, so we need to sanitize it
    const sanitizedJson = resultText.replace(/^```json/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(sanitizedJson);

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
    throw new Error("Failed to parse the transcription response from the AI. Please try again.");
  }
};

export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const systemInstruction = `You are a world-class expert translator. Your task is to translate the given text from ${sourceLang === 'auto' ? 'the auto-detected language' : sourceLang} to ${targetLang}. Assume the context of the text is a spoken conversation or monologue, so prefer natural, conversational language where appropriate.
You must provide only the translated text as a response. Do not include any extra information, context, or explanations. Do not wrap the response in quotes or any other formatting.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: text,
        config: {
            systemInstruction,
        },
    });

    return response.text.trim();
};

export const correctGrammar = async (text: string, language: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const systemInstruction = `You are an expert proofreader. Your task is to correct any grammar, spelling, and punctuation errors in the given text. The text is in ${language === 'Auto-detect' ? 'an auto-detected language' : language}.
Your goal is to improve clarity and correctness while preserving the original meaning, tone, and style of the author.
You must provide only the corrected text as a response. Do not include any extra information, context, or explanations. Do not wrap the response in quotes or any other formatting. Just return the corrected text directly.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: text,
        config: {
            systemInstruction,
        },
    });

    return response.text.trim();
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

    // Fix: Use correct method to generate content and specify a model
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // Pro is better for vision tasks
        contents: { parts: [imagePart, textPart] },
    });
    
    // Fix: Access text directly from response.text
    return response.text.trim();
};