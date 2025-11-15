import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUserLocalStorage } from './hooks/useUserLocalStorage';
import { getTranslations } from './lib/i18n';
import type { Language, TranslationSet, User, Transcription, TranscriptionSegment, TranslationHistoryItem, AnalysisHistoryItem, PdfImageHistoryItem, ImagePdfHistoryItem, PdfWordHistoryItem, WordPdfHistoryItem, GrammarHistoryItem } from './types';
import { transcribeAudio, translateText } from './services/geminiService';

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
import ExportToSheets from './components/ExportToSheets';
import AuthModal from './components/AuthModal';
import Panel from './components/Panel';
import { LanguageOption, targetLanguages } from './lib/languages';
import LanguageDropdown from './components/LanguageDropdown';
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

const EmptyPanel: React.FC<{ message: string }> = ({ message }) => (
    <div className="h-full flex items-center justify-center text-center text-gray-500 p-4">
        <p>{message}</p>
    </div>
);

const TranslationPanel: React.FC<{ text: string | null; t: TranslationSet }> = ({ text, t }) => {
    const [targetLang, setTargetLang] = useState<LanguageOption>(targetLanguages[0]);
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!text) {
            setTranslatedText('');
            setError('');
            return;
        }
        const doTranslate = async () => {
            setIsTranslating(true);
            setError('');
            try {
                const result = await translateText(text, 'auto', targetLang.name);
                setTranslatedText(result);
            } catch (err) {
                setError('Failed to translate.');
                console.error(err);
            } finally {
                setIsTranslating(false);
            }
        };
        doTranslate();
    }, [text, targetLang.name]);

    if (!text) {
        return <EmptyPanel message="No text to translate." />;
    }

    const SkeletonLoader = () => (
        <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="px-1">
                <LanguageDropdown
                    languages={targetLanguages}
                    selectedLang={targetLang}
                    onSelectLang={setTargetLang}
                    title={t.targetLanguage}
                    searchPlaceholder="Search language"
                />
            </div>
            <div className="mt-4 p-4 bg-gray-900/50 rounded-lg flex-grow overflow-y-auto min-h-[150px]">
                {isTranslating && <SkeletonLoader />}
                {error && <p className="text-red-400">{error}</p>}
                {!isTranslating && !error && <p className="text-gray-200 whitespace-pre-wrap">{translatedText}</p>}
            </div>
        </div>
    );
};


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
  
  // History States for all tools
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
      const isSupported = file.type.startsWith('audio/') || file.type.startsWith('video/');
      return {
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        status: isSupported ? 'pending' : 'error',
        error: isSupported ? undefined : 'Unsupported file type. Please upload audio or video.',
      };
    });
    setProcessingFiles(current => [...newFilesToProcess]);
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

  const handleDeleteTranscription = useCallback((id: string) => {
    setTranscriptions(prev => prev.filter(t => t.id !== id));
    if (currentTranscriptionId === id) {
      setCurrentTranscriptionId(null);
    }
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
    const fullText = currentTranscription?.segments.map(s => s.text).join('\n') || null;

    const mainContentClass = "flex flex-col";
    const panelGridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 min-h-0";
    
    const renderTranscriptionHistoryItem = (item: Transcription, isActive: boolean) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-gray-200">{item.fileName}</p>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-400">{item.date}</p>
                <span className="bg-gray-600 text-purple-300 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {item.detectedLanguage}
                </span>
            </div>
        </div>
    );
    
    const renderTranslationHistoryItem = (item: TranslationHistoryItem, isActive: boolean) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-gray-200" title={item.inputText}>{item.inputText}</p>
            <p className="text-sm text-gray-400 mt-1">{item.sourceLang} → {item.targetLang}</p>
        </div>
    );

    const renderGrammarHistoryItem = (item: GrammarHistoryItem, isActive: boolean) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-gray-200" title={item.originalText}>{item.originalText}</p>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-400">{item.date}</p>
                <span className="bg-gray-600 text-purple-300 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {item.language}
                </span>
            </div>
        </div>
    );
    
    const renderAnalysisHistoryItem = (item: AnalysisHistoryItem, isActive: boolean) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-gray-200" title={item.fileName}>{item.fileName}</p>
            <p className="text-sm text-gray-400 mt-1">{item.date}</p>
        </div>
    );

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
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg p-6 transform-gpu">
                                <h2 className="text-xl font-bold mb-4 text-gray-200">Transcription Queue</h2>
                                <ul className="space-y-4">
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
                                {allDone && <button onClick={() => setProcessingFiles([])} className="w-full mt-6 px-4 py-2 bg-purple-600 font-semibold rounded-lg hover:bg-purple-700 transition-colors">Clear Completed</button>}
                            </div>
                        );
                    })()
                ) : (
                    <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={false} />
                )}
                <div className={panelGridClass}>
                    <Panel title={t.transcription} defaultOpen={true} className="md:col-span-2 lg:col-span-1">
                        {currentTranscription ? <TranscriptionView transcription={currentTranscription} onSave={() => {}} onUpdate={handleUpdateTranscription} t={t} /> : <EmptyPanel message="No transcription selected or available." />}
                    </Panel>
                    <Panel title={t.aiTranslatorTitle} defaultOpen={true}>
                        <TranslationPanel text={fullText} t={t} />
                    </Panel>
                    <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={transcriptions} onSelect={handleSelectTranscription} onDelete={handleDeleteTranscription} activeId={currentTranscription?.id} t={t} renderItem={renderTranscriptionHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
      case 'AI Translator':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <AITranslator t={t} onTranslationComplete={(data) => handleAddToHistory('AI Translator', data)} />
                 <div className={panelGridClass}>
                    <Panel title={t.translationResult} defaultOpen={true} className="md:col-span-2 lg:col-span-1">
                        <EmptyPanel message="Result is shown in the main tool above." />
                    </Panel>
                    <Panel title="Further Translation" defaultOpen={true}>
                        <EmptyPanel message="Not applicable for this tool." />
                    </Panel>
                    <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={translationHistory} onSelect={() => {}} onDelete={(id) => setTranslationHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderTranslationHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
      case 'Grammar Corrector':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <GrammarCorrector t={t} onCorrectionComplete={(data) => handleAddToHistory('Grammar Corrector', data)} />
                 <div className={panelGridClass}>
                    <Panel title={t.grammarResult} defaultOpen={true} className="md:col-span-2 lg:col-span-1">
                        <EmptyPanel message="Result is shown in the main tool above." />
                    </Panel>
                    <Panel title={t.history} defaultOpen={true} className="md:col-span-2 lg:col-span-2">
                        <HistoryPanel items={grammarHistory} onSelect={() => {}} onDelete={(id) => setGrammarHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderGrammarHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
       case 'Image Converter & OCR':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <ImageConverterOcr t={t} onAnalysisComplete={(data) => handleAddToHistory('Image Converter & OCR', data)}/>
                <div className="mt-8 flex flex-col gap-6">
                    <Panel title={t.imageAnalysisResult} defaultOpen={true}>
                         <EmptyPanel message="Analysis results will appear in the main tool above once an image is processed." />
                    </Panel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Panel title={t.translationResult} defaultOpen={true}>
                             <EmptyPanel message="Translation will appear in the main tool above." />
                        </Panel>
                        <Panel title={t.history} defaultOpen={true}>
                            <HistoryPanel items={analysisHistory} onSelect={() => {}} onDelete={(id) => setAnalysisHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderAnalysisHistoryItem} />
                        </Panel>
                    </div>
                </div>
            </div>
        );
      case 'PDF to Image':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <PdfToImage t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Image', data)} />
                <div className={panelGridClass}>
                    <Panel title="Result" defaultOpen={true} className="md:col-span-2 lg:col-span-1"><EmptyPanel message="Converted images will appear in the tool above." /></Panel>
                    <Panel title="Translation" defaultOpen={true}><EmptyPanel message="Not applicable for this tool." /></Panel>
                    <Panel title="History" defaultOpen={true}><EmptyPanel message="History coming soon for this tool." /></Panel>
                </div>
            </div>
        );
      case 'Image to PDF':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <ImageToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Image to PDF', data)}/>
                 <div className={panelGridClass}>
                    <Panel title="Result" defaultOpen={true} className="md:col-span-2 lg:col-span-1"><EmptyPanel message="The PDF download link will appear in the tool above." /></Panel>
                    <Panel title="Translation" defaultOpen={true}><EmptyPanel message="Not applicable for this tool." /></Panel>
                    <Panel title="History" defaultOpen={true}><EmptyPanel message="History coming soon for this tool." /></Panel>
                </div>
            </div>
        );
      case 'PDF to Word':
         return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <PdfToWord t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Word', data)} />
                 <div className={panelGridClass}>
                    <Panel title="Result" defaultOpen={true} className="md:col-span-2 lg:col-span-1"><EmptyPanel message="The document download link will appear in the tool above." /></Panel>
                    <Panel title="Translation" defaultOpen={true}><EmptyPanel message="Translation feature coming soon." /></Panel>
                    <Panel title="History" defaultOpen={true}><EmptyPanel message="History coming soon for this tool." /></Panel>
                </div>
            </div>
        );
      case 'Word to PDF':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <WordToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Word to PDF', data)} />
                 <div className={panelGridClass}>
                    <Panel title="Result" defaultOpen={true} className="md:col-span-2 lg:col-span-1"><EmptyPanel message="The PDF download link will appear in the tool above." /></Panel>
                    <Panel title="Translation" defaultOpen={true}><EmptyPanel message="Not applicable for this tool." /></Panel>
                    <Panel title="History" defaultOpen={true}><EmptyPanel message="History coming soon for this tool." /></Panel>
                </div>
            </div>
        );
      case 'Export to Sheets':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <ExportToSheets t={t} />
                 <div className={panelGridClass}>
                    <Panel title="Result" defaultOpen={true} className="md:col-span-2 lg:col-span-3">
                        <EmptyPanel message="The CSV file will be downloaded directly to your device." />
                    </Panel>
                </div>
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
