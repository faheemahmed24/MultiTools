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
import { SkeletonLoader } from './components/Loader';

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
                {isTranslating && <SkeletonLoader lines={3} />}
                {error && <p className="text-red-400">{error}</p>}
                {!isTranslating && !error && <p className="text-gray-200 whitespace-pre-wrap">{translatedText}</p>}
            </div>
        </div>
    );
};

// Updated Tool Configuration with descriptions and stats for new design
const TOOLS_CONFIG = [
    { key: 'AI Transcriber', category: 'media', iconClass: 'fas fa-file-audio', description: 'Convert audio and video files to text with high accuracy using advanced AI transcription.', users: '12.5k', rating: 4.8 },
    { key: 'Image Converter & OCR', category: 'media', iconClass: 'fas fa-image', description: 'Convert images between formats and extract text using powerful OCR technology.', users: '18.2k', rating: 4.9 },
    { key: 'AI Translator', category: 'text', iconClass: 'fas fa-language', description: 'Translate text between 100+ languages with AI-powered accuracy and natural results.', users: '25.8k', rating: 4.7 },
    { key: 'Grammar Corrector', category: 'text', iconClass: 'fas fa-spell-check', description: 'Fix grammar, spelling, and style issues automatically.', users: '15.3k', rating: 4.6 },
    { key: 'Voice Generator', category: 'media', iconClass: 'fas fa-microphone', description: 'Convert text to natural-sounding speech with multiple voice options.', users: '15.3k', rating: 4.6 },
    { key: 'Video Editor', category: 'media', iconClass: 'fas fa-video', description: 'Edit and enhance videos with AI-powered tools, filters, and automated effects.', users: '9.7k', rating: 4.5 },
    { key: 'PDF to Image', category: 'productivity', iconClass: 'fas fa-file-pdf', description: 'Convert PDF pages into high-quality images.', users: '10.1k', rating: 4.5 },
    { key: 'Image to PDF', category: 'productivity', iconClass: 'fas fa-images', description: 'Combine multiple images into a single PDF document.', users: '12.4k', rating: 4.6 },
    { key: 'PDF to Word', category: 'productivity', iconClass: 'fas fa-file-word', description: 'Convert PDF documents to editable Word files.', users: '14.2k', rating: 4.7 },
    { key: 'Word to PDF', category: 'productivity', iconClass: 'fas fa-file-pdf', description: 'Convert Word documents to standardized PDF format.', users: '11.8k', rating: 4.7 },
    { key: 'Export to Sheets', category: 'data', iconClass: 'fas fa-table', description: 'Process data and export directly to spreadsheet formats.', users: '5.4k', rating: 4.4 },
    { key: 'Data Analyzer', category: 'data', iconClass: 'fas fa-chart-line', description: 'Analyze and visualize data with AI-powered insights and automated reporting.', users: '11.4k', rating: 4.7 },
    { key: 'Code Assistant', category: 'development', iconClass: 'fas fa-code', description: 'AI-powered code generation, debugging, and optimization for multiple programming languages.', users: '19.6k', rating: 4.9 }
];

