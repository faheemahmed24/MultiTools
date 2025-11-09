import React from 'react';
import type { TranslationSet, Language, Tool } from '../types';
import LanguageSelector from './LanguageSelector';
import { useTasks } from '../hooks/useTasks';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface HeaderProps {
  t: TranslationSet;
  uiLanguage: Language;
  setUiLanguage: (lang: Language) => void;
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

const Header: React.FC<HeaderProps> = ({ t, uiLanguage, setUiLanguage, activeTool, setActiveTool }) => {
  const { tasks } = useTasks();
  const isProcessing = tasks.some(task => task.status === 'processing');

  const tools: { id: Tool; labelKey: keyof TranslationSet }[] = [
    { id: 'transcriber', labelKey: 'toolTranscriber' },
    { id: 'translator', labelKey: 'toolTranslator' },
    { id: 'ocr', labelKey: 'toolOcr' },
    { id: 'pdf-to-image', labelKey: 'toolPdfToImage' },
    { id: 'image-to-pdf', labelKey: 'toolImageToPdf' },
    { id: 'pdf-to-word', labelKey: 'toolPdfToWord' },
    { id: 'word-to-pdf', labelKey: 'toolWordToPdf' },
  ];

  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 md:px-6 py-3 flex flex-wrap justify-between items-center gap-4">
        <button onClick={() => setActiveTool('transcriber')} className="flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            {t.title}
          </h1>
        </button>
        
        <nav className="flex-grow flex justify-center items-center overflow-hidden order-3 sm:order-2 w-full sm:w-auto">
          <div className="flex items-center space-x-1 bg-gray-900/50 p-1 rounded-full overflow-x-auto">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center whitespace-nowrap px-3 sm:px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                  activeTool === tool.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {t[tool.labelKey]}
                {tool.id === 'transcriber' && isProcessing && <SpinnerIcon className="w-4 h-4 ms-2 animate-spin" />}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-shrink-0 order-2 sm:order-3">
            <LanguageSelector selectedLanguage={uiLanguage} onSelectLanguage={setUiLanguage} />
        </div>
      </div>
    </header>
  );
};

export default Header;