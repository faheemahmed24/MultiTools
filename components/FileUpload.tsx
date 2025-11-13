
import React, { useState, useCallback, useRef } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';

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
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
      <div
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors duration-300 ${isProcessing ? 'border-gray-600' : (isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600 hover:border-purple-500')}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*,video/*"
          className="hidden"
          multiple
          disabled={isProcessing}
        />
        <button
          onClick={handleClick}
          disabled={isProcessing}
          className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isProcessing ? t.transcribing : t.uploadFile}
        </button>
        <p className="mt-2 text-sm text-gray-400">{t.dropFile}</p>
      </div>
    </div>
  );
};

export default FileUpload;
