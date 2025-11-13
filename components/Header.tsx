import React, { useState, useEffect, useRef } from 'react';
import type { Language, TranslationSet } from '../types';
import LanguageSelector from './LanguageSelector';
import { SidebarCollapseIcon } from './icons/SidebarCollapseIcon';
import { SidebarExpandIcon } from './icons/SidebarExpandIcon';
import { TranscriberIcon } from './icons/TranscriberIcon';
import { TranslatorIcon } from './icons/TranslatorIcon';
import { AnalyzerIcon } from './icons/AnalyzerIcon';
import { PdfToImageIcon } from './icons/PdfToImageIcon';
import { ImageToPdfIcon } from './icons/ImageToPdfIcon';
import { PdfToWordIcon } from './icons/PdfToWordIcon';
import { WordToPdfIcon } from './icons/WordToPdfIcon';

interface HeaderProps {
  uiLanguage: Language;
  setUiLanguage: (lang: Language) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  t: TranslationSet;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ uiLanguage, setUiLanguage, activeTool, setActiveTool, t, isSidebarOpen, setIsSidebarOpen }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const toolsContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Define tools inside the component to access `t`
  const tools = [
    { key: 'AI Transcriber', label: t.aiTranscriber, icon: TranscriberIcon },
    { key: 'AI Translator', label: t.aiTranslatorTitle, icon: TranslatorIcon },
    { key: 'Image Analyzer', label: t.imageAnalyzerTitle, icon: AnalyzerIcon },
    { key: 'PDF to Image', label: t.pdfToImage, icon: PdfToImageIcon },
    { key: 'Image to PDF', label: t.imageToPdf, icon: ImageToPdfIcon },
    { key: 'PDF to Word', label: t.pdfToWord, icon: PdfToWordIcon },
    { key: 'Word to PDF', label: t.wordToPdf, icon: WordToPdfIcon }
  ];

  useEffect(() => {
    const updateIndicator = () => {
      const activeToolElement = toolsContainerRef.current?.querySelector(`[data-tool-key="${activeTool}"]`) as HTMLElement;
      if (activeToolElement) {
        setIndicatorStyle({
          top: `${activeToolElement.offsetTop}px`,
          height: `${activeToolElement.offsetHeight}px`,
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

  }, [activeTool, t, isSidebarOpen]); // Rerun when sidebar state or language changes

  return (
    <aside className={`bg-gray-800 border-r border-gray-700/50 flex flex-col p-4 flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between mb-10 mt-4">
        <h1 className={`text-3xl font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'max-w-full opacity-100' : 'max-w-0 opacity-0'}`}>
          <span className="text-purple-400">Multi</span><span className="text-pink-500">Tools</span>
        </h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors ${!isSidebarOpen && 'w-full'}`}
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? <SidebarCollapseIcon className="w-6 h-6" /> : <SidebarExpandIcon className="w-6 h-6 mx-auto" />}
        </button>
      </div>
      
      <nav 
        ref={toolsContainerRef}
        className="relative flex flex-col space-y-1 flex-grow"
      >
        <div 
          className="w-1 bg-purple-600 rounded-full absolute start-0 transition-all duration-300 ease-in-out" 
          style={indicatorStyle}>
        </div>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button 
              key={tool.key}
              data-tool-key={tool.key}
              onClick={() => setActiveTool(tool.key)}
              title={!isSidebarOpen ? tool.label : ''}
              className={`w-full flex items-center h-12 pe-4 text-sm rounded-lg whitespace-nowrap transition-all duration-300 ${ isSidebarOpen ? 'ps-6 justify-start' : 'ps-0 justify-center' } ${
                activeTool === tool.key
                  ? 'bg-purple-600/20 text-white font-semibold' 
                  : 'text-gray-400 font-medium hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {isSidebarOpen ? (
                <span>{tool.label}</span>
              ) : (
                <Icon className="w-6 h-6" />
              )}
            </button>
          )
        })}
      </nav>

      <div className={`mt-auto pt-6 transition-opacity duration-300 ease-in-out ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <LanguageSelector selectedLanguage={uiLanguage} onSelectLanguage={setUiLanguage} />
      </div>
    </aside>
  );
};

export default Header;