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
import { BoltIcon } from './components/icons/BoltIcon';
import { TranscriberIcon } from './components/icons/TranscriberIcon';

function useUsageCounts(userId: string | undefined) {
    return useUserLocalStorage<Record<string, number>>(userId, 'toolUsageCounts', {});
}

const LandingPage: React.FC<{ 
  onStart: () => void; 
  onLogin: () => void; 
  currentUser: User | null;
  onSelectTool: (tool: string) => void;
}> = ({ onStart, onLogin, currentUser }) => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center py-20 px-6 text-center animate-fadeIn">
      <div className="max-w-4xl space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">
          <SparklesIcon className="w-4 h-4" /> MultiTools Neural Core v4.0
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase leading-none">
          Universal<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-600">Transcriber</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-medium">
          High-fidelity speech-to-text engine with auto-detection for 100+ languages and complex code-switching scenarios.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
          <button 
            onClick={onStart}
            className="px-12 py-5 bg-purple-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-purple-500 transition-all active:scale-95"
          >
            {currentUser ? 'Enter Workspace' : 'Initialize Session'}
          </button>
          {!currentUser && (
            <button 
              onClick={onLogin}
              className="px-12 py-5 bg-transparent border border-white/10 text-gray-400 font-black uppercase tracking-widest rounded-2xl hover:border-white/30 hover:text-white transition-all"
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
  const [activeTool, setActiveTool] = useUserLocalStorage<string>(currentUser?.id, 'activeTool', 'Home');
  const [usageCounts, setUsageCounts] = useUsageCounts(currentUser?.id);
  const [transcriptions, setTranscriptions] = useUserLocalStorage<Transcription[]>(currentUser?.id, 'transcriptions', []);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useUserLocalStorage<string | null>(currentUser?.id, 'currentTranscriptionId', null);
  const [isProcessing, setIsProcessing] = useState(false);

  const t = useMemo(() => getTranslations('en'), []);

  const handleToolSelect = useCallback((toolKey: string) => {
    setActiveTool(toolKey);
    if (toolKey !== 'Home' && toolKey !== 'History') {
        setUsageCounts(prev => ({ ...prev, [toolKey]: (prev[toolKey] || 0) + 1 }));
    }
  }, [setActiveTool, setUsageCounts]);

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
    } catch (error) {
      console.error("Transcription Fault:", error);
      alert("Terminal Processing Error. Check network integrity.");
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
            <div className="space-y-12">
                <div className="text-center md:text-left max-w-4xl">
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Speech Intelligence Hub</h2>
                    <p className="text-gray-500 text-lg leading-relaxed">Neural Core v4.0. Upload audio or video for verbatim transcription across 100+ global dialects.</p>
                </div>
                <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={isProcessing} />
            </div>
        );
      case 'History':
        return <div className="h-full flex flex-col animate-fadeIn">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-10">System Archive</h2>
            <HistoryPanel items={transcriptions} onSelect={(i) => { handleToolSelect('AI Transcriber'); setCurrentTranscriptionId(i.id); }} onDelete={(id) => setTranscriptions(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
               <div className="flex-grow min-w-0">
                 <p className="font-bold truncate text-gray-100 text-lg">{item.fileName}</p>
                 <p className="text-[10px] text-purple-400 font-black uppercase mt-1.5 tracking-[0.2em]">{item.date} • {item.detectedLanguage}</p>
               </div>
            )} />
        </div>;
      default: return <div className="p-20 text-center text-gray-500 font-black uppercase tracking-widest">Tool Offline</div>;
    }
  };

  return (
    <div className="bg-[#05050C] text-white min-h-screen font-sans flex overflow-x-hidden">
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
      <main className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar">
        {renderActiveTool()}
      </main>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={(user) => { setCurrentUser(user); setIsAuthModalOpen(false); }} t={t} />
    </div>
  );
}

export default App;