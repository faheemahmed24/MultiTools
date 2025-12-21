
import React, { useState, useEffect, useRef } from 'react';
import type { Language, TranslationSet, User } from '../types';
import { SidebarCollapseIcon } from './icons/SidebarCollapseIcon';
import { SidebarExpandIcon } from './icons/SidebarExpandIcon';
import { TranscriberIcon } from './icons/TranscriberIcon';
import { TranslatorIcon } from './icons/TranslatorIcon';
import { AnalyzerIcon } from './icons/AnalyzerIcon';
import { PdfToImageIcon } from './icons/PdfToImageIcon';
import { ImageToPdfIcon } from './icons/ImageToPdfIcon';
import { PdfToWordIcon } from './icons/PdfToWordIcon';
import { WordToPdfIcon } from './icons/WordToPdfIcon';
import { VideoToAudioIcon } from './icons/VideoToAudioIcon';
import { AudioMergerIcon } from './icons/AudioMergerIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { SheetIcon } from './icons/SheetIcon';
import { GrammarIcon } from './icons/GrammarIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { CogIcon } from './icons/CogIcon';

interface HeaderProps {
  uiLanguage: Language;
  setUiLanguage: (lang: Language) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  t: TranslationSet;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    uiLanguage, 
    setUiLanguage, 
    activeTool, 
    setActiveTool, 
    t, 
    isSidebarOpen, 
    setIsSidebarOpen,
    currentUser,
    onLoginClick,
    onLogoutClick 
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const toolsContainerRef = useRef<HTMLUListElement>(null);
  const isInitialMount = useRef(true);

  const tools = [
    { key: 'Features', label: 'Features', icon: CogIcon },
    { key: 'AI Transcriber', label: t.aiTranscriber, icon: TranscriberIcon },
    { key: 'AI Translator', label: t.aiTranslatorTitle, icon: TranslatorIcon },
    { key: 'Grammar Corrector', label: t.grammarCorrector, icon: GrammarIcon },
    { key: 'Image Converter & OCR', label: t.imageConverterOcrTitle, icon: AnalyzerIcon },
    { key: 'PDF to Image', label: t.pdfToImage, icon: PdfToImageIcon },
    { key: 'Image to PDF', label: t.imageToPdf, icon: ImageToPdfIcon },
    { key: 'PDF to Word', label: t.pdfToWord, icon: PdfToWordIcon },
    { key: 'Word to PDF', label: t.wordToPdf, icon: WordToPdfIcon },
    { key: 'Video to Audio', label: t.videoToAudio, icon: VideoToAudioIcon },
    { key: 'Audio Merger', label: t.audioMerger, icon: AudioMergerIcon },
    { key: 'Text to Speech', label: t.textToSpeech, icon: SpeakerIcon },
    { key: 'Export to Sheets', label: t.exportToSheets, icon: SheetIcon },
    { key: 'History', label: t.history, icon: HistoryIcon }
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
    
    const timer = setTimeout(updateIndicator, isInitialMount.current ? 100 : 0);
    isInitialMount.current = false;
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTool, t, isSidebarOpen]);

  const sidebarClasses = [
    'bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50',
    'flex flex-col p-4',
    'duration-300 ease-in-out',
    'fixed inset-y-0 left-0 z-40 w-64 transition-transform',
    'md:relative md:inset-auto md:z-auto md:transition-all',
    isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    isSidebarOpen ? 'md:w-64' : 'md:w-20',
  ].join(' ');


  return (
    <aside className={sidebarClasses}>
      <div className="hidden md:flex items-center justify-between mb-6 mt-2">
        <div className={`text-3xl font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'max-w-full opacity-100' : 'max-w-0 opacity-0'}`}>
          <a href="/"><span className="text-purple-400">Multi</span><span className="text-pink-500">Tools</span></a>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors ${!isSidebarOpen && 'w-full'}`}
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? <SidebarCollapseIcon className="w-6 h-6" /> : <SidebarExpandIcon className="w-6 h-6 mx-auto" />}
        </button>
      </div>
      
      {(isSidebarOpen) && (
          <h2 className="text-xs font-semibold uppercase text-gray-500 tracking-wider px-4 mb-2">{t.tools}</h2>
      )}
      
      <nav className="relative flex-grow overflow-y-auto -me-2 pe-2 mt-8 md:mt-0">
        <ul ref={toolsContainerRef} className="flex flex-col space-y-2">
            <div className="w-1 bg-purple-500 rounded-full absolute start-0 transition-all duration-300 ease-in-out" style={indicatorStyle}></div>
            {tools.map((tool) => {
            const Icon = tool.icon;
            return (
                <li key={tool.key}>
                    <button 
                        data-tool-key={tool.key}
                        onClick={() => {
                            setActiveTool(tool.key);
                            if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        title={!isSidebarOpen ? tool.label : ''}
                        className={`w-full flex items-center h-12 pe-4 text-sm font-semibold rounded-lg whitespace-nowrap transition-all duration-300 transform hover:scale-105 active:scale-100 ${ isSidebarOpen ? 'ps-6 justify-start' : 'md:ps-0 md:justify-center' } ${
                            activeTool === tool.key
                            ? 'bg-purple-600/20 text-white' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                        }`}
                        >
                        {isSidebarOpen ? (
                            <span className="flex items-center gap-3">
                                <Icon className="w-5 h-5" />
                                {tool.label}
                            </span>
                        ) : (
                            <Icon className="w-6 h-6" />
                        )}
                    </button>
                </li>
            )
            })}
        </ul>
      </nav>
      
      {/* Semantic "Home" link requirement */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <nav>
            <ul>
                <li>
                    <a href="/" className="flex items-center gap-3 p-3 text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
                         {isSidebarOpen ? 'Home / Landing' : 'H'}
                    </a>
                </li>
            </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Header;
