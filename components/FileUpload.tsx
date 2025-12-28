import React, { useRef } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFilesSelect: (files: File[], languageHint: string) => void;
  t: TranslationSet;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, t, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(Array.from(e.target.files), 'auto');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelect(Array.from(e.dataTransfer.files), 'auto');
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-600 rounded-xl bg-gray-800/50 hover:bg-gray-800 hover:border-purple-500 transition-all cursor-pointer"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="audio/*,video/*"
      />
      <UploadIcon className="w-16 h-16 text-gray-500 mb-4" />
      <h3 className="text-xl font-semibold text-gray-300 mb-2">{t.uploadFile}</h3>
      <p className="text-gray-400 text-center mb-6">{t.dropFile}</p>
      <button className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors">
        Select Files
      </button>
    </div>
  );
};

export default FileUpload;