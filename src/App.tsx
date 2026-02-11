import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUserLocalStorage } from './hooks/useUserLocalStorage';
import { getTranslations } from './lib/i18n';
import type { User, Transcription, TranslationSet } from './types';
import { transcribeAudio } from './services/geminiService';

import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import HistoryPanel from './components/HistoryPanel';
import AuthModal from './components/AuthModal';
import Loader from './components/Loader';

// Icons
import { SparklesIcon } from './components/icons/SparklesIcon';
import { TranscriberIcon } from './components/icons/TranscriberIcon';
import { BoltIcon } from './components/icons/BoltIcon';
import { SearchIcon } from './components/icons/SearchIcon';
import { ArrowPathIcon } from './components/icons/ArrowPathIcon';
import { Squares2x2Icon } from './components/icons/Squares2x2Icon';
import { TranslatorIcon } from './components/icons/TranslatorIcon';
import { GrammarIcon } from './components/icons/GrammarIcon';
import { SummarizerIcon } from './components/icons/SummarizerIcon';
import { CubeIcon } from './components/icons/CubeIcon';
import { SwatchIcon } from './components/icons/SwatchIcon';
import { DocumentDuplicateIcon } from './components/icons/DocumentDuplicateIcon';
import { XCircleIcon } from './components/icons/XCircleIcon';

interface ToolEntry {
  key: string;
  label: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  category: string;
  tags: string[];
}

const TOOLS_DATABASE: ToolEntry[] = [
  { key: 'AI Transcriber', label: 'Universal Transcriber', description: 'Neural Speech-to-Text Engine', icon: TranscriberIcon, category: 'Intelligence', tags: ['audio', 'video', 'speech', 'text', 'transcribe'] },
  { key: 'PDF Copilot', label: 'AI Copilot', description: 'Command terminal for documents', icon: BoltIcon, category: 'Intelligence', tags: ['pdf', 'ai', 'automate', 'commands'] },
  { key: 'Chat PDF', label: 'Chat PDF', description: 'Cognitive dialogue with documents', icon: SparklesIcon, category: 'Intelligence', tags: ['pdf', 'chat', 'analyze', 'qa'] },
  { key: 'AI PDF Editor', label: 'AI Text Editor', description: 'Neural syntax refiner', icon: Squares2x2Icon, category: 'Intelligence', tags: ['edit', 'text', 'rewrite', 'refine'] },
  { key: 'Strategic Planner', label: 'Plan Architect', description: 'Synthesize data into reporting', icon: CubeIcon, category: 'Business', tags: ['strategy', 'report', 'planning', 'pptx'] },
  { key: 'AI Whiteboard', label: 'Whiteboards', description: 'Sketch-to-diagram synthesis', icon: SwatchIcon, category: 'Business', tags: ['drawing', 'diagram', 'canvas', 'sketch'] },
  { key: 'Smart Summarizer', label: 'Auto Summarize', description: 'Concise data briefing', icon: SummarizerIcon, category: 'Business', tags: ['summary', 'brief', 'extraction', 'contacts'] },
  { key: 'Pure Organizer', label: 'Verbatim Node', description: 'Zero-alteration data structuring', icon: ArrowPathIcon, category: 'Business', tags: ['organize', 'data', 'verbatim', 'structure'] },
  { key: 'AI Translator', label: 'Universal Translator', description: 'Nuanced dialect and script flow', icon: TranslatorIcon, category: 'Media', tags: ['translate', 'language', 'speech', 'global'] },
  { key: 'Grammar Corrector', label: 'Syntax Refiner', description: 'Stylistic proofreading', icon: GrammarIcon, category: 'Media', tags: ['grammar', 'proofread', 'spellcheck', 'syntax'] },
  { key: 'PDF Manager', label: 'Page Architect', description: 'Merge and slice PDF assets', icon: DocumentDuplicateIcon, category: 'Media', tags: ['pdf', 'merge', 'split', 'pages'] },
];

const CommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (key: string) => void;
}> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  
  const filtered = useMemo(() => {
    if (!query.trim()) return TOOLS_DATABASE;
    const lower = query.toLowerCase();
    return TOOLS_DATABASE.filter(t => 
      t.label.toLowerCase().includes(lower) || 
      t.category.toLowerCase().includes(lower) ||
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
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-start justify-center pt-[15vh] px-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0D0D1A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col transform animate-pop-in">
        <div className="flex items-center gap-4 p-6 border-b border-white/5">
          <SearchIcon className="w-6 h-6 text-purple-500" />
          <input 
            autoFocus
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by tool, section (Business), or type (PDF)..."
            className="flex-grow bg-transparent text-xl text-white outline-none placeholder:text-gray-700"
          />
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-4 custom-scrollbar space-y-2">
          {filtered.map(tool => (
            <button 
              key={tool.key}
              onClick={() => { onSelect(tool.key); onClose(); }}
              className="w-full flex items-center gap-4 p-4 hover:bg-purple-600/10 rounded-2xl transition-all text-left group"
            >
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white">
                <tool.icon className="w-5 h-5" />
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-white text-sm uppercase">{tool.label}</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{tool.category} Module</p>
              </div>
              <div className="flex gap-1">
                {tool.tags.slice(0, 2).map(tag => (
                   <span key={tag} className="text-[8px] font-black uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded border border-white/5 text-gray-400">{tag}</span>
                ))}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-600 font-bold uppercase tracking-[0.2em] text-xs">No tools found matching your request</div>
          )}
        </div>
        <div className="bg-black/40 p-4 flex justify-between items-center px-8 border-t border-white/5">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">MultiTools Logic Engine v4.0</p>
          <div className="flex gap-4">
             <span className="text-[9px] font-bold text-gray-700"><kbd className="bg-gray-800 px-1.5 py-0.5 rounded">ESC</kbd> to close</span>
             <span className="text-[9px] font-bold text-gray-700"><kbd className="bg-gray-800 px-1.5 py-0.5 rounded">⏎</kbd> to select</span>
          </div>
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
}> = ({ onStart, onLogin, currentUser, onSelectTool, openSearch }) => {
  return (
    <div className="min-h-full flex flex-col items-center py-16 px-6 animate-fadeIn">
      <div className="max-w-5xl w-full space-y-12 text-center mb-20">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-black uppercase tracking-[0.3em] mb-4 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
            <SparklesIcon className="w-4 h-4" /> MultiTools Workstation 4.0
          </div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white uppercase leading-none">
            Universal<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-500 to-indigo-600">Workstation</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed">
            Neural architecture for global intelligence, synthesis and data strategy.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
          <button 
            onClick={onStart}
            className="group relative px-14 py-6 bg-purple-600 text-white font-black uppercase tracking-[0.25em] text-sm rounded-2xl transition-all shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] active:scale-95 flex items-center gap-4 overflow-hidden"
          >
            <TranscriberIcon className="w-5 h-5" />
            {currentUser ? 'Enter Universal Core' : 'Initialize Session'}
          </button>
          <button 
            onClick={openSearch}
            className="px-14 py-6 bg-white/5 border border-white/10 text-gray-400 hover:text-white font-black uppercase tracking-[0.25em] text-sm rounded-2xl transition-all flex items-center gap-4"
          >
            <SearchIcon className="w-5 h-5" /> Quick Command
          </button>
        </div>
      </div>

      <div className="w-full max-w-7xl">
          <div className="flex items-center gap-4 mb-10">
              <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em]">Core Capabilities</h3>
              <div className="h-[1px] flex-grow bg-white/5"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TOOLS_DATABASE.slice(0, 4).map(tool => (
                  <div 
                    key={tool.key}
                    onClick={() => onSelectTool(tool.key)}
                    className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-purple-500/50 transition-all cursor-pointer group"
                  >
                      <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all mb-6">
                          <tool.icon className="w-7 h-7" />
                      </div>
                      <h4 className="text-lg font-black text-white uppercase mb-2">{tool.label}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

// Fix: Completed the App component which was truncated and added default export to resolve "No default export" error.
function App() {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTool, setActiveTool] = useUserLocalStorage<string>(currentUser?.id, 'activeTool_v4', 'Home');
  const [transcriptions, setTranscriptions] = useUserLocalStorage<Transcription[]>(currentUser?.id, 'transcriptions', []);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useUserLocalStorage<string | null>(currentUser?.id, 'currentTranscriptionId', null);
  const [isProcessing, setIsProcessing] = useState(false);

  const t = useMemo(() => getTranslations('en'), []);

  const handleToolSelect = useCallback((toolKey: string) => {
    setActiveTool(toolKey);
  }, [setActiveTool]);

  const handleFilesSelect = useCallback(async (files: File[], languageHint: string) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const result = await transcribeAudio(files[0], languageHint);
      const newTranscription: Transcription = {
        ...result,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      setTranscriptions(prev => [newTranscription, ...prev]);
      setCurrentTranscriptionId(newTranscription.id);
      setActiveTool('AI Transcriber');
    } catch (error) {
      console.error(error);
      alert("Error processing node.");
    } finally {
      setIsProcessing(false);
    }
  }, [setTranscriptions, setCurrentTranscriptionId, setActiveTool]);

  const renderActiveTool = () => {
    if (isProcessing) return <div className="min-h-[60vh] flex items-center justify-center"><Loader t={t} /></div>;

    switch (activeTool) {
      case 'Home':
        return <LandingPage 
            currentUser={currentUser} 
            onStart={() => handleToolSelect('AI Transcriber')} 
            onLogin={() => setIsAuthModalOpen(true)} 
            onSelectTool={handleToolSelect}
            openSearch={() => setIsSearchOpen(true)}
        />;
      case 'AI Transcriber':
        if (currentTranscriptionId) {
             const ct = transcriptions.find(tr => tr.id === currentTranscriptionId);
             if (ct) return <TranscriptionView transcription={ct} onSave={() => {}} onUpdate={(id, segs) => setTranscriptions(prev => prev.map(t => t.id === id ? {...t, segments: segs} : t))} onClose={() => setCurrentTranscriptionId(null)} t={t} />;
        }
        return (
            <div className="space-y-12">
                <div className="text-center md:text-left max-w-4xl">
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Speech Intelligence Hub</h2>
                    <p className="text-gray-500 text-lg leading-relaxed">Neural core for universal transcription.</p>
                </div>
                <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={isProcessing} />
            </div>
        );
      case 'History':
        return <div className="h-full flex flex-col animate-fadeIn">
            <div className="mb-14 text-center md:text-left"><h2 className="text-5xl font-black text-white uppercase tracking-tighter">System Archive</h2></div>
            <HistoryPanel items={transcriptions} onSelect={(i) => { handleToolSelect('AI Transcriber'); setCurrentTranscriptionId(i.id); }} onDelete={(id) => setTranscriptions(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
               <div className="flex-grow min-w-0"><p className="font-bold truncate text-gray-100 text-lg">{item.fileName}</p><p className="text-[10px] text-purple-400 font-black uppercase mt-1.5 tracking-[0.2em]">{item.date} • {item.detectedLanguage}</p></div>
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
    <div className="bg-[#05050C] text-white min-h-screen font-sans flex overflow-x-hidden">
      <Header 
        activeTool={activeTool} 
        setActiveTool={handleToolSelect} 
        activeImageCategory="All" setActiveImageCategory={() => {}}
        activeSummaryCategory="All" setActiveSummaryCategory={() => {}}
        activeHistoryTab="transcriptions" setActiveHistoryTab={() => {}}
        t={t} isSidebarOpen={false} setIsSidebarOpen={() => {}}
        mostUsedTools={[]} 
      />
      <div className="flex-1 flex flex-col relative">
        <main className="flex-grow p-8 md:p-12 overflow-y-auto no-scrollbar">
          {renderActiveTool()}
        </main>
      </div>
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelect={handleToolSelect} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={(user) => { setCurrentUser(user); setIsAuthModalOpen(false); }} t={t} />
    </div>
  );
}

export default App;