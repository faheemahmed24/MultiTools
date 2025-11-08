import React from 'react';
import type { Transcription, TranslationSet, TranscriptionSegment } from '../types';
import type { SortByType } from '../App';
import { TrashIcon } from './icons/TrashIcon';

const DocumentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const SortControl: React.FC<{t: TranslationSet, sortBy: SortByType, setSortBy: (val: SortByType) => void}> = ({ t, sortBy, setSortBy }) => (
  <div className="flex items-center gap-2 mb-4">
    <label htmlFor="sort-by" className="text-sm font-medium text-gray-400">{t.sortBy}</label>
    <select
      id="sort-by"
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value as SortByType)}
      className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-1.5"
    >
      <option value="newest">{t.newest}</option>
      <option value="oldest">{t.oldest}</option>
      <option value="name">{t.nameAZ}</option>
    </select>
  </div>
);


interface HistoryPanelProps {
  transcriptions: Transcription[];
  onSelect: (transcription: Transcription) => void;
  onDelete: (id: string) => void;
  activeId?: string;
  t: TranslationSet;
  sortBy: SortByType;
  setSortBy: (value: SortByType) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ transcriptions, onSelect, onDelete, activeId, t, sortBy, setSortBy }) => {
  const getDuration = (segments: TranscriptionSegment[]): string => {
    if (!segments || segments.length === 0) return '00:00';
    const lastSegment = segments[segments.length-1];
    const parts = lastSegment.endTime.split(':');
    // return only HH:MM or MM:SS if hours are 0
    if (parts.length === 3 && parts[0] !== "00") {
      return `${parts[0]}:${parts[1]} min`;
    }
    return `${parts[1]}:${parts[2]} sec`;
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col h-full max-h-[50vh] lg:max-h-none">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-200">{t.history}</h2>
      </div>
      {transcriptions.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center">
          <DocumentIcon className="w-16 h-16 text-gray-600 mb-4" />
          <p className="text-gray-400 font-semibold">{t.noHistory}</p>
          <p className="text-gray-500 text-sm mt-1">{t.noHistoryDescription}</p>
        </div>
      ) : (
        <>
        <SortControl t={t} sortBy={sortBy} setSortBy={setSortBy} />
        <ul className="space-y-2 overflow-y-auto -me-3 pe-3">
          {transcriptions.map((item) => (
            <li
              key={item.id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                activeId === item.id ? 'bg-purple-600/50' : 'bg-gray-700/50 hover:bg-gray-700'
              }`}
              onClick={() => onSelect(item)}
            >
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold truncate text-gray-200">{item.fileName}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-xs text-gray-400 whitespace-nowrap">{item.date.split(',')[0]}</p>
                  <span className="bg-green-500/20 text-green-300 text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    {t.completed}
                  </span>
                   <span className="bg-gray-600 text-purple-300 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                    {getDuration(item.segments)}
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
        </>
      )}
    </div>
  );
};

export default HistoryPanel;
