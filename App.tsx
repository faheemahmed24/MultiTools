
import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUserLocalStorage } from './hooks/useUserLocalStorage';
import { getTranslations } from './lib/i18n';
import type { Language, User, Transcription, TranslationHistoryItem, AnalysisHistoryItem, PdfImageHistoryItem, VideoAudioHistoryItem, TtsHistoryItem, DataSummarizerHistoryItem, GrammarHistoryItem } from './types';
import { transcribeAudio } from './services/geminiService';

import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import HistoryPanel from './components/HistoryPanel';
import ComingSoon from './components/ComingSoon';
import AITranslator from './components/AITranslator';
import GrammarCorrector from './components/GrammarCorrector';
import ImageConverterOcr from './components/ImageAnalyzer';
import PdfToImage from './components/PdfToImage';
import ImageToPdf from './components/ImageToPdf';
import PdfToWord from './components/PdfToWord';
import VideoToAudio from './components/VideoToAudio';
import AudioMerger from './components/AudioMerger';
import TextToSpeech from './components/TextToSpeech';
import DataSummarizer from './components/DataSummarizer';
import ImageToolsHub from './components/ImageToolsHub';
import ExportToSheets from './components/ExportToSheets';
import StrategicPlanner from './components/StrategicPlanner';
import AuthModal from './components/AuthModal';
import { XCircleIcon } from './components/icons/XCircleIcon';
import { UserIcon } from './components/icons/UserIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';

