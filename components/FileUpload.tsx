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
    <div className="bg-white/[0.01] border border-white/5 backdrop-blur-3xl rounded-[3rem] p-12 max-w-5xl mx-auto animate-fadeIn shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-8 flex flex-col gap-8">
            <div
                className={`relative flex flex-col items-center justify-center transition-all duration-700 ${fileQueue.length > 0 ? 'p-8 border-1' : 'p-16 border-2'} border-dashed rounded-[3rem] ${isProcessing ? 'border-gray-800' : (isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/50')}`}
                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
            >
                <div className={`${fileQueue.length > 0 ? 'p-4 mb-4' : 'p-8 mb-8'} bg-purple-500/10 rounded-full border border-purple-500/20 transition-all shadow-2xl`}>
                    <UploadIcon className={`${fileQueue.length > 0 ? 'w-10 h-10' : 'w-20 h-20'} text-purple-400`} />
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
                    className="px-10 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                >
                    {isProcessing ? 'System Locked' : 'Add Local Assets'}
                </button>
            </div>

            {fileQueue.length > 0 && (
                <div className="bg-black/20 rounded-[2rem] border border-white/5 overflow-hidden flex flex-col animate-fadeIn">
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Selected Node Cluster ({fileQueue.length})</span>
                        {!isProcessing && (
                            <button onClick={() => setFileQueue([])} className="text-[9px] font-black text-red-500/70 hover:text-red-400 uppercase tracking-widest transition-colors">Clear Batch</button>
                        )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-4 space-y-2">
                        {fileQueue.map((file, idx) => {
                            const isCurrentlyProcessing = processingFiles.includes(file.name);
                            return (
                                <div key={`${file.name}-${idx}`} className={`group flex items-center gap-4 p-3 bg-white/[0.03] rounded-2xl border transition-all ${isCurrentlyProcessing ? 'border-purple-500/50 bg-purple-500/5' : 'border-transparent hover:border-white/10'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-purple-400 flex-shrink-0 ${isCurrentlyProcessing ? 'animate-pulse' : ''}`}>
                                        {isCurrentlyProcessing ? <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /> : <UploadIcon className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="text-xs font-bold text-gray-200 truncate">{file.name}</p>
                                        <p className="text-[9px] text-gray-600 font-black uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1] || 'binary'}</p>
                                    </div>
                                    {!isProcessing && (
                                        <button onClick={() => removeFile(idx)} className="p-2 text-gray-600 hover:text-red-400 transition-colors">
                                            <XCircleIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="p-4 bg-purple-600/5">
                         <button 
                            onClick={handleExecuteBatch}
                            disabled={isProcessing}
                            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-2xl ${isProcessing ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-900/20 active:scale-[0.98]'}`}
                         >
                            {isProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Neural Synchronization...</span>
                                </>
                            ) : (
                                <>
                                    <BoltIcon className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Initialize Batch Processing</span>
                                </>
                            )}
                         </button>
                    </div>
                </div>
            )}

            <div className="flex gap-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-5 pointer-events-none">
                        <LinkIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <input type="text" className="block w-full p-5 ps-14 text-sm text-gray-300 border border-white/5 rounded-2xl bg-black/40 focus:border-purple-500/50 transition-all outline-none shadow-inner placeholder:text-gray-700" placeholder="Stage from remote link..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLinkUpload()} disabled={isProcessing || isFetchingLink} />
                </div>
                <button onClick={handleLinkUpload} disabled={isFetchingLink || !linkUrl || isProcessing} className="px-10 py-5 text-xs font-black uppercase tracking-widest text-white bg-white/5 border border-white/10 rounded-2xl hover:bg-purple-600 transition-all active:scale-95 shadow-xl">
                    {isFetchingLink ? 'FETCH' : 'STAGE'}
                </button>
            </div>
            {linkError && <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest px-2">{linkError}</p>}
        </div>

        <div className="md:col-span-4 space-y-8">
            <div className="p-8 bg-black/20 rounded-[3rem] border border-white/5 shadow-2xl">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    <GlobeIcon className="w-5 h-5 text-purple-500" /> Dialect Engine
                </label>
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-3">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => setLanguageHint(lang.code === 'auto' ? 'auto' : lang.name)}
                            className={`w-full text-left p-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${languageHint === (lang.code === 'auto' ? 'auto' : lang.name) ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-8 bg-purple-500/5 rounded-[2.5rem] border border-purple-500/10 shadow-inner">
                <p className="text-[10px] font-bold text-purple-400/80 uppercase tracking-widest leading-loose">
                    MultiTools Core supports high-density code-switching and batch ingestion targets for 100+ languages.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;