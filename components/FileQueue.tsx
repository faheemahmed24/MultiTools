import React from 'react';
import type { TranslationSet } from '../types';

interface FileQueueProps {
  files: { name: string; status: 'processing' | 'done' | 'error', duration?: number }[];
  t: TranslationSet;
}

const FileQueue: React.FC<FileQueueProps> = ({ files, t }) => {
  if (files.length === 0) {
    return null;
  }

  const getStatusText = (status: 'processing' | 'done' | 'error') => {
    switch(status) {
      case 'processing': return t.processing;
      case 'done': return t.done;
      case 'error': return t.error;
    }
  }

  const getStatusColor = (status: 'processing' | 'done' | 'error') => {
    switch(status) {
      case 'processing': return 'text-blue-500 dark:text-blue-400';
      case 'done': return 'text-green-500 dark:text-green-400';
      case 'error': return 'text-red-500 dark:text-red-400';
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">{t.fileQueue}</h2>
      <div className="bg-[color:var(--bg-secondary)] rounded-lg p-4 space-y-3 shadow-sm">
        {files.map((file, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-[color:var(--text-secondary)] truncate pr-4">{file.name}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {file.duration !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{`(${file.duration}s)`}</span>
              )}
              <span className={`font-semibold ${getStatusColor(file.status)}`}>
                {getStatusText(file.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileQueue;