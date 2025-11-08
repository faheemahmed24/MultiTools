// types.ts
export interface TranscriptionSegment {
  startTime: string;
  endTime: string;
  speaker: string;
  text: string;
}

// Data payload specific to a transcription
export interface TranscriptionData {
  detectedLanguage: string;
  segments: TranscriptionSegment[];
}

// Generic structure for any item saved in history
export interface HistoryItem {
  id: string;
  fileName: string;
  date: string;
  tool: Tool;
  data: TranscriptionData | { [key: string]: any }; // Can hold data for any tool
}


export type Language = 'en' | 'ar' | 'ur' | 'hi';

export type Tool = 'transcriber' | 'ocr' | 'pdf-to-image' | 'image-to-pdf' | 'pdf-to-word' | 'word-to-pdf';

export interface TranslationSet {
  title: string;
  selectTool: string;
  toolTranscriber: string;
  toolOcr: string;
  toolPdfToImage: string;
  toolImageToPdf: string;
  toolPdfToWord: string;
  toolWordToPdf: string;
  comingSoon: string;
  uploadFile: string;
  dropFile: string;
  transcribing: string;
  history: string;
  historyAndSavedFiles: string; // New key for the updated title
  noHistory: string;
  transcription: string;
  showTimestamps: string;
  hideTimestamps: string;
  copy: string;
  copied: string;
  save: string;
  saved: string;
  welcomeTitle: string;
  welcomeMessage: string;
  errorTitle: string;
  loadingMessage: string;
  delete: string;
  speaker: string;
  edit: string;
  cancel: string;
  saveChanges: string;
  export: string;
  downloadAs: string;
  detectedLanguage: string;
  securityNote: string;
}

export type Translations = Record<Language, TranslationSet>;
