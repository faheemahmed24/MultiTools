import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function fileToPart(file: File) {
  return new Promise<{ inlineData: { data: string, mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function decode(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(bytes: Uint8Array, ctx: AudioContext, sampleRate: number, channels: number): Promise<AudioBuffer> {
  // Gemini TTS returns raw PCM 16-bit mono at 24kHz
  const float32Data = new Float32Array(bytes.length / 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < float32Data.length; i++) {
    float32Data[i] = view.getInt16(i * 2, true) / 32768;
  }
  
  const buffer = ctx.createBuffer(channels, float32Data.length, sampleRate);
  buffer.getChannelData(0).set(float32Data);
  return buffer;
}

export async function transcribeAudio(file: File, languageHint: string) {
  const model = "gemini-3-flash-preview";
  const filePart = await fileToPart(file);
  
  const prompt = `Transcribe the following ${file.type.startsWith('video') ? 'video' : 'audio'} file. 
  Language hint: ${languageHint}. 
  Provide the transcription in a structured JSON format with segments including startTime, endTime, speaker, and text.`;

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [filePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fileName: { type: Type.STRING },
          detectedLanguage: { type: Type.STRING },
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                speaker: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ["startTime", "endTime", "speaker", "text"],
            },
          },
        },
        required: ["fileName", "detectedLanguage", "segments"],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

export async function runAICommand(command: string, file?: File) {
  const model = "gemini-3-flash-preview";
  const parts: any[] = [{ text: command }];
  
  if (file) {
    parts.push(await fileToPart(file));
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
  });

  return response.text || '';
}

export async function runStrategicPlanning(inputText: string, pastedImages: {data: string, mime: string, id: string}[]) {
  const model = "gemini-3-flash-preview";
  const parts: any[] = [{ text: `Create a strategic plan based on this input: ${inputText}` }];
  
  for (const img of pastedImages) {
    parts.push({
      inlineData: {
        data: img.data,
        mimeType: img.mime,
      },
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mirror: { type: Type.STRING },
          executiveSummary: { type: Type.STRING },
          strategicAnalysis: { type: Type.STRING },
          missingWorkflows: { type: Type.ARRAY, items: { type: Type.STRING } },
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.ARRAY, items: { type: Type.STRING } },
                visualSuggestion: { type: Type.STRING },
                criticalDetail: { type: Type.STRING },
              },
            },
          },
          tableData: { type: Type.ARRAY, items: { type: Type.OBJECT } },
        },
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

export async function analyzeImage(file: File) {
  const model = "gemini-3-flash-preview";
  const filePart = await fileToPart(file);
  
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [filePart, { text: "Extract all text from this image and provide a detailed analysis." }] },
  });

  return response.text || '';
}

export async function translateText(text: string, sourceLang: string, targetLang: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${text}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text || '';
}

export async function summarizeText(text: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Summarize the following text:\n\n${text}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text || '';
}

export async function generateWhiteboardImage(base64: string, prompt: string) {
  const model = "gemini-2.5-flash-image";
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64.split(',')[1],
            mimeType: "image/png",
          },
        },
        { text: `Enhance this drawing based on this prompt: ${prompt}. Return the enhanced image.` },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}

export async function smartSummarize(text: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Perform a smart summary of the following text. Extract contacts, numbers, and a general summary.
  Text: ${text}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          contacts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                info: { type: Type.STRING },
                type: { type: Type.STRING },
              },
            },
          },
          numbers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

export async function processStructuredTask(text: string, taskName: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Perform the following task: ${taskName} on this text: ${text}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text || '';
}

export async function correctGrammar(text: string, language: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Correct the grammar of the following ${language} text. Return only the corrected text: ${text}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text || '';
}

export async function pureOrganizeData(text: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Organize the following data verbatim into categories. 
  Text: ${text}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          categories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
          },
          structuredTable: { type: Type.ARRAY, items: { type: Type.OBJECT } },
        },
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

export async function generateSpeech(text: string, voiceName: string) {
  const model = "gemini-2.5-flash-preview-tts";
  const response = await ai.models.generateContent({
    model,
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

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
}

export async function extractTextFromUrl(url: string) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Extract the main text content from this URL: ${url}`,
    config: {
      tools: [{ urlContext: {} }],
    },
  });

  return response.text || '';
}
