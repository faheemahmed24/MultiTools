import React from 'react';
import type { TranslationSet } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { HistoryIcon } from './icons/HistoryIcon';

interface HistoryPanelProps<T extends { id: string }> {
  items: T[];
  onSelect: (item: T) => void;
  onDelete: (id: string) => void;
  renderItem: (item: T, isActive: boolean) => React.ReactNode;
  activeId?: string;
  t: TranslationSet;
  title?: string;
}

const HistoryPanel = <T extends { id: string }>({ 
  items, 
  onSelect, 
  onDelete,
  renderItem, 
  activeId, 
  t,
  title 
}: HistoryPanelProps<T>) => {
  return (
    <div className="flex flex-col h-full">
      {items.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <HistoryIcon className="w-16 h-16 text-gray-700 mb-4" />
          <h4 className="font-semibold text-gray-400">No History Yet</h4>
          <p className="text-sm text-gray-500">Your past activities will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-2 overflow-y-auto -me-3 pe-3 flex-grow">
          {items.map((item) => (
            <li
              key={item.id}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                activeId === item.id ? 'bg-purple-600/30 border-purple-500/50 border' : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent'
              }`}
              onClick={() => onSelect(item)}
            >
              {renderItem(item, activeId === item.id)}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="ms-2 p-2 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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

export default HistoryPanel;