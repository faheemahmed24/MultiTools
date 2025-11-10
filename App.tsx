import React, { useState, useEffect, useCallback } from 'react';
import type { Language, Transcription, TranscriptionSegment } from './types';
import { translations } from './lib/i18n';
import { transcribeAudio } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import HistoryPanel from './components/HistoryPanel';
import Loader from './components/Loader';
import ComingSoon from './components/ComingSoon';
import AITranslator from './components/AITranslator';

const App: React.FC = () => {
  const [uiLanguage, setUiLanguage] = useState<Language>('en');
  const [activeTool, setActiveTool] = useState<string>('AI Transcriber');
  const [transcriptions, setTranscriptions] = useLocalStorage<Transcription[]>('transcriptions', []);
  const [activeTranscription, setActiveTranscription] = useState<Transcription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dir = uiLanguage === 'ar' || uiLanguage === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);

  const t = translations[uiLanguage];

  const handleFileTranscribe = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setActiveTranscription(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        if (!base64String) {
          throw new Error("Failed to read file.");
        }

        const { detectedLanguage, segments } = await transcribeAudio(base64String, file.type);
        
        const newTranscription: Transcription = {
          id: new Date().toISOString(),
          fileName: file.name,
          date: new Date().toLocaleString(),
          detectedLanguage,
          segments,
        };
        setActiveTranscription(newTranscription);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setIsLoading(false);
        throw new Error("Error reading file.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during transcription.');
      setIsLoading(false);
    }
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
  
  const renderActiveTool = () => {
    switch (activeTool) {
      case 'AI Transcriber':
        return (
          <>
            <div className="lg:col-span-1 flex flex-col gap-6">
              <FileUpload onFileSelect={handleFileTranscribe} t={t} isLoading={isLoading} />
              <HistoryPanel 
                transcriptions={transcriptions}
                onSelect={handleSelectHistory}
                onDelete={handleDeleteHistory}
                activeId={activeTranscription?.id}
                t={t}
              />
            </div>
            <div className="lg:col-span-2 bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col min-h-[60vh] lg:min-h-0">
              {isLoading && <Loader t={t} />}
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
                <div className="m-auto text-center text-gray-400">
                  <h3 className="text-2xl font-semibold">{t.welcomeTitle}</h3>
                  <p className="mt-2 max-w-prose mx-auto">{t.welcomeMessage}</p>
                  <p className="mt-4 text-xs text-gray-500">{t.securityNote}</p>
                </div>
              )}
            </div>
          </>
        );
      case 'AI Translator':
        return (
            <div className="lg:col-span-3">
                <AITranslator />
            </div>
        );
      default:
        return (
          <div className="lg:col-span-3">
            <ComingSoon toolName={activeTool} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header 
        uiLanguage={uiLanguage} 
        setUiLanguage={setUiLanguage}
        activeTool={activeTool}
        setActiveTool={setActiveTool} 
      />
      <main className="flex-grow container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {renderActiveTool()}
      </main>
    </div>
  );
};

export default App;