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

interface ProcessingFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const renderToolContent = () => {
    switch (activeTool) {
      case 'AI Transcriber':
        return (
          <div>
            <div className="mb-6">
                <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={processingFiles.some(f => f.status === 'processing')} />
            </div>
            {currentTranscription ? (
              <TranscriptionView 
                transcription={currentTranscription} 
                onSave={() => {}} 
                onUpdate={handleUpdateTranscription} 
                t={t} 
              />
            ) : (
                <div className="text-center py-10 text-gray-500">Upload a file to start transcribing.</div>
            )}
          </div>
        );
      case 'AI Translator':
        return <AITranslator t={t} onTranslationComplete={(data) => handleAddToHistory('AI Translator', data)} />;
      case 'Grammar Corrector':
        return <GrammarCorrector t={t} onCorrectionComplete={(data) => handleAddToHistory('Grammar Corrector', data)} />;
      case 'Image Converter & OCR':
        return <ImageConverterOcr t={t} onAnalysisComplete={(data) => handleAddToHistory('Image Converter & OCR', data)} />;
      case 'PDF to Image':
        return <PdfToImage t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Image', data)} />;
      case 'Image to PDF':
        return <ImageToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Image to PDF', data)} />;
      case 'PDF to Word':
        return <PdfToWord t={t} onConversionComplete={(data) => handleAddToHistory('PDF to Word', data)} />;
      case 'Word to PDF':
        return <WordToPdf t={t} onConversionComplete={(data) => handleAddToHistory('Word to PDF', data)} />;
      case 'Export to Sheets':
        return <ExportToSheets t={t} />;
      case 'Voice Generator':
      case 'Video Editor':
      case 'Data Analyzer':
      case 'Code Assistant':
        return <ComingSoon toolName={activeTool} />;
      default:
        return <div>Tool not found</div>;
    }
  };

  const getRecentActivity = () => {
      const allActivity = [
          ...transcriptions.map(item => ({ 
              id: item.id, 
              title: `Transcription: ${item.fileName}`, 
              time: item.date, 
              status: 'Completed', 
              icon: 'fa-file-audio',
              tool: 'AI Transcriber'
          })),
          ...translationHistory.map(item => ({
              id: item.id,
              title: `Translated text (${item.sourceLang} -> ${item.targetLang})`,
              time: item.date,
              status: 'Completed',
              icon: 'fa-language',
              tool: 'AI Translator'
          })),
          ...grammarHistory.map(item => ({
              id: item.id,
              title: `Grammar Correction (${item.language})`,
              time: item.date,
              status: 'Completed',
              icon: 'fa-spell-check',
              tool: 'Grammar Corrector'
          }))
      ];
      // Sort by date/id (assuming newer ids are larger strings or we trust date string if mostly same day)
      // For simplicity, just taking slice of mixed array. In real app, use proper timestamps.
      return allActivity.slice(0, 5);
  };

  const filteredTools = TOOLS_CONFIG.filter(tool => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const matchesSearch = tool.key.toLowerCase().includes(searchQuery.toLowerCase()) || tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
  });

  const activeToolConfig = TOOLS_CONFIG.find(t => t.key === activeTool);

  const renderDashboard = () => (
      <>
        {showAd && (
            <div className="advertisement">
                <div className="ad-content">
                    <i className="fas fa-crown ad-icon"></i>
                    <div>
                        <div className="ad-title">{t.upgradeToPro || "Upgrade to Pro"}</div>
                        <div className="ad-description">{t.unlockPremium || "Unlock all premium features and unlimited processing"}</div>
                    </div>
                </div>
                <button className="ad-close" onClick={() => setShowAd(false)}>
                    <i className="fas fa-times"></i>
                </button>
            </div>
        )}

        <section className="categories">
            <div className="category-tabs">
                <button className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>All Tools</button>
                <button className={`category-tab ${selectedCategory === 'media' ? 'active' : ''}`} onClick={() => setSelectedCategory('media')}>Media</button>
                <button className={`category-tab ${selectedCategory === 'text' ? 'active' : ''}`} onClick={() => setSelectedCategory('text')}>Text & Language</button>
                <button className={`category-tab ${selectedCategory === 'productivity' ? 'active' : ''}`} onClick={() => setSelectedCategory('productivity')}>Productivity</button>
                <button className={`category-tab ${selectedCategory === 'development' ? 'active' : ''}`} onClick={() => setSelectedCategory('development')}>Development</button>
                <button className={`category-tab ${selectedCategory === 'data' ? 'active' : ''}`} onClick={() => setSelectedCategory('data')}>Data & Analytics</button>
            </div>
        </section>

        <section className="quick-actions">
            <h2 className="quick-actions-title">
                <i className="fas fa-bolt"></i>
                Quick Actions
            </h2>
            <div className="quick-actions-grid">
                <button className="quick-action-btn" onClick={() => setActiveTool('AI Transcriber')}>
                    <i className="fas fa-upload"></i>
                    <span>Upload Files</span>
                </button>
                <button className="quick-action-btn">
                    <i className="fas fa-history"></i>
                    <span>Recent Projects</span>
                </button>
                <button className="quick-action-btn">
                    <i className="fas fa-star"></i>
                    <span>Favorites</span>
                </button>
                <button className="quick-action-btn">
                    <i className="fas fa-cog"></i>
                    <span>Settings</span>
                </button>
            </div>
        </section>

        <section className="tools-grid">
            {filteredTools.map(tool => (
                <div key={tool.key} className="tool-card" onClick={() => setActiveTool(tool.key)}>
                    <div className="tool-header">
                        <div className="tool-icon">
                            <i className={tool.iconClass}></i>
                        </div>
                        <div className="tool-info">
                            <h3 className="tool-name">{tool.key}</h3>
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
            ))}
        </section>

        <section className="recent-activity">
            <h2 className="recent-activity-title">
                <i className="fas fa-clock"></i>
                {t.recentActivity || "Recent Activity"}
            </h2>
            <div className="activity-list">
                {getRecentActivity().length > 0 ? getRecentActivity().map((activity, idx) => (
                    <div key={idx} className="activity-item" onClick={() => setActiveTool(activity.tool)}>
                        <div className="activity-icon">
                            <i className={`fas ${activity.icon}`}></i>
                        </div>
                        <div className="activity-details">
                            <div className="activity-title">{activity.title}</div>
                            <div className="activity-time">{activity.time}</div>
                        </div>
                        <span className="activity-status status-completed">{activity.status}</span>
                    </div>
                )) : (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
            </div>
        </section>
      </>
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
        onSearch={setSearchQuery}
      />
      
      <main className="main-container">
        {activeTool === 'Dashboard' ? renderDashboard() : (
            <div className="page-view active">
                <div className="tool-container">
                    <div className="tool-header">
                        <div className="tool-icon-large">
                            <i className={activeToolConfig?.iconClass || 'fas fa-tools'}></i>
                        </div>
                        <div className="tool-title-section">
                            <h2>{activeToolConfig?.key}</h2>
                            <p>{activeToolConfig?.description}</p>
                        </div>
                        <button className="back-btn" onClick={() => setActiveTool('Dashboard')}>
                            <i className="fas fa-arrow-left"></i>
                            Back to Dashboard
                        </button>
                    </div>
                    
                    {renderToolContent()}
                </div>
            </div>
        )}
      </main>

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