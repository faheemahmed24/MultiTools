
import React from 'react';
import type { Language } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onSelectLanguage: (language: Language) => void;
}

const languages: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ur', name: 'اردو' },
  { code: 'ar', name: 'العربية' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onSelectLanguage }) => {
  return (
    <div className="bg-gray-200 dark:bg-gray-700/50 rounded-full p-1 flex items-center space-x-1 rtl:space-x-reverse">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onSelectLanguage(lang.code)}
          className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-200 ${
            selectedLanguage === lang.code
              ? 'bg-[color:var(--accent-primary)] text-white'
              : 'text-[color:var(--text-secondary)] hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;