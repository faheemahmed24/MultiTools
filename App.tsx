
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUserLocalStorage } from './hooks/useUserLocalStorage';
import { getTranslations } from './lib/i18n';
import type { Language, User, Transcription, TranscriptionSegment, TranslationHistoryItem, AnalysisHistoryItem, PdfImageHistoryItem, ImagePdfHistoryItem, PdfWordHistoryItem, WordPdfHistoryItem, GrammarHistoryItem, VideoAudioHistoryItem, AudioMergerHistoryItem, TtsHistoryItem, DataSummarizerHistoryItem } from './types';
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
import WordToPdf from './components/WordToPdf';
import VideoToAudio from './components/VideoToAudio';
import AudioMerger from './components/AudioMerger';
import TextToSpeech from './components/TextToSpeech';
import DataSummarizer from './components/DataSummarizer';
import ExportToSheets from './components/ExportToSheets';
import AuthModal from './components/AuthModal';
import { ClockIcon } from './components/icons/ClockIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { XCircleIcon } from './components/icons/XCircleIcon';
import { UserIcon } from './components/icons/UserIcon';

const HamburgerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

interface ProcessingFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  transcriptionId?: string;
  languageHint?: string;
}

function App() {
  const [uiLanguage, setUiLanguage] = useLocalStorage<Language>('uiLanguage', 'en');
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [activeTool, setActiveTool] = useUserLocalStorage<string>(currentUser?.id, 'activeTool', 'AI Transcriber');
  const [transcriptions, setTranscriptions] = useUserLocalStorage<Transcription[]>(currentUser?.id, 'transcriptions', []);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useUserLocalStorage<string | null>(currentUser?.id, 'currentTranscriptionId', null);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  
  const [translationHistory, setTranslationHistory] = useUserLocalStorage<TranslationHistoryItem[]>(currentUser?.id, 'translationHistory', []);
  const [grammarHistory, setGrammarHistory] = useUserLocalStorage<GrammarHistoryItem[]>(currentUser?.id, 'grammarHistory', []);
  const [analysisHistory, setAnalysisHistory] = useUserLocalStorage<AnalysisHistoryItem[]>(currentUser?.id, 'analysisHistory', []);
  const [pdfImageHistory, setPdfImageHistory] = useUserLocalStorage<PdfImageHistoryItem[]>(currentUser?.id, 'pdfImageHistory', []);
  const [imagePdfHistory, setImagePdfHistory] = useUserLocalStorage<ImagePdfHistoryItem[]>(currentUser?.id, 'imagePdfHistory', []);
  const [pdfWordHistory, setPdfWordHistory] = useUserLocalStorage<PdfWordHistoryItem[]>(currentUser?.id, 'pdfWordHistory', []);
  const [wordPdfHistory, setWordPdfHistory] = useUserLocalStorage<WordPdfHistoryItem[]>(currentUser?.id, 'wordPdfHistory', []);
  const [videoAudioHistory, setVideoAudioHistory] = useUserLocalStorage<VideoAudioHistoryItem[]>(currentUser?.id, 'videoAudioHistory', []);
  const [audioMergerHistory, setAudioMergerHistory] = useUserLocalStorage<AudioMergerHistoryItem[]>(currentUser?.id, 'audioMergerHistory', []);
  const [ttsHistory, setTtsHistory] = useUserLocalStorage<TtsHistoryItem[]>(currentUser?.id, 'ttsHistory', []);
  const [summarizerHistory, setSummarizerHistory] = useUserLocalStorage<DataSummarizerHistoryItem[]>(currentUser?.id, 'summarizerHistory', []);
  
  const [historyTab, setHistoryTab] = useState('transcriptions');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage<boolean>('isSidebarOpen', window.innerWidth >= 768);

  const t = useMemo(() => getTranslations(uiLanguage), [uiLanguage]);

  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = uiLanguage === 'ar' || uiLanguage === 'ur' ? 'rtl' : 'ltr';
  }, [uiLanguage]);
  
  useEffect(() => {
    const handleResize = () => {
      const newIsDesktop = window.innerWidth >= 768;
      if (newIsDesktop !== isDesktop) {
        setIsDesktop(newIsDesktop);
        if (!newIsDesktop) setIsSidebarOpen(false);
        else setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDesktop, setIsSidebarOpen]);

  const currentTranscription = useMemo(() => {
    if (!currentTranscriptionId) return null;
    return transcriptions.find(t => t.id === currentTranscriptionId) || null;
  }, [transcriptions, currentTranscriptionId]);
  
  const handleFilesSelect = (files: File[], languageHint: string) => {
    const newFilesToProcess: ProcessingFile[] = files.map(file => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      status: 'pending',
      languageHint,
    }));
    setProcessingFiles(current => [...current, ...newFilesToProcess]);
    setActiveTool('AI Transcriber');
    setCurrentTranscriptionId(null);
  };

  useEffect(() => {
    const isProcessing = processingFiles.some(f => f.status === 'processing');
    if (isProcessing) return;

    const fileToProcess = processingFiles.find(f => f.status === 'pending');
    if (!fileToProcess) return;

    const processFile = async () => {
      setProcessingFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'processing' } : f));
      
      try {
        const newTranscriptionData = await transcribeAudio(fileToProcess.file, fileToProcess.languageHint);
        const newTranscription: Transcription = {
          ...newTranscriptionData,
          id: `${Date.now()}-${Math.random()}`,
          date: new Date().toLocaleDateString(uiLanguage, { year: 'numeric', month: 'long', day: 'numeric' }),
        };
        
        setTranscriptions(prev => [newTranscription, ...prev]);
        setProcessingFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'done', transcriptionId: newTranscription.id } : f));
        setCurrentTranscriptionId(newTranscription.id);
        
      } catch (err: any) {
        setProcessingFiles(prev => prev.map(f => (
          f.id === fileToProcess.id ? { ...f, status: 'error', error: err.message } : f
        )));
      }
    };
    
    processFile();
  }, [processingFiles, setTranscriptions, uiLanguage, setCurrentTranscriptionId]);

  const handleUpdateTranscription = useCallback((id: string, updatedSegments: TranscriptionSegment[]) => {
    setTranscriptions(prev => prev.map(t => t.id === id ? { ...t, segments: updatedSegments } : t));
  }, [setTranscriptions]);

  const handleDeleteTranscription = useCallback((id: string) => {
    setTranscriptions(prev => prev.filter(t => t.id !== id));
    if (currentTranscriptionId === id) setCurrentTranscriptionId(null);
  }, [currentTranscriptionId, setTranscriptions, setCurrentTranscriptionId]);

  const handleSelectTranscription = useCallback((transcription: Transcription) => {
    setActiveTool('AI Transcriber');
    setCurrentTranscriptionId(transcription.id);
  }, [setActiveTool, setCurrentTranscriptionId]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const handleAddToHistory = (tool: string, data: any) => {
    const newItem = {
        id: `${Date.now()}-${Math.random()}`,
        date: new Date().toLocaleDateString(uiLanguage, { year: 'numeric', month: 'long', day: 'numeric' }),
        ...data,
    };
    switch (tool) {
        case 'AI Translator': setTranslationHistory(prev => [newItem, ...prev]); break;
        case 'Grammar Corrector': setGrammarHistory(prev => [newItem, ...prev]); break;
        case 'Image Converter & OCR': setAnalysisHistory(prev => [newItem, ...prev]); break;
        case 'PDF to Image': setPdfImageHistory(prev => [newItem, ...prev]); break;
        case 'Image to PDF': setImagePdfHistory(prev => [newItem, ...prev]); break;
        case 'PDF to Word': setPdfWordHistory(prev => [newItem, ...prev]); break;
        case 'Word to PDF': setWordPdfHistory(prev => [newItem, ...prev]); break;
        case 'Video to Audio': setVideoAudioHistory(prev => [newItem, ...prev]); break;
        case 'Audio Merger': setAudioMergerHistory(prev => [newItem, ...prev]); break;
        case 'Text to Speech': setTtsHistory(prev => [newItem, ...prev]); break;
        case 'Smart Summarizer': setSummarizerHistory(prev => [newItem, ...prev]); break;
    }
  };

  const renderActiveTool = () => {
    const mainContentClass = "flex flex-col h-full";
    
    switch (activeTool) {
      case 'AI Transcriber':
        if (currentTranscription) {
             return (
                 <div className="h-full">
                     <TranscriptionView 
                        transcription={currentTranscription} 
                        onSave={() => {}} 
                        onUpdate={handleUpdateTranscription} 
                        onClose={() => setCurrentTranscriptionId(null)}
                        t={t} 
                    />
                 </div>
             )
        }
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                {processingFiles.length > 0 ? (
                    (() => {
                        const allDone = processingFiles.every(f => f.status === 'done' || f.status === 'error');
                        return (
                            <section className="bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto w-full">
                                <h2 className="text-2xl font-black mb-6 text-white tracking-tight">Active Processings</h2>
                                <ul className="space-y-4">
                                    {processingFiles.map(f => (
                                        <li key={f.id} className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700/30 transition-all hover:bg-gray-900/60">
                                            <div className="flex items-center justify-between gap-4 mb-3">
                                                <p className="font-bold truncate text-gray-100 flex-1 text-sm md:text-base" title={f.file.name}>{f.file.name}</p>
                                                <div className="flex items-center gap-4">
                                                    {f.status === 'pending' && <ClockIcon className="w-5 h-5 text-gray-500" />}
                                                    {f.status === 'processing' && <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400/20 border-t-purple-400"></div>}
                                                    {f.status === 'done' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                                                    {f.status === 'error' && <XCircleIcon className="w-5 h-5 text-red-500" />}
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{f.status}</span>
                                                    {f.status === 'done' && f.transcriptionId && (
                                                        <button 
                                                            onClick={() => setCurrentTranscriptionId(f.transcriptionId!)}
                                                            className="text-[10px] font-black tracking-widest bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-white transition-all transform hover:scale-105 active:scale-95"
                                                        >
                                                            VIEW
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-700 ease-in-out ${f.status === 'error' ? 'bg-red-500 w-full' : (f.status === 'processing' ? 'progress-bar-shimmer w-full' : (f.status === 'done' ? 'bg-green-500 w-full' : 'bg-purple-600 w-[10%]'))}`}></div>
                                            </div>
                                            {f.error && <p className="mt-3 text-[10px] text-red-400 font-medium leading-relaxed bg-red-400/10 p-2 rounded-lg">{f.error}</p>}
                                        </li>
                                    ))}
                                </ul>
                                {allDone && (
                                    <div className="flex gap-4 mt-8">
                                        <button onClick={() => setProcessingFiles([])} className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-650 font-bold rounded-xl transition-all text-white text-sm uppercase tracking-widest">Upload More</button>
                                        <button onClick={() => setProcessingFiles([])} className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 font-bold rounded-xl transition-all text-white text-sm uppercase tracking-widest shadow-lg shadow-purple-900/20">Clear List</button>
                                    </div>
                                )}
                            </section>
                        );
                    })()
                ) : (
                    <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={false} />
                )}
            </div>
        );
      case 'AI Translator': return <div className={mainContentClass}><AITranslator t={t} onTranslationComplete={(data) => handleAddToHistory('AI Translator', data)} /></div>;
      case 'Grammar Corrector': return <div className={mainContentClass}><GrammarCorrector t={t} onCorrectionComplete={(data) => handleAddToHistory('Grammar Corrector', data)} /></div>;
      case 'Image Converter & OCR': return <div className={mainContentClass}><ImageConverterOcr t={t} onAnalysisComplete={(data) => handleAddToHistory('Image Converter & OCR', data)}/></div>;
      case 'PDF to Image': return <div className={mainContentClass}><PdfToImage t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Image', data)} /></div>;
      case 'Image to PDF': return <div className={mainContentClass}><ImageToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Image to PDF', data)}/></div>;
      case 'PDF to Word': return <div className={mainContentClass}><PdfToWord t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Word', data)} /></div>;
      case 'Word to PDF': return <div className={mainContentClass}><WordToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Word to PDF', data)} /></div>;
      case 'Video to Audio': return <div className={mainContentClass}><VideoToAudio t={t} onConversionComplete={(data) => handleAddToHistory('Video to Audio', data)} /></div>;
      case 'Audio Merger': return <div className={mainContentClass}><AudioMerger t={t} onConversionComplete={(data) => handleAddToHistory('Audio Merger', data)} /></div>;
      case 'Text to Speech': return <div className={mainContentClass}><TextToSpeech t={t} onComplete={(data) => handleAddToHistory('Text to Speech', data)} /></div>;
      case 'Smart Summarizer': return <div className={mainContentClass}><DataSummarizer t={t} onComplete={(data) => handleAddToHistory('Smart Summarizer', data)} /></div>;
      case 'Export to Sheets': return <div className={mainContentClass}><ExportToSheets t={t} /></div>;
      case 'History':
        const tabs = [
            { id: 'transcriptions', label: t.transcription },
            { id: 'translations', label: t.aiTranslatorTitle },
            { id: 'grammar', label: t.grammarCorrector },
            { id: 'analysis', label: t.imageConverterOcrTitle },
            { id: 'summarizer', label: t.smartSummarizer },
            { id: 'pdfimage', label: t.pdfToImage },
            { id: 'imagepdf', label: t.imageToPdf },
            { id: 'pdfword', label: t.pdfToWord },
            { id: 'wordpdf', label: t.wordToPdf },
            { id: 'videoaudio', label: t.videoToAudio },
            { id: 'audiomerger', label: t.audioMerger },
            { id: 'tts', label: t.textToSpeech },
        ];
        return (
             <div className={`${mainContentClass} animate-fadeIn h-full overflow-hidden`}>
                <div className="mb-6 overflow-x-auto pb-4 flex space-x-3 custom-scrollbar">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setHistoryTab(tab.id)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${historyTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-800 text-gray-500 hover:text-gray-300 hover:bg-gray-700'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex-grow bg-gray-800/40 backdrop-blur-md rounded-3xl p-6 overflow-hidden shadow-2xl border border-gray-700/50">
                     {historyTab === 'transcriptions' && <HistoryPanel items={transcriptions} onSelect={handleSelectTranscription} onDelete={handleDeleteTranscription} activeId={currentTranscription?.id} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden">
                            <p className="font-bold truncate text-gray-100">{item.fileName}</p>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">{item.date} • {item.detectedLanguage}</p>
                        </div>
                     )} />}
                     {historyTab === 'translations' && <HistoryPanel items={translationHistory} onSelect={() => {}} onDelete={(id) => setTranslationHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-bold truncate text-gray-100">{item.inputText}</p><p className="text-[10px] text-gray-500 font-black mt-0.5 uppercase tracking-widest">{item.date} • {item.sourceLang} → {item.targetLang}</p></div>
                     )} />}
                     {historyTab === 'grammar' && <HistoryPanel items={grammarHistory} onSelect={() => {}} onDelete={(id) => setGrammarHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-bold truncate text-gray-100">{item.originalText}</p><p className="text-[10px] text-gray-500 font-black mt-0.5 uppercase tracking-widest">{item.date} • {item.language}</p></div>
                     )} />}
                     {historyTab === 'analysis' && <HistoryPanel items={analysisHistory} onSelect={() => {}} onDelete={(id) => setAnalysisHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-bold truncate text-gray-100">{item.fileName}</p><p className="text-[10px] text-gray-500 font-black mt-0.5 uppercase tracking-widest">{item.date}</p></div>
                     )} />}
                     {historyTab === 'summarizer' && <HistoryPanel items={summarizerHistory} onSelect={() => {}} onDelete={(id) => setSummarizerHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-bold truncate text-gray-100">{item.result.summary}</p><p className="text-[10px] text-gray-500 font-black mt-0.5 uppercase tracking-widest">{item.date} • {item.result.contacts.length} entities</p></div>
                     )} />}
                     {historyTab === 'pdfimage' && <HistoryPanel items={pdfImageHistory} onSelect={() => {}} onDelete={(id) => setPdfImageHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-bold truncate text-gray-100">{item.fileName}</p><p className="text-[10px] text-gray-500 font-black mt-0.5 uppercase tracking-widest">{item.date} • {item.pageCount} pages</p></div>
                     )} />}
                     {historyTab === 'imagepdf' && <HistoryPanel items={imagePdfHistory} onSelect={() => {}} onDelete={(id) => setImagePdfHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-bold truncate text-gray-100">{item.fileName}</p><p className="text-[10px] text-gray-500 font-black mt-0.5 uppercase tracking-widest">{item.date} • {item.imageCount} images</p></div>
                     )} />}
                     {historyTab === 'pdfword' && <HistoryPanel items={pdfWordHistory} onSelect={() => {}} onDelete={(id) => setPdfWordHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-bold truncate text-gray-100">{item.fileName}</p><p className="text-[10px] text-gray-500 font-black mt-0.5 uppercase tracking-widest">{item.date}</p></div>
                     )} />}
                     {historyTab === 'wordpdf' && <HistoryPanel items={wordPdfHistory} onSelect={() => {}} onDelete={(id) => setWordPdfHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-bold truncate text-gray-100">{item.fileName}</p><p className="text-[10px] text-gray-500 font-black mt-0.5 uppercase tracking-widest">{item.date}</p></div>
                     )} />}
                     {historyTab === 'videoaudio' && <HistoryPanel items={videoAudioHistory} onSelect={() => {}} onDelete={(id) => setVideoAudioHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-bold truncate text-gray-100">{item.fileName}</p><p className="text-[10px] text-gray-500 font-black mt-0.5 uppercase tracking-widest">{item.date} • {item.outputFormat}</p></div>
                     )} />}
                     {historyTab === 'audiomerger' && <HistoryPanel items={audioMergerHistory} onSelect={() => {}} onDelete={(id) => setAudioMergerHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-bold truncate text-gray-100">{item.fileName}</p><p className="text-[10px] text-gray-500 font-black mt-0.5 uppercase tracking-widest">{item.date} • {item.fileCount} files</p></div>
                     )} />}
                     {historyTab === 'tts' && <HistoryPanel items={ttsHistory} onSelect={() => {}} onDelete={(id) => setTtsHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-bold truncate text-gray-100">{item.text}</p><p className="text-[10px] text-gray-500 font-black mt-0.5 uppercase tracking-widest">{item.date} • Voice: {item.voice}</p></div>
                     )} />}
                </div>
            </div>
        );
      default: return <ComingSoon toolName={activeTool} />;
    }
  };

  return (
    <div className="bg-gray-950 text-white h-screen font-sans flex overflow-hidden">
      {/* SEMANTIC HEADER & NAV */}
      <header className="contents">
        <Header uiLanguage={uiLanguage} setUiLanguage={setUiLanguage} activeTool={activeTool} setActiveTool={setActiveTool} t={t} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} currentUser={currentUser} onLoginClick={() => setIsAuthModalOpen(true)} onLogoutClick={handleLogout} />
        {isSidebarOpen && !isDesktop && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/80 z-30 md:hidden" aria-hidden="true" />}
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* MOBILE NAV BAR */}
        <nav className="md:hidden flex items-center justify-between px-6 py-4 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 h-20">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 -ms-2 rounded-2xl bg-gray-800 text-gray-400 hover:text-white transition-all transform active:scale-95" aria-label="Open menu"><HamburgerIcon className="w-6 h-6" /></button>
          <div className="text-2xl font-black tracking-tighter"><a href="/"><span className="text-purple-500">Multi</span><span className="text-pink-600">Tools</span></a></div>
          {currentUser ? <div className="p-1.5 bg-purple-600/20 rounded-full border border-purple-500/30"><UserIcon className="w-6 h-6 text-purple-400"/></div> : <button onClick={() => setIsAuthModalOpen(true)} className="p-1.5 bg-gray-800 rounded-full text-gray-500"><UserIcon className="w-6 h-6" /></button>}
        </nav>

        {/* MAIN CONTENT AREA */}
        <main id="main-content" className="flex-grow p-6 md:p-12 overflow-y-auto custom-scrollbar">
          {/* SEO HERO SECTION */}
          {!currentTranscription && activeTool === 'AI Transcriber' && processingFiles.length === 0 && (
             <section className="mb-12 animate-fadeIn max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tight mb-4">
                        Precision Media <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600">Transcription</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl font-medium leading-relaxed">
                        Convert any audio or video file into structured text instantly. Powered by Gemini 3 Pro for unmatched accuracy in 100+ languages.
                    </p>
                </div>
                
                <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-[2.5rem] p-8 md:p-12 flex flex-col lg:flex-row gap-12 items-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] group-hover:bg-purple-600/20 transition-colors"></div>
                    <div className="flex-shrink-0 relative z-10 w-full lg:w-1/2">
                        <img 
                            src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1200&auto=format&fit=crop" 
                            alt="Professional AI Transcription Interface" 
                            className="rounded-3xl shadow-2xl border border-gray-700/50 transform group-hover:scale-[1.02] transition-transform duration-700"
                            loading="lazy" 
                        />
                    </div>
                    <div className="relative z-10 lg:w-1/2">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-purple-500/30">
                            Enterprise AI Core
                        </div>
                        <h2 className="text-3xl font-extrabold text-white mb-6 leading-tight">Advanced Speaker Identification & Formatting</h2>
                        <ul className="space-y-4 mb-8">
                            {[
                                "Automatic multi-language detection (Urdu, Hindi, Arabic & more)",
                                "Precise speaker diarization with custom labels",
                                "Professional exports: SRT, PDF, Word, and JSON",
                                "Local-first privacy: Your files never leave your browser"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-400 font-medium">
                                    <CheckCircleIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <a href="#uploader" className="inline-flex items-center px-10 py-4 bg-white text-gray-950 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-purple-500 hover:text-white transition-all transform hover:-translate-y-1 shadow-xl">
                            Start Transcribing
                        </a>
                    </div>
                </div>
             </section>
          )}

          <div id="tool-view" className="h-full">
            {renderActiveTool()}
          </div>
        </main>

        {/* SEMANTIC FOOTER */}
        <footer className="bg-gray-900/50 backdrop-blur-md border-t border-gray-800 p-6 text-center">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} MultiTools AI Labs. Built for Privacy.
                </p>
                <nav>
                    <ul className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <li><a href="#" className="hover:text-purple-400 transition-colors">Documentation</a></li>
                        <li><a href="#" className="hover:text-purple-400 transition-colors">API Specs</a></li>
                        <li><a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a></li>
                    </ul>
                </nav>
            </div>
        </footer>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} t={t} />
    </div>
  );
}

export default App;
