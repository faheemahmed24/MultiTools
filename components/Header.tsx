import React, { useState, useEffect, useRef } from 'react';
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
}

const Header: React.FC<HeaderProps> = ({ 
    uiLanguage, 
    setUiLanguage, 
    setActiveTool, 
    t, 
    currentUser,
    onLoginClick,
    onLogoutClick 
}) => {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'ur', name: 'اردو' },
    { code: 'hi', name: 'हिन्दी' },
  ];

  const currentLanguageName = languages.find(l => l.code === uiLanguage)?.name || 'English';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header">
        <div className="header-content">
            <div className="logo" onClick={() => setActiveTool('Dashboard')}>
                <i className="fas fa-robot"></i>
                <h1>MultiTools</h1>
            </div>
            
            <div className="search-bar">
                <input type="text" className="search-input" placeholder={t.searchTranscription || "Search for tools..."} id="searchInput" />
                <button className="search-btn">
                    <i className="fas fa-search"></i>
                </button>
            </div>
            
            <div className="user-menu">
                <div className="language-selector" ref={langDropdownRef}>
                    <button className="language-btn" onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}>
                        <i className="fas fa-globe"></i>
                        <span id="currentLanguage">{currentLanguageName}</span>
                        <i className="fas fa-chevron-down"></i>
                    </button>
                    {isLangDropdownOpen && (
                        <div className="language-dropdown active" id="languageDropdown">
                            {languages.map(lang => (
                                <div 
                                    key={lang.code} 
                                    className={`language-option ${uiLanguage === lang.code ? 'active' : ''}`}
                                    onClick={() => {
                                        setUiLanguage(lang.code);
                                        setIsLangDropdownOpen(false);
                                    }}
                                >
                                    <i className="fas fa-flag"></i>
                                    <span>{lang.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <button className="notification-btn">
                    <i className="fas fa-bell"></i>
                    <span className="notification-badge">3</span>
                </button>
                
                {currentUser ? (
                     <div className="user-avatar" onClick={onLogoutClick} title={`Logged in as ${currentUser.email}. Click to logout.`}>
                        {currentUser.email.charAt(0).toUpperCase()}
                    </div>
                ) : (
                    <div className="user-avatar" onClick={onLoginClick} title="Login">
                        <i className="fas fa-user"></i>
                    </div>
                )}
            </div>
        </div>
    </header>
  );
};

export default Header;