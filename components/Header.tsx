import React from 'react';
import type { Language } from '../types';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
  uiLanguage: Language;
  setUiLanguage: (lang: Language) => void;
}

const tools = [
  'AI Transcriber', 'AI Translator', 'Image Analyzer', 'PDF to Image', 
  'Image to PDF', 'PDF to Word', 'Word to PDF'
];
const activeTool = 'AI Transcriber';

const Header: React.FC<HeaderProps> = ({ uiLanguage, setUiLanguage }) => {
  return (
    <header className="bg-gray-900 border-b border-gray-700/50">
      <div className="container mx-auto px-4 md:px-6 py-6 flex flex-col items-center gap-8">
        <h1 className="text-3xl md:text-4xl font-bold">
          <span className="text-purple-400">Multi</span><span className="text-pink-500">Tools</span>
        </h1>
        
        <div className="w-full max-w-6xl">
          <div 
            className="flex justify-between items-center space-x-1 sm:space-x-2 md:space-x-4 overflow-x-auto pb-2" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {tools.map((tool) => (
              <div key={tool} className="flex-shrink-0">
                {activeTool === tool ? (
                  <button className="px-5 py-2 text-sm md:text-base font-semibold rounded-full bg-purple-600 text-white whitespace-nowrap">
                    {tool}
                  </button>
                ) : (
                  <span className="text-gray-400 text-sm md:text-base font-medium cursor-not-allowed whitespace-nowrap px-5 py-2">
                    {tool}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="w-full h-[5px] bg-gray-700 rounded-full mt-2 relative">
            <div 
              className="h-full bg-purple-600 rounded-full absolute" 
              style={{width: '140px'}}>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <LanguageSelector selectedLanguage={uiLanguage} onSelectLanguage={setUiLanguage} />
        </div>
      </div>
    </header>
  );
};

export default Header;