import { TranslationSet } from '../types';

const translations: Record<string, TranslationSet> = {
  en: {
    transcribing: 'Transcribing...',
    loadingMessage: 'Neural engine is processing your request',
    transcription: 'Transcription',
    copy: 'Copy',
    copied: 'Copied',
    export: 'Export',
    uploadImages: 'Upload Images',
    addMoreImages: 'Add More',
    clearAll: 'Clear All',
    analyze: 'Analyze',
    analyzing: 'Analyzing...',
    reanalyze: 'Re-analyze',
    imageAnalysisResult: 'Analysis Result',
    targetLanguage: 'Target Language',
    sourceLanguage: 'Source Language',
    translate: 'Translate',
    translating: 'Translating...',
    translationResult: 'Translation Result',
    summarize: 'Summarize',
    summarizing: 'Summarizing...',
    summaryResult: 'Summary Result',
    enterText: 'Enter text here...',
    linkError: 'Link access error',
  }
};

export function getTranslations(lang: string): TranslationSet {
  return translations[lang] || translations.en;
}
