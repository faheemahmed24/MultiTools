import React, { useState, useRef, useEffect } from 'react';
import type { LanguageOption } from '../lib/languages';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface LanguageDropdownProps {
  languages: LanguageOption[];
  selectedLang: LanguageOption;
  onSelectLang: (lang: LanguageOption) => void;
  title: string;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ languages, selectedLang, onSelectLang, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (lang: LanguageOption) => {
    onSelectLang(lang);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full sm:w-56" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-700 px-4 py-2 rounded-lg text-gray-200 hover:bg-gray-600 transition-colors"
      >
        <div className="flex flex-col items-start">
            <span className="text-xs text-gray-400">{title}</span>
            <span className="font-semibold">{selectedLang.name}</span>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 top-full mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 text-gray-200 px-3 py-2 rounded-md border-0 focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {filteredLanguages.map(lang => (
              <li key={lang.code}>
                <button
                  onClick={() => handleSelect(lang)}
                  className={`w-full text-left px-4 py-2 text-sm ${selectedLang.code === lang.code ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-purple-600/50'}`}
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

export default LanguageDropdown;