function App() {
  const [uiLanguage, setUiLanguage] = useLocalStorage<Language>('uiLanguage', 'en');
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // 'Dashboard' means the main grid view.
  const [activeTool, setActiveTool] = useUserLocalStorage<string>(currentUser?.id, 'activeTool', 'Dashboard');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
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

  const [showAd, setShowAd] = useState(true);

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
    if (activeTool === 'Dashboard') setActiveTool('AI Transcriber');
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

  const handleUpdateTranscription = useCallback((id: string, updatedSegments: TranscriptionSegment[], summary?: string, sentiment?: string) => {
    setTranscriptions(prev => prev.map(t => t.id === id ? { ...t, segments: updatedSegments, summary, sentiment } : t));
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
    
    // History Renderers
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

    const renderPdfImageHistoryItem = (item: PdfImageHistoryItem) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-gray-200" title={item.fileName}>{item.fileName}</p>
             <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-400">{item.date}</p>
                <span className="bg-gray-600 text-purple-300 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {item.pageCount} pages
                </span>
            </div>
        </div>
    );

    const renderImagePdfHistoryItem = (item: ImagePdfHistoryItem) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-gray-200" title={item.fileName}>{item.fileName}</p>
             <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-400">{item.date}</p>
                <span className="bg-gray-600 text-purple-300 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {item.imageCount} images
                </span>
            </div>
        </div>
    );

    const renderFileHistoryItem = (item: PdfWordHistoryItem | WordPdfHistoryItem) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-gray-200" title={item.fileName}>{item.fileName}</p>
            <p className="text-xs text-gray-400 mt-1">{item.date}</p>
        </div>
    );

    let toolContent = <ComingSoon toolName={activeTool} />;

    switch (activeTool) {
      case 'AI Transcriber':
        toolContent = (
            <div className={`${mainContentClass} animate-fadeIn`}>
                {processingFiles.length > 0 ? (
                     <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg p-6 transform-gpu mb-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-200">Transcription Queue</h2>
                        <ul className="space-y-4">
                            {processingFiles.map(f => (
                                <li key={f.id} className="bg-gray-700/50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <p className="font-semibold truncate text-gray-200 flex-1">{f.file.name}</p>
                                        <span className="text-sm text-gray-400">{f.status}</span>
                                    </div>
                                    <div className="w-full bg-gray-600 rounded-full h-2">
                                         <div className={`h-2 rounded-full transition-all duration-500 ${f.status === 'processing' ? 'bg-purple-500 w-full animate-pulse' : f.status === 'done' ? 'bg-green-500 w-full' : f.status === 'error' ? 'bg-red-500 w-full' : 'bg-gray-500 w-[10%]'}`}></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                         {processingFiles.every(f => f.status === 'done' || f.status === 'error') && 
                            <button onClick={() => setProcessingFiles([])} className="w-full mt-6 px-4 py-2 bg-purple-600 font-semibold rounded-lg hover:bg-purple-700 transition-colors">Clear Completed</button>
                         }
                    </div>
                ) : (
                    <div className="mb-6">
                        <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={false} />
                    </div>
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
        break;
      case 'AI Translator':
        toolContent = (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <AITranslator t={t} onTranslationComplete={(data) => handleAddToHistory('AI Translator', data)} />
                 <div className={panelGridClass}>
                    <Panel title={t.history} defaultOpen={true} className="md:col-span-3">
                        <HistoryPanel items={translationHistory} onSelect={() => {}} onDelete={(id) => setTranslationHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderTranslationHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
        break;
      case 'Grammar Corrector':
        toolContent = (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <GrammarCorrector t={t} onCorrectionComplete={(data) => handleAddToHistory('Grammar Corrector', data)} />
                 <div className="mt-8">
                     <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={grammarHistory} onSelect={() => {}} onDelete={(id) => setGrammarHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderGrammarHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
        break;
       case 'Image Converter & OCR':
        toolContent = (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <ImageConverterOcr t={t} onAnalysisComplete={(data) => handleAddToHistory('Image Converter & OCR', data)}/>
                <div className="mt-8">
                     <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={analysisHistory} onSelect={() => {}} onDelete={(id) => setAnalysisHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderAnalysisHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
        break;
      case 'PDF to Image':
        toolContent = (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <PdfToImage t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Image', data)} />
                <div className="mt-8">
                    <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={pdfImageHistory} onSelect={() => {}} onDelete={(id) => setPdfImageHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderPdfImageHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
        break;
      case 'Image to PDF':
        toolContent = (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <ImageToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Image to PDF', data)}/>
                 <div className="mt-8">
                    <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={imagePdfHistory} onSelect={() => {}} onDelete={(id) => setImagePdfHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderImagePdfHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
        break;
      case 'PDF to Word':
         toolContent = (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <PdfToWord t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Word', data)} />
                 <div className="mt-8">
                    <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={pdfWordHistory} onSelect={() => {}} onDelete={(id) => setPdfWordHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderFileHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
        break;
      case 'Word to PDF':
        toolContent = (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <WordToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Word to PDF', data)} />
                 <div className="mt-8">
                    <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={wordPdfHistory} onSelect={() => {}} onDelete={(id) => setWordPdfHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderFileHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
        break;
      case 'Export to Sheets':
        toolContent = (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <ExportToSheets t={t} />
            </div>
        );
        break;
    }

    // Get icon for the current tool
    const currentToolConfig = TOOLS_CONFIG.find(tool => tool.key === activeTool);
    const iconClass = currentToolConfig ? currentToolConfig.iconClass : 'fas fa-tools';

    return (
        <div className="tool-container">
            <div className="tool-header">
                <div className="tool-icon-large">
                    <i className={iconClass}></i>
                </div>
                <div className="tool-title-section">
                    <h2>{activeTool}</h2>
                    <p>{currentToolConfig ? currentToolConfig.description : 'AI Powered Tool'}</p>
                </div>
                <button className="back-btn" onClick={() => setActiveTool('Dashboard')}>
                    <i className="fas fa-arrow-left"></i>
                    Back to Dashboard
                </button>
            </div>
            {toolContent}
        </div>
    );
  };

  const renderDashboard = () => (
      <div className="animate-fadeIn">
          {/* Advertisement */}
          {showAd && (
            <div className="advertisement">
                <div className="ad-content">
                    <i className="fas fa-crown ad-icon"></i>
                    <div>
                        <div className="ad-title">Upgrade to Pro</div>
                        <div className="ad-description">Unlock all premium features and unlimited processing</div>
                    </div>
                </div>
                <button className="ad-close" onClick={() => setShowAd(false)}>
                    <i className="fas fa-times"></i>
                </button>
            </div>
          )}
          
          {/* Categories */}
          <section className="categories">
            <div className="category-tabs">
                {['all', 'media', 'text', 'productivity', 'development', 'data'].map(cat => (
                    <button 
                        key={cat}
                        className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                        style={{textTransform: 'capitalize'}}
                    >
                        {cat === 'all' ? t.tools : cat}
                    </button>
                ))}
            </div>
          </section>

           {/* Quick Actions */}
            <section className="quick-actions">
                <h2 className="quick-actions-title">
                    <i className="fas fa-bolt"></i>
                    Quick Actions
                </h2>
                <div className="quick-actions-grid">
                    <button className="quick-action-btn" onClick={() => setActiveTool('AI Transcriber')}>
                        <i className="fas fa-upload"></i>
                        <span>{t.transcription}</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => setActiveTool('AI Translator')}>
                        <i className="fas fa-language"></i>
                        <span>{t.translate}</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => setActiveTool('Image Converter & OCR')}>
                        <i className="fas fa-image"></i>
                        <span>OCR</span>
                    </button>
                    <button className="quick-action-btn">
                        <i className="fas fa-cog"></i>
                        <span>Settings</span>
                    </button>
                </div>
            </section>

           {/* Tools Grid */}
            <section className="tools-grid">
                {TOOLS_CONFIG
                    .filter(tool => selectedCategory === 'all' || tool.category === selectedCategory)
                    .map(tool => {
                        // Find user-friendly name if available in t, else use key
                        let toolName = tool.key;
                        
                        if (tool.key === 'AI Transcriber') { toolName = t.aiTranscriber; }
                        else if (tool.key === 'AI Translator') { toolName = t.aiTranslatorTitle; }
                        else if (tool.key === 'Image Converter & OCR') { toolName = t.imageConverterOcrTitle; }
                        
                        return (
                            <div key={tool.key} className="tool-card" onClick={() => setActiveTool(tool.key)}>
                                <div className="tool-header">
                                    <div className="tool-icon">
                                        <i className={tool.iconClass}></i>
                                    </div>
                                    <div className="tool-info">
                                        <h3 className="tool-name">{toolName}</h3>
                                        <span className="tool-category">{tool.category}</span>
                                    </div>
                                </div>
                                <p className="tool-description">{tool.description}</p>
                                <div className="tool-stats">
                                    <span className="tool-stat">
                                        <i className="fas fa-users"></i>
                                        {tool.users} users
                                    </span>
                                    <span className="tool-stat">
                                        <i className="fas fa-star"></i>
                                        {tool.rating}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
            </section>

            {/* Recent Activity */}
            <section className="recent-activity">
                <h2 className="recent-activity-title">
                    <i className="fas fa-clock"></i>
                    Recent Activity
                </h2>
                <div className="activity-list">
                    {transcriptions.length > 0 ? (
                         transcriptions.slice(0, 3).map((item, idx) => (
                            <div className="activity-item" key={idx}>
                                <div className="activity-icon">
                                    <i className="fas fa-file-audio"></i>
                                </div>
                                <div className="activity-details">
                                    <div className="activity-title">{item.fileName}</div>
                                    <div className="activity-time">{item.date}</div>
                                </div>
                                <span className="activity-status status-completed">Saved</span>
                            </div>
                         ))
                    ) : (
                        <p className="text-gray-500 text-center p-4">{t.noHistory}</p>
                    )}
                </div>
            </section>
      </div>
  );

  return (
    <>
      <Header 
        uiLanguage={uiLanguage} 
        setUiLanguage={setUiLanguage} 
        activeTool={activeTool} 
        setActiveTool={setActiveTool}
        t={t}
        currentUser={currentUser}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
      />
      
      <main className="main-container">
        {activeTool === 'Dashboard' ? renderDashboard() : renderActiveTool()}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
            <div className="footer-links">
                <a href="#" className="footer-link">About</a>
                <a href="#" className="footer-link">Privacy Policy</a>
                <a href="#" className="footer-link">Terms of Service</a>
                <a href="#" className="footer-link">Contact</a>
                <a href="#" className="footer-link">API</a>
            </div>
            <p className="footer-text">© 2024 MultiTools. All rights reserved.</p>
        </div>
      </footer>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess}
        t={t}
      />
    </>
  );
}

export default App;