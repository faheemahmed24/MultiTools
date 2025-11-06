import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import HistoryPanel from './components/HistoryPanel';
import FileQueue from './components/FileQueue';
import Loader from './components/Loader';
import CustomVocabulary from './components/CustomVocabulary';
import { useLocalStorage } from './hooks/useLocalStorage';
import { transcribeAudio, summarizeText, translateText, detectLanguage } from './services/geminiService';
import { getTranslations } from './lib/i18n';
import type { Language, Theme, Transcription, FileQueueItem } from './types';

const App: React.FC = () => {
  const [language, setLanguage] = useLocalStorage<Language>('language', 'en');
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
  const [history, setHistory] = useLocalStorage<Transcription[]>('transcriptionHistory', []);
  const [activeTranscription, setActiveTranscription] = useState<Transcription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [processTimeLeft, setProcessTimeLeft] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [customVocabulary, setCustomVocabulary] = useState<string>('');

  const t = getTranslations(language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = ['ar', 'ur'].includes(language) ? 'rtl' : 'ltr';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [language, theme]);
  
  // FIX: Changed NodeJS.Timeout to ReturnType<typeof setTimeout> for browser compatibility and fixed potential runtime error.
  useEffect(() => {
    if (isLoading && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, timeLeft]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if ((isSummarizing || isTranslating) && processTimeLeft > 0) {
      timer = setTimeout(() => setProcessTimeLeft(processTimeLeft - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isSummarizing, isTranslating, processTimeLeft]);

  useEffect(() => {
    // Revoke the old audio URL when a new one is set or component unmounts
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const processFile = async (file: File) => {
    const startTime = Date.now();
    try {
      // Create a URL for the audio player
      const newAudioUrl = URL.createObjectURL(file);
      setAudioUrl(newAudioUrl);

      const segments = await transcribeAudio(file, customVocabulary);
      
      const newTranscription: Transcription = {
        id: `${Date.now()}-${file.name}`,
        fileName: file.name,
        segments: segments,
        createdAt: new Date().toISOString(),
        audioUrl: newAudioUrl, // Store URL with the transcription
      };
      
      setHistory(prev => [newTranscription, ...prev]);
      setActiveTranscription(newTranscription);
      const duration = Math.round((Date.now() - startTime) / 1000);
      setFileQueue(prev => prev.map(item => item.name === file.name ? { ...item, status: 'done', duration } : item));

    } catch (err) {
      console.error(err);
      setError(t.transcriptionError);
      const duration = Math.round((Date.now() - startTime) / 1000);
      setFileQueue(prev => prev.map(item => item.name === file.name ? { ...item, status: 'error', duration } : item));
    }
  };

  const handleFileUpload = async (files: File[]) => {
    const newQueueItems: FileQueueItem[] = files.map(file => ({ name: file.name, status: 'processing' }));
    setFileQueue(prev => [...prev, ...newQueueItems]);
    setActiveTranscription(null);
    if(audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsLoading(true);
    setError(null);
    
    // Estimate based on 1 minute per 1MB, capped at 10 mins
    const totalSizeMB = files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024);
    const estimatedDuration = Math.min(Math.round(totalSizeMB * 60), 600);
    setTimeLeft(estimatedDuration);
    
    for (const file of files) {
      await processFile(file);
    }
    setIsLoading(false);
  };
  
  const handleSelectHistory = (id: string) => {
    const selected = history.find(item => item.id === id);
    if (selected) {
      setActiveTranscription(selected);
      // Ensure the audio URL from history is used
      if (audioUrl && audioUrl !== selected.audioUrl) {
         URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(selected.audioUrl || null);
    }
  };

  const handleDeleteHistory = (id: string) => {
    const itemToDelete = history.find(item => item.id === id);
    setHistory(history.filter(item => item.id !== id));
    if (activeTranscription?.id === id) {
      setActiveTranscription(null);
      if(itemToDelete?.audioUrl) {
        URL.revokeObjectURL(itemToDelete.audioUrl);
      }
      setAudioUrl(null);
    }
  };

  const handleClearHistory = () => {
    history.forEach(item => {
      if(item.audioUrl) URL.revokeObjectURL(item.audioUrl);
    });
    setHistory([]);
    setActiveTranscription(null);
    setAudioUrl(null);
  };

  const handleNewTranscription = () => {
    setActiveTranscription(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    // Reset queue for a fresh start
    setFileQueue([]);
  };
  
  const handleUpdateTranscription = (updatedData: Transcription) => {
    setActiveTranscription(updatedData);
    setHistory(history.map(item => item.id === updatedData.id ? updatedData : item));
  };

  const estimateProcessingTime = (text: string) => {
    // Estimate based on ~1s per 800 chars, with a min of 5s and a max of 90s for more accuracy
    return Math.max(5, Math.min(90, Math.round(text.length / 800)));
  };

  const handleSummarize = async (targetLanguage: string) => {
    if (!activeTranscription) return;
    setIsSummarizing(true);
    const fullText = activeTranscription.segments.map(s => s.text).join(' ');
    setProcessTimeLeft(estimateProcessingTime(fullText));
    try {
      const summary = await summarizeText(fullText, targetLanguage);
      const updatedTranscription = { ...activeTranscription, summary };
      handleUpdateTranscription(updatedTranscription);
    } catch (error) {
      console.error("Summarization failed", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTranslate = async (targetLanguage: string) => {
    if (!activeTranscription) return;
    setIsTranslating(true);
    const fullText = activeTranscription.segments.map(s => s.text).join('\n');
    setProcessTimeLeft(estimateProcessingTime(fullText));
    try {
      const translation = await translateText(fullText, targetLanguage, activeTranscription.detectedLanguage);
      const updatedTranscription = { ...activeTranscription, translation };
      handleUpdateTranscription(updatedTranscription);
    } catch (error) {
      console.error("Translation failed", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDetectLanguage = async () => {
    if (!activeTranscription || activeTranscription.detectedLanguage) return;
    try {
      const fullText = activeTranscription.segments.map(s => s.text).join('\n');
      const language = await detectLanguage(fullText);
      const updatedTranscription = { ...activeTranscription, detectedLanguage: language };
      handleUpdateTranscription(updatedTranscription);
    } catch (error) {
      console.error("Language detection failed", error);
      // Optionally set an error state to show in the UI
    }
  };


  return (
    <div className={`min-h-screen text-[color:var(--text-primary)] transition-colors ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <Header
        t={t}
        selectedLanguage={language}
        onSelectLanguage={setLanguage}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-grow">
            {isLoading ? (
              <Loader t={t} timeLeft={timeLeft} />
            ) : activeTranscription ? (
              <>
                <TranscriptionView 
                  key={activeTranscription.id} // Re-mount component on change
                  data={activeTranscription} 
                  t={t} 
                  onUpdate={handleUpdateTranscription} 
                  onSummarize={handleSummarize}
                  isSummarizing={isSummarizing}
                  onTranslate={handleTranslate}
                  isTranslating={isTranslating}
                  onDetectLanguage={handleDetectLanguage}
                  processTimeLeft={processTimeLeft}
                />
                <div className="mt-6 text-center">
                  <button
                    onClick={handleNewTranscription}
                    className="px-6 py-2 bg-[color:var(--accent-primary)] text-white font-semibold rounded-lg shadow-md hover:bg-[color:var(--accent-primary-hover)] transition-colors"
                  >
                    {t.transcribeAnother}
                  </button>
                </div>
              </>
            ) : (
              <>
                <FileUpload onFileUpload={handleFileUpload} t={t} isLoading={isLoading} />
                <CustomVocabulary value={customVocabulary} onChange={setCustomVocabulary} t={t} />
              </>
            )}
            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            <FileQueue files={fileQueue} t={t} />
          </div>
          <HistoryPanel
            history={history}
            onSelectHistory={handleSelectHistory}
            onDeleteHistory={handleDeleteHistory}
            onClearHistory={handleClearHistory}
            t={t}
            activeId={activeTranscription?.id}
          />
        </div>
      </main>
    </div>
  );
};

export default App;