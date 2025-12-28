import React from 'react';
import type { Language, User, TranslationSet } from '../types';
import { UserIcon } from './icons/UserIcon';

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
  isSidebarOpen,
  setIsSidebarOpen,
  currentUser,
  onLoginClick,
  onLogoutClick,
}) => {
  const tools = [
    'AI Transcriber',
    'AI Translator',
    'Grammar Corrector',
    'Image Converter & OCR',
    'PDF to Image',
    'Image to PDF',
    'PDF to Word',
    'Word to PDF',
    'Video to Audio',
    'Audio Merger',
    'Text to Speech',
    'Export to Sheets',
    'History',
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 flex flex-col`}
    >
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          <span className="text-purple-400">Multi</span>
          <span className="text-pink-500">Tools</span>
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {tools.map((tool) => (
          <button
            key={tool}
            onClick={() => {
              setActiveTool(tool);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeTool === tool
                ? 'bg-purple-600 text-white font-medium'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {t[tool.replace(/ & /g, '').replace(/ /g, '').replace(/^./, (c) => c.toLowerCase())] || tool}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 text-gray-300 mb-4">
          <UserIcon className="w-5 h-5" />
          <span className="text-sm truncate">{currentUser ? currentUser.email : 'Guest'}</span>
        </div>
        {currentUser ? (
          <button onClick={onLogoutClick} className="w-full py-2 px-4 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium">
            Logout
          </button>
        ) : (
          <button onClick={onLoginClick} className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
            Login / Sign Up
          </button>
        )}
      </div>
    </aside>
  );
};

export default Header;