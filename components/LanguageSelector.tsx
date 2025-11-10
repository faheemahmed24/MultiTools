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
    <div className="bg-gray-800/80 rounded-full p-2 flex items-center space-x-3 rtl:space-x-reverse">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onSelectLanguage(lang.code)}
          className={`px-4 py-1 text-md font-semibold rounded-full transition-colors duration-200 ${
            selectedLanguage === lang.code
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;