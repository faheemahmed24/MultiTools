import React, { useState, useCallback, useRef } from 'react';
import type { TranslationSet } from '../types';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  t: TranslationSet;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, t, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) {
      setIsDragging(true);
    }
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isProcessing && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelect(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelect, isProcessing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(Array.from(e.target.files));
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow)] p-6">
      <div
        className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-all duration-300 ${isProcessing ? 'border-gray-300 cursor-not-allowed' : (isDragging ? 'border-[var(--primary-color)] bg-purple-50' : 'border-[var(--border-color)] hover:border-[var(--primary-color)] hover:bg-[var(--bg-color)]')}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className={`flex flex-col items-center justify-center text-center z-10 transition-transform duration-300 transform ${isDragging ? 'scale-105' : ''}`}>
            <div className="p-4 bg-purple-100 rounded-full mb-4">
                <i className="fas fa-cloud-upload-alt w-10 h-10 text-[var(--primary-color)] text-4xl flex items-center justify-center" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*,video/*"
              className="hidden"
              multiple
              disabled={isProcessing}
            />
            <h3 className="text-xl font-semibold text-[var(--text-color)] mb-2">Upload Audio or Video</h3>
            <p className="text-[var(--text-secondary)] mb-6">Drag and drop files here or click to browse</p>
            <button
              onClick={handleClick}
              disabled={isProcessing}
              className="px-8 py-3 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:bg-[var(--hover-color)] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              {isProcessing ? t.transcribing : t.uploadFile}
            </button>
            <p className="mt-4 text-xs text-[var(--text-secondary)]">Supported formats: MP3, WAV, MP4, MOV, etc.</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;