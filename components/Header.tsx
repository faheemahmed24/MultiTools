import React, { useState } from 'react';
import type { Language, TranslationSet, User } from '../types';
import LanguageSelector from './LanguageSelector';

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
    currentUser,
    onLoginClick,
    onLogoutClick 
}) => {
  return (
    <header className="header">
        <div className="header-content">
            <div className="logo" onClick={() => setActiveTool('Dashboard')}>
                <i className="fas fa-robot"></i>
                <h1>MultiTools</h1>
            </div>
            
            <div className="search-bar">
                <input type="text" className="search-input" placeholder="Search for tools..." id="searchInput" />
                <button className="search-btn">
                    <i className="fas fa-search"></i>
                </button>
            </div>
            
            <div className="user-menu">
                <div className="hidden sm:block w-32">
                     <LanguageSelector selectedLanguage={uiLanguage} onSelectLanguage={setUiLanguage} />
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
                    <button onClick={onLoginClick} className="user-avatar" title="Login">
                        <i className="fas fa-user"></i>
                    </button>
                )}
            </div>
        </div>
    </header>
  );
};

export default Header;