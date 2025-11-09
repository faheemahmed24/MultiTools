import { GoogleGenAI, Type } from "@google/genai";
import type { TranscriptionSegment } from "../types";

export const transcribeAudio = async (base64Data: string, mimeType: string, languageName?: string): Promise<{ detectedLanguage: string; segments: TranscriptionSegment[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const targetLanguage = languageName;

  const prompt = `You are an expert transcriber. Your task is to:
1. ${targetLanguage ? `Transcribe the audio in ${targetLanguage}. The detected language should be reported as ${targetLanguage}.` : 'Auto-detect the spoken language.'}
2. Identify different speakers and label them sequentially (e.g., 'Speaker 1', 'Speaker 2').
3. Provide a precise transcription for each segment.
4. Include accurate start and end timestamps for each segment in HH:MM:SS format.
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
                    description: "The start time of the segment in HH:MM:SS format."
                  },
                  endTime: {
                    type: Type.STRING,
                    description: "The end time of the segment in HH:MM:SS format."
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


export const translateText = async (segments: TranscriptionSegment[], targetLanguage: string): Promise<TranscriptionSegment[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `You are an expert translator. Your task is to translate the 'text' field of each JSON object in the provided array into ${targetLanguage}.
IMPORTANT:
- Keep the 'startTime', 'endTime', and 'speaker' fields exactly the same as in the original.
- Respond ONLY with a single JSON object containing a 'segments' array that strictly matches the provided schema.
- Do not include any other text, explanations, or markdown formatting.`;

  const segmentsJsonString = JSON.stringify(segments);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: {
        parts: [
          { text: prompt },
          { text: `Here is the JSON array of transcription segments:\n${segmentsJsonString}` }
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["startTime", "endTime", "speaker", "text"]
              }
            }
          },
          required: ["segments"]
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result.segments;

  } catch (error) {
    console.error("Error calling Gemini API for translation:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while translating the text.");
  }
};