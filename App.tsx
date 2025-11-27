import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUserLocalStorage } from './hooks/useUserLocalStorage';
import { getTranslations } from './lib/i18n';
import type { Language, TranslationSet, User, Transcription, TranscriptionSegment, TranslationHistoryItem, AnalysisHistoryItem, PdfImageHistoryItem, ImagePdfHistoryItem, PdfWordHistoryItem, WordPdfHistoryItem, GrammarHistoryItem } from './types';
import { transcribeAudio } from './services/geminiService';

import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import ComingSoon from './components/ComingSoon';
import AITranslator from './components/AITranslator';
import GrammarCorrector from './components/GrammarCorrector';
import ImageConverterOcr from './components/ImageAnalyzer';
import PdfToImage from './components/PdfToImage';
import ImageToPdf from './components/ImageToPdf';
import PdfToWord from './components/PdfToWord';
import WordToPdf from './components/WordToPdf';
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
}

function App() {
  const [uiLanguage, setUiLanguage] = useLocalStorage<Language>('uiLanguage', 'en');
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // User-specific data
  const [activeTool, setActiveTool] = useUserLocalStorage<string>(currentUser?.id, 'activeTool', 'AI Transcriber');
  
  // Transcription State
  const [transcriptions, setTranscriptions] = useUserLocalStorage<Transcription[]>(currentUser?.id, 'transcriptions', []);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useUserLocalStorage<string | null>(currentUser?.id, 'currentTranscriptionId', null);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  
  // History States for all tools (kept for state persistence, though UI is removed)
  const [translationHistory, setTranslationHistory] = useUserLocalStorage<TranslationHistoryItem[]>(currentUser?.id, 'translationHistory', []);
  const [grammarHistory, setGrammarHistory] = useUserLocalStorage<GrammarHistoryItem[]>(currentUser?.id, 'grammarHistory', []);
  const [analysisHistory, setAnalysisHistory] = useUserLocalStorage<AnalysisHistoryItem[]>(currentUser?.id, 'analysisHistory', []);
  const [pdfImageHistory, setPdfImageHistory] = useUserLocalStorage<PdfImageHistoryItem[]>(currentUser?.id, 'pdfImageHistory', []);
  const [imagePdfHistory, setImagePdfHistory] = useUserLocalStorage<ImagePdfHistoryItem[]>(currentUser?.id, 'imagePdfHistory', []);
  const [pdfWordHistory, setPdfWordHistory] = useUserLocalStorage<PdfWordHistoryItem[]>(currentUser?.id, 'pdfWordHistory', []);
  const [wordPdfHistory, setWordPdfHistory] = useUserLocalStorage<WordPdfHistoryItem[]>(currentUser?.id, 'wordPdfHistory', []);

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage<boolean>('isSidebarOpen', window.innerWidth >= 768);

  const t = useMemo(() => getTranslations(uiLanguage), [uiLanguage]);

  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = uiLanguage === 'ar' || uiLanguage === 'ur' ? 'rtl' : 'ltr';
  }, [uiLanguage]);
  
  useEffect(() => {
    if (!currentUser) {
      setCurrentTranscriptionId(null);
      setProcessingFiles([]);
    }
  }, [currentUser, setCurrentTranscriptionId]);

   useEffect(() => {
    const handleResize = () => {
      const newIsDesktop = window.innerWidth >= 768;
      if (newIsDesktop !== isDesktop) {
        setIsDesktop(newIsDesktop);
        if (!newIsDesktop) {
          setIsSidebarOpen(false); // Close sidebar when switching to mobile
        } else {
          setIsSidebarOpen(true); // Open sidebar when switching to desktop
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDesktop, setIsSidebarOpen]);


  const currentTranscription = useMemo(() => {
    if (!currentTranscriptionId) return null;
    return transcriptions.find(t => t.id === currentTranscriptionId) || null;
  }, [transcriptions, currentTranscriptionId]);
  
  const handleFilesSelect = (files: File[]) => {
    const newFilesToProcess: ProcessingFile[] = files.map(file => {
      const type = file.type;
      const name = file.name.toLowerCase();
      // Check for MIME type or common extensions
      const isSupported = type.startsWith('audio/') || type.startsWith('video/') ||
                         /\.(mp3|wav|ogg|m4a|flac|aac|mp4|webm|mov|avi|mkv|wmv|flv|m4v|3gp)$/i.test(name);
      
      return {
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        status: isSupported ? 'pending' : 'error',
        error: isSupported ? undefined : 'Unsupported file type. Please upload audio or video.',
      };
    });
    // Fix: Append to existing files instead of overwriting
    setProcessingFiles(current => [...current, ...newFilesToProcess]);
    setActiveTool('AI Transcriber');
  };

  useEffect(() => {
    const isProcessing = processingFiles.some(f => f.status === 'processing');
    if (isProcessing) return;

    const fileToProcess = processingFiles.find(f => f.status === 'pending');
    if (!fileToProcess) return;

    const processFile = async () => {
      setProcessingFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'processing' } : f));
      
      try {
        const newTranscriptionData = await transcribeAudio(fileToProcess.file);
        const newTranscription: Transcription = {
          ...newTranscriptionData,
          id: new Date().toISOString() + Math.random(),
          date: new Date().toLocaleDateString(uiLanguage, { year: 'numeric', month: 'long', day: 'numeric' }),
        };
        setTranscriptions(prev => [newTranscription, ...prev]);
        setCurrentTranscriptionId(newTranscription.id);
        setProcessingFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'done' } : f));
      } catch (err: any) {
        setProcessingFiles(prev => prev.map(f => (
          f.id === fileToProcess.id 
            ? { ...f, status: 'error', error: err.message || 'An unexpected error occurred.' } 
            : f
        )));
      }
    };
    
    processFile();
  }, [processingFiles, setTranscriptions, uiLanguage, setCurrentTranscriptionId]);

  const handleUpdateTranscription = useCallback((id: string, updatedSegments: TranscriptionSegment[]) => {
    setTranscriptions(prev => prev.map(t => t.id === id ? { ...t, segments: updatedSegments } : t));
  }, [setTranscriptions]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const handleAddToHistory = (tool: string, data: any) => {
    const newItem = {
        id: new Date().toISOString() + Math.random(),
        date: new Date().toLocaleDateString(uiLanguage, { year: 'numeric', month: 'long', day: 'numeric' }),
        ...data,
    };
    switch (tool) {
        case 'AI Translator':
            setTranslationHistory(prev => [newItem, ...prev]);
            break;
        case 'Grammar Corrector':
            setGrammarHistory(prev => [newItem, ...prev]);
            break;
        case 'Image Converter & OCR':
            setAnalysisHistory(prev => [newItem, ...prev]);
            break;
        case 'PDF to Image':
            setPdfImageHistory(prev => [newItem, ...prev]);
            break;
        case 'Image to PDF':
            setImagePdfHistory(prev => [newItem, ...prev]);
            break;
        case 'PDF to Word':
            setPdfWordHistory(prev => [newItem, ...prev]);
            break;
        case 'Word to PDF':
            setWordPdfHistory(prev => [newItem, ...prev]);
            break;
        default:
            break;
    }
  };

  const renderActiveTool = () => {
    const mainContentClass = "flex flex-col";
    
    switch (activeTool) {
      case 'AI Transcriber':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                {processingFiles.length > 0 ? (
                    (() => {
                        const allDone = processingFiles.every(f => f.status === 'done' || f.status === 'error');
                        const StatusIndicator = ({ status, error }: { status: ProcessingFile['status'], error?: string }) => {
                            if (status === 'pending') return <div className="flex items-center gap-2 text-gray-400"><ClockIcon className="w-5 h-5" /><span>Pending</span></div>;
                            if (status === 'processing') return <div className="flex items-center gap-2 text-purple-400"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div><span>Processing...</span></div>;
                            if (status === 'done') return <div className="flex items-center gap-2 text-green-400"><CheckCircleIcon className="w-5 h-5" /><span>Done</span></div>;
                            if (status === 'error') return <div className="flex items-center gap-2 text-red-400" title={error}><XCircleIcon className="w-5 h-5" /><span>Error</span></div>;
                            return null;
                        };
                        const getProgressBarProps = (status: ProcessingFile['status']) => {
                            if (status === 'pending') return { width: 'w-[10%]', classes: 'bg-purple-500' };
                            if (status === 'processing') return { width: 'w-full', classes: 'progress-bar-shimmer' };
                            if (status === 'error') return { width: 'w-full', classes: 'bg-red-500' };
                            return { width: 'w-full', classes: 'bg-purple-500' };
                        };

                        return (
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg p-6 transform-gpu mb-6">
                                <h2 className="text-xl font-bold mb-4 text-gray-200">Transcription Queue</h2>
                                <ul className="space-y-4 max-h-[300px] overflow-y-auto">
                                    {processingFiles.map(f => {
                                        const {width, classes} = getProgressBarProps(f.status);
                                        return (
                                            <li key={f.id} className="bg-gray-700/50 p-4 rounded-lg">
                                                <div className="flex items-center justify-between gap-4 mb-2">
                                                    <p className="font-semibold truncate text-gray-200 flex-1" title={f.file.name}>{f.file.name}</p>
                                                    <StatusIndicator status={f.status} error={f.error} />
                                                </div>
                                                <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                                                    <div className={`h-2 rounded-full transition-all duration-500 ${classes} ${width}`}></div>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                                <div className="flex gap-4 mt-6">
                                     <button onClick={() => setProcessingFiles([])} className="flex-1 px-4 py-2 bg-gray-700 font-semibold rounded-lg hover:bg-gray-600 transition-colors">Clear Queue</button>
                                     <div className="flex-1">
                                        <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={false} />
                                     </div>
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={false} />
                )}
                
                {currentTranscription && (
                    <div className="flex-grow min-h-[60vh] flex flex-col bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg p-6">
                        <TranscriptionView 
                            transcription={currentTranscription} 
                            onSave={() => {}} 
                            onUpdate={handleUpdateTranscription} 
                            t={t} 
                        />
                    </div>
                )}
            </div>
        );
      case 'AI Translator':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <AITranslator t={t} onTranslationComplete={(data) => handleAddToHistory('AI Translator', data)} />
            </div>
        );
      case 'Grammar Corrector':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <GrammarCorrector t={t} onCorrectionComplete={(data) => handleAddToHistory('Grammar Corrector', data)} />
            </div>
        );
       case 'Image Converter & OCR':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <ImageConverterOcr t={t} onAnalysisComplete={(data) => handleAddToHistory('Image Converter & OCR', data)}/>
            </div>
        );
      case 'PDF to Image':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <PdfToImage t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Image', data)} />
            </div>
        );
      case 'Image to PDF':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <ImageToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Image to PDF', data)}/>
            </div>
        );
      case 'PDF to Word':
         return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <PdfToWord t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Word', data)} />
            </div>
        );
      case 'Word to PDF':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <WordToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Word to PDF', data)} />
            </div>
        );
      case 'Export to Sheets':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <ExportToSheets t={t} />
            </div>
        );
      default:
        return <ComingSoon toolName={activeTool} />;
    }
  };

  return (
    <div className="bg-gray-900 text-white h-screen font-sans flex overflow-hidden">
      <Header 
        uiLanguage={uiLanguage} 
        setUiLanguage={setUiLanguage} 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        t={t}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentUser={currentUser}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
      />
      {isSidebarOpen && !isDesktop && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          aria-hidden="true"
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center justify-between p-4 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-20 h-16">
          <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ms-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              aria-label="Open menu"
          >
              <HamburgerIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">
            <span className="text-purple-400">Multi</span><span className="text-pink-500">Tools</span>
          </h1>
          {currentUser ? (
             <div className="p-1 bg-gray-700 rounded-full">
                <UserIcon className="w-6 h-6 text-purple-400"/>
              </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="p-1">
               <UserIcon className="w-6 h-6 text-gray-400" />
            </button>
          )}
        </div>
        <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto">
         {renderActiveTool()}
        </main>
      </div>
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        t={t}
      />
    </div>
  );
}

export default App;