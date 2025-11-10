import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { Task, Transcription, TranscriptionSegment, TranscriptionTask, TranslationTask, TextTranslationTask } from '../types';
import * as db from '../lib/db';
import { processAudioForTranscription } from '../lib/audioUtils';

interface TaskContextType {
  tasks: Task[];
  startTranscription: (file: File, languageName?: string, context?: string) => Promise<void>;
  startTranslation: (segments: TranscriptionSegment[], targetLanguage: {code: string, name: string}, parentId: string) => Promise<void>;
  startTextTranslation: (sourceText: string, targetLanguage: {code: string, name: string}, sourceLanguage?: {code: string, name: string}) => Promise<void>;
  dismissTask: (taskId: string) => void;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

const postMessageToServiceWorker = (message: any) => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  } else {
    // Wait for the controller to be available.
    navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage(message);
    });
  }
};

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load tasks from DB on initial mount and set up SW listener
  useEffect(() => {
    const loadTasks = async () => {
      const storedTasks = await db.getTasks();
      setTasks(storedTasks);
    };
    loadTasks();

    const handleServiceWorkerMessage = async (event: MessageEvent) => {
      const { type, payload: updatedTask } = event.data;
      if (type === 'TASK_UPDATE') {
        setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const startTranscription = useCallback(async (file: File, languageName?: string, context?: string) => {
    const taskId = `task_trans_${Date.now()}`;
    // Convert the file to base64 to send to the service worker.
    const fileData = await processAudioForTranscription(file);
    
    const newTask: TranscriptionTask = {
      id: taskId,
      type: 'transcription',
      status: 'processing',
      createdAt: new Date().toISOString(),
      fileName: file.name,
      language: languageName,
      context: context,
      fileData,
    };

    await db.addTask(newTask);
    setTasks(prev => [newTask, ...prev]);
    postMessageToServiceWorker({ type: 'START_TASK', payload: newTask });
  }, []);

  const startTranslation = useCallback(async (segments: TranscriptionSegment[], targetLanguage: {code: string, name: string}, parentId: string) => {
    const taskId = `task_transl_${Date.now()}`;
    
    const newTask: TranslationTask = {
      id: taskId,
      type: 'translation',
      status: 'processing',
      createdAt: new Date().toISOString(),
      parentId,
      targetLanguageCode: targetLanguage.code,
      targetLanguageName: targetLanguage.name,
      segments: segments,
    };

    await db.addTask(newTask);
    setTasks(prev => [newTask, ...prev]);
    postMessageToServiceWorker({ type: 'START_TASK', payload: newTask });
  }, []);

  const startTextTranslation = useCallback(async (sourceText: string, targetLanguage: {code: string, name: string}, sourceLanguage?: {code: string, name: string}) => {
    const taskId = `task_text_transl_${Date.now()}`;
    
    const newTask: TextTranslationTask = {
      id: taskId,
      type: 'text-translation',
      status: 'processing',
      createdAt: new Date().toISOString(),
      sourceText,
      targetLanguageName: targetLanguage.name,
      sourceLanguageName: sourceLanguage?.name,
    };

    await db.addTask(newTask);
    setTasks(prev => [newTask, ...prev]);
    postMessageToServiceWorker({ type: 'START_TASK', payload: newTask });
  }, []);

  const dismissTask = useCallback(async (taskId: string) => {
    await db.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, startTranscription, startTranslation, startTextTranslation, dismissTask }}>
      {children}
    </TaskContext.Provider>
  );
};
