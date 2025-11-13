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
  password?: string; // Stored locally, only for 'password' authMethod
  authMethod?: 'password' | 'google';
}
