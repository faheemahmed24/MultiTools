import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getTranslations } from './lib/i18n';
import type { Language, Transcription, TranscriptionSegment } from './types';
import { transcribeAudio } from './services/geminiService';

import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import HistoryPanel from './components/HistoryPanel';
import ComingSoon from './components/ComingSoon';
import AITranslator from './components/AITranslator';
import ImageAnalyzer from './components/ImageAnalyzer';
import PdfToImage from './components/PdfToImage';
import ImageToPdf from './components/ImageToPdf';
import PdfToWord from './components/PdfToWord';
import WordToPdf from './components/WordToPdf';
import { ClockIcon } from './components/icons/ClockIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { XCircleIcon } from './components/icons/XCircleIcon';

interface ProcessingFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

function App() {
  const [uiLanguage, setUiLanguage] = useLocalStorage<Language>('uiLanguage', 'en');
  const [activeTool, setActiveTool] = useLocalStorage<string>('activeTool', 'AI Transcriber');
  
  const [transcriptions, setTranscriptions] = useLocalStorage<Transcription[]>('transcriptions', []);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useLocalStorage<string | null>('currentTranscriptionId', null);
  
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage<boolean>('isSidebarOpen', true);

  const t = useMemo(() => getTranslations(uiLanguage), [uiLanguage]);

  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    if (uiLanguage === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [uiLanguage]);

  const currentTranscription = useMemo(() => {
    if (!currentTranscriptionId) return null;
    return transcriptions.find(t => t.id === currentTranscriptionId) || null;
  }, [transcriptions, currentTranscriptionId]);
  
  const handleFilesSelect = (files: File[]) => {
    const newFilesToProcess: ProcessingFile[] = files.map(file => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        status: 'pending',
    }));
    setProcessingFiles(current => [...current, ...newFilesToProcess]);
    setActiveTool('AI Transcriber');
  };

  useEffect(() => {
    const isProcessing = processingFiles.some(f => f.status === 'processing');
    if (isProcessing) {
      return; // A file is already being processed
    }

    const fileToProcess = processingFiles.find(f => f.status === 'pending');
    if (!fileToProcess) {
      return; // No pending files
    }

    const processFile = async () => {
      // Set file to processing
      setProcessingFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'processing' } : f));
      
      try {
        const newTranscriptionData = await transcribeAudio(fileToProcess.file);
        const newTranscription: Transcription = {
          ...newTranscriptionData,
          id: new Date().toISOString() + Math.random(),
          date: new Date().toLocaleDateString(uiLanguage, { year: 'numeric', month: 'long', day: 'numeric' }),
        };
        setTranscriptions(prev => [newTranscription, ...prev]);
        
        // Set file to done
        setProcessingFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'done' } : f));
      } catch (err: any) {
        // Set file to error
        setProcessingFiles(prev => prev.map(f => (
          f.id === fileToProcess.id 
            ? { ...f, status: 'error', error: err.message || 'An unexpected error occurred.' } 
            : f
        )));
      }
    };
    
    processFile();
  }, [processingFiles, setTranscriptions, uiLanguage]);


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

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'AI Transcriber':
        if (processingFiles.length > 0) {
            const allDone = processingFiles.every(f => f.status === 'done' || f.status === 'error');

            const StatusIndicator = ({ status }: { status: ProcessingFile['status'] }) => {
                if (status === 'pending') {
                    return <div className="flex items-center gap-2 text-gray-400"><ClockIcon className="w-5 h-5" /><span>Pending</span></div>;
                }
                if (status === 'processing') {
                    return <div className="flex items-center gap-2 text-purple-400"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div><span>Processing...</span></div>;
                }
                if (status === 'done') {
                    return <div className="flex items-center gap-2 text-green-400"><CheckCircleIcon className="w-5 h-5" /><span>Done</span></div>;
                }
                if (status === 'error') {
                    return <div className="flex items-center gap-2 text-red-400"><XCircleIcon className="w-5 h-5" /><span>Error</span></div>;
                }
                return null;
            };

            return (
                <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] lg:h-full flex flex-col">
                    <h2 className="text-xl font-bold mb-4 text-gray-200">Transcription Queue</h2>
                    <div className="flex-grow overflow-y-auto -me-3 pe-3">
                        <ul className="space-y-3">
                            {processingFiles.map(f => (
                                <li key={f.id} className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between gap-4">
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold truncate text-gray-200" title={f.file.name}>{f.file.name}</p>
                                        {f.status === 'error' && <p className="text-xs text-red-400 mt-1 truncate" title={f.error}>{f.error}</p>}
                                    </div>
                                    <div className="flex-shrink-0">
                                        <StatusIndicator status={f.status} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {allDone && (
                        <button
                            onClick={() => setProcessingFiles([])}
                            className="w-full mt-6 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Acknowledge & Clear
                        </button>
                    )}
                </div>
            );
        }
        if (currentTranscription) {
          return (
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
              <TranscriptionView 
                transcription={currentTranscription} 
                onSave={() => { /* Could implement a persistent save here */ }} 
                onUpdate={handleUpdateTranscription} 
                t={t} 
              />
            </div>
          );
        }
        return <FileUpload onFilesSelect={handleFilesSelect} t={t} isProcessing={processingFiles.length > 0} />;
      case 'AI Translator':
        return <AITranslator t={t} />;
      case 'Image Analyzer':
        return <ImageAnalyzer t={t} />;
      case 'PDF to Image':
        return <PdfToImage t={t} />;
      case 'Image to PDF':
        return <ImageToPdf t={t} />;
      case 'PDF to Word':
        return <PdfToWord t={t} />;
      case 'Word to PDF':
        return <WordToPdf t={t} />;
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
      />
      <main className="flex-grow p-4 md:p-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="lg:col-span-2 flex flex-col">
            {renderActiveTool()}
          </div>
          <div className="flex flex-col">
            <HistoryPanel 
              transcriptions={transcriptions.filter(t => t.fileName)} // Only show transcription history
              onSelect={handleSelectTranscription} 
              onDelete={handleDeleteTranscription}
              activeId={currentTranscription?.id}
              t={t} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;