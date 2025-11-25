
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
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg p-6 transform-gpu">
      <div
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-300 ${isProcessing ? 'border-gray-600' : (isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-purple-500')}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className={`absolute inset-0 bg-purple-500/20 rounded-xl transition-all duration-300 transform scale-95 ${isDragging ? 'opacity-100 scale-100' : 'opacity-0'}`}></div>
        <div className={`flex flex-col items-center justify-center text-center z-10 transition-transform duration-300 transform ${isDragging ? 'scale-105' : ''}`}>
            <div className="p-4 bg-gray-700/50 rounded-full mb-4 border border-gray-600">
                <i className="fas fa-cloud-upload-alt w-10 h-10 text-gray-400 flex items-center justify-center text-3xl" />
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
            <button
              onClick={handleClick}
              disabled={isProcessing}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-100"
            >
              {isProcessing ? t.transcribing : t.uploadFile}
            </button>
            <p className="mt-3 text-sm text-gray-400">{t.dropFile}</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
