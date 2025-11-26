import React, { useState, useRef, useEffect } from 'react';
import type { Language, TranslationSet, User } from '../types';

interface HeaderProps {
  uiLanguage: Language;
  setUiLanguage: (lang: Language) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  t: TranslationSet;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    uiLanguage, 
    setUiLanguage, 
    setActiveTool, 
    currentUser,
    onLoginClick,
    onLogoutClick,
    searchQuery,
    setSearchQuery
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'language' | 'notifications' | 'profile' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: 'language' | 'notifications' | 'profile') => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <header className="bg-[var(--secondary-bg)] px-8 py-4 flex justify-between items-center border-b border-[var(--border-color)] shadow-[var(--shadow)] sticky top-0 z-50">
        <div className="flex items-center gap-2 text-2xl font-bold text-[var(--primary-color)] cursor-pointer select-none" onClick={() => setActiveTool('Dashboard')}>
            <i className="fas fa-tools text-3xl"></i>
            <span>MultiTools</span>
        </div>
        
        <div className="flex-grow max-w-[500px] mx-8 relative hidden md:block">
            <input 
                type="text" 
                placeholder="Search for tools..." 
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                className="w-full py-2.5 px-4 pl-4 pr-10 rounded-full border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] text-sm focus:outline-none focus:border-[var(--primary-color)] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)] transition-all"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors cursor-pointer p-1">
                <i className="fas fa-search"></i>
            </button>
        </div>
        
        <div className="flex items-center gap-4" ref={dropdownRef}>
            {/* Language Selector */}
            <div className="relative">
                <button 
                    onClick={() => toggleDropdown('language')}
                    className="bg-none border-none text-[var(--text-color)] cursor-pointer text-xl p-2.5 rounded-full transition-all hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]"
                >
                    <i className="fas fa-globe"></i>
                </button>
                {activeDropdown === 'language' && (
                    <div className="absolute top-[calc(100%+0.5rem)] right-0 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-xl p-2 min-w-[180px] z-50 shadow-[var(--shadow-hover)] animate-fadeIn">
                        <div onClick={() => { setUiLanguage('en'); setActiveDropdown(null); }} className="p-3 cursor-pointer rounded-lg transition-colors flex items-center gap-3 text-[var(--text-color)] hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]">
                             <i className="fas fa-flag-usa w-5 text-center"></i> English
                        </div>
                        <div onClick={() => { setUiLanguage('ar'); setActiveDropdown(null); }} className="p-3 cursor-pointer rounded-lg transition-colors flex items-center gap-3 text-[var(--text-color)] hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]">
                             <i className="fas fa-mosque w-5 text-center"></i> Arabic
                        </div>
                         <div onClick={() => { setUiLanguage('ur'); setActiveDropdown(null); }} className="p-3 cursor-pointer rounded-lg transition-colors flex items-center gap-3 text-[var(--text-color)] hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]">
                             <span className="font-serif w-5 text-center text-lg leading-none">اردو</span> Urdu
                        </div>
                        <div onClick={() => { setUiLanguage('hi'); setActiveDropdown(null); }} className="p-3 cursor-pointer rounded-lg transition-colors flex items-center gap-3 text-[var(--text-color)] hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]">
                             <span className="w-5 text-center">HI</span> Hindi
                        </div>
                    </div>
                )}
            </div>
            
            {/* Notifications */}
            <div className="relative">
                <button 
                     onClick={() => toggleDropdown('notifications')}
                     className="bg-none border-none text-[var(--text-color)] cursor-pointer text-xl p-2.5 rounded-full transition-all hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)] relative"
                >
                    <i className="fas fa-bell"></i>
                    <span className="absolute top-0 right-0 bg-[var(--primary-color)] text-white rounded-full w-[18px] h-[18px] flex items-center justify-center text-[0.7rem] font-bold shadow-[0_0_0_2px_#fff]">2</span>
                </button>
                {activeDropdown === 'notifications' && (
                     <div className="absolute top-[calc(100%+0.5rem)] right-0 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-xl p-1 min-w-[300px] z-50 shadow-[var(--shadow-hover)] animate-fadeIn">
                        <div className="max-h-[350px] overflow-y-auto">
                            <div className="p-4 border-b border-[var(--border-color)] hover:bg-[var(--bg-color)] transition-colors cursor-default">
                                <div className="font-semibold mb-1 text-[var(--text-color)]">Welcome</div>
                                <div className="text-sm text-[var(--text-secondary)] leading-snug">Welcome to MultiTools! Explore our amazing tools.</div>
                                <div className="text-xs text-[var(--text-secondary)] mt-2 opacity-70">Just now</div>
                            </div>
                             <div className="p-4 hover:bg-[var(--bg-color)] transition-colors cursor-default">
                                <div className="font-semibold mb-1 text-[var(--text-color)]">New Feature</div>
                                <div className="text-sm text-[var(--text-secondary)] leading-snug">Dark/Light theme update applied.</div>
                                <div className="text-xs text-[var(--text-secondary)] mt-2 opacity-70">10 mins ago</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Profile */}
             <div className="relative">
                <button 
                    onClick={() => toggleDropdown('profile')}
                    className="bg-none border-none text-[var(--text-color)] cursor-pointer text-xl p-2.5 rounded-full transition-all hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]"
                >
                    <i className="fas fa-user"></i>
                </button>
                 {activeDropdown === 'profile' && (
                    <div className="absolute top-[calc(100%+0.5rem)] right-0 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-xl p-2 min-w-[180px] z-50 shadow-[var(--shadow-hover)] animate-fadeIn">
                        {currentUser ? (
                             <>
                                <div className="p-3 rounded-lg flex items-center gap-3 text-[var(--text-color)] border-b border-[var(--border-color)] mb-1">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[#a855f7] flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        {currentUser.email.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate max-w-[120px] font-medium text-sm">{currentUser.email.split('@')[0]}</span>
                                </div>
                                <div onClick={() => { onLogoutClick(); setActiveDropdown(null); }} className="p-3 cursor-pointer rounded-lg transition-colors flex items-center gap-3 text-[var(--text-color)] hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]">
                                    <i className="fas fa-sign-out-alt"></i> Logout
                                </div>
                             </>
                        ) : (
                            <>
                                <div onClick={() => { onLoginClick(); setActiveDropdown(null); }} className="p-3 cursor-pointer rounded-lg transition-colors flex items-center gap-3 text-[var(--text-color)] hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]">
                                    <i className="fas fa-sign-in-alt"></i> Login
                                </div>
                                <div onClick={() => { onLoginClick(); setActiveDropdown(null); }} className="p-3 cursor-pointer rounded-lg transition-colors flex items-center gap-3 text-[var(--text-color)] hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]">
                                    <i className="fas fa-user-plus"></i> Sign Up
                                </div>
                            </>
                        )}
                    </div>
                 )}
            </div>
        </div>
    </header>
  );
};

export default Header;