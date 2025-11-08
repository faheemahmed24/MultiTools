
export type Language = 'en' | 'hi' | 'ur' | 'ar';

export type Tool =
  | 'transcriber'
  | 'ocr'
  | 'pdf-to-image'
  | 'image-to-pdf'
  | 'pdf-to-word'
  | 'word-to-pdf';

export type TranslationSet = Record<string, string>;

export interface TranscriptionData {
  detectedLanguage: string;
  transcription: string;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  date: string;
  tool: Tool;
  data: TranscriptionData; // For now, only transcriber data
}