import React from 'react';
import type { TranslationItem, TranslationSet } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface TranslationHistoryPanelProps {
  translations: TranslationItem[];
  onSelect: (item: TranslationItem) => void;
  onDelete: (id: string) => void;
  activeId?: string;
  t: TranslationSet;
}

const TranslationHistoryPanel: React.FC<TranslationHistoryPanelProps> = ({ translations, onSelect, onDelete, activeId, t }) => {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col h-full max-h-[50vh] lg:max-h-none">
      <h2 className="text-xl font-bold mb-4 text-gray-200">{t.translationHistory}</h2>
      {translations.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500">{t.noTranslationHistory}</p>
        </div>
      ) : (
        <ul className="space-y-2 overflow-y-auto -me-3 pe-3">
          {translations.map((item) => (
            <li
              key={item.id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                activeId === item.id ? 'bg-purple-600/50' : 'bg-gray-700/50 hover:bg-gray-700'
              }`}
              onClick={() => onSelect(item)}
            >
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold truncate text-gray-200" title={item.sourceText}>"{item.sourceText.substring(0, 50)}..."</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-gray-600 text-purple-300 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {item.sourceLanguage}
                  </span>
                  <span className="text-gray-400 text-xs">→</span>
                  <span className="bg-gray-600 text-green-300 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {item.targetLanguage}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="ms-2 p-2 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={t.delete}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TranslationHistoryPanel;