const LandingPage: React.FC<{ onStart: () => void; onLogin: () => void; currentUser: User | null }> = ({ onStart, onLogin, currentUser }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 800);
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const cardStyle = "group relative overflow-hidden backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 hover:border-purple-500/40 hover:bg-white/[0.05] shadow-2xl cursor-pointer";

  return (
    <div className="min-h-full flex flex-col items-center justify-center relative overflow-visible animate-fadeIn pb-24">
      {/* Interactive Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-purple-600/10 blur-[140px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-pink-600/10 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div 
          className="absolute w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full transition-transform duration-700 ease-out"
          style={{ transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)` }}
        ></div>
      </div>

      <div className="max-w-6xl w-full text-center space-y-12 z-10 px-6 pt-12">
        {!isLoaded ? (
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-white/5 rounded-3xl w-3/4 mx-auto"></div>
            <div className="h-10 bg-white/5 rounded-xl w-1/2 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="relative inline-block">
              <h1 className="text-7xl md:text-[9rem] font-black tracking-tighter text-white relative leading-none select-none">
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-purple-500 to-purple-800">Multi</span>Tools
              </h1>
              <div className="mt-4 text-xs font-black uppercase tracking-[0.8em] text-gray-500 flex items-center justify-center gap-4">
                <div className="h-px w-8 bg-gray-800"></div>
                Integrated Data Workstation
                <div className="h-px w-8 bg-gray-800"></div>
              </div>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
              Process audio, visual media, and business logic through <br/> 
              <span className="text-white font-bold">one high-performance universal engine.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <button 
                onClick={onStart}
                className="group relative px-14 py-5 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(168,85,247,0.4)] hover:brightness-110"
              >
                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center gap-3">
                  <SparklesIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Launch Dashboard
                </span>
              </button>
              
              {!currentUser && (
                <button 
                  onClick={onLogin}
                  className="px-14 py-5 bg-transparent border border-white/10 hover:border-white/30 text-gray-400 font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all hover:text-white active:scale-95"
                >
                  Sign In
                </button>
              )}
            </div>
          </>
        )}

        {/* Bento Grid with Shimmer Effects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-24 text-left pb-12">
          <div className={`${cardStyle} md:col-span-2 overflow-hidden`}>
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent group-hover:animate-[shimmer_2s_infinite]"></div>
            <div className="absolute top-8 right-8 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest">Logic Hub</span>
            </div>
            <div className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Strategic Plan</div>
            <p className="text-gray-500 font-bold text-sm leading-relaxed max-w-md">
              The Burooj-themed logic core that architecturally maps chaotic data into structured visual reports and actionable task lists.
            </p>
          </div>

          <div className={cardStyle}>
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent group-hover:animate-[shimmer_2s_infinite]"></div>
            <div className="absolute top-8 right-8">
              <span className="text-[10px] font-black text-cyan-500/80 uppercase tracking-widest">Vision</span>
            </div>
            <div className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Visual Studio</div>
            <p className="text-gray-500 font-bold text-xs leading-relaxed">
              Precision OCR, multimodal editing, and government-compliant formatting tools for high-stakes documentation.
            </p>
          </div>

          <div className={cardStyle}>
             <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent group-hover:animate-[shimmer_2s_infinite]"></div>
             <div className="absolute top-8 right-8">
              <span className="text-[10px] font-black text-purple-500/80 uppercase tracking-widest">Audio</span>
            </div>
            <div className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Voice Archive</div>
            <p className="text-gray-500 font-bold text-xs leading-relaxed">
              Deep-learning transcription across 50+ languages with diarization and automated content summarization.
            </p>
          </div>

          <div className={`${cardStyle} md:col-span-2`}>
             <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent group-hover:animate-[shimmer_2s_infinite]"></div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Smart Summarizer</div>
                <p className="text-gray-500 font-bold text-xs">Instantly synthesize vast datasets into structured insights and key entities.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5 group-hover:border-purple-500/30 transition-colors">
                <SparklesIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [uiLanguage, setUiLanguage] = useLocalStorage<Language>('uiLanguage', 'en');
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage<boolean>('isSidebarOpen', true);
  
  const [activeTool, setActiveTool] = useUserLocalStorage<string>(currentUser?.id, 'activeTool', 'Home');
  const [activeImageCategory, setActiveImageCategory] = useUserLocalStorage<string>(currentUser?.id, 'activeImageCategory', 'All');
  const [activeSummaryCategory, setActiveSummaryCategory] = useUserLocalStorage<string>(currentUser?.id, 'activeSummaryCategory', 'All');
  const [historyTab, setHistoryTab] = useUserLocalStorage<string>(currentUser?.id, 'historyTab', 'transcriptions');
  
  const [transcriptions, setTranscriptions] = useUserLocalStorage<Transcription[]>(currentUser?.id, 'transcriptions', []);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useUserLocalStorage<string | null>(currentUser?.id, 'currentTranscriptionId', null);
  const [processingFiles, setProcessingFiles] = useState<any[]>([]);
  
  const [translationHistory, setTranslationHistory] = useUserLocalStorage<TranslationHistoryItem[]>(currentUser?.id, 'translationHistory', []);
  const [grammarHistory, setGrammarHistory] = useUserLocalStorage<GrammarHistoryItem[]>(currentUser?.id, 'grammarHistory', []);
  const [summarizerHistory, setSummarizerHistory] = useUserLocalStorage<DataSummarizerHistoryItem[]>(currentUser?.id, 'summarizerHistory', []);
  const [plannerHistory, setPlannerHistory] = useUserLocalStorage<any[]>(currentUser?.id, 'plannerHistory', []);

  const t = useMemo(() => getTranslations(uiLanguage), [uiLanguage]);

  const handleLaunchDashboard = () => {
    setActiveTool('AI Transcriber');
    setIsSidebarOpen(true);
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
  }, [processingFiles]);

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'Home':
        return <LandingPage currentUser={currentUser} onStart={handleLaunchDashboard} onLogin={() => setIsAuthModalOpen(true)} />;
      case 'AI Transcriber':
        if (currentTranscriptionId) {
             const ct = transcriptions.find(tr => tr.id === currentTranscriptionId);
             if (ct) return <TranscriptionView transcription={ct} onSave={() => {}} onUpdate={(id, segs) => setTranscriptions(prev => prev.map(t => t.id === id ? {...t, segments: segs} : t))} onClose={() => setCurrentTranscriptionId(null)} t={t} />;
        }
        return (
            <div className="flex flex-col h-full animate-fadeIn">
                {processingFiles.length > 0 ? (
                    <section className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-4xl mx-auto w-full">
                        <h2 className="text-2xl font-black mb-6 text-white uppercase tracking-widest">Processing Stack</h2>
                        <ul className="space-y-4">
                            {processingFiles.map(f => (
                                <li key={f.id} className="bg-black/40 p-5 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="font-bold truncate text-gray-100 flex-1">{f.file.name}</p>
                                        <div className="flex items-center gap-3">
                                            {f.status === 'processing' && <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400/20 border-t-purple-400"></div>}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{f.status}</span>
                                            {f.status === 'done' && <button onClick={() => setCurrentTranscriptionId(f.transcriptionId!)} className="text-[10px] font-black tracking-widest bg-purple-600 px-4 py-2 rounded-lg text-white hover:bg-purple-500 transition-colors">OPEN</button>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={false} />}
            </div>
        );
      case 'Strategic Planner': return <StrategicPlanner t={t} />;
      case 'Image Related Tools': return <ImageToolsHub t={t} externalCategory={activeImageCategory} onCategoryChange={setActiveImageCategory} />;
      case 'AI Translator': return <AITranslator t={t} onTranslationComplete={(data) => setTranslationHistory(prev => [{...data, id: Date.now().toString(), date: new Date().toLocaleDateString()}, ...prev])} />;
      case 'Grammar Corrector': return <GrammarCorrector t={t} onCorrectionComplete={(data) => setGrammarHistory(prev => [{...data, id: Date.now().toString(), date: new Date().toLocaleDateString()}, ...prev])} />;
      case 'PDF to Image': return <PdfToImage t={t} onConversionComplete={() => {}} />;
      case 'Video to Audio': return <VideoToAudio t={t} onConversionComplete={() => {}} />;
      case 'Text to Speech': return <TextToSpeech t={t} onComplete={(data) => {}} />;
      case 'Smart Summarizer': return <DataSummarizer t={t} onComplete={(data) => setSummarizerHistory(prev => [{...data, id: Date.now().toString(), date: new Date().toLocaleDateString()}, ...prev])} externalCategory={activeSummaryCategory} />;
      case 'Export to Sheets': return <ExportToSheets t={t} />;
      case 'History':
        return (
             <div className="h-full flex flex-col animate-fadeIn">
                <div className="mb-10">
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Archives</h2>
                </div>
                <div className="flex-grow overflow-hidden">
                     {historyTab === 'transcriptions' && <HistoryPanel items={transcriptions} onSelect={(i) => setCurrentTranscriptionId(i.id)} onDelete={(id) => setTranscriptions(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow min-w-0"><p className="font-bold truncate text-gray-100">{item.fileName}</p><p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mt-1.5">{item.detectedLanguage} • {item.date}</p></div>
                     )} />}
                </div>
            </div>
        );
      default: return <ComingSoon toolName={activeTool} />;
    }
  };

  return (
    <div className={`bg-[#05050C] text-white min-h-screen font-sans flex overflow-x-hidden selection:bg-purple-500/30 selection:text-white ${isAuthModalOpen ? 'modal-active' : ''}`}>
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
      
      <div className={`flex-1 flex flex-col relative transition-all duration-700 ${isAuthModalOpen ? 'blur-xl scale-[0.98] brightness-50' : ''}`}>
        <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-4 bg-white/[0.03] backdrop-blur-2xl px-6 py-3 rounded-2xl border border-white/5 shadow-2xl">
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase text-purple-500 tracking-widest">Operator Connected</span>
                  <span className="text-xs font-bold truncate max-w-[150px] text-gray-300">{currentUser.email}</span>
               </div>
               <button onClick={() => setCurrentUser(null)} className="p-2 hover:bg-red-500/20 rounded-xl text-gray-500 hover:text-red-400 transition-all active:scale-90"><XCircleIcon className="w-6 h-6" /></button>
            </div>
          ) : (
            <button 
                onClick={() => setIsAuthModalOpen(true)} 
                className="group flex items-center gap-3 bg-pink-600 hover:bg-pink-500 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_0_40px_rgba(219,39,119,0.3)] hover:shadow-[0_0_60px_rgba(219,39,119,0.5)] active:scale-95 hover:brightness-110"
            >
                <UserIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Connect Profile
            </button>
          )}
        </div>

        <main className="flex-grow p-8 md:p-16 pt-28">
          <div className="max-w-7xl mx-auto min-h-full">
            {renderActiveTool()}
          </div>
        </main>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={setCurrentUser} t={t} />
    </div>
  );
}

export default App;
