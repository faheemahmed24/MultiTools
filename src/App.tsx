import React, { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUserLocalStorage } from './hooks/useUserLocalStorage';
import { getTranslations } from './lib/i18n';
import type { User, Transcription } from './types';
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

interface ToolEntry {
  key: string;
  label: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  category: string;
}

const TOOLS_DATABASE: ToolEntry[] = [
  { key: 'AI Transcriber', label: 'Universal Transcriber', description: 'Neural Speech-to-Text with 100+ languages', icon: TranscriberIcon, category: 'Intelligence' },
  { key: 'PDF Copilot', label: 'AI Copilot', description: 'Interactive command terminal for documents', icon: BoltIcon, category: 'Intelligence' },
  { key: 'Chat PDF', label: 'Chat PDF', description: 'Cognitive dialogue with document nodes', icon: SparklesIcon, category: 'Intelligence' },
  { key: 'AI PDF Editor', label: 'AI Text Editor', description: 'Neural professionalizer and syntax refiner', icon: Squares2x2Icon, category: 'Intelligence' },
  { key: 'Strategic Planner', label: 'Plan Architect', description: 'Synthesize data into strategic reporting', icon: CubeIcon, category: 'Business' },
  { key: 'AI Whiteboard', label: 'Whiteboards', description: 'Sketch-to-diagram neural synthesis', icon: SwatchIcon, category: 'Business' },
  { key: 'Smart Summarizer', label: 'Auto Summarize', description: 'Data extraction and concise briefing', icon: SummarizerIcon, category: 'Business' },
  { key: 'Pure Organizer', label: 'Verbatim Node', description: 'Zero-alteration data structuring', icon: ArrowPathIcon, category: 'Business' },
  { key: 'AI Translator', label: 'Universal Translator', description: 'Nuanced dialect and script flow', icon: TranslatorIcon, category: 'Media' },
  { key: 'Grammar Corrector', label: 'Syntax Refiner', description: 'Stylistic polishing and proofreading', icon: GrammarIcon, category: 'Media' },
  { key: 'PDF Manager', label: 'Page Architect', description: 'Reorder, merge, and slice PDF assets', icon: DocumentDuplicateIcon, category: 'Media' },
];

