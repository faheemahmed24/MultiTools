import React, { useState, useCallback, useRef } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { LinkIcon } from './icons/LinkIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { BoltIcon } from './icons/BoltIcon';

interface FileUploadProps {
  onFilesSelect: (files: File[], languageHint: string) => void;
  t: TranslationSet;
  isProcessing: boolean;
  processingFiles?: string[];
}

const LANGUAGES = [
    { code: 'auto', name: 'Universal Auto-Detect' },
    { code: 'en', name: 'English (Global)' },
    { code: 'hi', name: 'Hindi / हिन्दी' },
    { code: 'ur', name: 'Urdu / اردو' },
    { code: 'ar', name: 'Arabic / العربية' },
    { code: 'es', name: 'Spanish / Español' },
    { code: 'fr', name: 'French / Français' },
    { code: 'de', name: 'German / Deutsch' },
    { code: 'zh', name: 'Chinese / 中文' },
    { code: 'ja', name: 'Japanese / 日本語' },
];

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, t, isProcessing, processingFiles = [] }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isFetchingLink, setIsFetchingLink] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [languageHint, setLanguageHint] = useState('auto');
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFilesToQueue = (files: File[]) => {
    const validFiles = files.filter(f => 
      f.type.startsWith('audio/') || 
      f.type.startsWith('video/') || 
      f.type === 'application/pdf' || 
      f.type.startsWith('image/')
    );
    setFileQueue(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFileQueue(prev => prev.filter((_, i) => i !== index));
  };

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
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  }, [isProcessing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
    }
  };

  const handleExecuteBatch = () => {
    if (fileQueue.length > 0) {
      onFilesSelect(fileQueue, languageHint);
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
        addFilesToQueue([file]);
        setLinkUrl('');
    } catch (err) {
        setLinkError(t.linkError || 'Access restricted by system policy or CORS.');
    } finally {
        setIsFetchingLink(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-[var(--border-app)] rounded-lg p-6 md:p-10 max-w-5xl mx-auto animate-fadeIn shadow-elevation-1">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
        <div className="md:col-span-8 flex flex-col gap-6 md:gap-8">
            <div
                className={`relative flex flex-col items-center justify-center transition-all duration-300 ${fileQueue.length > 0 ? 'p-6 md:p-8' : 'p-10 md:p-16'} border border-dashed rounded-md ${isProcessing ? 'border-zinc-200 dark:border-zinc-800' : (isDragging ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900' : 'border-[var(--border-app)] hover:border-zinc-400 dark:hover:border-zinc-600')}`}
                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
            >
                <div className={`${fileQueue.length > 0 ? 'mb-3' : 'mb-6'} text-zinc-400`}>
                    <UploadIcon className={`${fileQueue.length > 0 ? 'w-8 h-8' : 'w-12 h-12'}`} />
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="audio/*,video/*,application/pdf,image/*"
                    className="hidden"
                    multiple
                    disabled={isProcessing}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-[var(--border-app)] text-[var(--text-primary)] font-bold uppercase tracking-widest text-[10px] rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all active:scale-95"
                >
                    {isProcessing ? 'System Locked' : 'Add Local Assets'}
                </button>
            </div>

            {fileQueue.length > 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-[var(--border-app)] overflow-hidden flex flex-col animate-fadeIn">
                    <div className="px-5 py-3 border-b border-[var(--border-app)] flex justify-between items-center bg-zinc-100/50 dark:bg-zinc-900">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Node Cluster ({fileQueue.length})</span>
                        {!isProcessing && (
                            <button onClick={() => setFileQueue([])} className="text-[9px] font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 uppercase tracking-widest transition-colors">Clear All</button>
                        )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-3 space-y-1">
                        {fileQueue.map((file, idx) => {
                            const isCurrentlyProcessing = processingFiles.includes(file.name);
                            return (
                                <div key={`${file.name}-${idx}`} className={`group flex items-center gap-4 p-3 bg-white dark:bg-zinc-900 rounded border transition-all ${isCurrentlyProcessing ? 'border-zinc-900 dark:border-zinc-100' : 'border-transparent hover:border-[var(--border-app)]'}`}>
                                    <div className={`w-8 h-8 rounded flex items-center justify-center text-zinc-400 flex-shrink-0 ${isCurrentlyProcessing ? 'animate-pulse' : ''}`}>
                                        {isCurrentlyProcessing ? <div className="w-4 h-4 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin" /> : <UploadIcon className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{file.name}</p>
                                        <p className="text-[9px] text-zinc-500 font-bold uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1] || 'binary'}</p>
                                    </div>
                                    {!isProcessing && (
                                        <button onClick={() => removeFile(idx)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                            <XCircleIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="p-3 border-t border-[var(--border-app)]">
                         <button 
                            onClick={handleExecuteBatch}
                            disabled={isProcessing}
                            className={`w-full py-3 rounded-md flex items-center justify-center gap-3 transition-all ${isProcessing ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.98]'}`}
                         >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Neural Sync...</span>
                                </>
                            ) : (
                                <>
                                    <BoltIcon className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Initialize Processing</span>
                                </>
                            )}
                         </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                        <LinkIcon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <input type="text" className="block w-full p-3 ps-11 text-xs text-[var(--text-primary)] border border-[var(--border-app)] rounded-md bg-white dark:bg-zinc-950 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all outline-none placeholder:text-zinc-400" placeholder="Stage from remote link..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLinkUpload()} disabled={isProcessing || isFetchingLink} />
                </div>
                <button onClick={handleLinkUpload} disabled={isFetchingLink || !linkUrl || isProcessing} className="w-full sm:w-auto px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] bg-zinc-100 dark:bg-zinc-900 border border-[var(--border-app)] rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all active:scale-95">
                    {isFetchingLink ? 'FETCH' : 'STAGE'}
                </button>
            </div>
            {linkError && <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">{linkError}</p>}
        </div>

        <div className="md:col-span-4 space-y-6">
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-[var(--border-app)]">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <GlobeIcon className="w-4 h-4" /> Dialect Engine
                </label>
                <div className="space-y-1 max-h-[240px] md:max-h-[340px] overflow-y-auto custom-scrollbar pr-2">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => setLanguageHint(lang.code === 'auto' ? 'auto' : lang.name)}
                            className={`w-full text-left px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all border ${languageHint === (lang.code === 'auto' ? 'auto' : lang.name) ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900' : 'bg-white dark:bg-zinc-950 border-[var(--border-app)] text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-5 bg-zinc-100 dark:bg-zinc-900 rounded-md border border-[var(--border-app)]">
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest leading-relaxed">
                    MultiTools Core supports high-density code-switching and batch ingestion targets for 100+ languages.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;