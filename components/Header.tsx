
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
import { LockClosedIcon } from './icons/LockClosedIcon';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { SwatchIcon } from './icons/SwatchIcon';
// Fix: Moved SparklesIcon import to top and removed it from bottom
import { SparklesIcon } from './icons/SparklesIcon';

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
  mostUsedTools: Array<{key: string, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>>}>;
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
    onStatusClick,
    mostUsedTools
}) => {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Intelligence': true,
    'Collaboration': false,
    'Documents': true,
    'Favorites': true
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
      group: 'Intelligence',
      icon: SparklesIcon,
      items: [
        { key: 'PDF Copilot', label: 'AI Copilot', icon: BoltIcon },
        { key: 'Chat PDF', label: 'Chat PDF', icon: ChatBubbleLeftRightIcon },
        { key: 'AI PDF Editor', label: 'AI Text Editor', icon: PencilSquareIcon },
        { key: 'AI Transcriber', label: t.aiTranscriber, icon: TranscriberIcon },
      ]
    },
    {
        group: 'Collaboration',
        icon: SwatchIcon,
        items: [
          { key: 'AI Whiteboard', label: 'Whiteboards', icon: SwatchIcon },
          { key: 'Pages & Spaces', label: 'Workspaces', icon: Squares2x2Icon },
          { key: 'Strategic Planner', label: 'Plan Architect', icon: CubeIcon },
          { key: 'Smart Summarizer', label: 'Auto Summarize', icon: SummarizerIcon },
        ]
    },
    {
        group: 'Documents',
        icon: DocumentDuplicateIcon,
        items: [
            { key: 'PDF Manager', label: 'Page Architect', icon: DocumentDuplicateIcon },
            { key: 'Compress PDF', label: 'Compressor', icon: ArrowPathIcon },
            { key: 'Security Vault', label: 'Unlock/Lock', icon: LockClosedIcon },
            { key: 'Watermark AI', label: 'Watermark', icon: PencilSquareIcon },
            { key: 'PDF to Image', label: 'PDF to Image', icon: PdfToImageIcon },
            { key: 'Image to PDF', label: 'Image to PDF', icon: ImageToPdfIcon },
            { key: 'Export to Sheets', label: 'To Sheets', icon: SheetIcon },
        ]
    }
  ], [t]);

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
                <p className="text-[9px] font-black text-purple-500 uppercase tracking-[0.35em] mt-1">PRO Elite</p>
            </div>
        </div>
      </div>

      <nav className="flex-grow overflow-y-auto px-3 space-y-2 no-scrollbar pb-10">
        {mostUsedTools.length > 0 && (
          <div className="mb-6">
            <button 
              onClick={() => toggleMenu('Favorites')}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all relative ${isSidebarOpen ? 'text-yellow-500/80' : 'text-yellow-500'}`}
            >
              <BoltIcon className="w-6 h-6 shrink-0" />
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  Quick Access
              </span>
            </button>
            {expandedMenus['Favorites'] && isSidebarOpen && (
              <div className="mt-1 ml-4 border-l border-yellow-500/20 space-y-1">
                {mostUsedTools.map(tool => (
                  <button 
                    key={tool.key} 
                    onClick={() => setActiveTool(tool.key)}
                    className={`w-full text-left px-5 py-2 text-xs font-bold rounded-xl transition-all ${activeTool === tool.key ? 'text-yellow-400 bg-yellow-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-[1px] bg-white/5 mx-2 my-4"></div>

        {toolStructure.map((group) => {
            const isActive = group.items?.some(i => i.key === activeTool);
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
                                        onClick={() => setActiveTool(item.key)} 
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
                                const isSubActive = activeTool === item.key;
                                return (
                                    <button 
                                      key={item.key} 
                                      onClick={() => setActiveTool(item.key)} 
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
                <span className={`text-sm font-bold truncate ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Global Archive</span>
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
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 font-mono whitespace-nowrap group-hover:text-white transition-colors">Workspace Live</span>
                <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">MultiTools Node</span>
              </div>
          </div>
      </div>
    </aside>
  );
};

export default Header;
