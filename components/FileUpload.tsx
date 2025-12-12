
import React, { useState, useCallback, useRef } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { LinkIcon } from './icons/LinkIcon';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  t: TranslationSet;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, t, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isFetchingLink, setIsFetchingLink] = useState(false);
  const [linkError, setLinkError] = useState('');
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

  const handleLinkUpload = async () => {
    if (!linkUrl.trim()) return;
    
    setIsFetchingLink(true);
    setLinkError('');
    
    try {
        const response = await fetch(linkUrl);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const blob = await response.blob();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        // Try to guess extension from url or content-type if needed
        let filename = linkUrl.split('/').pop()?.split('#')[0].split('?')[0] || 'downloaded_file';
        
        // Simple extension fix if missing
        if (!filename.includes('.')) {
             if (contentType.includes('audio/mpeg')) filename += '.mp3';
             else if (contentType.includes('audio/wav')) filename += '.wav';
             else if (contentType.includes('audio/ogg')) filename += '.ogg';
             else if (contentType.includes('video/mp4')) filename += '.mp4';
        }

        const file = new File([blob], filename, { type: contentType });
        onFilesSelect([file]);
        setLinkUrl('');
    } catch (err) {
        setLinkError(t.linkError || 'Could not load file. Check URL or CORS permissions.');
    } finally {
        setIsFetchingLink(false);
    }
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
                <UploadIcon className="w-10 h-10 text-gray-400" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*,video/*,.ogg,.mp3,.wav,.m4a,.aac,.flac,.mp4,.mov,.webm"
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

      <div className="flex items-center gap-4 my-6">
          <div className="h-px bg-gray-700 flex-1"></div>
          <span className="text-gray-500 text-sm font-medium">{t.orSeparator || 'OR'}</span>
          <div className="h-px bg-gray-700 flex-1"></div>
      </div>

      <div className="flex gap-2">
          <div className="relative flex-grow">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <LinkIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input 
                 type="text" 
                 className="block w-full p-3 ps-10 text-sm text-gray-200 border border-gray-600 rounded-lg bg-gray-700/50 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500" 
                 placeholder={t.pasteLinkPlaceholder || "Paste file URL (e.g., .mp3, .mp4)..."}
                 value={linkUrl}
                 onChange={(e) => setLinkUrl(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleLinkUpload()}
                 disabled={isProcessing || isFetchingLink}
              />
          </div>
          <button 
              onClick={handleLinkUpload}
              disabled={isFetchingLink || !linkUrl || isProcessing}
              className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
              {isFetchingLink ? 'Loading...' : (t.addLink || 'Add')}
          </button>
      </div>
      {linkError && <p className="mt-2 text-sm text-red-400">{linkError}</p>}
    </div>
  );
};

export default FileUpload;
