import React from 'react';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import type { Language, Theme, TranslationSet } from '../types';

interface HeaderProps {
  t: TranslationSet;
  selectedLanguage: Language;
  onSelectLanguage: (language: Language) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ t, selectedLanguage, onSelectLanguage, theme, onThemeToggle }) => {
  return (
    <header className="bg-[color:var(--bg-secondary)] shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-[color:var(--accent-primary)]">{t.title}</h1>
        <div className="flex items-center space-x-4">
          <LanguageSelector selectedLanguage={selectedLanguage} onSelectLanguage={onSelectLanguage} />
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>
      </div>
    </header>
  );
};

export default Header;