const LandingPage: React.FC<{ 
  onStart: () => void; 
  onLogin: () => void; 
  currentUser: User | null;
  onSelectTool: (key: string) => void;
}> = ({ onStart, onLogin, currentUser, onSelectTool }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTools = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return TOOLS_DATABASE.filter(t => 
      t.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

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
            A world-class neural engine for speech, strategy, and data processing.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="max-w-2xl mx-auto w-full relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <SearchIcon className="w-6 h-6 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
          </div>
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tools (e.g., 'transcribe', 'pdf', 'strategy')..."
            className="w-full bg-[#0A0A15] border-2 border-white/5 rounded-[2rem] py-6 pl-16 pr-8 text-xl text-white outline-none focus:border-purple-500/50 focus:shadow-[0_0_50px_rgba(168,85,247,0.15)] transition-all placeholder:text-gray-700"
          />
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-[#0D0D1A] border border-white/10 rounded-[2rem] p-4 shadow-2xl z-50 animate-pop-in overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                {filteredTools.length > 0 ? filteredTools.map(tool => (
                  <button 
                    key={tool.key}
                    onClick={() => onSelectTool(tool.key)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-purple-600/10 rounded-2xl transition-all text-left group/item"
                  >
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 group-hover/item:bg-purple-500 group-hover/item:text-white transition-all">
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase tracking-tight">{tool.label}</h4>
                      <p className="text-xs text-gray-500">{tool.description}</p>
                    </div>
                  </button>
                )) : (
                  <div className="py-8 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">No matching tools found</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-8 justify-center pt-4">
          <button 
            onClick={onStart}
            className="group relative px-16 py-6 bg-purple-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.3)] hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] transition-all active:scale-95"
          >
            {currentUser ? 'Enter Core' : 'Initialize Session'}
          </button>
          {!currentUser && (
            <button 
              onClick={onLogin}
              className="px-16 py-6 bg-transparent border border-white/10 text-gray-500 hover:text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:border-white/30 transition-all"
            >
              Operator Login
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {['Intelligence', 'Business', 'Media'].map((cat) => (
          <div key={cat} className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] px-4">{cat} Modules</h3>
            <div className="grid grid-cols-1 gap-4">
              {TOOLS_DATABASE.filter(t => t.category === cat).slice(0, 3).map(tool => (
                <button 
                  key={tool.key}
                  onClick={() => onSelectTool(tool.key)}
                  className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-purple-500/40 hover:-translate-y-1 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <tool.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{tool.label}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useUserLocalStorage<string>(currentUser?.id, 'activeTool', 'Home');
  const [transcriptions, setTranscriptions] = useUserLocalStorage<Transcription[]>(currentUser?.id, 'transcriptions', []);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useUserLocalStorage<string | null>(currentUser?.id, 'currentTranscriptionId', null);
  const [isProcessing, setIsProcessing] = useState(false);

  const t = useMemo(() => getTranslations('en'), []);

  const handleToolSelect = useCallback((toolKey: string) => {
    setActiveTool(toolKey);
    if (toolKey === 'Home') setCurrentTranscriptionId(null);
  }, [setActiveTool, setCurrentTranscriptionId]);

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
      handleToolSelect('AI Transcriber');
    } catch (error: any) {
      console.error("Neural Core Fault:", error);
      alert(error.message || "Terminal Processing Error. Check node connectivity.");
    } finally {
      setIsProcessing(false);
    }
  }, [handleToolSelect, setTranscriptions, setCurrentTranscriptionId]);

  const renderActiveTool = () => {
    if (isProcessing) return <div className="min-h-[60vh] flex items-center justify-center"><Loader t={t} /></div>;

    switch (activeTool) {
      case 'Home':
        return <LandingPage currentUser={currentUser} onStart={() => handleToolSelect('AI Transcriber')} onLogin={() => setIsAuthModalOpen(true)} onSelectTool={handleToolSelect} />;
      case 'AI Transcriber':
        if (currentTranscriptionId) {
             const ct = transcriptions.find(tr => tr.id === currentTranscriptionId);
             if (ct) return <TranscriptionView transcription={ct} onSave={() => {}} onUpdate={(id, segs) => setTranscriptions(prev => prev.map(t => t.id === id ? {...t, segments: segs} : t))} onClose={() => setCurrentTranscriptionId(null)} t={t} />;
        }
        return (
            <div className="space-y-12 max-w-6xl mx-auto">
                <div className="text-center md:text-left">
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">Speech Intelligence Hub</h2>
                    <p className="text-gray-500 text-xl leading-relaxed max-w-3xl">Neural Core v4.0. Upload audio/video for verbatim transcription with global dialect identification and native script preservation.</p>
                </div>
                <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={isProcessing} />
            </div>
        );
      case 'History':
        return <div className="h-full flex flex-col animate-fadeIn max-w-5xl mx-auto">
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-10">System Archive</h2>
            <HistoryPanel items={transcriptions} onSelect={(i) => { handleToolSelect('AI Transcriber'); setCurrentTranscriptionId(i.id); }} onDelete={(id) => setTranscriptions(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
               <div className="flex-grow min-w-0">
                 <p className="font-bold truncate text-gray-100 text-lg">{item.fileName}</p>
                 <p className="text-[10px] text-purple-400 font-black uppercase mt-1.5 tracking-[0.2em]">{item.date} • {item.detectedLanguage}</p>
               </div>
            )} />
        </div>;
      default: return <div className="p-24 text-center">
          <h2 className="text-3xl font-black text-white uppercase mb-4">{activeTool}</h2>
          <p className="text-gray-500 font-black uppercase tracking-[0.4em]">Protocol Under Construction</p>
          <button onClick={() => handleToolSelect('Home')} className="mt-8 text-purple-400 font-bold hover:underline">Return to Hub</button>
      </div>;
    }
  };

  return (
    <div className="bg-[#05050C] text-white min-h-screen font-sans flex overflow-x-hidden selection:bg-purple-600/30">
      <Header 
        activeTool={activeTool} 
        setActiveTool={handleToolSelect} 
        activeImageCategory="All" 
        setActiveImageCategory={() => {}} 
        activeSummaryCategory="All" 
        setActiveSummaryCategory={() => {}} 
        activeHistoryTab="transcriptions" 
        setActiveHistoryTab={() => {}} 
        t={t} 
        isSidebarOpen={false} 
        setIsSidebarOpen={() => {}} 
        mostUsedTools={[]} 
      />
      <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
        <div className="p-8 md:p-12 lg:p-20">
            {renderActiveTool()}
        </div>
      </main>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={(user) => { setCurrentUser(user); setIsAuthModalOpen(false); }} t={t} />
    </div>
  );
}

export default App;