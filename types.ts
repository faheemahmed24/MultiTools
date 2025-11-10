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

export type Language = 'en' | 'ar' | 'ur' | 'hi';

export interface TranslationSet {
  title: string;
  uploadFile: string;
  dropFile: string;
  transcribing: string;
  history: string;
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
