import React, { useState, useCallback, useMemo } from 'react';
import type { TranslationSet, HistoryItem, TranscriptionSegment, TranscriptionData } from '../types';
import { transcribeAudio } from '../services/geminiService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import FileUpload from './FileUpload';
import TranscriptionView, { type Transcription } from './TranscriptionView';
import HistoryPanel from './HistoryPanel';
import Loader from './Loader';

interface TranscriberToolProps {
  t: TranslationSet;
}

const TranscriberTool: React.FC<TranscriberToolProps> = ({ t }) => {
  const [historyItems, setHistoryItems] = useLocalStorage<HistoryItem[]>('multiToolsHistory', []);
  const [activeTranscription, setActiveTranscription] = useState<Transcription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter global history for items relevant to this tool
  const transcriberHistory = useMemo(() => {
    return historyItems.filter(item => item.tool === 'transcriber');
  }, [historyItems]);
  
  // Helper to convert HistoryItem to the flat Transcription object for the view
  const toTranscription = (item: HistoryItem): Transcription | null => {
    if (item.tool !== 'transcriber') return null;
    const data = item.data as TranscriptionData;
    return {
      id: item.id,
      fileName: item.fileName,
      date: item.date,
      detectedLanguage: data.detectedLanguage,
      segments: data.segments,
    };
  };

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
    if (activeTranscription && !historyItems.some(t => t.id === activeTranscription.id)) {
      const newHistoryItem: HistoryItem = {
        id: activeTranscription.id,
        fileName: activeTranscription.fileName,
        date: activeTranscription.date,
        tool: 'transcriber',
        data: {
          detectedLanguage: activeTranscription.detectedLanguage,
          segments: activeTranscription.segments,
        },
      };
      setHistoryItems(prev => [newHistoryItem, ...prev]);
    }
  }, [activeTranscription, historyItems, setHistoryItems]);

  const handleUpdateTranscription = (id: string, updatedSegments: TranscriptionSegment[]) => {
    if (!activeTranscription) return;

    const updatedTranscription = { ...activeTranscription, segments: updatedSegments };
    setActiveTranscription(updatedTranscription);
    
    setHistoryItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          data: {
            ...item.data,
            segments: updatedSegments,
          }
        };
      }
      return item;
    }));
  };
  
  const handleSelectHistory = (item: HistoryItem) => {
    const transcription = toTranscription(item);
    if (transcription) {
        setActiveTranscription(transcription);
    }
  };
  
  const handleDeleteHistory = (id: string) => {
    setHistoryItems(historyItems.filter(t => t.id !== id));
    if (activeTranscription?.id === id) {
      setActiveTranscription(null);
    }
  };

  return (
    <main className="flex-grow container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <FileUpload onFileSelect={handleFileTranscribe} t={t} isLoading={isLoading} />
        <HistoryPanel 
          items={transcriberHistory}
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
    </main>
  );
};

export default TranscriberTool;
