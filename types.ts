
export type Language = 'en' | 'hi' | 'ur' | 'ar';

export interface TranslationSet {
  [key: string]: string;
}

export interface TranscriptionSegment {
  startTime: string;
  endTime: string;
  speaker: string;
  text: string;
}

export interface Transcription {
  id: string;
  fileName: string;
  date: string;
  detectedLanguage: string;
  segments: TranscriptionSegment[];
  summary?: string; // Added summary field
}

export interface User {
  id: string;
  email: string;
  password?: string; // Stored locally, only for 'password' authMethod
  authMethod?: 'password' | 'google';
}

// History Item Types
export interface TranslationHistoryItem {
    id: string;
    date: string;
    inputText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
}

export type DiffPart = {
    value: string;
    added?: boolean;
    removed?: boolean;
};
  
export interface GrammarHistoryItem {
    id: string;
    date: string;
    originalText: string;
    correctedText: string;
    language: string;
    tone?: string; // Added tone
    diff: DiffPart[];
}

export interface AnalysisHistoryItem {
    id: string;
    date: string;
    fileName: string;
    resultText: string;
}

export interface PdfImageHistoryItem {
    id: string;
    date: string;
    fileName: string;
    pageCount: number;
}

export interface ImagePdfHistoryItem {
    id: string;
    date: string;
    imageCount: number;
    fileName: string;
}

export interface PdfWordHistoryItem {
    id: string;
    date: string;
    fileName: string;
}

export interface WordPdfHistoryItem {
    id: string;
    date: string;
    fileName: string;
}
