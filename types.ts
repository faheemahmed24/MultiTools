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

export interface TranslationItem {
  id:string;
  date: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export type Language = 'en' | 'ar' | 'ur' | 'hi';

export type Tool = 'transcriber' | 'translator' | 'ocr' | 'pdf-to-image' | 'image-to-pdf' | 'pdf-to-word' | 'word-to-pdf';

export interface TranslationSet {
  title: string;
  selectTool: string;
  toolTranscriber: string;
  toolTranslator: string;
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
  noHistory: string;
  transcription: string;
  translation: string;
  translate: string;
  translating: string;
  selectTargetLanguage: string;
  showTimestamps: string;
  hideTimestamps: string;
  showSpeaker: string;
  hideSpeaker: string;
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
  selectLanguagePrompt: string;
  autoDetect: string;
  estimatedTime: string;
  takingLonger: string;
  enableNotifications: string;
  notificationsEnabled: string;
  notificationsDenied: string;
  notificationTitle: string;
  notificationBody: string;
  recordAudio: string;
  stopRecording: string;
  recording: string;
  microphonePermissionDenied: string;
  microphoneError: string;
  microphoneNotFound: string;
  microphoneNotReadable: string;
  // Translator tool specific
  inputText: string;
  outputText: string;
  sourceLanguage: string;
  targetLanguage: string;
  translateTextAction: string;
  translatingText: string;
  translationHistory: string;
  noTranslationHistory: string;
  welcomeTranslatorTitle: string;
  welcomeTranslatorMessage: string;
}

export type Translations = Record<Language, TranslationSet>;

// Background Task Management
export type TaskStatus = 'processing' | 'completed' | 'error';
export type TaskType = 'transcription' | 'translation' | 'text-translation';

export interface BaseTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  createdAt: string;
  error?: string;
}

export interface TranscriptionTask extends BaseTask {
  type: 'transcription';
  fileName: string;
  language?: string;
  fileData: {
    base64: string;
    mimeType: string;
  };
  result?: Transcription;
}

export interface TranslationTask extends BaseTask {
  type: 'translation';
  parentId: string; // ID of the source transcription
  targetLanguageName: string; // e.g., "Spanish"
  targetLanguageCode: string; // e.g., "es"
  segments: TranscriptionSegment[];
  result?: TranscriptionSegment[];
}

export interface TextTranslationTask extends BaseTask {
  type: 'text-translation';
  sourceText: string;
  sourceLanguageName?: string;
  targetLanguageName: string;
  result?: {
      translatedText: string;
      detectedSourceLanguage: string;
  };
}

export type Task = TranscriptionTask | TranslationTask | TextTranslationTask;