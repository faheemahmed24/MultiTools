import { GoogleGenAI, Type } from '@google/genai';
import type { TranscriptSegment, Language } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

export const transcribeAudio = async (
  file: File,
  customVocabulary: string
): Promise<TranscriptSegment[]> => {
  try {
    const audioPart = await fileToGenerativePart(file);
    
    let prompt = `Transcribe the following audio. Identify different speakers and provide start and end timestamps for each segment.`;
    if (customVocabulary.trim()) {
      prompt += `\nPay special attention to the following words: ${customVocabulary.split('\n').join(', ')}.`;
    }

    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [audioPart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            segments: {
              type: Type.ARRAY,
              description: 'Array of transcription segments.',
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: {
                    type: Type.STRING,
                    description: 'Label for the speaker (e.g., "Speaker 1").',
                  },
                  start: {
                    type: Type.NUMBER,
                    description: 'Start time of the segment in seconds.',
                  },
                  end: {
                    type: Type.NUMBER,
                    description: 'End time of the segment in seconds.',
                  },
                  text: {
                    type: Type.STRING,
                    description: 'The transcribed text for this segment.',
                  },
                },
                required: ['speaker', 'start', 'end', 'text'],
              },
            },
          },
          required: ['segments'],
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (Array.isArray(result.segments)) {
      return result.segments;
    } else {
      // Fallback for simple string response
      if (typeof jsonString === 'string') {
          return [{ speaker: '1', start: 0, end: 10, text: jsonString }];
      }
      throw new Error('Invalid JSON response structure from API.');
    }
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw new Error('Failed to get transcription from Gemini API.');
  }
};

export const summarizeText = async (text: string, language: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Provide a concise summary of the following text in ${language}:\n\n${text}`,
    });
    return response.text;
  } catch (error) {
    console.error('Error in summarizeText:', error);
    throw new Error('Failed to get summary from Gemini API.');
  }
};


export const translateText = async (text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> => {
    try {
        const prompt = `Translate the following text ${sourceLanguage ? `from ${sourceLanguage} ` : ''}to ${targetLanguage}:\n\n${text}`;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error('Error in translateText:', error);
        throw new Error('Failed to get translation from Gemini API.');
    }
};

export const detectLanguage = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: `Detect the language of the following text. Respond with only the name of the language in English (e.g., "English", "Spanish").\n\nText snippet: "${text.substring(0, 500)}"`,
        });
        return response.text.trim();
    } catch (error) {
        console.error('Error in detectLanguage:', error);
        throw new Error('Failed to detect language from Gemini API.');
    }
};
