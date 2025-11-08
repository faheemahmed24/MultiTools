import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { TranslationSet } from '../types';
import type { StatusType } from '../App';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onCancel: () => void;
  t: TranslationSet;
  status: StatusType;
  fileName?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onCancel, t, status, fileName }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = status !== 'idle';

  useEffect(() => {
    let timer: number;
    if (status === 'reading') {
      setProgress(0);
      // Fake progress for FileReader since it's hard to get real progress
      timer = window.setInterval(() => {
        setProgress(prev => (prev >= 95 ? 95 : prev + 5));
      }, 200);
    } else {
      setProgress(0);
    }
    return () => {
      clearInterval(timer);
    };
  }, [status]);


  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  }, [isLoading]);

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
    if (!isLoading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (status === 'reading') {
    return (
       <div className="bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
         <h3 className="font-bold text-lg text-gray-200">{t.uploadProgress}</h3>
         <p className="text-sm text-gray-400 truncate mt-1" title={fileName}>{fileName}</p>
         <div className="w-full bg-gray-700 rounded-full h-2.5 my-4">
           <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.2s ease-in-out' }}></div>
         </div>
         <button
          onClick={onCancel}
          className="px-4 py-1 text-sm bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors duration-200"
        >
          {t.uploadCancel}
        </button>
       </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
      <div
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-300 ${isDragging ? 'border-green-400 bg-gray-700 scale-105' : 'border-gray-600 hover:border-purple-500'}`}
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
          accept="audio/*,video/*,.flac,.m4a"
          className="hidden"
          disabled={isLoading}
        />
        <button
          onClick={handleClick}
          disabled={isLoading}
          className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? t.transcribing : t.uploadFile}
        </button>
        <p className="mt-2 text-sm text-gray-400 font-bold">{isDragging ? t.releaseToUpload : t.dropFile}</p>
        <p className="mt-2 text-xs text-gray-500">{t.fileConstraints}</p>
      </div>
    </div>
  );
};

export default FileUpload;
