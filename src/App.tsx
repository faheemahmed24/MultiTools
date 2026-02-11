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

const LandingPage: React.FC<{ 
  onStart: () => void; 
  onLogin: () => void; 
  currentUser: User | null;
}> = ({ onStart, onLogin, currentUser }) => (
  <div className="min-h-full flex flex-col items-center justify-center py-24 px-6 text-center animate-fadeIn">
    <div className="max-w-5xl space-y-10">
      <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(168,85,247,0.1)]">
        <SparklesIcon className="w-4 h-4" /> MultiTools Workstation 4.0
      </div>
      <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white uppercase leading-none">
        Universal<br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-500 to-indigo-600">Transcriber</span>
      </h1>
      <p className="text-2xl md:text-3xl text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed">
        World-class neural engine for speech, strategy, and universal data processing across <span className="text-white italic">100+ global dialects.</span>
      </p>
      <div className="flex flex-col sm:flex-row gap-8 justify-center pt-8">
        <button 
          onClick={onStart}
          className="group relative px-16 py-6 bg-purple-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.3)] hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] transition-all active:scale-95"
        >
          {currentUser ? 'Enter Universal Workspace' : 'Initialize Session'}
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
  </div>
);

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
        return <LandingPage currentUser={currentUser} onStart={() => handleToolSelect('AI Transcriber')} onLogin={() => setIsAuthModalOpen(true)} />;
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
      default: return <div className="p-24 text-center font-black uppercase tracking-[0.4em] text-gray-700">Protocol Offline</div>;
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