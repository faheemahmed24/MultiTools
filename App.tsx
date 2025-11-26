
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
import DataAnalyzer from './components/DataAnalyzer';
import CodeAssistant from './components/CodeAssistant';
import VoiceGenerator from './components/VoiceGenerator';
import AuthModal from './components/AuthModal';
import Panel from './components/Panel';
import { LanguageOption, targetLanguages } from './lib/languages';
import LanguageDropdown from './components/LanguageDropdown';
import { SkeletonLoader } from './components/Loader';
import AdUnit from './components/AdUnit';

interface ProcessingFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

const EmptyPanel: React.FC<{ message: string }> = ({ message }) => (
    <div className="h-full flex items-center justify-center text-center text-[var(--text-secondary)] p-4">
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
        <div className="flex flex-col h-full text-[var(--text-color)]">
            <div className="px-1 mb-2">
                <LanguageDropdown
                    languages={targetLanguages}
                    selectedLang={targetLang}
                    onSelectLang={setTargetLang}
                    title={t.targetLanguage}
                    searchPlaceholder="Search language"
                />
            </div>
            <div className="mt-2 p-4 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg flex-grow overflow-y-auto min-h-[150px] shadow-sm">
                {isTranslating && <SkeletonLoader lines={3} />}
                {error && <p className="text-red-500">{error}</p>}
                {!isTranslating && !error && <p className="whitespace-pre-wrap text-[var(--text-color)]">{translatedText}</p>}
            </div>
        </div>
    );
};

// Map of Tool Keys to their Display Info
const TOOLS_CONFIG = [
    { key: 'AI Transcriber', category: 'media', iconClass: 'fas fa-file-audio', description: 'Transcribe audio & video to text' },
    { key: 'Image Converter & OCR', category: 'media', iconClass: 'fas fa-image', description: 'Convert images and extract text' },
    { key: 'AI Translator', category: 'text', iconClass: 'fas fa-language', description: 'Translate text between languages' },
    { key: 'Grammar Corrector', category: 'text', iconClass: 'fas fa-spell-check', description: 'Fix grammar and improve writing' },
    { key: 'PDF to Image', category: 'productivity', iconClass: 'fas fa-file-pdf', description: 'Convert PDF pages to images' },
    { key: 'Image to PDF', category: 'productivity', iconClass: 'fas fa-images', description: 'Combine images into a PDF' },
    { key: 'PDF to Word', category: 'productivity', iconClass: 'fas fa-file-word', description: 'Convert PDF to editable Word' },
    { key: 'Word to PDF', category: 'productivity', iconClass: 'fas fa-file-pdf', description: 'Convert Word docs to PDF' },
    { key: 'Export to Sheets', category: 'data', iconClass: 'fas fa-table', description: 'Convert data for spreadsheets' },
    { key: 'Data Analyzer', category: 'data', iconClass: 'fas fa-chart-line', description: 'Analyze data patterns' },
    { key: 'Code Assistant', category: 'development', iconClass: 'fas fa-code', description: 'Help with coding tasks' },
    { key: 'Voice Generator', category: 'media', iconClass: 'fas fa-microphone', description: 'Generate speech from text' },
];

