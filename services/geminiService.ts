import { GoogleGenAI, Type } from "@google/genai";
import type { TranscriptionSegment } from "../types";

export const transcribeAudio = async (base64Data: string, mimeType: string, languageName?: string, context?: string): Promise<{ detectedLanguage: string; segments: TranscriptionSegment[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const contextInstruction = context ? `
An additional context has been provided to improve accuracy. Pay close attention to these terms:
<context>
${context}
</context>
` : '';

  const prompt = `You are an expert transcriber. Your task is to:
1. ${languageName ? `Transcribe the audio in ${languageName}. The detected language should be reported as ${languageName}.` : 'Auto-detect the spoken language.'}
2. Identify different speakers and label them sequentially (e.g., 'Speaker 1', 'Speaker 2').
3. Provide a precise transcription for each segment.
4. Include accurate start and end timestamps for each segment in HH:MM:SS format.${contextInstruction}
Respond ONLY with a single JSON object that strictly matches the provided schema. Do not include any other text or markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

  const prompt = `You are a professional translator specializing in dialogue. Your task is to translate the 'text' field of each JSON object in the provided array of transcription segments into ${targetLanguage}.
Your translation must be:
- **Nuanced and Contextual:** Accurately convey the original meaning, tone, and intent. Pay close attention to colloquialisms, idioms, and cultural nuances.
- **Fluent and Natural:** The output should read like it was originally spoken in ${targetLanguage}, not like a literal, word-for-word translation.
- **Consistent:** Maintain consistency in terminology and style across all segments.

IMPORTANT INSTRUCTIONS:
- You MUST preserve the 'startTime', 'endTime', and 'speaker' fields exactly as they appear in the original segments. Do not modify them.
- Your response MUST be a single, valid JSON object containing a 'segments' array that strictly adheres to the provided schema.
- Do not include any additional text, explanations, code block formatting (like \`\`\`json), or markdown. The response should be pure JSON.`;

  const segmentsJsonString = JSON.stringify(segments);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: {
        parts: [
          { text: prompt },
          { text: `Here is the JSON array of transcription segments to translate:\n${segmentsJsonString}` }
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

  } catch (error)
 {
    console.error("Error calling Gemini API for translation:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while translating the text.");
  }
};

export const translateFreeformText = async (
  sourceText: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<{ translatedText: string; detectedSourceLanguage: string }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `You are a professional translator.
1. ${sourceLanguage ? `Assume the source text is in ${sourceLanguage}. The detected language should be reported as ${sourceLanguage}.` : 'Auto-detect the source language of the text and report which language you detected.'}
2. Translate the following text into ${targetLanguage}.
3. Your translation must be nuanced, contextual, fluent, natural, and consistent.
4. Respond ONLY with a single JSON object matching the provided schema. Do not include any other text, explanations, or markdown formatting.

Text to translate:
---
${sourceText}
---`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: {
              type: Type.STRING,
              description: `The translated text in ${targetLanguage}.`
            },
            detectedSourceLanguage: {
              type: Type.STRING,
              description: "The detected source language of the original text (e.g., 'English')."
            }
          },
          required: ["translatedText", "detectedSourceLanguage"]
        },
      },
    });
    
    const jsonString = response.text.trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error calling Gemini API for freeform translation:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while translating the text.");
  }
};