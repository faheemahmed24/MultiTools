import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import useUserLocalStorage from './hooks/useUserLocalStorage';
import i18n, { getTranslations } from './lib/i18n';
import type { Language, User, Transcription } from './types';
import { transcribeAudio } from './services/geminiService';
import { TOOL_STRUCTURE, ALL_TOOLS } from './constants';

import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import HistoryPanel from './components/HistoryPanel';
import AuthModal from './components/AuthModal';
import Loader from './components/Loader';
import Toast, { ToastType } from './components/Toast';

// Tool Components
import AICopilot from './components/AICopilot';
import ChatPDF from './components/ChatPDF';
import AIPDFEditor from './components/AIPDFEditor';
import AIWhiteboard from './components/AIWhiteboard';
import PureOrganizer from './components/PureOrganizer';
import StrategicPlanner from './components/StrategicPlanner';
import AITranslator from './components/AITranslator';
import GrammarCorrector from './components/GrammarCorrector';
import PdfManager from './components/PdfManager';
import PdfToImage from './components/PdfToImage';
import ImageToPdf from './components/ImageToPdf';
import ExportToSheets from './components/ExportToSheets';
import VideoToAudio from './components/VideoToAudio';
import TextToSpeech from './components/TextToSpeech';
import DataSummarizer from './components/DataSummarizer';

// Icons
import { SparklesIcon } from './components/icons/SparklesIcon';
import { BoltIcon } from './components/icons/BoltIcon';
import { TranscriberIcon } from './components/icons/TranscriberIcon';
import { Squares2x2Icon } from './components/icons/Squares2x2Icon';
import { ArrowPathIcon } from './components/icons/ArrowPathIcon';
import { SearchIcon } from './components/icons/SearchIcon';
import { XCircleIcon } from './components/icons/XCircleIcon';
import { CubeIcon } from './components/icons/CubeIcon';
import { SwatchIcon } from './components/icons/SwatchIcon';
import { SummarizerIcon } from './components/icons/SummarizerIcon';
import { DocumentDuplicateIcon } from './components/icons/DocumentDuplicateIcon';
import { TranslatorIcon } from './components/icons/TranslatorIcon';
import { GrammarIcon } from './components/icons/GrammarIcon';
import { Menu } from 'lucide-react';

interface ToolEntry {
  key: string;
  label: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  tags: string[];
  isCore?: boolean;
}

function useUsageCounts(userId: string | undefined) {
    return useUserLocalStorage<Record<string, number>>('toolUsageCounts_v4', {});
}

const CommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (key: string) => void;
}> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_TOOLS;
    const lower = query.toLowerCase();
    return ALL_TOOLS.filter(t => 
      t.label.toLowerCase().includes(lower) || 
      t.tags.some(tag => tag.includes(lower))
    );
  }, [query]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-[var(--border-app)] rounded-lg shadow-2xl overflow-hidden flex flex-col transform animate-pop-in">
        <div className="flex items-center gap-4 p-5 border-b border-[var(--border-app)]">
          <SearchIcon className="w-5 h-5 text-zinc-400" />
          <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools..." className="flex-grow bg-transparent text-lg text-[var(--text-primary)] outline-none placeholder:text-zinc-400" />
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"><XCircleIcon className="w-5 h-5" /></button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2 custom-scrollbar space-y-1">
          {filtered.map(tool => (
            <button key={tool.key} onClick={() => { onSelect(tool.key); onClose(); }} className="w-full flex items-center gap-4 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all text-left group">
              <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"><tool.icon className="w-4 h-4" /></div>
              <div className="flex-grow"><h4 className="font-bold text-[var(--text-primary)] text-sm">{tool.label}</h4><p className="text-[10px] text-zinc-500 uppercase tracking-wider">{tool.category}</p></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<{ 
  onStart: () => void; 
  onLogin: () => void; 
  currentUser: User | null;
  onSelectTool: (key: string) => void;
  openSearch: () => void;
}> = ({ onStart, onLogin, currentUser }) => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center py-12 md:py-24 px-4 md:px-6 animate-fadeIn relative">
      <div className="max-w-4xl w-full text-center relative z-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-[var(--border-app)] text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">
            <SparklesIcon className="w-3 h-3" /> MultiTools Industrial v4.0
          </div>
          
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-[var(--text-primary)] uppercase leading-[0.85] mb-6">
            Universal<br/>Workstation
          </h1>
          
          <div className="space-y-2 max-w-2xl mx-auto">
            <p className="text-lg sm:text-xl text-zinc-500 font-medium leading-relaxed">
              A high-precision neural architecture for speech intelligence, strategic planning, and universal data processing.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <button 
            onClick={onStart}
            className="w-full sm:w-auto px-10 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] rounded-md transition-all hover:bg-zinc-800 dark:hover:bg-white active:scale-95 flex items-center justify-center gap-3"
          >
            <TranscriberIcon className="w-4 h-4" />
            {currentUser ? 'Open Workstation' : 'Initialize Session'}
          </button>
          
          {!currentUser && (
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto px-10 py-4 bg-transparent border border-[var(--border-app)] text-zinc-500 hover:text-[var(--text-primary)] font-bold uppercase tracking-widest text-[10px] rounded-md transition-all active:scale-95"
            >
              Operator Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTool, setActiveTool] = useUserLocalStorage<string>('activeTool_v4', 'Home');
  const [usageCounts, setUsageCounts] = useUsageCounts(currentUser?.id);
  
  const [transcriptions, setTranscriptions] = useUserLocalStorage<Transcription[]>('transcriptions', []);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useUserLocalStorage<string | null>('currentTranscriptionId', null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const t = useMemo(() => getTranslations('en'), []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToolSelect = useCallback((toolKey: string) => {
    setActiveTool(toolKey);
    if (toolKey !== 'Home' && toolKey !== 'History') {
        setUsageCounts(prev => ({ ...prev, [toolKey]: (prev[toolKey] || 0) + 1 }));
    }
  }, [setActiveTool, setUsageCounts]);

  const handleFilesSelect = useCallback(async (files: File[], languageHint: string) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    let lastId = null;
    try {
      for (const file of files) {
        setCurrentProcessingFile(file.name);
        const result = await transcribeAudio(file, languageHint);
        const newTranscription: Transcription = {
          ...result,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        setTranscriptions(prev => [newTranscription, ...prev]);
        lastId = newTranscription.id;
      }
      if (lastId) {
        setCurrentTranscriptionId(lastId);
        handleToolSelect('AI Transcriber');
        showToast('Transcription completed successfully', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('Terminal Processing Error. Check node logs.', 'error');
    } finally {
      setIsProcessing(false);
      setCurrentProcessingFile(null);
    }
  }, [setTranscriptions, setCurrentTranscriptionId, handleToolSelect]);

  const mostUsedTools = useMemo(() => {
    return Object.entries(usageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([key]) => ALL_TOOLS.find(t => t.key === key))
      .filter(Boolean) as ToolEntry[];
  }, [usageCounts]);

  const renderActiveTool = () => {
    if (isProcessing) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Loader t={t} processingMessage={currentProcessingFile || undefined} />
        </div>
    );

    switch (activeTool) {
      case 'Home':
        return <LandingPage currentUser={currentUser} onStart={() => handleToolSelect('AI Transcriber')} onLogin={() => setIsAuthModalOpen(true)} onSelectTool={handleToolSelect} openSearch={() => setIsSearchOpen(true)} />;
      case 'AI Transcriber':
        if (currentTranscriptionId) {
             const ct = transcriptions.find(tr => tr.id === currentTranscriptionId);
             if (ct) return <TranscriptionView transcription={ct} onSave={() => {}} onUpdate={(id, segs) => setTranscriptions(prev => prev.map(t => t.id === id ? {...t, segments: segs} : t))} onClose={() => setCurrentTranscriptionId(null)} t={t} />;
        }
        return (
            <div className="space-y-8 md:space-y-12 animate-fadeIn">
                <div className="text-center md:text-left max-w-4xl">
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">Speech Intelligence Hub</h2>
                    <p className="text-gray-500 text-sm md:text-lg leading-relaxed">MultiTools Neural Core v4.0. Transcribe audio and video files with world-class accuracy across 100+ global languages and complex code-switching scenarios.</p>
                </div>
                <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={isProcessing} processingFiles={currentProcessingFile ? [currentProcessingFile] : []} />
            </div>
        );
      case 'PDF Copilot': return <AICopilot t={t} />;
      case 'Chat PDF': return <ChatPDF t={t} />;
      case 'AI PDF Editor': return <AIPDFEditor t={t} />;
      case 'AI Whiteboard': return <AIWhiteboard t={t} />;
      case 'Pure Organizer': return <PureOrganizer t={t} />;
      case 'Strategic Planner': return <StrategicPlanner t={t} />;
      case 'AI Translator': return <AITranslator t={t} onTranslationComplete={() => {}} />;
      case 'Grammar Corrector': return <GrammarCorrector t={t} onCorrectionComplete={() => {}} />;
      case 'PDF Manager': return <PdfManager t={t} />;
      case 'PDF to Image': return <PdfToImage t={t} onConversionComplete={() => {}} />;
      case 'Image to PDF': return <ImageToPdf t={t} onConversionComplete={() => {}} />;
      case 'Export to Sheets': return <ExportToSheets t={t} />;
      case 'Video to Audio': return <VideoToAudio t={t} onConversionComplete={() => {}} />;
      case 'Text to Speech': return <TextToSpeech t={t} onComplete={() => {}} />;
      case 'Smart Summarizer': return <DataSummarizer t={t} onComplete={() => {}} />;
      case 'History':
        return <div className="h-full flex flex-col animate-fadeIn">
            <div className="mb-8 md:mb-14 text-center md:text-left"><h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">System Archive</h2></div>
            <HistoryPanel items={transcriptions} onSelect={(i) => { handleToolSelect('AI Transcriber'); setCurrentTranscriptionId(i.id); }} onDelete={(id) => setTranscriptions(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
               <div className="flex-grow min-w-0"><p className="font-bold truncate text-gray-100 text-base md:text-lg">{item.fileName}</p><p className="text-[10px] text-purple-400 font-black uppercase mt-1.5 tracking-[0.2em]">{item.date} • {item.detectedLanguage}</p></div>
            )} />
        </div>;
      default: 
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                <BoltIcon className="w-16 h-16 text-gray-800 mb-6" />
                <h2 className="text-2xl font-black text-white uppercase mb-2">{activeTool} Logic Offline</h2>
                <p className="text-gray-500">This module is currently being optimized.</p>
            </div>
        );
    }
  };

  return (
    <div className="bg-[var(--bg-app)] text-[var(--text-primary)] min-h-screen font-sans flex flex-col md:flex-row overflow-x-hidden">
      <Header 
        activeTool={activeTool} 
        setActiveTool={handleToolSelect} 
        activeImageCategory="All" setActiveImageCategory={() => {}}
        activeSummaryCategory="All" setActiveSummaryCategory={() => {}}
        activeHistoryTab="transcriptions" setActiveHistoryTab={() => {}}
        t={t} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        mostUsedTools={mostUsedTools} 
      />
      
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--border-app)] bg-[var(--bg-app)] sticky top-0 z-40">
          <div className="flex items-center gap-3" onClick={() => handleToolSelect('Home')}>
            <div className="bg-zinc-900 dark:bg-zinc-100 w-8 h-8 rounded flex items-center justify-center">
              <span className="text-sm font-black text-white dark:text-zinc-900">M</span>
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight uppercase">MultiTools</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500 hover:text-[var(--text-primary)]">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <main className="flex-grow p-4 sm:p-8 md:p-12 overflow-y-auto no-scrollbar">
          <div className="max-w-6xl mx-auto">
            {renderActiveTool()}
          </div>
        </main>
      </div>
      
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelect={handleToolSelect} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={(user) => { setCurrentUser(user); setIsAuthModalOpen(false); showToast(`Welcome back, ${user.email}`, 'success'); }} t={t} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default App;