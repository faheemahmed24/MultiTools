import React, { useState, useEffect } from 'react';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  useEffect(() => {
    if (deletingId) {
      const timer = setTimeout(() => {
        onDelete(deletingId);
        setDeletingId(null);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [deletingId, onDelete]);

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
          {items.map((item) => {
            const isDeleting = item.id === deletingId;
            const itemClasses = [
              'group flex items-center justify-between p-3 rounded-xl cursor-pointer',
              'transition-all duration-300 transform',
              isDeleting ? 'scale-95 opacity-0 -translate-x-full' : 'scale-100 opacity-100 hover:scale-[1.02]',
              activeId === item.id ? 'bg-purple-600/30 border-purple-500/50 border' : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent'
            ].join(' ');
            
            return (
              <li
                key={item.id}
                className={itemClasses}
                style={{ transition: 'all 300ms ease-in-out' }}
                onClick={() => !isDeleting && onSelect(item)}
              >
                {renderItem(item, activeId === item.id)}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(item.id);
                  }}
                  className="ms-2 p-2 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-label={t.delete}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  );
};

export default HistoryPanel;