
import React, { useState, useRef, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (langCode: Language) => {
    onSelectLanguage(langCode);
    setIsOpen(false);
  };
  
  const currentLanguage = languages.find(lang => lang.code === selectedLanguage);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-700/50 px-4 py-2 rounded-lg text-gray-200 hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <i className="fas fa-globe w-5 h-5 text-gray-400 flex items-center justify-center" />
          <span className="font-semibold">{currentLanguage?.name || 'Select Language'}</span>
        </div>
        <i className={`fas fa-chevron-down w-5 h-5 text-gray-400 transition-transform flex items-center justify-center ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 bottom-full mb-2 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl py-1">
          <ul className="max-h-60 overflow-y-auto">
            {languages.map(lang => (
              <li key={lang.code}>
                <button
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-start px-4 py-2 text-sm ${selectedLanguage === lang.code ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-purple-600/50'}`}
                >
                  {lang.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
