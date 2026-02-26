
// Supported UI languages for the application
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
}

export interface User {
  id: string;
  email: string;
  password?: string;
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

export interface VideoAudioHistoryItem {
    id: string;
    date: string;
    fileName: string;
    outputFormat: string;
}

export interface AudioMergerHistoryItem {
    id: string;
    date: string;
    fileName: string;
    fileCount: number;
}

export interface TtsHistoryItem {
    id: string;
    date: string;
    text: string;
    voice: string;
}

export interface SmartSummary {
    summary: string;
    contacts: { name: string; info: string; type: string }[];
    languages: string[];
    keyInsights: string[];
    numbers: { label: string; value: string }[];
}

export interface DataSummarizerHistoryItem {
    id: string;
    date: string;
    inputText: string;
    result: SmartSummary;
}
