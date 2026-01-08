
import React, { useState, useEffect, useMemo } from 'react';
import type { TranslationSet } from '../types';
import { TranscriberIcon } from './icons/TranscriberIcon';
import { TranslatorIcon } from './icons/TranslatorIcon';
import { VideoToAudioIcon } from './icons/VideoToAudioIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { SheetIcon } from './icons/SheetIcon';
import { GrammarIcon } from './icons/GrammarIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { SummarizerIcon } from './icons/SummarizerIcon';
import { ImageIcon } from './icons/ImageIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { BoltIcon } from './icons/BoltIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { SearchIcon } from './icons/SearchIcon';
import { CubeIcon } from './icons/CubeIcon';
import { Squares2x2Icon } from './icons/Squares2x2Icon';
import { PdfToImageIcon } from './icons/PdfToImageIcon';
import { ImageToPdfIcon } from './icons/ImageToPdfIcon';
import { PdfToWordIcon } from './icons/PdfToWordIcon';

interface HeaderProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  activeImageCategory: string;
  setActiveImageCategory: (cat: string) => void;
  activeSummaryCategory: string;
  setActiveSummaryCategory: (cat: string) => void;
  activeHistoryTab: string;
  setActiveHistoryTab: (tab: string) => void;
  t: TranslationSet;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    activeTool, 
    setActiveTool, 
    activeImageCategory,
    setActiveImageCategory,
    activeSummaryCategory,
    setActiveSummaryCategory,
    activeHistoryTab,
    setActiveHistoryTab,
    t, 
    isSidebarOpen, 
    setIsSidebarOpen 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Transcription & Text': true,
    'Strategy & Planning': true,
    'Archives & History': false
  });
  
  const toggleMenu = (key: string) => {
    if (!isSidebarOpen) {
        setIsSidebarOpen(true);
        setExpandedMenus(prev => ({ ...prev, [key]: true }));
    } else {
        setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const toolStructure = useMemo(() => [
    {
      group: 'Transcription & Text',
      icon: TranscriberIcon,
      items: [
        { key: 'AI Transcriber', label: t.aiTranscriber, icon: TranscriberIcon },
        { key: 'AI Translator', label: t.aiTranslatorTitle, icon: TranslatorIcon },
        { key: 'Grammar Corrector', label: t.grammarCorrector, icon: GrammarIcon },
      ]
    },
    {
        group: 'Strategy & Planning',
        icon: CubeIcon,
        items: [
          { key: 'Strategic Planner', label: 'Strategic Architect', icon: CubeIcon },
          { key: 'Smart Summarizer', label: 'Knowledge Hub', icon: SummarizerIcon },
        ]
    },
    {
        group: 'Visual Studio',
        icon: ImageIcon,
        isHub: true,
        items: [
            { key: 'Popular & Essential', label: 'Essential', icon: BoltIcon },
            { key: 'Conversion & OCR', label: 'Convert/OCR', icon: ArrowPathIcon },
            { key: 'Basic Editing & Retouch', label: 'Editing', icon: ScissorsIcon },
        ],
        setSubKey: setActiveImageCategory,
        activeSubKey: activeImageCategory,
        hubKey: 'Image Related Tools'
    },
    {
        group: 'Document & PDF',
        icon: DocumentDuplicateIcon,
        items: [
            { key: 'PDF to Image', label: t.pdfToImage, icon: PdfToImageIcon },
            { key: 'Image to PDF', label: t.imageToPdf, icon: ImageToPdfIcon },
            { key: 'PDF to Word', label: t.pdfToWord, icon: PdfToWordIcon },
            { key: 'Export to Sheets', label: t.exportToSheets, icon: SheetIcon },
        ]
    },
    {
        group: 'Media Lab',
        icon: VideoToAudioIcon,
        items: [
            { key: 'Video to Audio', label: t.videoToAudio, icon: VideoToAudioIcon },
            { key: 'Audio Merger', label: t.audioMerger, icon: BoltIcon },
            { key: 'Text to Speech', label: t.textToSpeech, icon: SpeakerIcon },
        ]
    }
  ], [t, activeImageCategory]);

  const archiveTabs = [
    { key: 'transcriptions', label: 'Voice History', icon: TranscriberIcon },
    { key: 'planner', label: 'Strategy Archive', icon: CubeIcon },
  ];

  const filteredTools = useMemo(() => {
    if (!searchTerm) return toolStructure;
    return toolStructure.map(group => ({
      ...group,
      items: group.items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(group => group.items.length > 0);
  }, [searchTerm, toolStructure]);

  return (
    <aside 
        className={`bg-[#05050C] border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out relative shrink-0 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}
        onMouseEnter={() => !isSidebarOpen && setIsSidebarOpen(true)}
        onMouseLeave={() => isSidebarOpen && setIsSidebarOpen(false)}
    >
      <div className="flex items-center px-4 h-24 overflow-hidden shrink-0">
        <div 
          className={`flex items-center gap-3 transition-all duration-500 ${isSidebarOpen ? 'translate-x-0' : 'mx-auto'}`}
        >
            <div 
              className="bg-purple-600 p-3 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-110 transition-transform flex items-center justify-center min-w-[48px] h-[48px]"
              onClick={() => setActiveTool('Home')}
            >
                {isSidebarOpen ? <Squares2x2Icon className="w-6 h-6 text-white" /> : <span className="text-xl font-black text-white">M</span>}
            </div>
            {isSidebarOpen && (
                <div 
                    onClick={() => setActiveTool('Home')}
                    className="flex flex-col animate-fadeIn cursor-pointer"
                >
                    <span className="text-xl font-black text-white leading-none tracking-tighter">MultiTools</span>
                    <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest mt-1.5 opacity-80">AI Workstation</span>
                </div>
            )}
        </div>
      </div>

      {isSidebarOpen && (
          <div className="px-4 mb-8 animate-fadeIn">
              <div className="relative group">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                  <input 
                      type="text" 
                      placeholder="Quick Find..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-gray-200 outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600"
                  />
              </div>
          </div>
      )}

      <nav className="flex-grow overflow-y-auto custom-scrollbar px-2 space-y-1.5 pb-20 no-scrollbar">
        {filteredTools.map((group) => {
            const isOpen = expandedMenus[group.group];
            const isActive = group.isHub ? activeTool === group.hubKey : group.items?.some(i => i.key === activeTool);
            
            return (
                <div key={group.group} className="relative">
                    {/* Active Bar & Glow */}
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-purple-500 rounded-r-full shadow-[0_0_15px_rgba(168,85,247,1)] z-10" />
                    )}

                    <button 
                      onClick={() => toggleMenu(group.group)} 
                      onMouseEnter={() => setHoveredTool(group.group)}
                      onMouseLeave={() => setHoveredTool(null)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all relative group ${isActive ? 'bg-purple-600/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'} ${!isSidebarOpen ? 'justify-center' : ''}`}
                    >
                        <group.icon className={`w-6 h-6 shrink-0 transition-colors ${isActive ? 'text-purple-400' : 'text-gray-600'} ${isActive && !isSidebarOpen ? 'drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]' : ''}`} />
                        {isSidebarOpen && (
                          <>
                            <span className="text-sm font-bold truncate flex-grow text-left tracking-tight">{group.group}</span>
                            <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                          </>
                        )}
                    </button>
                    
                    {isOpen && isSidebarOpen && (
                        <div className="mt-1.5 ml-4 border-l border-white/10 space-y-1 animate-fadeIn">
                            {group.items?.map(item => {
                                const isSubActive = group.isHub ? (activeTool === group.hubKey && group.activeSubKey === item.key) : (activeTool === item.key);
                                return (
                                    <button 
                                      key={item.key} 
                                      onClick={() => { if(group.isHub) { setActiveTool(group.hubKey!); group.setSubKey?.(item.key); } else { setActiveTool(item.key); } }} 
                                      className={`w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${isSubActive ? 'text-purple-400 bg-purple-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )
        })}

        <div className="pt-6 mt-6 border-t border-white/5">
            <button 
                onClick={() => toggleMenu('Archives & History')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${activeTool === 'History' ? 'bg-pink-600/10 text-white' : 'text-gray-500 hover:bg-white/5'} ${!isSidebarOpen ? 'justify-center' : ''}`}
            >
                <HistoryIcon className={`w-6 h-6 shrink-0 ${activeTool === 'History' ? 'text-pink-400' : 'text-gray-600'}`} />
                {isSidebarOpen && <span className="text-sm font-bold flex-grow text-left tracking-tight">Archives</span>}
            </button>
            {expandedMenus['Archives & History'] && isSidebarOpen && (
                <div className="mt-1.5 ml-4 border-l border-white/10 space-y-1 animate-fadeIn">
                    {archiveTabs.map(sub => (
                        <button 
                            key={sub.key} 
                            onClick={() => { setActiveTool('History'); setActiveHistoryTab(sub.key); }} 
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTool === 'History' && activeHistoryTab === sub.key ? 'text-pink-400 bg-pink-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </nav>
      
      <div className={`mt-auto p-6 border-t border-white/5 flex items-center gap-3 bg-[#05050C] ${isSidebarOpen ? '' : 'justify-center'}`}>
          <div className="relative flex items-center justify-center">
            <div className="absolute w-5 h-5 bg-green-500/20 rounded-full animate-[pulse_2s_infinite]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] relative z-10"></div>
          </div>
          {isSidebarOpen && (
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500 truncate animate-fadeIn">Engine Operational</span>
          )}
      </div>
    </aside>
  );
};

export default Header;
