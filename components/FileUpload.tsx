
import React, { useState, useCallback, useRef } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { LinkIcon } from './icons/LinkIcon';
import { GlobeIcon } from './icons/GlobeIcon';

interface FileUploadProps {
  onFilesSelect: (files: File[], languageHint: string) => void;
  t: TranslationSet;
  isProcessing: boolean;
}

const LANGUAGES = [
    { code: 'auto', name: 'Auto-detect Language' },
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ur', name: 'Urdu' },
    { code: 'ar', name: 'Arabic' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ru', name: 'Russian' },
];

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, t, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isFetchingLink, setIsFetchingLink] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [languageHint, setLanguageHint] = useState('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
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
      onFilesSelect(Array.from(e.dataTransfer.files), languageHint);
    }
  }, [onFilesSelect, isProcessing, languageHint]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(Array.from(e.target.files), languageHint);
    }
  };

  const handleLinkUpload = async () => {
    if (!linkUrl.trim()) return;
    setIsFetchingLink(true);
    setLinkError('');
    try {
        const response = await fetch(linkUrl);
        if (!response.ok) throw new Error('Failed to fetch file');
        const blob = await response.blob();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        let filename = linkUrl.split('/').pop()?.split('#')[0].split('?')[0] || 'file';
        const file = new File([blob], filename, { type: contentType });
        onFilesSelect([file], languageHint);
        setLinkUrl('');
    } catch (err) {
        setLinkError(t.linkError || 'Could not load file.');
    } finally {
        setIsFetchingLink(false);
    }
  };

  return (
    <div className="glass-card max-w-4xl mx-auto p-6 shadow-lg">
      <div className="mb-6">
          <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
              <GlobeIcon className="w-4 h-4" />
              Language Hint (Optional)
          </label>
          <select 
            value={languageHint} 
            onChange={(e) => setLanguageHint(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-gray-200 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
          >
              {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code === 'auto' ? 'auto' : lang.name}>
                      {lang.name}
                  </option>
              ))}
          </select>
          <p className="mt-2 text-xs text-gray-500"> गाइड: यदि "ऑटो-डिटेक्ट" गलत भाषा पहचानता है, तो कृपया यहाँ से भाषा चुनें।</p>
      </div>

      <div
        className={`relative flex flex-col items-center justify-center p-12 dropzone-dashed rounded-xl transition-all duration-300 ${isProcessing ? 'border-gray-600' : (isDragging ? 'dragover' : 'hover:border-purple-500')}`}
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
      >
        <div className="p-4 bg-gray-700/50 rounded-full mb-4 border border-gray-600 group-hover:scale-110 transition-transform">
            <UploadIcon className="w-12 h-12 text-gray-400" />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*,video/*,.ogg,.mp3,.wav,.m4a,.aac,.flac,.mp4,.mov,.webm,.opus"
          className="hidden"
          multiple
          disabled={isProcessing}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-8 py-3.5 btn-primary font-bold rounded-lg hover:brightness-105 transition-all transform hover:scale-105 shadow-lg shadow-purple-900/20"
        >
          {isProcessing ? t.transcribing : t.uploadFile}
        </button>
        <p className="mt-4 text-sm text-gray-400">{t.dropFile}</p>
        <p className="mt-2 text-xs text-gray-500 font-medium bg-gray-900/30 px-3 py-1 rounded-full border border-gray-700/50">Supports all formats up to 1GB</p>
      </div>

      <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-gray-700 flex-1"></div>
          <span className="text-gray-500 text-xs font-bold">{t.orSeparator}</span>
          <div className="h-px bg-gray-700 flex-1"></div>
      </div>

      <div className="flex gap-2">
          <div className="relative flex-grow">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <LinkIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input type="text" className="block w-full p-3 ps-10 text-sm text-gray-200 border border-gray-600 rounded-lg bg-gray-700/50 focus:ring-purple-500 focus:border-purple-500 transition-all" placeholder={t.pasteLinkPlaceholder} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLinkUpload()} disabled={isProcessing || isFetchingLink} />
          </div>
          <button onClick={handleLinkUpload} disabled={isFetchingLink || !linkUrl || isProcessing} className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-lg">
              {isFetchingLink ? '...' : t.addLink}
          </button>
      </div>
      {linkError && <p className="mt-2 text-xs text-red-400">{linkError}</p>}
    </div>
  );
};

export default FileUpload;
