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
  // New keys for UI/UX update
  fileConstraints: string;
  releaseToUpload: string;
  noHistoryDescription: string;
  sortBy: string;
  newest: string;
  oldest: string;
  nameAZ: string;
  duration: string;
  uploadProgress: string;
  uploadCancel: string;
  progressStep1: string;
  progressStep2: string;
  progressStep3: string;
  progressStep4: string;
  progressStep5: string;
  timeRemaining: string;
  minutes: string;
  completed: string;
}

export type Translations = Record<Language, TranslationSet>;
