export type Language = 'en' | 'hi' | 'ur' | 'ar';
export type Theme = 'light' | 'dark';

export interface TranslationSet {
  title: string;
  uploadTitle: string;
  uploadSubtitle: string;
  transcribing: string;
  loadingMessage: string;
  timeRemaining: string;
  transcription: string;
  translation: string;
  copy: string;
  copied: string;
  download: string;
  edit: string;
  save: string;
  delete: string;
  history: string;
  clearHistory: string;
  error: string;
  unsupportedFileType: string;
  transcriptionError: string;
  fileQueue: string;
  processing: string;
  done: string;
  exportSRT: string;
  exportVTT: string;
  exportTXT: string;
  exportPDF: string;
  exportDOCX: string;
  summary: string;
  summarize: string;
  summarizing: string;
  searchTranscript: string;
  speaker: string;
  customVocabulary: string;
  customVocabularyPlaceholder: string;
  recordAudio: string;
  uploadFile: string;
  recording: string;
  startRecording: string;
  stopRecording: string;
  selectLanguagePrompt: string;
  selectSummaryLanguagePrompt: string;
  translate: string;
  translating: string;
  detectingLanguage: string;
  detectedLanguage: string;
  showTimestamps: string;
  showSpeakers: string;
  segmentedView: string;
  paragraphView: string;
  includeTimestamps: string;
  includeSpeakers: string;
  transcribeAnother: string;
}

export interface TranscriptSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

export interface Transcription {
  id: string;
  fileName: string;
  segments: TranscriptSegment[];
  createdAt: string;
  summary?: string;
  translation?: string; // Kept for on-demand translation
  audioUrl?: string; // URL for the audio player
  detectedLanguage?: string;
}

export interface FileQueueItem {
  name: string;
  status: 'processing' | 'done' | 'error';
  duration?: number;
}