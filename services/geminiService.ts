import { GoogleGenAI, Type } from "@google/genai";
import type { TranscriptionSegment } from "../types";

export const transcribeAudio = async (base64Data: string, mimeType: string): Promise<{ detectedLanguage: string; segments: TranscriptionSegment[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Fix: Updated prompt to request timestamps with milliseconds for better SRT export precision.
  const prompt = `You are an expert transcriber. Your task is to:
1. Auto-detect the spoken language.
2. Identify different speakers and label them sequentially (e.g., 'Speaker 1', 'Speaker 2').
3. Provide a precise transcription for each segment.
4. Include accurate start and end timestamps for each segment in HH:MM:SS.sss format.
Respond ONLY with a single JSON object that strictly matches the provided schema. Do not include any other text or markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: {
              type: Type.STRING,
              description: "The automatically detected language of the audio (e.g., 'English', 'Arabic')."
            },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: {
                    type: Type.STRING,
                    // Fix: Updated schema description to match the requested timestamp format.
                    description: "The start time of the segment in HH:MM:SS.sss format."
                  },
                  endTime: {
                    type: Type.STRING,
                    // Fix: Updated schema description to match the requested timestamp format.
                    description: "The end time of the segment in HH:MM:SS.sss format."
                  },
                  speaker: {
                    type: Type.STRING,
                    description: "The identified speaker label (e.g., 'Speaker 1')."
                  },
                  text: {
                    type: Type.STRING,
                    description: "The transcribed text for the segment."
                  }
                },
                required: ["startTime", "endTime", "speaker", "text"]
              }
            }
          },
          required: ["detectedLanguage", "segments"]
        },
      },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};