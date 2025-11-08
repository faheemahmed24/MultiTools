
import React from 'react';
import type { TranslationSet, Language } from '../types';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
  t: TranslationSet;
  uiLanguage: Language;
  setUiLanguage: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ t, uiLanguage, setUiLanguage }) => {
  return (
    <header className="bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          {t.title}
        </h1>
        <LanguageSelector selectedLanguage={uiLanguage} onSelectLanguage={setUiLanguage} />
      </div>
    </header>
  );
};

export default Header;
