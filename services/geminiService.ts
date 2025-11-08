
import { GoogleGenAI, Type } from "@google/genai";
import type { TranscriptionData } from "../types";

// Helper to convert file to base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      mimeType: file.type,
      data: base64EncodedData,
    },
  };
};

export const transcribeFile = async (file: File): Promise<TranscriptionData> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  // FIX: Initialize GoogleGenAI with named apiKey parameter
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // FIX: Use a recommended model for complex tasks like multilingual transcription
  const model = "gemini-2.5-pro";

  const audioPart = await fileToGenerativePart(file);

  const prompt = "Please transcribe the audio from the provided file and identify the language spoken.";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [
        { text: prompt },
        audioPart
      ]}],
      config: {
        // FIX: Use responseMimeType and responseSchema for reliable structured JSON output
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: {
              type: Type.STRING,
              description: "The detected language of the speech (e.g., 'English', 'Hindi')."
            },
            transcription: {
              type: Type.STRING,
              description: "The full transcription of the audio."
            }
          },
          required: ["detectedLanguage", "transcription"]
        }
      }
    });
    
    // FIX: Access text directly from the response object
    const text = response.text.trim();
    
    const parsedResult = JSON.parse(text);

    if (parsedResult && typeof parsedResult.detectedLanguage === 'string' && typeof parsedResult.transcription === 'string') {
        return parsedResult;
    } else {
        throw new Error("Invalid JSON structure in response.");
    }
  } catch (error) {
    console.error("Error during transcription:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
         throw new Error("The model returned a response that was not valid JSON. Please try again.");
    }
    throw new Error("Failed to transcribe the file. Please check the console for details.");
  }
};

export const summarizeText = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash"; // Flash is efficient for summarization

  const prompt = `Summarize the following text:\n\n${text}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error during summarization:", error);
    throw new Error("Failed to summarize the text.");
  }
}

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash";

    const prompt = `Translate the following text to ${targetLanguage}. Return only the translated text, without any introductory phrases or explanations.\n\nText:\n"""\n${text}\n"""`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error during translation to ${targetLanguage}:`, error);
        throw new Error(`Failed to translate the text to ${targetLanguage}.`);
    }
};