function App() {
  const showAd = true;
  const [uiLanguage, setUiLanguage] = useLocalStorage<Language>('uiLanguage', 'en');
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // 'Dashboard' means the main grid view.
  const [activeTool, setActiveTool] = useUserLocalStorage<string>(currentUser?.id, 'activeTool', 'Dashboard');
  const [selectedCategory, setSelectedCategory] = useState('tools'); // Default category matches prototype
  const [searchQuery, setSearchQuery] = useState(''); // New search state
  
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

  // Removed isSidebarOpen as we are moving to a top-nav/dashboard layout

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

    const mainContentClass = "flex flex-col gap-6";
    const panelGridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    
    // History Renderers (Updated Text Colors for Light Theme)
    const renderTranscriptionHistoryItem = (item: Transcription, isActive: boolean) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-[var(--text-color)]">{item.fileName}</p>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-[var(--text-secondary)]">{item.date}</p>
                <span className="bg-purple-100 text-purple-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {item.detectedLanguage}
                </span>
            </div>
        </div>
    );
    
    const renderTranslationHistoryItem = (item: TranslationHistoryItem, isActive: boolean) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-[var(--text-color)]" title={item.inputText}>{item.inputText}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{item.sourceLang} → {item.targetLang}</p>
        </div>
    );

    const renderGrammarHistoryItem = (item: GrammarHistoryItem, isActive: boolean) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-[var(--text-color)]" title={item.originalText}>{item.originalText}</p>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-[var(--text-secondary)]">{item.date}</p>
                <span className="bg-purple-100 text-purple-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {item.language}
                </span>
            </div>
        </div>
    );
    
    const renderAnalysisHistoryItem = (item: AnalysisHistoryItem, isActive: boolean) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-[var(--text-color)]" title={item.fileName}>{item.fileName}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{item.date}</p>
        </div>
    );

    const renderPdfImageHistoryItem = (item: PdfImageHistoryItem) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-[var(--text-color)]" title={item.fileName}>{item.fileName}</p>
             <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-[var(--text-secondary)]">{item.date}</p>
                <span className="bg-purple-100 text-purple-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {item.pageCount} pages
                </span>
            </div>
        </div>
    );

    const renderImagePdfHistoryItem = (item: ImagePdfHistoryItem) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-[var(--text-color)]" title={item.fileName}>{item.fileName}</p>
             <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-[var(--text-secondary)]">{item.date}</p>
                <span className="bg-purple-100 text-purple-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {item.imageCount} images
                </span>
            </div>
        </div>
    );

    const renderFileHistoryItem = (item: PdfWordHistoryItem | WordPdfHistoryItem) => (
        <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate text-[var(--text-color)]" title={item.fileName}>{item.fileName}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{item.date}</p>
        </div>
    );

    switch (activeTool) {
      case 'AI Transcriber':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                {processingFiles.length > 0 ? (
                     <div className="bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4 text-[var(--text-color)]">Transcription Queue</h2>
                        <ul className="space-y-4">
                            {processingFiles.map(f => (
                                <li key={f.id} className="bg-[var(--bg-color)] p-4 rounded-lg border border-[var(--border-color)]">
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <p className="font-semibold truncate text-[var(--text-color)] flex-1">{f.file.name}</p>
                                        <span className="text-sm text-[var(--text-secondary)]">{f.status}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                         <div className={`h-2 rounded-full transition-all duration-500 ${f.status === 'processing' ? 'bg-purple-500 w-full animate-pulse' : f.status === 'done' ? 'bg-green-500 w-full' : f.status === 'error' ? 'bg-red-500 w-full' : 'bg-gray-400 w-[10%]'}`}></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                         {processingFiles.every(f => f.status === 'done' || f.status === 'error') && 
                            <button onClick={() => setProcessingFiles([])} className="w-full mt-6 px-4 py-2 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:bg-[var(--hover-color)] transition-colors">Clear Completed</button>
                         }
                    </div>
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
                    <Panel title={t.history} defaultOpen={true} className="md:col-span-3">
                        <HistoryPanel items={translationHistory} onSelect={() => {}} onDelete={(id) => setTranslationHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderTranslationHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
      case 'Grammar Corrector':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <GrammarCorrector t={t} onCorrectionComplete={(data) => handleAddToHistory('Grammar Corrector', data)} />
                 <div className="mt-8">
                     <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={grammarHistory} onSelect={() => {}} onDelete={(id) => setGrammarHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderGrammarHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
       case 'Image Converter & OCR':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <ImageConverterOcr t={t} onAnalysisComplete={(data) => handleAddToHistory('Image Converter & OCR', data)}/>
                <div className="mt-8">
                     <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={analysisHistory} onSelect={() => {}} onDelete={(id) => setAnalysisHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderAnalysisHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
      case 'PDF to Image':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <PdfToImage t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Image', data)} />
                <div className="mt-8">
                    <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={pdfImageHistory} onSelect={() => {}} onDelete={(id) => setPdfImageHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderPdfImageHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
      case 'Image to PDF':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <ImageToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Image to PDF', data)}/>
                 <div className="mt-8">
                    <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={imagePdfHistory} onSelect={() => {}} onDelete={(id) => setImagePdfHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderImagePdfHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
      case 'PDF to Word':
         return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <PdfToWord t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Word', data)} />
                 <div className="mt-8">
                    <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={pdfWordHistory} onSelect={() => {}} onDelete={(id) => setPdfWordHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderFileHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
      case 'Word to PDF':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <WordToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Word to PDF', data)} />
                 <div className="mt-8">
                    <Panel title={t.history} defaultOpen={true}>
                        <HistoryPanel items={wordPdfHistory} onSelect={() => {}} onDelete={(id) => setWordPdfHistory(p => p.filter(i => i.id !== id))} t={t} renderItem={renderFileHistoryItem} />
                    </Panel>
                </div>
            </div>
        );
      case 'Export to Sheets':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <ExportToSheets t={t} />
            </div>
        );
      case 'Data Analyzer':
        return (
             <div className={`${mainContentClass} animate-fadeIn`}>
                <DataAnalyzer t={t} />
            </div>
        );
      case 'Code Assistant':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <CodeAssistant t={t} />
            </div>
        );
      case 'Voice Generator':
        return (
            <div className={`${mainContentClass} animate-fadeIn`}>
                <VoiceGenerator t={t} />
            </div>
        );
      case 'Dashboard':
          return null;
      default:
        return <ComingSoon toolName={activeTool} />;
    }
  };

  const renderDashboard = () => (
      <div className="animate-fadeIn w-full">
          {/* Categories */}
          <div className="flex gap-4 mb-6 flex-wrap">
            {[
                { id: 'tools', label: t.tools },
                { id: 'media', label: 'Media' },
                { id: 'text', label: 'Text' },
                { id: 'productivity', label: 'Productivity' },
                { id: 'development', label: 'Development' },
                { id: 'data', label: 'Data' }
            ].map(cat => (
                <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-6 py-3 rounded-full font-medium transition-all duration-300 border relative overflow-hidden group 
                        ${selectedCategory === cat.id 
                            ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-md' 
                            : 'bg-[var(--secondary-bg)] text-[var(--text-color)] border-[var(--border-color)] hover:-translate-y-0.5 hover:shadow-sm'
                        }`}
                >
                    <span className="capitalize relative z-10">{cat.label}</span>
                </button>
            ))}
          </div>

           {/* Tools Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-8">
                {TOOLS_CONFIG
                    .filter(tool => {
                        const matchesCategory = selectedCategory === 'tools' || tool.category === selectedCategory;
                        const matchesSearch = tool.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            (tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase()));
                        return matchesCategory && matchesSearch;
                    })
                    .map((tool, index) => {
                        return (
                            <div 
                                key={tool.key} 
                                className="bg-[var(--secondary-bg)] rounded-xl p-5 text-center transition-all duration-300 cursor-pointer border border-[var(--border-color)] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] hover:border-[var(--primary-color)] animate-fadeIn"
                                onClick={() => setActiveTool(tool.key)}
                                style={{ animationDelay: `${index * 0.03}s` }}
                            >
                                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[rgba(124,58,237,0.05)] rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                                <i className={`${tool.iconClass} text-4xl text-[var(--primary-color)] mb-3 transition-transform duration-300 group-hover:scale-110`}></i>
                                <h3 className="mb-1.5 text-base font-bold text-[var(--text-color)]">{tool.key}</h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-tight">{tool.description}</p>
                            </div>
                        );
                })}
                {TOOLS_CONFIG.filter(tool => {
                        const matchesCategory = selectedCategory === 'tools' || tool.category === selectedCategory;
                        const matchesSearch = tool.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            (tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase()));
                        return matchesCategory && matchesSearch;
                    }).length === 0 && (
                    <div className="col-span-full text-center py-12 text-[var(--text-secondary)]">
                        No tools found matching your criteria.
                    </div>
                )}
            </div>
            
           {/* Quick Actions */}
            <div className="flex justify-center flex-wrap gap-12 mt-8 p-8 bg-[var(--secondary-bg)] rounded-2xl shadow-[var(--shadow)] border border-[var(--border-color)]">
                 {[
                    { key: 'AI Transcriber', icon: 'fas fa-file-audio', label: t.transcription },
                    { key: 'AI Translator', icon: 'fas fa-language', label: t.translate },
                    { key: 'Image Converter & OCR', icon: 'fas fa-file-image', label: 'OCR' },
                    { key: 'Dashboard', icon: 'fas fa-cog', label: 'Settings' } // Dashboard essentially acts as home/settings here for now
                 ].map(action => (
                    <div 
                        key={action.key} 
                        className="flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 p-4 rounded-xl hover:-translate-y-1 hover:text-[var(--primary-color)] hover:bg-[var(--bg-color)]"
                        onClick={() => setActiveTool(action.key)}
                    >
                        <i className={`${action.icon} text-4xl transition-transform duration-300 hover:scale-110`}></i>
                        <span className="font-medium text-sm text-[var(--text-color)]">{action.label}</span>
                    </div>
                 ))}
            </div>
      </div>
  );

  return (
    <div className="bg-[var(--bg-color)] text-[var(--text-color)] min-h-screen font-sans flex flex-col">
      <Header 
        uiLanguage={uiLanguage} 
        setUiLanguage={setUiLanguage} 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        t={t}
        currentUser={currentUser}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <main className="flex-grow p-4 md:p-8 flex flex-col gap-8 max-w-[1400px] mx-auto w-full">
         {activeTool === 'Dashboard' ? renderDashboard() : (
            <div className="animate-fadeIn w-full">
                 <div className="mb-6 flex items-center gap-3">
                    <button onClick={() => setActiveTool('Dashboard')} className="text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors p-2 rounded-full hover:bg-[var(--secondary-bg)]">
                        <i className="fas fa-arrow-left text-lg"></i>
                    </button>
                    <h2 className="text-2xl font-bold text-[var(--text-color)]">{activeTool}</h2>
                 </div>
                 {renderActiveTool()}
            </div>
         )}
         {showAd && activeTool !== 'Dashboard' && <AdUnit className="mt-8" />}
      </main>

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
