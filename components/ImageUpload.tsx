import React, { useState, useCallback, useRef } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onAnalyze: () => void;
  imageUrl: string | null;
  prompt: string;
  setPrompt: (prompt: string) => void;
  isLoading: boolean;
  t: TranslationSet;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, onAnalyze, imageUrl, prompt, setPrompt, isLoading, t }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImageSelect(e.dataTransfer.files[0]);
    }
  }, [onImageSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelect(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
      {imageUrl ? (
        <div className="mb-4">
            <img src={imageUrl} alt="Preview" className="rounded-lg max-h-60 w-full object-contain" />
            <button onClick={handleUploadClick} className="w-full mt-2 text-sm text-purple-400 hover:underline">
                Change Image
            </button>
        </div>
      ) : (
        <div
          onClick={handleUploadClick}
          className={`flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-xl transition-colors duration-300 cursor-pointer ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600'} hover:border-purple-500`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
          <p className="font-semibold text-white">{t.uploadImage}</p>
          <p className="mt-1 text-sm text-gray-400">{t.dropImage}</p>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isLoading}
      />
      
      <div className="mt-4">
        <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-300 mb-1">
          {t.askAnything}
        </label>
        <textarea
          id="prompt-input"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          placeholder="e.g., Extract the text from this receipt."
          className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 disabled:opacity-50 resize-y"
        />
      </div>

      <button
        onClick={onAnalyze}
        disabled={isLoading || !imageUrl}
        className="mt-4 w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? t.analyzing : t.analyze}
      </button>
    </div>
  );
};

export default ImageUpload;
