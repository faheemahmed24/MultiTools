import React from 'react';
import { TrashIcon } from './icons/TrashIcon';
import type { Transcription, TranslationSet } from '../types';

interface HistoryPanelProps {
  history: Transcription[];
  onSelectHistory: (id: string) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
  t: TranslationSet;
  activeId?: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelectHistory, onDeleteHistory, onClearHistory, t, activeId }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
      <div className="bg-[color:var(--bg-secondary)] rounded-lg p-4 h-full flex flex-col shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">{t.history}</h2>
          <button onClick={onClearHistory} className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors">{t.clearHistory}</button>
        </div>
        <div className="flex-grow overflow-y-auto -mr-2 pr-2">
          {history.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-md mb-2 cursor-pointer transition-colors flex justify-between items-start
              ${activeId === item.id ? 'bg-[color:var(--accent-primary)]/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
              onClick={() => onSelectHistory(item.id)}
            >
              <div>
                <p className="font-semibold text-sm text-[color:var(--text-primary)] truncate">{item.fileName}</p>
                <p className="text-xs text-[color:var(--text-secondary)] mt-1">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                className="p-1 text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-full"
                title={t.delete}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;