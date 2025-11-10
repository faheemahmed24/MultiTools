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
      text: `Transcribe this audio. Provide the output as a JSON object with two keys: "language" (the detected language code, e.g., "en-US") and "segments". The "segments" key should be an array of objects, where each object has "startTime", "endTime", "speaker" (e.g., "SPEAKER_01"), and "text" keys. The timestamps should be in "HH:MM:SS.ms" format. For example: {"language": "en-US", "segments": [{"startTime": "00:00:00.123", "endTime": "00:00:02.456", "speaker": "SPEAKER_01", "text": "Hello, world."}]}`
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

    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Return only the translated text, without any additional explanation or context.\n\nText: "${text}"`;

    // Fix: Use correct method to generate content and specify a model
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Flash is good for quick text tasks
        contents: prompt,
    });
    
    // Fix: Access text directly from response.text
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

    const textPart = { text: "Extract all text visible in this image. Return only the extracted text, without any additional comments, formatting, or explanations." };

    // Fix: Use correct method to generate content and specify a model
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // Pro is better for vision tasks
        contents: { parts: [imagePart, textPart] },
    });
    
    // Fix: Access text directly from response.text
    return response.text.trim();
};