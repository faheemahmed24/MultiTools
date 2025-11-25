
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
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    uiLanguage, 
    setUiLanguage, 
    setActiveTool, 
    t, 
    currentUser,
    onLoginClick,
    onLogoutClick,
    onSearch
}) => {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLButtonElement>(null);

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
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && !dropdown.contains(event.target as Node)) {
             setIsNotifDropdownOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleUserMenu = () => {
      setIsUserDropdownOpen(!isUserDropdownOpen);
      setIsNotifDropdownOpen(false);
      setIsLangDropdownOpen(false);
  }

  const toggleNotifications = () => {
      setIsNotifDropdownOpen(!isNotifDropdownOpen);
      setIsUserDropdownOpen(false);
      setIsLangDropdownOpen(false);
  }

  return (
    <>
    <header className="header">
        <div className="header-content">
            <div className="logo" onClick={() => setActiveTool('Dashboard')}>
                <i className="fas fa-robot"></i>
                <h1>MultiTools</h1>
            </div>
            
            <div className="search-bar">
                <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search for tools..." 
                    onChange={(e) => onSearch(e.target.value)}
                />
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
                    <div className={`language-dropdown ${isLangDropdownOpen ? 'active' : ''}`} id="languageDropdown">
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
                </div>
                
                <button className="notification-btn" onClick={toggleNotifications} ref={notifDropdownRef}>
                    <i className="fas fa-bell"></i>
                    <span className="notification-badge">3</span>
                </button>
                
                <div className="user-avatar" onClick={toggleUserMenu} ref={userDropdownRef}>
                    {currentUser ? currentUser.email.charAt(0).toUpperCase() : <i className="fas fa-user"></i>}
                </div>
            </div>
        </div>
    </header>

    {/* Notification Dropdown */}
    <div className={`notification-dropdown ${isNotifDropdownOpen ? 'active' : ''}`} id="notificationDropdown">
        <div className="notification-item">
            <div className="notification-title">Audio transcription completed</div>
            <div className="notification-time">2 minutes ago</div>
        </div>
        <div className="notification-item">
            <div className="notification-title">New tool available: Code Assistant</div>
            <div className="notification-time">1 hour ago</div>
        </div>
        <div className="notification-item">
            <div className="notification-title">System update ready</div>
            <div className="notification-time">3 hours ago</div>
        </div>
    </div>

    {/* User Dropdown */}
    <div className={`user-dropdown ${isUserDropdownOpen ? 'active' : ''}`} id="userDropdown">
        {currentUser ? (
            <>
                <div className="user-dropdown-item">
                    <i className="fas fa-user"></i> Profile
                </div>
                <div className="user-dropdown-item">
                    <i className="fas fa-cog"></i> Settings
                </div>
                <div className="user-dropdown-item">
                    <i className="fas fa-crown"></i> Subscription
                </div>
                <div className="user-dropdown-item" onClick={onLogoutClick}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                </div>
            </>
        ) : (
             <div className="user-dropdown-item" onClick={onLoginClick}>
                <i className="fas fa-sign-in-alt"></i> Login
            </div>
        )}
    </div>
    </>
  );
};

export default Header;
