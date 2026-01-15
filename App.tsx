
import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUserLocalStorage } from './hooks/useUserLocalStorage';
import { getTranslations } from './lib/i18n';
import type { Language, User, Transcription, TranslationHistoryItem, DataSummarizerHistoryItem, GrammarHistoryItem } from './types';
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
import AuthModal from './components/AuthModal';
import { XCircleIcon } from './components/icons/XCircleIcon';
import { UserIcon } from './components/icons/UserIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { SearchIcon } from './components/icons/SearchIcon';

const LandingPage: React.FC<{ onStart: () => void; onLogin: () => void; currentUser: User | null }> = ({ onStart, onLogin, currentUser }) => {
  const cardStyle = "group relative overflow-hidden backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 transition-all duration-500 hover:-translate-y-2 hover:border-purple-500/30 shadow-2xl cursor-pointer flex flex-col justify-between h-full";

  return (
    <div className="min-h-full flex flex-col items-center justify-center relative animate-fadeIn py-12 px-6">
      {/* Centered Hero Section */}
      <div className="max-w-4xl w-full text-center space-y-10 mb-20">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <SparklesIcon className="w-3 h-3" /> System v3.0 Powered
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase leading-none">
            Multi<span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-600">Tools</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-400 font-medium leading-tight max-w-2xl mx-auto">
            One powerful engine for your <br/> 
            <span className="text-white">entire professional workflow.</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4">
          <button 
            onClick={onStart}
            className="group relative px-14 py-5 bg-purple-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] active:scale-95 flex items-center gap-3"
          >
            <SparklesIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            {currentUser ? 'Enter Workspace' : 'Launch Dashboard'}
          </button>
          
          {!currentUser && (
            <button 
              onClick={onLogin}
              className="px-14 py-5 bg-transparent border border-white/10 hover:border-white/20 text-gray-400 font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all active:scale-95"
            >
              Secure Sync
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-7xl h-auto">
        <div className="md:col-span-8">
            <div className={cardStyle}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                <div>
                    <div className="flex items-center justify-between mb-6">
                         <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Strategic Plan</h2>
                         <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
                            <SparklesIcon className="w-6 h-6 text-yellow-500" />
                         </div>
                    </div>
                    <p className="text-gray-400 text-lg leading-relaxed max-w-md">Turn chaotic data into structured visual reports, task matrices, and high-fidelity presentations with multimodal reasoning.</p>
                </div>
                <div className="mt-10 flex items-center justify-between">
                    <div className="flex gap-4">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Efficiency</span>
                            <span className="text-sm font-bold text-yellow-500">+84% Gain</span>
                         </div>
                         <div className="w-px h-8 bg-white/5"></div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Status</span>
                            <span className="text-sm font-bold text-green-500">Optimized</span>
                         </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-600">8.4k PLANS GENERATED</span>
                </div>
            </div>
        </div>

        <div className="md:col-span-4">
            <div className={cardStyle}>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                <div>
                    <div className="flex items-center justify-between mb-6">
                         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Voice Archive</h2>
                         <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                            <SparklesIcon className="w-5 h-5 text-purple-500" />
                         </div>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">Deep-learning transcription with speaker identification and auto-summarization.</p>
                </div>
                <div className="mt-8">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Real-time Stream</span>
                        <div className="flex gap-1 mt-2">
                             {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-3 bg-purple-500/40 rounded-full animate-pulse" style={{animationDelay: `${i*0.1}s`}}></div>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="md:col-span-12">
            <div className={`${cardStyle} md:flex-row items-center gap-12 border-t-purple-500/40`}>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Visual Intelligence</span>
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Visual Studio</h2>
                    <p className="text-gray-400 leading-relaxed max-w-xl">Precision OCR, high-accuracy format conversion, and government-compliant photo resizing tools integrated into a single studio.</p>
                 </div>
                 <div className="flex gap-8 items-center">
                    <div className="text-center">
                        <span className="block text-3xl font-black text-white tracking-tighter">1.2s</span>
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Avg OCR Sync</span>
                    </div>
                    <div className="w-px h-12 bg-white/10"></div>
                    <div className="text-center">
                        <span className="block text-3xl font-black text-white tracking-tighter">100%</span>
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Privacy Shield</span>
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
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  
  const [activeTool, setActiveTool] = useUserLocalStorage<string>(currentUser?.id, 'activeTool', 'Home');
  const [activeImageCategory, setActiveImageCategory] = useUserLocalStorage<string>(currentUser?.id, 'activeImageCategory', 'All');
  const [activeSummaryCategory, setActiveSummaryCategory] = useUserLocalStorage<string>(currentUser?.id, 'activeSummaryCategory', 'All');
  const [historyTab, setHistoryTab] = useUserLocalStorage<string>(currentUser?.id, 'historyTab', 'transcriptions');
  
  const [transcriptions, setTranscriptions] = useUserLocalStorage<Transcription[]>(currentUser?.id, 'transcriptions', []);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useUserLocalStorage<string | null>(currentUser?.id, 'currentTranscriptionId', null);
  const [processingFiles, setProcessingFiles] = useState<any[]>([]);

  const t = useMemo(() => getTranslations('en'), []);

  // CMD+K Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLaunchDashboard = () => {
    if(!currentUser) {
        setIsAuthModalOpen(true);
    } else {
        setActiveTool('AI Transcriber');
    }
  };

  const handleFilesSelect = (files: File[], languageHint: string) => {
    const newFiles = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      languageHint,
    }));
    setProcessingFiles(current => [...current, ...newFiles]);
    setActiveTool('AI Transcriber');
    setCurrentTranscriptionId(null);
  };

  useEffect(() => {
    const fileToProcess = processingFiles.find(f => f.status === 'pending');
    if (!fileToProcess) return;

    const processFile = async () => {
      setProcessingFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'processing' } : f));
      try {
        const data = await transcribeAudio(fileToProcess.file, fileToProcess.languageHint);
        const newTranscription: Transcription = {
          ...data,
          id: `${Date.now()}-${Math.random()}`,
          date: new Date().toLocaleDateString(),
        };
        setTranscriptions(prev => [newTranscription, ...prev]);
        setProcessingFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'done', transcriptionId: newTranscription.id } : f));
        setCurrentTranscriptionId(newTranscription.id);
      } catch (err: any) {
        setProcessingFiles(prev => prev.map(f => (f.id === fileToProcess.id ? { ...f, status: 'error', error: err.message } : f)));
      }
    };
    processFile();
  }, [processingFiles, setTranscriptions]);

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'Home':
        return <LandingPage currentUser={currentUser} onStart={handleLaunchDashboard} onLogin={() => setIsAuthModalOpen(true)} />;
      case 'AI Transcriber':
        if (currentTranscriptionId) {
             const ct = transcriptions.find(tr => tr.id === currentTranscriptionId);
             if (ct) return <TranscriptionView transcription={ct} onSave={() => {}} onUpdate={(id, segs) => setTranscriptions(prev => prev.map(t => t.id === id ? {...t, segments: segs} : t))} onClose={() => setCurrentTranscriptionId(null)} t={t} />;
        }
        return <div className="flex flex-col h-full animate-fadeIn">
            {processingFiles.length > 0 ? (
                <section className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-4xl mx-auto w-full shadow-2xl">
                    <h2 className="text-xl font-black mb-6 text-white uppercase tracking-widest flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                        Pipeline Active
                    </h2>
                    <ul className="space-y-4">
                        {processingFiles.map(f => (
                            <li key={f.id} className="bg-black/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                                <p className="font-bold truncate text-gray-200 flex-1">{f.file.name}</p>
                                <div className="flex items-center gap-3">
                                    {f.status === 'processing' && <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400/20 border-t-purple-400"></div>}
                                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-500/80">{f.status}</span>
                                    {f.status === 'done' && <button onClick={() => setCurrentTranscriptionId(f.transcriptionId!)} className="text-[10px] font-black tracking-widest bg-purple-600 px-4 py-2 rounded-lg text-white hover:bg-purple-500 transition-all">OPEN</button>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={false} />}
        </div>;
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
            <div className="mb-10">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">System History</h2>
            </div>
            <div className="flex-grow overflow-hidden">
                 {historyTab === 'transcriptions' && <HistoryPanel items={transcriptions} onSelect={(i) => setCurrentTranscriptionId(i.id)} onDelete={(id) => setTranscriptions(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                    <div className="flex-grow min-w-0"><p className="font-bold truncate text-gray-100">{item.fileName}</p><p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mt-1.5">{item.detectedLanguage} • {item.date}</p></div>
                 )} />}
            </div>
        </div>;
      default: return <ComingSoon toolName={activeTool} />;
    }
  };

  return (
    <div className={`bg-[#05050C] text-white min-h-screen font-sans flex overflow-x-hidden selection:bg-purple-500/30 selection:text-white ${isAuthModalOpen || isCmdPaletteOpen ? 'modal-active' : ''}`}>
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-purple-600/10 blur-[150px] rounded-full animate-float"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-pink-600/10 blur-[150px] rounded-full animate-float-delayed"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <Header 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        activeImageCategory={activeImageCategory} 
        setActiveImageCategory={setActiveImageCategory} 
        activeSummaryCategory={activeSummaryCategory} 
        setActiveSummaryCategory={setActiveSummaryCategory} 
        activeHistoryTab={historyTab} 
        setActiveHistoryTab={setHistoryTab} 
        t={t} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />
      
      <div className={`flex-1 flex flex-col relative transition-all duration-700 ${isAuthModalOpen || isCmdPaletteOpen ? 'blur-lg scale-[0.99] brightness-50' : ''}`}>
        <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
          <button 
            onClick={() => setIsCmdPaletteOpen(true)}
            className="hidden md:flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 transition-all group"
          >
            <SearchIcon className="w-4 h-4 text-gray-500 group-hover:text-white" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Search Engine</span>
            <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                <span className="text-[10px] font-mono text-gray-400">⌘</span>
                <span className="text-[10px] font-mono text-gray-400">K</span>
            </div>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-3 bg-white/[0.03] backdrop-blur-3xl px-5 py-2.5 rounded-2xl border border-white/5 shadow-2xl">
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase text-purple-500 tracking-[0.2em] leading-none mb-1">Active Core</span>
                  <span className="text-xs font-bold text-gray-300 max-w-[120px] truncate">{currentUser.email}</span>
               </div>
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center font-black text-white shadow-lg border border-white/20">
                    <UserIcon className="w-6 h-6" />
               </div>
               <button onClick={() => setCurrentUser(null)} className="p-2 hover:bg-red-500/20 rounded-xl text-gray-500 hover:text-red-400 transition-all active:scale-90"><XCircleIcon className="w-5 h-5" /></button>
            </div>
          ) : (
            <button 
                onClick={() => setIsAuthModalOpen(true)} 
                className="group flex items-center gap-3 bg-pink-600 hover:bg-pink-500 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_0_20px_rgba(219,39,119,0.4)] active:scale-95 hover:brightness-110"
            >
                <UserIcon className="w-4 h-4" />
                Auth Profile
            </button>
          )}
        </div>

        <main className="flex-grow p-8 md:p-16 pt-28 max-w-7xl mx-auto w-full min-h-screen">
          <div className="h-full">
            {renderActiveTool()}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={setCurrentUser} t={t} />

      {/* Command Palette Mockup */}
      {isCmdPaletteOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 animate-fadeIn" onClick={() => setIsCmdPaletteOpen(false)}>
            <div className="w-full max-w-2xl bg-[#0A0A10]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden animate-pop-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center px-6 py-4 border-b border-white/5">
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                    <input 
                        autoFocus
                        placeholder="Search tools, history, or commands..." 
                        className="flex-1 bg-transparent px-4 py-2 text-white outline-none placeholder:text-gray-600"
                    />
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ESC TO CLOSE</div>
                </div>
                <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                    <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest px-2">Recently Used</div>
                    {['Strategic Architect', 'OCR Studio', 'Voice History'].map(cmd => (
                        <button key={cmd} onClick={() => { setActiveTool(cmd === 'OCR Studio' ? 'Image Related Tools' : (cmd === 'Voice History' ? 'History' : 'Strategic Planner')); setIsCmdPaletteOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 font-bold transition-all flex items-center justify-between group">
                            {cmd}
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] uppercase tracking-widest text-purple-400">Jump To</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
