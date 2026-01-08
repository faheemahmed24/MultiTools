
import React, { useState, useMemo } from 'react';
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
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Transcription & Text': true,
    'Strategy & Planning': false,
    'Visual Studio': false
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
          { key: 'Strategic Planner', label: 'Architect Suite', icon: CubeIcon },
          { key: 'Smart Summarizer', label: 'Knowledge Hub', icon: SummarizerIcon },
        ]
    },
    {
        group: 'Visual Studio',
        icon: ImageIcon,
        isHub: true,
        items: [
            { key: 'Popular & Essential', label: 'Essentials', icon: BoltIcon },
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
            { key: 'PDF to Image', label: 'Export Pages', icon: PdfToImageIcon },
            { key: 'Image to PDF', label: 'Merge Docs', icon: ImageToPdfIcon },
            { key: 'PDF to Word', label: 'Editable OCR', icon: PdfToWordIcon },
            { key: 'Export to Sheets', label: 'Data Tabulate', icon: SheetIcon },
        ]
    }
  ], [t, activeImageCategory]);

  return (
    <aside 
        className={`bg-[#05050C] border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out relative shrink-0 z-50 group/sidebar ${isSidebarOpen ? 'w-[260px]' : 'w-[72px]'}`}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
    >
      {/* Branding Area: M Icon or Full Logo */}
      <div className="flex items-center h-24 px-4 mb-4 overflow-hidden select-none">
        <div className="flex items-center gap-4 min-w-[220px]">
            <div 
                onClick={() => setActiveTool('Home')}
                className="bg-purple-600 p-2.5 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.4)] flex-shrink-0 cursor-pointer hover:scale-105 transition-transform active:scale-95"
            >
                {isSidebarOpen ? <Squares2x2Icon className="w-7 h-7 text-white" /> : <span className="text-2xl font-black text-white w-7 h-7 flex items-center justify-center">M</span>}
            </div>
            <div 
                onClick={() => setActiveTool('Home')}
                className={`transition-all duration-500 cursor-pointer ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
            >
                <span className="text-2xl font-black text-white tracking-tighter">MultiTools</span>
                <p className="text-[9px] font-black text-purple-500 uppercase tracking-[0.35em] leading-none mt-1">Universal AI</p>
            </div>
        </div>
      </div>

      {/* Navigation Rail */}
      <nav className="flex-grow overflow-y-auto px-3 space-y-2 no-scrollbar scroll-smooth">
        {toolStructure.map((group) => {
            const isActive = group.isHub ? activeTool === group.hubKey : group.items?.some(i => i.key === activeTool);
            const isOpen = expandedMenus[group.group];

            return (
                <div key={group.group} className="relative">
                    {/* Tooltip for Rail Mode */}
                    {!isSidebarOpen && hoveredTool === group.group && (
                        <div className="fixed left-[84px] px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl z-[100] animate-pop-in whitespace-nowrap after:content-[''] after:absolute after:right-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-transparent after:border-r-purple-600">
                            {group.group}
                        </div>
                    )}

                    <button 
                      onClick={() => toggleMenu(group.group)} 
                      onMouseEnter={() => setHoveredTool(group.group)}
                      onMouseLeave={() => setHoveredTool(null)}
                      className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all relative group ${isActive ? 'bg-purple-600/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                      aria-label={group.group}
                    >
                        {/* Vertical Neon Indicator */}
                        {isActive && (
                            <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                        )}
                        
                        <group.icon className={`w-6 h-6 shrink-0 transition-all duration-300 ${isActive ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'text-gray-600 group-hover:text-gray-400'}`} />
                        
                        <span className={`text-sm font-bold truncate flex-grow text-left tracking-tight transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            {group.group}
                        </span>
                        
                        {isSidebarOpen && (
                            <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-500 ${isOpen ? 'rotate-180' : 'opacity-40'}`} />
                        )}
                    </button>
                    
                    {isOpen && isSidebarOpen && (
                        <div className="mt-1 ml-4 border-l border-white/5 space-y-1 animate-fadeIn">
                            {group.items?.map(item => {
                                const isSubActive = group.isHub ? (activeTool === group.hubKey && group.activeSubKey === item.key) : (activeTool === item.key);
                                return (
                                    <button 
                                      key={item.key} 
                                      onClick={() => { if(group.isHub) { setActiveTool(group.hubKey!); group.setSubKey?.(item.key); } else { setActiveTool(item.key); } }} 
                                      className={`w-full text-left px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${isSubActive ? 'text-purple-400 bg-purple-500/5' : 'text-gray-500 hover:text-gray-300 hover:translate-x-1'}`}
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

        {/* History Quick Link */}
        <div className="pt-6 mt-6 border-t border-white/5">
             <button 
                onClick={() => { setActiveTool('History'); setActiveHistoryTab('transcriptions'); }}
                onMouseEnter={() => setHoveredTool('History')}
                onMouseLeave={() => setHoveredTool(null)}
                className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all relative ${activeTool === 'History' ? 'bg-pink-600/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
                {!isSidebarOpen && hoveredTool === 'History' && (
                    <div className="fixed left-[84px] px-4 py-2 bg-pink-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl z-[100] animate-pop-in whitespace-nowrap after:content-[''] after:absolute after:right-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-transparent after:border-r-pink-600">Archives</div>
                )}
                {activeTool === 'History' && <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-500 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.8)]" />}
                <HistoryIcon className={`w-6 h-6 shrink-0 ${activeTool === 'History' ? 'text-pink-400' : 'text-gray-600'}`} />
                <span className={`text-sm font-bold truncate transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Archives</span>
             </button>
        </div>
      </nav>
      
      {/* Sidebar Footer: Smart Pulse Status */}
      <div className="mt-auto p-5 border-t border-white/5">
          <div className="flex items-center gap-4 group/status">
              <div className="relative flex items-center justify-center w-6 h-6 flex-shrink-0">
                  <div className="absolute w-4 h-4 bg-green-500/20 rounded-full animate-ping"></div>
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.8)] group-hover:scale-125 transition-transform"></div>
              </div>
              <div className={`flex flex-col transition-all duration-500 overflow-hidden ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 font-mono whitespace-nowrap">Engine Operational</span>
                <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">Master Node v2.1</span>
              </div>
          </div>
      </div>
    </aside>
  );
};

export default Header;
