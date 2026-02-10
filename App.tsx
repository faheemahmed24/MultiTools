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
import WordToPdf from './components/WordToPdf';
import VideoToAudio from './components/VideoToAudio';
import TextToSpeech from './components/TextToSpeech';
import DataSummarizer from './components/DataSummarizer';
import ImageToolsHub from './components/ImageToolsHub';
import ExportToSheets from './components/ExportToSheets';
import StrategicPlanner from './components/StrategicPlanner';
import PureOrganizer from './components/PureOrganizer';
import AuthModal from './components/AuthModal';
import PdfManager from './components/PdfManager';
import AICopilot from './components/AICopilot';
import ChatPDF from './components/ChatPDF';
import AIPDFEditor from './components/AIPDFEditor';
import AIWhiteboard from './components/AIWhiteboard';
import Loader from './components/Loader';

// Icons
import { SparklesIcon } from './components/icons/SparklesIcon';
import { BoltIcon } from './components/icons/BoltIcon';
import { TranscriberIcon } from './components/icons/TranscriberIcon';
import { Squares2x2Icon } from './components/icons/Squares2x2Icon';
import { ArrowPathIcon } from './components/icons/ArrowPathIcon';

// Hooks
function useUsageCounts(userId: string | undefined) {
    return useUserLocalStorage<Record<string, number>>(userId, 'toolUsageCounts', {});
}

const LandingPage: React.FC<{ 
  onStart: () => void; 
  onLogin: () => void; 
  currentUser: User | null;
  recentItems: Transcription[];
  mostUsedTools: Array<{key: string, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>>}>;
  onSelectTool: (tool: string) => void;
  onSelectItem: (item: Transcription) => void;
}> = ({ onStart, onLogin, currentUser, mostUsedTools, onSelectTool }) => {
  const cardStyle = "group relative overflow-hidden backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-[3rem] p-12 transition-all duration-700 hover:-translate-y-3 hover:border-purple-500/40 shadow-2xl cursor-pointer flex flex-col justify-between h-full min-h-[360px]";

  return (
    <div className="min-h-full flex flex-col items-center justify-center relative animate-fadeIn py-16 px-6 text-center">
      <div className="max-w-5xl w-full space-y-12 mb-28">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-black uppercase tracking-[0.3em] mb-4 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <SparklesIcon className="w-4 h-4" /> MultiTools Workstation 3.0
          </div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white uppercase leading-none selection:bg-purple-600">
            Universal<span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-500 to-indigo-600">Transcriber</span>
          </h1>
          <p className="text-2xl md:text-4xl text-gray-400 font-medium leading-tight max-w-3xl mx-auto">
            Neural Architecture for <br/> 
            <span className="text-white font-black italic">Speech, Strategy & Universal Data.</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8">
          <button 
            onClick={onStart}
            className="group relative px-16 py-6 bg-purple-600 text-white font-black uppercase tracking-[0.25em] text-sm rounded-2xl transition-all shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] active:scale-95 flex items-center gap-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <TranscriberIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {currentUser ? 'Open Universal Core' : 'Initialize Session'}
          </button>
          
          {!currentUser && (
            <button 
              onClick={onLogin}
              className="px-16 py-6 bg-transparent border border-white/10 hover:border-white/30 text-gray-400 hover:text-white font-black uppercase tracking-[0.25em] text-sm rounded-2xl transition-all active:scale-95"
            >
              Operator Log In
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-7xl mb-24 animate-fadeIn" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between mb-10 px-4">
              <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-3">
                  <BoltIcon className="w-4 h-4 text-yellow-500" /> Operational Hubs
              </h3>
              <div className="h-[1px] flex-grow mx-8 bg-white/5"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {mostUsedTools.map(tool => (
                  <button 
                      key={tool.key}
                      onClick={() => onSelectTool(tool.key)}
                      className="flex flex-col items-center gap-5 p-8 bg-white/[0.03] hover:bg-purple-600/10 border border-white/5 rounded-[2.5rem] transition-all hover:border-purple-500/50 group relative overflow-hidden shadow-xl"
                  >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl group-hover:bg-purple-600/20 transition-all"></div>
                      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-lg border border-purple-500/20">
                          <tool.icon className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                          <p className="text-[12px] font-black text-gray-200 uppercase tracking-widest leading-none group-hover:text-white transition-colors">{tool.label}</p>
                      </div>
                  </button>
              ))}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full max-w-7xl text-left">
        <div className="md:col-span-8" onClick={() => onSelectTool('AI Transcriber')}>
            <div className={cardStyle}>
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <TranscriberIcon className="w-64 h-64" />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-8">
                             <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Universal Engine</h2>
                             <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                <TranscriberIcon className="w-8 h-8 text-purple-500" />
                             </div>
                        </div>
                        <p className="text-gray-400 text-xl leading-relaxed max-w-lg mb-8">Convert Audio, Video, and Documents into verified text with global auto-detection and speaker diarization.</p>
                        <div className="flex gap-3">
                            {['Audio', 'Video', '100+ Dialects', 'Native Script'].map(tag => (
                                <span key={tag} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase text-gray-500 tracking-widest">{tag}</span>
                            ))}
                        </div>
                    </div>
                    <div className="mt-12 flex items-center gap-2 text-purple-500 font-black text-[11px] uppercase tracking-widest group-hover:gap-4 transition-all">
                        Launch Engine Core <ArrowPathIcon className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
        <div className="md:col-span-4 space-y-8">
            <div className={`${cardStyle} !min-h-[170px] !p-10`} onClick={() => onSelectTool('Chat PDF')}>
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Chat PDF</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">Interrogate document nodes using high-performance logic to extract answers instantly.</p>
                    </div>
                </div>
            </div>
            <div className={`${cardStyle} !min-h-[170px] !p-10 border-pink-500/10 hover:border-pink-500/40`} onClick={() => onSelectTool('Strategic Planner')}>
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <h2 className="text-2xl font-black text-pink-500 uppercase tracking-tighter mb-4">Plan Architect</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">Synthesize scattered data and meeting notes into professional strategic reporting.</p>
                    </div>
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
      const file = files[0];
      const result = await transcribeAudio(file, languageHint);
      const newTranscription: Transcription = {
        ...result,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      setTranscriptions(prev => [newTranscription, ...prev]);
      setCurrentTranscriptionId(newTranscription.id);
      handleToolSelect('AI Transcriber');
    } catch (error) {
      console.error("System Core Fault:", error);
      alert("Terminal Processing Error. Check node logs.");
    } finally {
      setIsProcessing(false);
    }
  }, [handleToolSelect, setTranscriptions, setCurrentTranscriptionId]);

  const allToolsRegistry = useMemo(() => [
      { key: 'AI Transcriber', label: 'Universal Transcriber', icon: TranscriberIcon },
      { key: 'PDF Copilot', label: 'AI Copilot', icon: BoltIcon },
      { key: 'Chat PDF', label: 'Chat PDF', icon: Squares2x2Icon },
  ], []);

  const mostUsedTools = useMemo(() => {
    const sorted = Object.entries(usageCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 6)
      .map(([key]) => allToolsRegistry.find(tool => tool.key === key))
      .filter(Boolean) as Array<{key: string, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>>}>;
    
    if (sorted.length < 3) {
        return allToolsRegistry.slice(0, 3);
    }
    return sorted;
  }, [usageCounts, allToolsRegistry]);

  const renderActiveTool = () => {
    if (isProcessing) return <div className="min-h-[60vh] flex items-center justify-center"><Loader t={t} /></div>;

    switch (activeTool) {
      case 'Home':
        return <LandingPage currentUser={currentUser} onStart={() => handleToolSelect('AI Transcriber')} onLogin={() => setIsAuthModalOpen(true)} recentItems={transcriptions} mostUsedTools={mostUsedTools} onSelectTool={handleToolSelect} onSelectItem={(item) => { handleToolSelect('AI Transcriber'); setCurrentTranscriptionId(item.id); }} />;
      case 'AI Transcriber':
        if (currentTranscriptionId) {
             const ct = transcriptions.find(tr => tr.id === currentTranscriptionId);
             if (ct) return <TranscriptionView transcription={ct} onSave={() => {}} onUpdate={(id, segs) => setTranscriptions(prev => prev.map(t => t.id === id ? {...t, segments: segs} : t))} onClose={() => setCurrentTranscriptionId(null)} t={t} />;
        }
        return (
            <div className="space-y-12">
                <div className="text-center md:text-left max-w-4xl">
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Speech Intelligence Hub</h2>
                    <p className="text-gray-500 text-lg leading-relaxed">MultiTools Neural Core v4.0. Transcribe audio and video files with world-class accuracy across 100+ global languages, dialects, and complex code-switching scenarios.</p>
                </div>
                <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={isProcessing} />
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
      case 'PDF to Word': return <PdfToWord t={t} onConversionComplete={() => {}} />;
      case 'Word to PDF': return <WordToPdf t={t} onConversionComplete={() => {}} />;
      case 'Video to Audio': return <VideoToAudio t={t} onConversionComplete={() => {}} />;
      case 'Text to Speech': return <TextToSpeech t={t} onComplete={() => {}} />;
      case 'Smart Summarizer': return <DataSummarizer t={t} onComplete={() => {}} externalCategory={activeSummaryCategory} />;
      case 'Export to Sheets': return <ExportToSheets t={t} />;
      case 'History':
        return <div className="h-full flex flex-col animate-fadeIn">
            <div className="mb-14 text-center md:text-left"><h2 className="text-5xl font-black text-white uppercase tracking-tighter">System Archive</h2></div>
            <HistoryPanel items={transcriptions} onSelect={(i) => { handleToolSelect('AI Transcriber'); setCurrentTranscriptionId(i.id); }} onDelete={(id) => setTranscriptions(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
               <div className="flex-grow min-w-0"><p className="font-bold truncate text-gray-100 text-lg">{item.fileName}</p><p className="text-[10px] text-purple-400 font-black uppercase mt-1.5 tracking-[0.2em]">{item.date} • {item.detectedLanguage}</p></div>
            )} />
        </div>;
      default: return <ComingSoon toolName={activeTool} />;
    }
  };

  return (
    <div className={`bg-[#05050C] text-white min-h-screen font-sans flex overflow-x-hidden ${isAuthModalOpen ? 'modal-active' : ''}`}>
      <Header activeTool={activeTool} setActiveTool={handleToolSelect} activeImageCategory={activeImageCategory} setActiveImageCategory={setActiveImageCategory} activeSummaryCategory={activeSummaryCategory} setActiveSummaryCategory={setActiveSummaryCategory} activeHistoryTab={historyTab} setActiveHistoryTab={setHistoryTab} t={t} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} mostUsedTools={mostUsedTools} />
      <div className="flex-1 flex flex-col relative">
        <main className="flex-grow p-8 md:p-12 overflow-y-auto relative no-scrollbar">
          {renderActiveTool()}
        </main>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={(user) => { setCurrentUser(user); setIsAuthModalOpen(false); }} t={t} />
    </div>
  );
}

export default App;