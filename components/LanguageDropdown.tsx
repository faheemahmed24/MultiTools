import React from 'react';
import type { LanguageOption } from '../lib/languages';

interface LanguageDropdownProps {
  languages: LanguageOption[];
  selectedLang: LanguageOption;
  onSelectLang: (lang: LanguageOption) => void;
  title: string;
  searchPlaceholder?: string;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  languages,
  selectedLang,
  onSelectLang,
  title,
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-300">{title}</label>
      <select
        value={selectedLang.code}
        onChange={(e) => {
          const lang = languages.find((l) => l.code === e.target.value);
          if (lang) onSelectLang(lang);
        }}
        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageDropdown;