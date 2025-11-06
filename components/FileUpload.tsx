import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadIcon } from './icons/UploadIcon';
import { AudioRecorder } from './AudioRecorder';
import type { TranslationSet } from '../types';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  t: TranslationSet;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, t, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileUpload(acceptedFiles);
  }, [onFileUpload]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'audio/*': [],
      'video/*': [],
    },
    disabled: isLoading,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  return (
    <div className="bg-[color:var(--bg-secondary)] rounded-xl shadow-sm">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'upload' ? 'text-[color:var(--accent-primary)] border-b-2 border-[color:var(--accent-secondary)]' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
        >
          {t.uploadFile}
        </button>
        <button
          onClick={() => setActiveTab('record')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'record' ? 'text-[color:var(--accent-primary)] border-b-2 border-[color:var(--accent-secondary)]' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
        >
          {t.recordAudio}
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'upload' && (
           <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-300
            ${isLoading ? 'cursor-not-allowed bg-gray-200 dark:bg-gray-700/50' : 'hover:border-[color:var(--accent-primary)] hover:bg-[color:var(--accent-primary)]/10'}
            ${isDragActive ? 'border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/20' : 'border-gray-300 dark:border-gray-600'}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center text-[color:var(--text-secondary)]">
              <UploadIcon className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">{t.uploadTitle}</h3>
              <p className="mt-1 text-sm">{t.uploadSubtitle}</p>
            </div>
          </div>
        )}
        {activeTab === 'record' && (
          <AudioRecorder onRecordingComplete={(file) => onFileUpload([file])} t={t} />
        )}
      </div>
    </div>
  );
};

export default FileUpload;