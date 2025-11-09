import React, { useState, useCallback } from 'react';
import type { TranslationSet, TranslationItem, Task, TextTranslationTask } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTasks } from '../hooks/useTasks';
import { LANGUAGES } from '../lib/languages';
import TasksPanel from './TasksPanel';
import Loader from './Loader';
import TranslationInput from './TranslationInput';
import TranslationHistoryPanel from './TranslationHistoryPanel';
import TranslationResultView from './TranslationResultView';

interface TranslatorToolProps {
  t: TranslationSet;
}

type ActiveSelection = {
  type: 'task' | 'history';
  id: string;
} | null;

const TranslatorTool: React.FC<TranslatorToolProps> = ({ t }) => {
  const [history, setHistory] = useLocalStorage<TranslationItem[]>('translations', []);
  const [activeSelection, setActiveSelection] = useState<ActiveSelection>(null);

  const { tasks, startTextTranslation, dismissTask } = useTasks();

  const handleTranslate = async (sourceText: string, targetLanguageCode: string, sourceLanguageCode: string) => {
    const targetLanguage = LANGUAGES.find(l => l.code === targetLanguageCode);
    if (!targetLanguage) return;

    const sourceLanguage = sourceLanguageCode === 'auto'
      ? undefined
      : LANGUAGES.find(l => l.code === sourceLanguageCode);
    
    startTextTranslation(sourceText, targetLanguage, sourceLanguage);
  };
  
  const handleSaveTranslation = useCallback((taskResult: TextTranslationTask) => {
    if (!taskResult.result) return;
    
    // Check if it's already saved to prevent duplicates
    if (!history.some(h => h.id === `hist_${taskResult.id}`)) {
      const newHistoryItem: TranslationItem = {
        id: `hist_${taskResult.id}`,
        date: new Date().toLocaleString(),
        sourceText: taskResult.sourceText,
        translatedText: taskResult.result.translatedText,
        sourceLanguage: taskResult.result.detectedSourceLanguage,
        targetLanguage: taskResult.targetLanguageName,
      };
      setHistory(prev => [newHistoryItem, ...prev]);
    }
    dismissTask(taskResult.id);
    setActiveSelection(null);
  }, [history, setHistory, dismissTask]);

  const handleSelectHistory = (item: TranslationItem) => {
    setActiveSelection({ type: 'history', id: item.id });
  };
  
  const handleSelectTask = (task: Task) => {
    setActiveSelection({ type: 'task', id: task.id });
  };
  
  const handleDeleteHistory = (id: string) => {
    setHistory(history.filter(h => h.id !== id));
    if (activeSelection?.type === 'history' && activeSelection.id === id) {
      setActiveSelection(null);
    }
  };

  const renderMainView = () => {
    if (!activeSelection) {
      return (
        <div className="m-auto text-center text-gray-400">
          <h3 className="text-2xl font-semibold">{t.welcomeTranslatorTitle}</h3>
          <p className="mt-2 max-w-prose mx-auto">{t.welcomeTranslatorMessage}</p>
        </div>
      );
    }

    if (activeSelection.type === 'task') {
      const task = tasks.find(t => t.id === activeSelection.id) as TextTranslationTask | undefined;
      if (!task) return null; // Task might have been dismissed

      switch (task.status) {
        case 'processing':
          return <Loader message={t.translatingText} duration={30} t={t} />;
        case 'error':
          return (
            <div className="m-auto text-center text-red-400">
              <h3 className="text-xl font-bold">{t.errorTitle}</h3>
              <p>{task.error}</p>
            </div>
          );
        case 'completed':
          if (task.result) {
            return <TranslationResultView task={task} onSave={handleSaveTranslation} t={t} isFromHistory={false} />;
          }
          return null;
        default:
          return null;
      }
    }

    if (activeSelection.type === 'history') {
      const historyItem = history.find(h => h.id === activeSelection.id);
      if (historyItem) {
        return <TranslationResultView item={historyItem} t={t} isFromHistory={true} />;
      }
    }
    
    return null;
  };

  const textTranslationTasks = tasks.filter(t => t.type === 'text-translation');
  const isTranslating = tasks.some(t => t.type === 'text-translation' && t.status === 'processing');

  return (
    <main className="flex-grow container mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <TranslationInput onTranslate={handleTranslate} t={t} isLoading={isTranslating} />
        <TasksPanel
          tasks={tasks}
          taskType="text-translation"
          onSelect={handleSelectTask}
          onDismiss={dismissTask}
          activeId={activeSelection?.type === 'task' ? activeSelection.id : undefined}
          t={t}
        />
        <TranslationHistoryPanel
          translations={history}
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

export default TranslatorTool;