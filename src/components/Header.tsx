import React, { useState, useMemo } from 'react';
import type { TranslationSet } from '../types';
import { TOOL_STRUCTURE } from '../constants';
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
import { X } from 'lucide-react';

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
  mostUsedTools: Array<{key: string, label: string, description: string, icon: React.FC<React.SVGProps<SVGSVGElement>>}>;
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

  const filteredStructure = useMemo(() => {
    if (!sidebarSearch.trim()) return TOOL_STRUCTURE;
    const lower = sidebarSearch.toLowerCase();
    return TOOL_STRUCTURE.map(group => {
      const groupMatches = group.group.toLowerCase().includes(lower);
      const filteredItems = group.items.filter(item => 
        groupMatches || 
        item.label.toLowerCase().includes(lower) || 
        item.description.toLowerCase().includes(lower) ||
        item.tags.some(tag => tag.toLowerCase().includes(lower))
      );
      return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);
  }, [sidebarSearch]);

  const isSearching = sidebarSearch.trim().length > 0;

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="text-purple-400 bg-purple-400/10 px-0.5 rounded-sm">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside 
          className={`bg-[var(--bg-app)] border-r border-[var(--border-app)] flex flex-col transition-all duration-300 ease-in-out fixed md:relative inset-y-0 left-0 z-[70] md:z-50 shrink-0 group/sidebar ${isSidebarOpen ? 'w-[260px] translate-x-0' : 'w-[72px] -translate-x-full md:translate-x-0'}`}
          onMouseEnter={() => { if (window.innerWidth >= 768) setIsSidebarOpen(true); }}
          onMouseLeave={() => { if (window.innerWidth >= 768) setIsSidebarOpen(false); }}
      >
        <div className="flex items-center justify-between h-20 px-5 mb-2 overflow-hidden select-none border-b border-[var(--border-app)]">
          <div className="flex items-center gap-3 min-w-[240px] cursor-pointer" onClick={() => { setActiveTool('Home'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}>
              <div className="bg-zinc-900 dark:bg-zinc-100 w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center">
                  <span className="text-xl font-black text-white dark:text-zinc-900">M</span>
              </div>
              <div className={`transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                  <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">MultiTools</span>
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Industrial v4.0</p>
              </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-500 hover:text-[var(--text-primary)] p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`px-4 py-4 transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-3.5 h-3.5 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Search... (Ctrl+K)"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-[var(--border-app)] rounded-md py-2 pl-9 pr-4 text-[10px] font-medium text-[var(--text-primary)] outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                />
            </div>
        </div>

        <nav className="flex-grow overflow-y-auto px-3 space-y-1 no-scrollbar pb-10">
          {!isSearching && mostUsedTools.length > 0 && (
            <div className="mb-4">
              <button 
                onClick={() => toggleMenu('Favorites')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-md transition-all relative ${isSidebarOpen ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}
              >
                <BoltIcon className="w-5 h-5 shrink-0" />
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    Pinned
                </span>
              </button>
              {expandedMenus['Favorites'] && isSidebarOpen && (
                <div className="mt-1 ml-3 border-l border-[var(--border-app)] space-y-0.5">
                  {mostUsedTools.map(item => (
                    <button 
                      key={item.key} 
                      onClick={() => { setActiveTool(item.key); if (window.innerWidth < 768) setIsSidebarOpen(false); }} 
                      className={`w-full text-left px-4 py-2 rounded-md transition-all flex flex-col items-start ${activeTool === item.key ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200/50 dark:bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
                    >
                        <span className="text-xs font-semibold truncate w-full" title={item.label}>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {filteredStructure.map((group, idx) => {
              const isActive = group.items?.some(i => i.key === activeTool);
              const isOpen = isSearching || expandedMenus[group.group];
              return (
                  <div key={group.group} className="relative">
                      <button 
                        onClick={() => toggleMenu(group.group)} 
                        className={`w-full flex items-center gap-3 p-2.5 rounded-md transition-all relative group ${isActive ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
                      >
                          <group.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                          <span className={`text-xs font-bold truncate flex-grow text-left transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                              {highlightText(group.group, sidebarSearch)}
                          </span>
                      </button>
                      
                      {isOpen && isSidebarOpen && (
                          <div className="mt-1 ml-3 border-l border-[var(--border-app)] space-y-0.5">
                              {group.items?.map(item => (
                                  <button 
                                    key={item.key} 
                                    onClick={() => { setActiveTool(item.key); if (window.innerWidth < 768) setIsSidebarOpen(false); }} 
                                    className={`w-full text-left px-4 py-2 rounded-md transition-all flex flex-col items-start ${activeTool === item.key ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200/50 dark:bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
                                  >
                                      <span className="text-xs font-semibold truncate w-full" title={item.label}>{highlightText(item.label, sidebarSearch)}</span>
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
              )
          })}

          <div className="h-[1px] bg-[var(--border-app)] mx-2 my-4"></div>
          <button onClick={() => { setActiveTool('History'); setActiveHistoryTab('transcriptions'); if (window.innerWidth < 768) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-2.5 rounded-md transition-all relative ${activeTool === 'History' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
              <HistoryIcon className="w-5 h-5 shrink-0" />
              <span className={`text-xs font-bold truncate ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Archive</span>
          </button>
        </nav>
        
        <div className="mt-auto p-4 border-t border-[var(--border-app)]">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rounded-full"></div>
                <div className={`flex flex-col transition-all duration-300 ${isSidebarOpen ? 'opacity-100 ml-1' : 'opacity-0 w-0'}`}>
                  <span className="text-[8px] font-bold uppercase text-zinc-500">System Ready</span>
                </div>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Header;