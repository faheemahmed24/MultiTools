export interface User {
  id: string;
  email: string;
  authMethod?: 'password' | 'google';
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

export type TranslationSet = Record<string, string>;