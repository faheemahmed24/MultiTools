
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUserLocalStorage } from './hooks/useUserLocalStorage';
import { getTranslations } from './lib/i18n';
import type { Language, User, Transcription, TranscriptionSegment, TranslationHistoryItem, AnalysisHistoryItem, PdfImageHistoryItem, ImagePdfHistoryItem, PdfWordHistoryItem, WordPdfHistoryItem, GrammarHistoryItem, VideoAudioHistoryItem, AudioMergerHistoryItem, TtsHistoryItem } from './types';
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
import ExportToSheets from './components/ExportToSheets';
import AuthModal from './components/AuthModal';
import Features from './components/Features';
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
  
  const [historyTab, setHistoryTab] = useState('transcriptions');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage<boolean>('isSidebarOpen', window.innerWidth >= 768);

  const t = useMemo(() => getTranslations(uiLanguage), [uiLanguage]);

  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    const isRtl = uiLanguage === 'ar' || uiLanguage === 'ur';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', isRtl);
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
    }
  };

  const renderActiveTool = () => {
    const mainContentClass = "flex flex-col h-full";
    
    switch (activeTool) {
      case 'AI Transcriber':
        if (currentTranscription) {
             return (
                 <div className="h-full animate-fadeIn">
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
                            <section className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg p-6">
                                <h2 className="text-xl font-bold mb-4 text-gray-200">Transcription Queue</h2>
                                <ul className="space-y-4">
                                    {processingFiles.map(f => (
                                        <li key={f.id} className="bg-gray-700/50 p-4 rounded-lg">
                                            <div className="flex items-center justify-between gap-4 mb-2">
                                                <p className="font-semibold truncate text-gray-200 flex-1" title={f.file.name}>{f.file.name}</p>
                                                <div className="flex items-center gap-3">
                                                    {f.status === 'pending' && <ClockIcon className="w-5 h-5 text-gray-400" />}
                                                    {f.status === 'processing' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>}
                                                    {f.status === 'done' && <CheckCircleIcon className="w-5 h-5 text-green-400" />}
                                                    {f.status === 'error' && <XCircleIcon className="w-5 h-5 text-red-400" />}
                                                    <span className="text-sm font-medium text-gray-300 capitalize">{f.status === 'done' ? 'Completed' : f.status}</span>
                                                    {f.status === 'done' && f.transcriptionId && (
                                                        <button 
                                                            onClick={() => setCurrentTranscriptionId(f.transcriptionId!)}
                                                            className="text-xs bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-white font-bold transition-colors"
                                                        >
                                                            VIEW
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-600 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-500 ${f.status === 'error' ? 'bg-red-500 w-full' : (f.status === 'processing' ? 'progress-bar-shimmer w-full' : (f.status === 'done' ? 'bg-purple-500 w-full' : 'bg-purple-500 w-[10%]'))}`}></div>
                                            </div>
                                            {f.error && <p className="mt-2 text-xs text-red-400 leading-relaxed">{f.error}</p>}
                                        </li>
                                    ))}
                                </ul>
                                {allDone && (
                                    <div className="flex gap-4 mt-6">
                                        <button onClick={() => setProcessingFiles([])} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 font-semibold rounded-lg transition-colors text-white">Upload More</button>
                                        <button onClick={() => setProcessingFiles([])} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 font-semibold rounded-lg transition-colors text-white">Clear Queue</button>
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
      case 'Export to Sheets': return <div className={mainContentClass}><ExportToSheets t={t} /></div>;
      case 'Features': return <div className={mainContentClass}><Features t={t} /></div>;
      case 'History':
        const tabs = [
            { id: 'transcriptions', label: t.transcription },
            { id: 'translations', label: t.aiTranslatorTitle },
            { id: 'grammar', label: t.grammarCorrector },
            { id: 'analysis', label: t.imageConverterOcrTitle },
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
                <div className="mb-6 overflow-x-auto pb-2 flex space-x-2">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setHistoryTab(tab.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${historyTab === tab.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex-grow bg-gray-800 rounded-2xl p-4 overflow-hidden shadow-lg border border-gray-700/50">
                     {historyTab === 'transcriptions' && <HistoryPanel items={transcriptions} onSelect={handleSelectTranscription} onDelete={handleDeleteTranscription} activeId={currentTranscription?.id} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden">
                            <p className="font-semibold truncate text-gray-200">{item.fileName}</p>
                            <p className="text-xs text-gray-400">{item.date} • {item.detectedLanguage}</p>
                        </div>
                     )} />}
                     {historyTab === 'translations' && <HistoryPanel items={translationHistory} onSelect={() => {}} onDelete={(id) => setTranslationHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-semibold truncate text-gray-200">{item.inputText}</p><p className="text-xs text-gray-400">{item.date} • {item.sourceLang} → {item.targetLang}</p></div>
                     )} />}
                     {historyTab === 'grammar' && <HistoryPanel items={grammarHistory} onSelect={() => {}} onDelete={(id) => setGrammarHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-semibold truncate text-gray-200">{item.originalText}</p><p className="text-xs text-gray-400">{item.date} • {item.language}</p></div>
                     )} />}
                     {historyTab === 'analysis' && <HistoryPanel items={analysisHistory} onSelect={() => {}} onDelete={(id) => setAnalysisHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-semibold truncate text-gray-200">{item.fileName}</p><p className="text-xs text-gray-400">{item.date}</p></div>
                     )} />}
                     {historyTab === 'pdfimage' && <HistoryPanel items={pdfImageHistory} onSelect={() => {}} onDelete={(id) => setPdfImageHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-semibold truncate text-gray-200">{item.fileName}</p><p className="text-xs text-gray-400">{item.date} • {item.pageCount} pages</p></div>
                     )} />}
                     {historyTab === 'imagepdf' && <HistoryPanel items={imagePdfHistory} onSelect={() => {}} onDelete={(id) => setImagePdfHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-semibold truncate text-gray-200">{item.fileName}</p><p className="text-xs text-gray-400">{item.date} • {item.imageCount} images</p></div>
                     )} />}
                     {historyTab === 'pdfword' && <HistoryPanel items={pdfWordHistory} onSelect={() => {}} onDelete={(id) => setPdfWordHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-semibold truncate text-gray-200">{item.fileName}</p><p className="text-xs text-gray-400">{item.date}</p></div>
                     )} />}
                     {historyTab === 'wordpdf' && <HistoryPanel items={wordPdfHistory} onSelect={() => {}} onDelete={(id) => setWordPdfHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-semibold truncate text-gray-200">{item.fileName}</p><p className="text-xs text-gray-400">{item.date}</p></div>
                     )} />}
                     {historyTab === 'videoaudio' && <HistoryPanel items={videoAudioHistory} onSelect={() => {}} onDelete={(id) => setVideoAudioHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-semibold truncate text-gray-200">{item.fileName}</p><p className="text-xs text-gray-400">{item.date} • {item.outputFormat}</p></div>
                     )} />}
                     {historyTab === 'audiomerger' && <HistoryPanel items={audioMergerHistory} onSelect={() => {}} onDelete={(id) => setAudioMergerHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-semibold truncate text-gray-200">{item.fileName}</p><p className="text-xs text-gray-400">{item.date} • {item.fileCount} files</p></div>
                     )} />}
                     {historyTab === 'tts' && <HistoryPanel items={ttsHistory} onSelect={() => {}} onDelete={(id) => setTtsHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={(item) => (
                        <div className="flex-grow overflow-hidden"><p className="font-semibold truncate text-gray-200">{item.text}</p><p className="text-xs text-gray-400">{item.date} • Voice: {item.voice}</p></div>
                     )} />}
                </div>
            </div>
        );
      default: return <ComingSoon toolName={activeTool} />;
    }
  };

  return (
    <div className="bg-gray-900 text-white h-screen font-sans flex overflow-hidden">
      {/* SEMANTIC HEADER & NAV */}
      <header className="contents">
        <Header uiLanguage={uiLanguage} setUiLanguage={setUiLanguage} activeTool={activeTool} setActiveTool={setActiveTool} t={t} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} currentUser={currentUser} onLoginClick={() => setIsAuthModalOpen(true)} onLogoutClick={handleLogout} />
        {isSidebarOpen && !isDesktop && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden" aria-hidden="true" />}
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* MOBILE NAV BAR */}
        <nav className="md:hidden flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 h-16">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ms-2 rounded-lg text-gray-400 hover:text-white" aria-label="Open menu"><HamburgerIcon className="w-6 h-6" /></button>
          <div className="text-xl font-bold"><a href="/"><span className="text-purple-400">Multi</span><span className="text-pink-500">Tools</span></a></div>
          {currentUser ? <div className="p-1 bg-gray-700 rounded-full"><UserIcon className="w-6 h-6 text-purple-400"/></div> : <button onClick={() => setIsAuthModalOpen(true)} className="p-1"><UserIcon className="w-6 h-6 text-gray-400" /></button>}
        </nav>

        {/* MAIN CONTENT AREA */}
        <main id="main-content" className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto">
          {/* SEO SECTION (INTEGRATED) */}
          {!currentTranscription && activeTool === 'AI Transcriber' && (
             <section className="mb-8 animate-fadeIn">
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">Welcome to MultiTools</h1>
                <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-shrink-0">
                        <img 
                            src="https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=400&h=266&auto=format&fit=crop" 
                            alt="Professional AI Audio Transcription Tool" 
                            width="400" 
                            height="266" 
                            className="rounded-xl shadow-2xl border border-gray-600"
                            loading="lazy" 
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-100 mb-2">Professional AI Transcription Services</h2>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            Harness the power of Gemini 3.5 to convert your media into accurate text instantly. 
                            Our system automatically detects language nuances and provides speaker diarization for clear, professional results.
                        </p>
                        <a href="#uploader" className="inline-flex items-center px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105">
                            Start Transcribing Now
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
        <footer className="bg-gray-800/30 border-t border-gray-700/30 p-4 text-center">
            <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} MultiTools AI. All rights reserved. 
                <span className="mx-2">|</span>
                <a href="/contact" className="hover:text-purple-400 transition-colors">Contact Us Today</a>
            </p>
        </footer>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} t={t} />
    </div>
  );
}

export default App;
