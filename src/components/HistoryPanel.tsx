
import React, { useState, useEffect } from 'react';
import type { TranslationSet } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { ClockIcon } from './icons/ClockIcon';

interface HistoryPanelProps<T extends { id: string }> {
  items: T[];
  onSelect: (item: T) => void;
  onDelete: (id: string) => void;
  renderItem: (item: T, isActive: boolean) => React.ReactNode;
  activeId?: string;
  t: TranslationSet;
}

const HistoryPanel = <T extends { id: string }>({ 
  items, 
  onSelect, 
  onDelete,
  renderItem, 
  activeId, 
  t
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
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [deletingId, onDelete]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {items.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 animate-fadeIn">
          <div className="bg-gray-900/50 p-6 rounded-full border border-gray-800 mb-6">
            <HistoryIcon className="w-12 h-12 text-gray-700" />
          </div>
          <h4 className="text-lg font-black uppercase tracking-widest text-gray-500">{t.noHistory || 'Archive Empty'}</h4>
          <p className="text-sm text-gray-600 mt-2 max-w-xs">Start using the tools to build your personal processing history.</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2">
            <div className="grid grid-cols-1 gap-3 pb-8">
              {items.map((item) => {
                const isDeleting = item.id === deletingId;
                const isActive = activeId === item.id;
                
                return (
                  <div
                    key={item.id}
                    className={`group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                      isDeleting ? 'scale-95 opacity-0 -translate-x-12' : 'scale-100 opacity-100'
                    } ${
                      isActive 
                        ? 'bg-purple-600/10 border-purple-500/50 shadow-lg' 
                        : 'bg-gray-900/40 border-gray-800/50 hover:bg-gray-800/60 hover:border-gray-700'
                    }`}
                    onClick={() => !isDeleting && onSelect(item)}
                  >
                    {/* Visual Indicator */}
                    <div className={`w-1.5 h-10 rounded-full flex-shrink-0 transition-colors ${isActive ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-gray-800'}`}></div>
                    
                    {/* Content */}
                    <div className="flex-grow min-w-0 overflow-hidden">
                        {renderItem(item, isActive)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(item.id);
                          }}
                          className="p-2.5 rounded-xl bg-gray-800/50 text-gray-500 hover:bg-red-500/20 hover:text-red-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 active:scale-95"
                          title={t.delete}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
                )
              })}
            </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
