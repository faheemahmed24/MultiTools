import React, { useState, useEffect, useRef } from 'react';
import type { Language, TranslationSet } from '../types';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
  uiLanguage: Language;
  setUiLanguage: (lang: Language) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  t: TranslationSet;
}

const Header: React.FC<HeaderProps> = ({ uiLanguage, setUiLanguage, activeTool, setActiveTool, t }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const toolsContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Define tools inside the component to access `t`
  const tools = [
    { key: 'AI Transcriber', label: t.aiTranscriber },
    { key: 'AI Translator', label: t.aiTranslatorTitle },
    { key: 'Image Analyzer', label: t.imageAnalyzerTitle },
    { key: 'PDF to Image', label: t.pdfToImage },
    { key: 'Image to PDF', label: t.imageToPdf },
    { key: 'PDF to Word', label: t.pdfToWord },
    { key: 'Word to PDF', label: t.wordToPdf }
  ];


  useEffect(() => {
    const updateIndicator = () => {
      const activeToolElement = toolsContainerRef.current?.querySelector(`[data-tool-key="${activeTool}"]`) as HTMLElement;
      if (activeToolElement) {
        setIndicatorStyle({
          left: `${activeToolElement.offsetLeft}px`,
          width: `${activeToolElement.offsetWidth}px`,
        });
      }
    };
    
    // Delay initial animation slightly for smoother page load render
    const timer = setTimeout(updateIndicator, isInitialMount.current ? 100 : 0);
    isInitialMount.current = false;

    window.addEventListener('resize', updateIndicator);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };

  }, [activeTool, t]); // Rerun when `t` changes

  return (
    <header className="bg-gray-900 border-b border-gray-700/50">
      <div className="container mx-auto px-4 md:px-6 py-6 flex flex-col items-center gap-8">
        <h1 className="text-3xl md:text-4xl font-bold">
          <span className="text-purple-400">Multi</span><span className="text-pink-500">Tools</span>
        </h1>
        
        <div className="w-full max-w-6xl">
          <div 
            ref={toolsContainerRef}
            className="flex justify-between items-center space-x-1 sm:space-x-2 md:space-x-4 overflow-x-auto pb-2"
          >
            {tools.map((tool) => (
              <div key={tool.key} className="flex-shrink-0">
                <button 
                  data-tool-key={tool.key}
                  onClick={() => setActiveTool(tool.key)}
                  className={`px-5 py-2 text-sm md:text-base rounded-full whitespace-nowrap transition-all duration-300 ${
                    activeTool === tool.key
                      ? 'bg-purple-600 text-white font-semibold' 
                      : 'text-gray-400 font-medium hover:text-white'
                  }`}
                >
                  {tool.label}
                </button>
              </div>
            ))}
          </div>
          <div className="w-full h-[5px] bg-gray-700 rounded-full mt-2 relative">
            <div 
              className="h-full bg-purple-600 rounded-full absolute transition-all duration-300 ease-in-out" 
              style={indicatorStyle}>
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