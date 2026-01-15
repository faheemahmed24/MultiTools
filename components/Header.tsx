import React, { useState, useMemo } from 'react';
import type { TranslationSet } from '../types';
import { TranscriberIcon } from './icons/TranscriberIcon';
import { TranslatorIcon } from './icons/TranslatorIcon';
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
  onStatusClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    activeTool, 
    setActiveTool, 
    activeImageCategory,
    setActiveImageCategory,
    t, 
    isSidebarOpen, 
    setIsSidebarOpen,
    setActiveHistoryTab,
    onStatusClick
}) => {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Transcription': true,
    'Visual Lab': false,
    'Strategy': true
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
      group: 'Transcription',
      icon: TranscriberIcon,
      items: [
        { key: 'AI Transcriber', label: t.aiTranscriber, icon: TranscriberIcon },
        { key: 'AI Translator', label: t.aiTranslatorTitle, icon: TranslatorIcon },
        { key: 'Grammar Corrector', label: t.grammarCorrector, icon: GrammarIcon },
      ]
    },
    {
        group: 'Strategy',
        icon: CubeIcon,
        items: [
          { key: 'Pure Organizer', label: 'Pure Organizer', icon: Squares2x2Icon },
          { key: 'Strategic Planner', label: 'Plan Architect', icon: CubeIcon },
          { key: 'Smart Summarizer', label: 'Auto Summarize', icon: SummarizerIcon },
        ]
    },
    {
        group: 'Visual Lab',
        icon: ImageIcon,
        isHub: true,
        items: [
            { key: 'All', label: 'Full Studio', icon: BoltIcon },
            { key: 'Conversion & OCR', label: 'OCR Scan', icon: ArrowPathIcon },
            { key: 'Basic Editing & Retouch', label: 'Photo Edit', icon: ScissorsIcon },
        ],
        setSubKey: setActiveImageCategory,
        activeSubKey: activeImageCategory,
        hubKey: 'Image Related Tools'
    },
    {
        group: 'Documents',
        icon: DocumentDuplicateIcon,
        items: [
            { key: 'PDF to Image', label: 'PDF to Image', icon: PdfToImageIcon },
            { key: 'Image to PDF', label: 'Image to PDF', icon: ImageToPdfIcon },
            { key: 'PDF to Word', label: 'PDF to Word', icon: PdfToWordIcon },
            { key: 'Export to Sheets', label: 'To Sheets', icon: SheetIcon },
        ]
    }
  ], [t, activeImageCategory, setActiveImageCategory]);

  return (
    <aside 
        className={`bg-[#05050C] border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out relative shrink-0 z-50 group/sidebar ${isSidebarOpen ? 'w-[260px]' : 'w-[72px]'}`}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => {
            setIsSidebarOpen(false);
            setHoveredGroup(null);
        }}
    >
      <div className="flex items-center h-24 px-4 mb-4 overflow-hidden select-none cursor-pointer" onClick={() => setActiveTool('Home')}>
        <div className="flex items-center gap-4 min-w-[220px]">
            <div className="bg-purple-600 p-2.5 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.4)] flex-shrink-0">
                {isSidebarOpen ? <Squares2x2Icon className="w-7 h-7 text-white" /> : <span className="text-2xl font-black text-white w-7 h-7 flex items-center justify-center">M</span>}
            </div>
            <div className={`transition-all duration-500 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <span className="text-2xl font-black text-white tracking-tighter">MultiTools</span>
                <p className="text-[9px] font-black text-purple-500 uppercase tracking-[0.35em] mt-1">v3.0 Click</p>
            </div>
        </div>
      </div>

      <nav className="flex-grow overflow-y-auto px-3 space-y-2 no-scrollbar">
        {toolStructure.map((group) => {
            const isActive = group.isHub ? activeTool === group.hubKey : group.items?.some(i => i.key === activeTool);
            const isOpen = expandedMenus[group.group];

            return (
                <div key={group.group} className="relative">
                    {!isSidebarOpen && hoveredGroup === group.group && (
                        <div className="fixed left-[80px] bg-[#0A0A10] border border-white/10 rounded-2xl shadow-2xl p-4 min-w-[200px] z-[100] animate-pop-in">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">{group.group}</p>
                            <div className="space-y-1">
                                {group.items?.map(item => (
                                    <button 
                                        key={item.key} 
                                        onClick={() => { if(group.isHub) { setActiveTool(group.hubKey!); group.setSubKey?.(item.key); } else { setActiveTool(item.key); } }} 
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button 
                      onClick={() => toggleMenu(group.group)} 
                      onMouseEnter={() => setHoveredGroup(group.group)}
                      className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all relative group ${isActive ? 'bg-purple-600/10 text-white' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                        {isActive && <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)]" />}
                        <group.icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-purple-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                        <span className={`text-sm font-bold truncate flex-grow text-left transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            {group.group}
                        </span>
                        {isSidebarOpen && <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-500 ${isOpen ? 'rotate-180' : 'opacity-40'}`} />}
                    </button>
                    
                    {isOpen && isSidebarOpen && (
                        <div className="mt-1 ml-4 border-l border-white/5 space-y-1">
                            {group.items?.map(item => {
                                const isSubActive = group.isHub ? (activeTool === group.hubKey && group.activeSubKey === item.key) : (activeTool === item.key);
                                return (
                                    <button 
                                      key={item.key} 
                                      onClick={() => { if(group.isHub) { setActiveTool(group.hubKey!); group.setSubKey?.(item.key); } else { setActiveTool(item.key); } }} 
                                      className={`w-full text-left px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${isSubActive ? 'text-purple-400 bg-purple-500/5' : 'text-gray-500 hover:text-gray-300'}`}
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
             <button onClick={() => { setActiveTool('History'); setActiveHistoryTab('transcriptions'); }} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all relative ${activeTool === 'History' ? 'bg-pink-600/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {activeTool === 'History' && <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-500 rounded-full" />}
                <HistoryIcon className="w-6 h-6 shrink-0" />
                <span className={`text-sm font-bold truncate ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Archive Hub</span>
             </button>
        </div>
      </nav>
      
      <div className="mt-auto p-5 border-t border-white/5">
          <div className="flex items-center gap-4 group/status cursor-pointer" onClick={onStatusClick}>
              <div className="relative flex items-center justify-center w-6 h-6 flex-shrink-0">
                  <div className="absolute w-4 h-4 bg-green-500/20 rounded-full animate-ping"></div>
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.8)]"></div>
              </div>
              <div className={`flex flex-col transition-all duration-500 overflow-hidden ${isSidebarOpen ? 'opacity-100 w-auto ml-2' : 'opacity-0 w-0'}`}>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 font-mono whitespace-nowrap group-hover:text-white transition-colors">Engine Operational</span>
                <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">Master Node Live</span>
              </div>
          </div>
      </div>
    </aside>
  );
};

export default Header;