import React, { useState, useMemo } from 'react';
import type { TranslationSet } from '../types';
import { History, Search } from 'lucide-react';
import { ALL_TOOLS } from '../constants';

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
  mostUsedTools: Array<{key: string, label: string, icon: React.FC<any>}>;
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
  
  const filteredTools = useMemo(() => {
    if (!sidebarSearch.trim()) return ALL_TOOLS;
    const lower = sidebarSearch.toLowerCase();
    return ALL_TOOLS.filter(item => 
      item.label.toLowerCase().includes(lower) || 
      item.description.toLowerCase().includes(lower) ||
      item.tags.some(tag => tag.toLowerCase().includes(lower))
    );
  }, [sidebarSearch]);

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
                  <Search className="w-3.5 h-3.5 text-gray-600 group-focus-within:text-purple-500 transition-colors" />
              </div>
              <input 
                type="text" 
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search tools..."
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold text-white outline-none focus:border-purple-500/50 transition-all"
              />
          </div>
      </div>

      <nav className="flex-grow overflow-y-auto px-4 space-y-1 no-scrollbar pb-10">
        {filteredTools.map((item) => {
            const isActive = activeTool === item.key;
            return (
                <button 
                  key={item.key} 
                  onClick={() => setActiveTool(item.key)} 
                  className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all relative group ${isActive ? 'bg-purple-600/10 text-white' : 'text-gray-500 hover:bg-white/5'}`}
                >
                    {isActive && <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1.5 h-10 bg-purple-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)]" />}
                    <item.icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-yellow-500' : 'text-gray-600 group-hover:text-gray-400'}`} />
                    <div className={`flex flex-col items-start transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <span className="text-sm font-bold truncate">{item.label}</span>
                        <span className="text-[10px] opacity-50 font-medium leading-tight mt-0.5 text-left line-clamp-1">{item.description}</span>
                    </div>
                </button>
            )
        })}

        <button onClick={() => { setActiveTool('History'); setActiveHistoryTab('transcriptions'); }} className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all relative ${activeTool === 'History' ? 'bg-pink-600/10 text-white' : 'text-gray-500 hover:bg-white/5'}`}>
            <History className="w-6 h-6 shrink-0" />
            <span className={`text-sm font-bold truncate ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>History</span>
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
