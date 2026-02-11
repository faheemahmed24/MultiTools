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
import { SparklesIcon } from './icons/SparklesIcon';
import { SearchIcon } from './icons/SearchIcon';

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
    isSidebarOpen, 
    setIsSidebarOpen,
    setActiveHistoryTab,
    mostUsedTools
}) => {
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Intelligence': true,
    'Business': false,
    'Media & Docs': false,
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
        { key: 'AI Transcriber', label: 'AI Transcriber', description: 'Neural audio/video to text.', tags: ['speech', 'voice', 'mp3', 'mp4', 'text', 'transcribe'], icon: TranscriberIcon, isCore: true },
        { key: 'PDF Copilot', label: 'AI Copilot', description: 'Command-based PDF management.', tags: ['automate', 'commands', 'prompt', 'pdf'], icon: BoltIcon, isCore: true },
        { key: 'Chat PDF', label: 'Chat PDF', description: 'Interactive document dialogue.', tags: ['qa', 'analyze', 'reading', 'pdf'], icon: ChatBubbleLeftRightIcon, isCore: true },
        { key: 'AI PDF Editor', label: 'AI Text Editor', description: 'Generative document refinement.', tags: ['edit', 'rewrite', 'style', 'text'], icon: PencilSquareIcon },
      ]
    },
    {
        group: 'Business',
        icon: CubeIcon,
        items: [
          { key: 'AI Whiteboard', label: 'Whiteboards', description: 'Sketch to technical diagram.', tags: ['draw', 'diagram', 'visual', 'sketch', 'canvas'], icon: SwatchIcon },
          { key: 'Strategic Planner', label: 'Plan Architect', description: 'Data-driven project roadmaps.', tags: ['strategy', 'report', 'business', 'pptx', 'plan'], icon: CubeIcon, isCore: true },
          { key: 'Smart Summarizer', label: 'Auto Summarize', description: 'Deep extraction of key metrics.', tags: ['summary', 'brief', 'extract', 'intelligence'], icon: SummarizerIcon },
          { key: 'Pure Organizer', label: 'Verbatim Node', description: 'Grouping data without changes.', tags: ['structure', 'data', 'cleaning', 'verbatim'], icon: Squares2x2Icon },
        ]
    },
    {
        group: 'Media & Docs',
        icon: DocumentDuplicateIcon,
        items: [
            { key: 'PDF Manager', label: 'Page Architect', description: 'PDF merging and manipulation.', tags: ['combine', 'split', 'pages', 'merge', 'pdf'], icon: DocumentDuplicateIcon },
            { key: 'AI Translator', label: 'Universal Translator', description: 'Nuanced multilingual conversion.', tags: ['language', 'global', 'speak', 'translate'], icon: TranslatorIcon },
            { key: 'Grammar Corrector', label: 'Syntax Refiner', description: 'AI-driven stylistic proofreading.', tags: ['proofread', 'english', 'grammar', 'spellcheck'], icon: GrammarIcon },
            { key: 'PDF to Image', label: 'PDF to Image', description: 'Extract pages as JPG or PNG.', tags: ['png', 'jpg', 'extract', 'pdf'], icon: PdfToImageIcon },
            { key: 'Image to PDF', label: 'Image to PDF', description: 'Assemble images into documents.', tags: ['convert', 'combine', 'photos', 'pdf'], icon: ImageToPdfIcon },
            { key: 'Export to Sheets', label: 'Data to Sheets', description: 'Unstructured text to CSV/Excel.', tags: ['csv', 'excel', 'data', 'sheets'], icon: SheetIcon },
        ]
    }
  ], []);

  const filteredStructure = useMemo(() => {
    if (!sidebarSearch.trim()) return toolStructure;
    const lower = sidebarSearch.toLowerCase();
    return toolStructure.map(group => {
      const groupMatches = group.group.toLowerCase().includes(lower);
      const filteredItems = group.items.filter(item => 
        groupMatches || 
        item.label.toLowerCase().includes(lower) || 
        item.description.toLowerCase().includes(lower) ||
        item.tags.some(tag => tag.toLowerCase().includes(lower))
      );
      return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);
  }, [toolStructure, sidebarSearch]);

  const isSearching = sidebarSearch.trim().length > 0;

  return (
    <aside 
        className={`bg-[#05050C] border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out relative shrink-0 z-50 group/sidebar ${isSidebarOpen ? 'w-[280px]' : 'w-[80px]'}`}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
    >
      <div className="flex items-center h-24 px-5 mb-2 overflow-hidden select-none cursor-pointer" onClick={() => setActiveTool('Home')}>
        <div className="flex items-center gap-4 min-w-[240px]">
            <div className="bg-purple-600 w-12 h-12 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.4)] flex-shrink-0 flex items-center justify-center">
                <span className="text-2xl font-black text-white">M</span>
            </div>
            <div className={`transition-all duration-500 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <span className="text-2xl font-black text-white tracking-tighter">MultiTools</span>
                <p className="text-[9px] font-black text-purple-500 uppercase tracking-[0.35em] mt-1">PRO ELITE</p>
            </div>
        </div>
      </div>

      <div className={`px-4 mb-6 transition-all duration-500 ${isSidebarOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
          <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <SearchIcon className="w-3.5 h-3.5 text-gray-600 group-focus-within:text-purple-500 transition-colors" />
              </div>
              <input 
                type="text" 
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold text-white outline-none focus:border-purple-500/50 transition-all"
              />
          </div>
      </div>

      <nav className="flex-grow overflow-y-auto px-4 space-y-4 no-scrollbar pb-10">
        {!isSearching && mostUsedTools.length > 0 && (
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
          </div>
        )}

        {filteredStructure.map((group, idx) => {
            const isActive = group.items?.some(i => i.key === activeTool);
            const isOpen = isSearching || expandedMenus[group.group];
            return (
                <div key={group.group} className="relative">
                    {idx > 0 && <div className="h-[1px] bg-white/5 mx-2 my-4"></div>}
                    
                    <button 
                      onClick={() => toggleMenu(group.group)} 
                      className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all relative group ${isActive ? 'bg-purple-600/10 text-white' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                        {isActive && <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1.5 h-10 bg-purple-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)]" />}
                        <group.icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-yellow-500' : 'text-gray-600 group-hover:text-gray-400'}`} />
                        <span className={`text-sm font-bold truncate flex-grow text-left transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            {group.group}
                        </span>
                    </button>
                    
                    {isOpen && isSidebarOpen && (
                        <div className="mt-1 ml-4 border-l border-white/5 space-y-1">
                            {group.items?.map(item => (
                                <button 
                                  key={item.key} 
                                  onClick={() => setActiveTool(item.key)} 
                                  className={`w-full text-left px-5 py-2.5 rounded-xl transition-all flex flex-col items-start ${activeTool === item.key ? 'text-purple-400 bg-purple-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <span className="text-xs font-bold">{item.label}</span>
                                    <span className="text-[10px] opacity-50 font-medium leading-tight mt-0.5">{item.description}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )
        })}

        <div className="h-[1px] bg-white/5 mx-2 my-4"></div>
        <button onClick={() => { setActiveTool('History'); setActiveHistoryTab('transcriptions'); }} className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all relative ${activeTool === 'History' ? 'bg-pink-600/10 text-white' : 'text-gray-500 hover:bg-white/5'}`}>
            <HistoryIcon className="w-6 h-6 shrink-0" />
            <span className={`text-sm font-bold truncate ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Archive</span>
        </button>
      </nav>
      
      <div className="mt-auto p-5 border-t border-white/5">
          <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.8)]"></div>
              <div className={`flex flex-col transition-all duration-500 ${isSidebarOpen ? 'opacity-100 ml-2' : 'opacity-0 w-0'}`}>
                <span className="text-[9px] font-black uppercase text-gray-400">Live Engine</span>
              </div>
          </div>
      </div>
    </aside>
  );
};

export default Header;