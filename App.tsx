import React, { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getTranslations } from './lib/i18n';
import type { Language, Transcription, TranscriptionSegment } from './types';
import { transcribeAudio } from './services/geminiService';

import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import HistoryPanel from './components/HistoryPanel';
import Loader from './components/Loader';
import ComingSoon from './components/ComingSoon';
import AITranslator from './components/AITranslator';
import ImageAnalyzer from './components/ImageAnalyzer';

function App() {
  const [uiLanguage, setUiLanguage] = useLocalStorage<Language>('uiLanguage', 'en');
  const [activeTool, setActiveTool] = useLocalStorage<string>('activeTool', 'AI Transcriber');
  
  const [transcriptions, setTranscriptions] = useLocalStorage<Transcription[]>('transcriptions', []);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useLocalStorage<string | null>('currentTranscriptionId', null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useMemo(() => getTranslations(uiLanguage), [uiLanguage]);

  const currentTranscription = useMemo(() => {
    if (!currentTranscriptionId) return null;
    return transcriptions.find(t => t.id === currentTranscriptionId) || null;
  }, [transcriptions, currentTranscriptionId]);
  
  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const newTranscriptionData = await transcribeAudio(file);
      const newTranscription: Transcription = {
        ...newTranscriptionData,
        id: new Date().toISOString(),
        date: new Date().toLocaleDateString(uiLanguage, { year: 'numeric', month: 'long', day: 'numeric' }),
      };
      setTranscriptions(prev => [newTranscription, ...prev]);
      setCurrentTranscriptionId(newTranscription.id);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during transcription.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
        if (isLoading) {
          return <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center justify-center min-h-[60vh] lg:h-full"><Loader t={t} /></div>;
        }
        if (error) {
          return (
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 text-center min-h-[60vh] lg:h-full flex flex-col items-center justify-center">
              <h3 className="text-red-400 text-lg font-semibold">An Error Occurred</h3>
              <p className="text-gray-400 mt-2">{error}</p>
              <button
                onClick={() => { setError(null); setCurrentTranscriptionId(null); }}
                className="mt-4 px-4 py-2 bg-purple-600 rounded-lg"
              >
                Try Again
              </button>
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
        return <FileUpload onFileSelect={handleFileSelect} t={t} isLoading={isLoading} />;
      case 'AI Translator':
        return <AITranslator t={t} />;
      case 'Image Analyzer':
        return <ImageAnalyzer t={t} />;
      default:
        return <ComingSoon toolName={activeTool} />;
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Header 
        uiLanguage={uiLanguage} 
        setUiLanguage={setUiLanguage} 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        t={t}
      />
      <main className="container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {renderActiveTool()}
          </div>
          <div>
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