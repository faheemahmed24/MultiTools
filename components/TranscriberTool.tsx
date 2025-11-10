import React, { useState, useCallback, useEffect } from 'react';
import type { TranslationSet, Transcription, TranscriptionSegment, Task, TranscriptionTask } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTasks } from '../hooks/useTasks';
import FileUpload from './FileUpload';
import TranscriptionView from './TranscriptionView';
import HistoryPanel from './HistoryPanel';
import TasksPanel from './TasksPanel';
import Loader from './Loader';
import { LANGUAGES } from '../lib/languages';

interface TranscriberToolProps {
  t: TranslationSet;
}

type ActiveSelection = {
  type: 'task' | 'history';
  id: string;
} | null;

const NotificationManager: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [permission, setPermission] = useState(Notification.permission);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  if (permission === 'granted') {
    return <div className="text-center text-xs text-green-400">{t.notificationsEnabled}</div>;
  }
  
  if (permission === 'denied') {
    return <div className="text-center text-xs text-red-400">{t.notificationsDenied}</div>;
  }

  return (
    <div className="text-center">
      <button onClick={requestPermission} className="text-xs text-purple-400 hover:underline">
        {t.enableNotifications}
      </button>
    </div>
  );
};

const TranscriberTool: React.FC<TranscriberToolProps> = ({ t }) => {
  const [transcriptions, setTranscriptions] = useLocalStorage<Transcription[]>('transcriptions', []);
  const [activeSelection, setActiveSelection] = useState<ActiveSelection>(null);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<string>('auto');
  const [transcriptionContext, setTranscriptionContext] = useState<string>('');

  const { tasks, startTranscription, dismissTask } = useTasks();

  const handleFileTranscribe = async (file: File) => {
    const languageName = transcriptionLanguage === 'auto'
      ? undefined
      : LANGUAGES.find(l => l.code === transcriptionLanguage)?.name;
    startTranscription(file, languageName, transcriptionContext);
  };
  
  const handleSaveTranscription = useCallback((transcription: Transcription) => {
    // This function handles both saving new transcriptions and updating existing ones.
    const historyId = transcription.id.startsWith('hist_') ? transcription.id : `hist_${transcription.id}`;
    const newHistoryItem = { ...transcription, id: historyId, date: new Date().toLocaleString() };

    setTranscriptions(prev => {
        const existingIndex = prev.findIndex(t => t.id === historyId);
        const newHistory = [...prev];
        if (existingIndex > -1) {
            // Update the existing item
            newHistory[existingIndex] = newHistoryItem;
        } else {
            // Add the new item to the beginning
            newHistory.unshift(newHistoryItem);
        }
        return newHistory;
    });

    // If the original ID was from a task, dismiss that task.
    if (!transcription.id.startsWith('hist_')) {
        dismissTask(transcription.id);
        // Automatically select the newly saved history item.
        setActiveSelection({ type: 'history', id: historyId });
    }
  }, [setTranscriptions, dismissTask]);

  const handleUpdateTranscription = useCallback((id: string, updatedSegments: TranscriptionSegment[]) => {
    // This function is called by TranscriptionView when an item is modified.
    
    // Case 1: The item is already in history.
    const historyItem = transcriptions.find(t => t.id === id);
    if (historyItem) {
        const updatedItem = { ...historyItem, segments: updatedSegments };
        handleSaveTranscription(updatedItem);
        return;
    }

    // Case 2: The item is a completed task result that hasn't been saved yet.
    const task = tasks.find(t => t.id === id && t.status === 'completed') as TranscriptionTask | undefined;
    if (task?.result) {
        const updatedResult = { ...task.result, segments: updatedSegments };
        handleSaveTranscription(updatedResult);
    }
  }, [transcriptions, tasks, handleSaveTranscription]);
  
  // Auto-save completed tasks.
  useEffect(() => {
    const completedTasks = tasks.filter(
      (task): task is TranscriptionTask =>
        task.type === 'transcription' && task.status === 'completed'
    );

    if (completedTasks.length > 0) {
      const timer = setTimeout(() => {
        completedTasks.forEach(task => {
          const historyId = `hist_${task.id}`;
          const isAlreadySaved = transcriptions.some(t => t.id === historyId);
          if (!isAlreadySaved && task.result) {
            handleSaveTranscription(task.result);
          }
        });
      }, 1000); // 1-second delay before auto-saving.
      return () => clearTimeout(timer);
    }
  }, [tasks, transcriptions, handleSaveTranscription]);

  const handleSelectHistory = (transcription: Transcription) => {
    setActiveSelection({ type: 'history', id: transcription.id });
  };
  
  const handleSelectTask = (task: Task) => {
    setActiveSelection({ type: 'task', id: task.id });
  };
  
  const handleDeleteHistory = (id: string) => {
    setTranscriptions(transcriptions.filter(t => t.id !== id));
    if (activeSelection?.type === 'history' && activeSelection.id === id) {
      setActiveSelection(null);
    }
  };

  const renderMainView = () => {
    if (!activeSelection) {
      return (
        <div className="m-auto text-center text-gray-400">
          <h3 className="text-2xl font-semibold">{t.welcomeTitle}</h3>
          <p className="mt-2 max-w-prose mx-auto">{t.welcomeMessage}</p>
          <p className="mt-4 text-xs text-gray-500">{t.securityNote}</p>
        </div>
      );
    }

    if (activeSelection.type === 'task') {
      const task = tasks.find(t => t.id === activeSelection.id) as TranscriptionTask | undefined;
      if (!task) return null; // Task might have been dismissed

      return (
        <TranscriptionView
          task={task}
          onSave={handleSaveTranscription} // Kept for manual save on unsaved items
          onUpdate={handleUpdateTranscription}
          t={t}
        />
      );
    }

    if (activeSelection.type === 'history') {
      const transcription = transcriptions.find(t => t.id === activeSelection.id);
      if (transcription) {
        return (
          <TranscriptionView
            transcription={transcription}
            onSave={handleSaveTranscription}
            onUpdate={handleUpdateTranscription}
            t={t}
          />
        );
      }
    }
    
    return null;
  };

  const transcriptionTasks = tasks.filter(t => t.type === 'transcription');
  const isUploading = tasks.some(t => t.type === 'transcription' && t.status === 'processing');

  return (
    <main className="flex-grow container mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <FileUpload 
          onFileSelect={handleFileTranscribe} 
          t={t} 
          isLoading={isUploading} 
          language={transcriptionLanguage}
          onLanguageChange={setTranscriptionLanguage}
          context={transcriptionContext}
          onContextChange={setTranscriptionContext}
        />
        <NotificationManager t={t} />
        <TasksPanel
          tasks={transcriptionTasks}
          // FIX: Added the required 'taskType' prop.
          taskType="transcription"
          onSelect={handleSelectTask}
          onDismiss={dismissTask}
          activeId={activeSelection?.type === 'task' ? activeSelection.id : undefined}
          t={t}
        />
        <HistoryPanel 
          transcriptions={transcriptions}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          activeId={activeSelection?.type === 'history' ? activeSelection.id : undefined}
          t={t}
        />
      </div>
      <div className="lg:col-span-2 bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col min-h-[60vh] lg:min-h-0">
        {renderMainView()}
      </div>
    </main>
  );
};

export default TranscriberTool;