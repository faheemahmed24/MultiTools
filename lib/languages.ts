export interface LanguageOption {
  code: string;
  name: string;
}

export const sourceLanguages: LanguageOption[] = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ru', name: 'Russian' },
];

export const targetLanguages: LanguageOption[] = [
  ...sourceLanguages.filter(l => l.code !== 'auto'),
  { code: 'ur', name: 'Urdu' },
  { code: 'tr', name: 'Turkish' },
];