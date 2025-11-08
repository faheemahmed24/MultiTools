
import React, { useState } from 'react';
import type { TranslationSet, HistoryItem, TranscriptionData } from '../types';
import FileUpload from './FileUpload';
import TranscriptionView from './TranscriptionView';
import HistoryPanel from './HistoryPanel';
import Loader from './Loader';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { transcribeFile } from '../services/geminiService';

const TranscriberTool: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('transcription-history', []);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setActiveItem(null);

    try {
      const transcriptionData = await transcribeFile(file);
      const newHistoryItem: HistoryItem = {
        id: new Date().toISOString(),
        fileName: file.name,
        date: new Date().toLocaleDateString(),
        tool: 'transcriber',
        data: transcriptionData,
      };
      
      setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
      setActiveItem(newHistoryItem);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setActiveItem(item);
  };
  
  const handleHistoryDelete = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (activeItem?.id === id) {
      setActiveItem(null);
    }
  };

  const handleNewTranscription = () => {
    setActiveItem(null);
    setError(null);
  };
  
  const handleSaveEdit = (newText: string) => {
    if (!activeItem) return;

    const updatedData: TranscriptionData = {
      ...activeItem.data,
      transcription: newText,
    };
    
    const updatedItem: HistoryItem = {
      ...activeItem,
      data: updatedData,
    };

    setActiveItem(updatedItem);
    setHistory(prev => prev.map(item => item.id === activeItem.id ? updatedItem : item));
  };


  const renderContent = () => {
    if (isLoading) {
      return <Loader t={t} />;
    }

    if (error) {
        return (
            <div className="m-auto text-center bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-2">{t.errorTitle}</h2>
                <p>{error}</p>
                <button
                    onClick={handleNewTranscription}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (activeItem) {
      return (
        <TranscriptionView
          data={activeItem.data}
          fileName={activeItem.fileName}
          onNewTranscription={handleNewTranscription}
          onSaveEdit={handleSaveEdit}
          t={t}
        />
      );
    }

    return <FileUpload onFileSelect={handleFileSelect} t={t} isLoading={isLoading} />;
  };

  return (
    <main className="flex-grow container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col items-center justify-center">
        {renderContent()}
      </div>
      <div className="lg:col-span-1">
        <HistoryPanel
          items={history}
          onSelect={handleHistorySelect}
          onDelete={handleHistoryDelete}
          activeId={activeItem?.id}
          t={t}
        />
      </div>
    </main>
  );
};

export default TranscriberTool;
