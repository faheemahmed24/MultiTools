import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUserLocalStorage } from './hooks/useUserLocalStorage';
import { getTranslations } from './lib/i18n';
import type { Language, User, Transcription } from './types';
import { transcribeAudio } from './services/geminiService';

import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import HistoryPanel from './components/HistoryPanel';
import ComingSoon from './components/ComingSoon';
import AITranslator from './components/AITranslator';
import GrammarCorrector from './components/GrammarCorrector';
import PdfToImage from './components/PdfToImage';
import ImageToPdf from './components/ImageToPdf';
import PdfToWord from './components/PdfToWord';
import VideoToAudio from './components/VideoToAudio';
import TextToSpeech from './components/TextToSpeech';
import DataSummarizer from './components/DataSummarizer';
import ImageToolsHub from './components/ImageToolsHub';
import ExportToSheets from './components/ExportToSheets';
import StrategicPlanner from './components/StrategicPlanner';
import PureOrganizer from './components/PureOrganizer';
import AuthModal from './components/AuthModal';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { ClockIcon } from './components/icons/ClockIcon';
import Loader from './components/Loader';

const LandingPage: React.FC<{ 
  onStart: () => void; 
  onLogin: () => void; 
  currentUser: User | null;
  recentItems: Transcription[];
  onSelectItem: (item: Transcription) => void;
}> = ({ onStart, onLogin, currentUser, recentItems, onSelectItem }) => {
  const cardStyle = "group relative overflow-hidden backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 transition-all duration-500 hover:-translate-y-2 hover:border-purple-500/30 shadow-2xl cursor-pointer flex flex-col justify-between h-full min-h-[320px]";

  return (
    <div className="min-h-full flex flex-col items-center justify-center relative animate-fadeIn py-12 px-6">
      <div className="max-w-4xl w-full text-center space-y-10 mb-24">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <SparklesIcon className="w-3 h-3" /> Professional AI Node
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase leading-none">
            Multi<span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-600">Tools</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-400 font-medium leading-tight max-w-2xl mx-auto">
            Universal Transcriber & <br/> 
            <span className="text-white">Business Intelligence Engine.</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4">
          <button 
            onClick={onStart}
            className="group relative px-14 py-5 bg-purple-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] active:scale-95 flex items-center gap-3"
          >
            <SparklesIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            {currentUser ? 'Enter Dashboard' : 'Get Started'}
          </button>
          
          {!currentUser && (
            <button 
              onClick={onLogin}
              className="px-14 py-5 bg-transparent border border-white/10 hover:border-white/20 text-gray-400 font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {recentItems.length > 0 && (
        <div className="w-full max-w-7xl mb-24 animate-fadeIn" style={{animationDelay: '0.2s'}}>
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 ml-2 flex items-center gap-2">
                <ClockIcon className="w-3 h-3" /> Recent Activity
            </h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                {recentItems.slice(0, 5).map(item => (
                    <button 
                        key={item.id}
                        onClick={() => onSelectItem(item)}
                        className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl transition-all hover:border-purple-500/20 group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                            <ClockIcon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-gray-200 truncate max-w-[150px]">{item.fileName}</p>
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{item.date}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-7xl">
        <div className="md:col-span-8">
            <div className={cardStyle} onClick={onStart}>
                <div>
                    <div className="flex items-center justify-between mb-6">
                         <h2 className="text-3xl font-black text-white uppercase tracking-tighter">AI Transcriber</h2>
                         <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                            <SparklesIcon className="w-6 h-6 text-purple-500" />
                         </div>
                    </div>
                    <p className="text-gray-400 text-lg leading-relaxed max-w-md">Transform any audio or video into precise text with speaker identification and auto-language detection.</p>
                </div>
            </div>
        </div>
        <div className="md:col-span-4">
            <div className={cardStyle}>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Master Archives</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">Secure storage for your professional sessions, plans, and translations.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTool, setActiveTool] = useUserLocalStorage<string>(currentUser?.id, 'activeTool', 'Home');
  const [activeImageCategory, setActiveImageCategory] = useUserLocalStorage<string>(currentUser?.id, 'activeImageCategory', 'All');
  const [activeSummaryCategory, setActiveSummaryCategory] = useUserLocalStorage<string>(currentUser?.id, 'activeSummaryCategory', 'All');
  const [historyTab, setHistoryTab] = useUserLocalStorage<string>(currentUser?.id, 'historyTab', 'transcriptions');
  
  const [transcriptions, setTranscriptions] = useUserLocalStorage<Transcription[]>(currentUser?.id, 'transcriptions', []);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useUserLocalStorage<string | null>(currentUser?.id, 'currentTranscriptionId', null);
  const [isProcessing, setIsProcessing] = useState(false);

  const t = useMemo(() => getTranslations('en'), []);

  const handleFilesSelect = useCallback(async (files: File[], languageHint: string) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const file = files[0];
      const result = await transcribeAudio(file, languageHint);
      const newTranscription: Transcription = {
        ...result,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      setTranscriptions(prev => [newTranscription, ...prev]);
      setCurrentTranscriptionId(newTranscription.id);
      setActiveTool('AI Transcriber');
    } catch (error) {
      console.error("Transcription failure:", error);
      alert("System node error. Check console for details.");
    } finally {
      setIsProcessing(false);
    }
  }, [setActiveTool, setTranscriptions, setCurrentTranscriptionId]);

  const renderActiveTool = () => {
    if (isProcessing) return <Loader t={t} />;

    switch (activeTool) {
      case 'Home':
        return <LandingPage currentUser={currentUser} onStart={() => setActiveTool('AI Transcriber')} onLogin={() => setIsAuthModalOpen(true)} recentItems={transcriptions} onSelectItem={(item) => { setActiveTool('AI Transcriber'); setCurrentTranscriptionId(item.id); }} />;
      case 'AI Transcriber':
        if (currentTranscriptionId) {
             const ct = transcriptions.find(tr => tr.id === currentTranscriptionId);
             if (ct) return <TranscriptionView transcription={ct} onSave={() => {}} onUpdate={(id, segs) => setTranscriptions(prev => prev.map(t => t.id === id ? {...t, segments: segs} : t))} onClose={() => setCurrentTranscriptionId(null)} t={t} />;
        }
        return <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={isProcessing} />;
      case 'Pure Organizer': return <PureOrganizer t={t} />;
      case 'Strategic Planner': return <StrategicPlanner t={t} />;
      case 'Image Related Tools': return <ImageToolsHub t={t} externalCategory={activeImageCategory} onCategoryChange={setActiveImageCategory} />;
      case 'AI Translator': return <AITranslator t={t} onTranslationComplete={() => {}} />;
      case 'Grammar Corrector': return <GrammarCorrector t={t} onCorrectionComplete={() => {}} />;
      case 'PDF to Image': return <PdfToImage t={t} onConversionComplete={() => {}} />;
      case 'Image to PDF': return <ImageToPdf t={t} onConversionComplete={() => {}} />;
      case 'PDF to Word': return <PdfToWord t={t} onConversionComplete={() => {}} />;
      case 'Video to Audio': return <VideoToAudio t={t} onConversionComplete={() => {}} />;
      case 'Text to Speech': return <TextToSpeech t={t} onComplete={() => {}} />;
      case 'Smart Summarizer': return <DataSummarizer t={t} onComplete={() => {}} externalCategory={activeSummaryCategory} />;
      case 'Export to Sheets': return <ExportToSheets t={t} />;
      case 'History':
        return <div className="h-full flex flex-col animate-fadeIn">
            <div className="mb-10"><h2 className="text-4xl font-black text-white uppercase tracking-tighter">System History</h2></div>
            <HistoryPanel items={transcriptions} onSelect={(i) => { setActiveTool('AI Transcriber'); setCurrentTranscriptionId(i.id); }} onDelete={(id) => setTranscriptions(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
               <div className="flex-grow min-w-0"><p className="font-bold truncate text-gray-100">{item.fileName}</p><p className="text-[10px] text-purple-400 font-black uppercase mt-1.5">{item.date}</p></div>
            )} />
        </div>;
      default: return <ComingSoon toolName={activeTool} />;
    }
  };

  return (
    <div className={`bg-[#05050C] text-white min-h-screen font-sans flex overflow-x-hidden ${isAuthModalOpen ? 'modal-active' : ''}`}>
      <Header activeTool={activeTool} setActiveTool={setActiveTool} activeImageCategory={activeImageCategory} setActiveImageCategory={setActiveImageCategory} activeSummaryCategory={activeSummaryCategory} setActiveSummaryCategory={setActiveSummaryCategory} activeHistoryTab={historyTab} setActiveHistoryTab={setHistoryTab} t={t} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col relative">
        <main className="flex-grow p-8 md:p-16 pt-28 max-w-7xl mx-auto w-full min-h-screen">
          {renderActiveTool()}
        </main>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={setCurrentUser} t={t} />
    </div>
  );
}

export default App;