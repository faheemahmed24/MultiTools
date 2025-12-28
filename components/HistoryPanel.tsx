import React from 'react';
import type { TranslationSet } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface HistoryPanelProps<T> {
  items: T[];
  onSelect: (item: T) => void;
  onDelete: (id: string) => void;
  activeId?: string;
  t: TranslationSet;
  renderItem: (item: T) => React.ReactNode;
}

function HistoryPanel<T extends { id: string }>({ items, onSelect, onDelete, activeId, t, renderItem }: HistoryPanelProps<T>) {
  if (items.length === 0) {
    return <div className="text-center text-gray-500 mt-10">No history items found.</div>;
  }

  return (
    <div className="space-y-2 overflow-y-auto h-full pr-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`p-3 rounded-lg flex items-center justify-between group cursor-pointer transition-colors ${
            activeId === item.id ? 'bg-purple-900/40 border border-purple-500/50' : 'bg-gray-700/30 hover:bg-gray-700/60 border border-transparent'
          }`}
          onClick={() => onSelect(item)}
        >
          {renderItem(item)}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title={t.delete}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default HistoryPanel;