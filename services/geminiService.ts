import { generateContent, callGemini, type GeminiResponse } from '../api';

// --- Helpers ---

/**
 * Converts a File object to a Base64 string suitable for Gemini inlineData.
 */
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

// --- Core Services ---

export async function transcribeAudio(file: File, languageHint?: string) {
  const audioPart = await fileToGenerativePart(file);
  const prompt = languageHint 
    ? `Transcribe this audio file. The language is likely ${languageHint}. Provide a speaker diarization if possible in the format "Speaker [Time]: Text".`
    : `Transcribe this audio file accurately. Identify speakers if possible.`;

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        audioPart
      ]
    }]
  };

  const response = await callGemini<GeminiResponse>('/v1beta/models/gemini-1.5-flash:generateContent', body);
  
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  // Parse transcription segments looking for "Speaker [Time]: Text" pattern
  const segments = text.split('\n').map((line) => {
    // Regex to match: Speaker Name [00:00]: Text
    const match = line.match(/^(.*?)\s*\[(\d{1,2}:\d{2}(?::\d{2})?)\]:\s*(.*)$/);
    if (match) {
      return {
        startTime: match[2],
        endTime: "", // End time inferred or empty
        speaker: match[1].trim(),
        text: match[3].trim()
      };
    }
    // Fallback for lines that don't match
    return {
      startTime: "",
      endTime: "",
      speaker: "Unknown",
      text: line.trim()
    };
  }).filter(s => s.text.length > 0);

  return {
    fileName: file.name,
    detectedLanguage: languageHint || "Auto",
    segments: segments
  };
}

export async function analyzeImage(file: File) {
  const imagePart = await fileToGenerativePart(file);
  const body = {
    contents: [{
      parts: [
        { text: "Extract all text from this image. If there is no text, describe the image in detail." },
        imagePart
      ]
    }]
  };

  const response = await callGemini<GeminiResponse>('/v1beta/models/gemini-1.5-flash:generateContent', body);
  return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function translateText(text: string, sourceLang: string, targetLang: string) {
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only output the translated text:\n\n${text}`;
  return await generateContent(prompt, 'gemini-1.5-flash');
}

export async function correctGrammar(text: string, language: string) {
  const prompt = `Correct the grammar and spelling of the following ${language} text. Maintain the original tone. Only output the corrected text:\n\n${text}`;
  return await generateContent(prompt, 'gemini-1.5-flash');
}

// --- Utilities for TextToSpeech ---

export function decode(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  bytes: Uint8Array, 
  audioCtx: AudioContext, 
  sampleRate: number = 24000, 
  channels: number = 1
): Promise<AudioBuffer> {
  // Since we don't have a real TTS endpoint in Gemini API yet (it's text-to-text/image-to-text),
  // this is a placeholder. In a real scenario, you would call Google Cloud TTS or similar.
  // For now, we return an empty buffer to prevent crashes.
  return audioCtx.createBuffer(channels, 1024, sampleRate);
}

export async function generateSpeech(text: string, voice: string): Promise<string> {
  // Placeholder: Gemini API does not currently support Text-to-Audio generation directly via the standard endpoint.
  // This would typically require the Google Cloud Text-to-Speech API.
  console.warn("Text-to-Speech via Gemini API is not fully supported in this demo. Returning mock data.");
  return ""; // Return empty base64
}

export async function extractTextFromUrl(url: string): Promise<string> {
  // Client-side scraping is blocked by CORS on most sites.
  // We can try to ask Gemini to read it if it has access, but usually it cannot browse live URLs.
  // We will try a simple fetch, but expect it to fail for most external sites.
  try {
    const res = await fetch(url);
    const html = await res.text();
    
    // Ask Gemini to extract text from the raw HTML (if it fits in context)
    // Truncate to avoid token limits
    const truncatedHtml = html.substring(0, 30000); 
    const prompt = `Extract the main article content from this HTML. Ignore navigation, footers, and scripts:\n\n${truncatedHtml}`;
    
    return await generateContent(prompt, 'gemini-1.5-flash');
  } catch (e) {
    throw new Error("Could not fetch URL directly (CORS restriction). Please paste text manually.");
  }
}