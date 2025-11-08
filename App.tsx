import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Language, Transcription, TranscriptionSegment } from './types';
import { translations } from './lib/i18n';
import { transcribeAudio } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import HistoryPanel from './components/HistoryPanel';
import Loader from './components/Loader';

export type SortByType = 'newest' | 'oldest' | 'name';
export type StatusType = 'idle' | 'reading' | 'transcribing';

const App: React.FC = () => {
  const [uiLanguage, setUiLanguage] = useState<Language>('en');
  const [transcriptions, setTranscriptions] = useLocalStorage<Transcription[]>('transcriptions', []);
  const [activeTranscription, setActiveTranscription] = useState<Transcription | null>(null);
  const [status, setStatus] = useState<StatusType>('idle');
  const [error, setError] = useState<string | null>(null);
  const [processingFile, setProcessingFile] = useState<File | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const [sortBy, setSortBy] = useState<SortByType>('newest');

  useEffect(() => {
    const dir = uiLanguage === 'ar' || uiLanguage === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);

  const t = translations[uiLanguage];

  const handleFileTranscribe = async (file: File) => {
    setStatus('reading');
    setError(null);
    setActiveTranscription(null);
    setProcessingFile(file);
    setProgressStep(0);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        setStatus('transcribing');
        setProgressStep(1);
        
        // Simulate analysis steps for better UX
        setTimeout(() => setProgressStep(2), 800);
        setTimeout(() => setProgressStep(3), 2000);

        const base64String = (reader.result as string).split(',')[1];
        if (!base64String) {
          throw new Error("Failed to read file.");
        }

        const { detectedLanguage, segments } = await transcribeAudio(base64String, file.type);
        
        setProgressStep(4);

        const newTranscription: Transcription = {
          id: new Date().toISOString(),
          fileName: file.name,
          date: new Date().toLocaleString(),
          detectedLanguage,
          segments,
        };

        setTimeout(() => {
            setActiveTranscription(newTranscription);
            setStatus('idle');
            setProcessingFile(null);
            setProgressStep(5);
        }, 500);
      };
      reader.onerror = () => {
        setStatus('idle');
        setProcessingFile(null);
        throw new Error("Error reading file.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during transcription.');
      setStatus('idle');
      setProcessingFile(null);
    }
  };

  const handleCancel = () => {
      setStatus('idle');
      setProcessingFile(null);
      setError(null);
  };
  
  const handleSaveTranscription = useCallback(() => {
    if (activeTranscription && !transcriptions.some(t => t.id === activeTranscription.id)) {
      setTranscriptions([activeTranscription, ...transcriptions]);
    }
  }, [activeTranscription, transcriptions, setTranscriptions]);

  const handleUpdateTranscription = (id: string, updatedSegments: TranscriptionSegment[]) => {
    const updatedTranscription = { ...activeTranscription!, segments: updatedSegments };
    setActiveTranscription(updatedTranscription);
    
    // Update history as well
    const historyIndex = transcriptions.findIndex(t => t.id === id);
    if (historyIndex > -1) {
      const newTranscriptions = [...transcriptions];
      newTranscriptions[historyIndex] = updatedTranscription;
      setTranscriptions(newTranscriptions);
    }
  };
  
  const handleSelectHistory = (transcription: Transcription) => {
    setActiveTranscription(transcription);
  };
  
  const handleDeleteHistory = (id: string) => {
    setTranscriptions(transcriptions.filter(t => t.id !== id));
    if (activeTranscription?.id === id) {
      setActiveTranscription(null);
    }
  };

  const sortedTranscriptions = useMemo(() => {
    return [...transcriptions].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'name':
          return a.fileName.localeCompare(b.fileName);
        case 'newest':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [transcriptions, sortBy]);

  const isLoading = status !== 'idle';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header t={t} uiLanguage={uiLanguage} setUiLanguage={setUiLanguage} />
      <main className="flex-grow container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <FileUpload 
            onFileSelect={handleFileTranscribe}
            onCancel={handleCancel}
            t={t}
            status={status}
            fileName={processingFile?.name}
          />
          <HistoryPanel 
            transcriptions={sortedTranscriptions}
            onSelect={handleSelectHistory}
            onDelete={handleDeleteHistory}
            activeId={activeTranscription?.id}
            t={t}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </div>
        <div className="lg:col-span-2 bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col min-h-[60vh] lg:min-h-0">
          {status === 'transcribing' && <Loader t={t} step={progressStep} fileName={processingFile?.name || ''} />}
          {error && <div className="m-auto text-center text-red-400">
              <h3 className="text-xl font-bold">{t.errorTitle}</h3>
              <p>{error}</p>
            </div>}
          {!isLoading && !error && activeTranscription && (
            <TranscriptionView 
              transcription={activeTranscription}
              onSave={handleSaveTranscription}
              onUpdate={handleUpdateTranscription}
              t={t}
            />
          )}
          {!isLoading && !error && !activeTranscription && (
            <div className="m-auto text-center text-gray-400 px-4">
              <h3 className="text-3xl font-bold text-gray-100">{t.welcomeTitle}</h3>
              <p className="mt-4 max-w-prose mx-auto text-gray-300">{t.welcomeMessage}</p>
              <p className="mt-4 text-xs text-gray-500">{t.securityNote}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
