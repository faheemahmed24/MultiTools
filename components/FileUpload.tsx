
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
    { code: 'auto', name: 'Global Auto-Detect' },
    { code: 'en', name: 'English (US/UK)' },
    { code: 'hi', name: 'Hindi / हिन्दी' },
    { code: 'ur', name: 'Urdu / اردو' },
    { code: 'ar', name: 'Arabic / العربية' },
    { code: 'es', name: 'Spanish / Español' },
    { code: 'fr', name: 'French / Français' },
    { code: 'de', name: 'German / Deutsch' },
    { code: 'zh', name: 'Chinese / 中文' },
    { code: 'ja', name: 'Japanese / 日本語' },
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
        setLinkError(t.linkError || 'Access blocked by CORS or invalid link.');
    } finally {
        setIsFetchingLink(false);
    }
  };

  return (
    <div className="bg-white/[0.01] border border-white/5 backdrop-blur-3xl rounded-[3rem] p-12 max-w-5xl mx-auto animate-fadeIn shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-8 flex flex-col gap-8">
            <div
                className={`relative flex-grow flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-[3rem] transition-all duration-700 ${isProcessing ? 'border-gray-800' : (isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/50')}`}
                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
            >
                <div className="p-8 bg-purple-500/10 rounded-full mb-8 border border-purple-500/20 group-hover:scale-110 transition-transform shadow-2xl">
                    <UploadIcon className="w-20 h-20 text-purple-400" />
                </div>
                <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="audio/*,video/*,application/pdf,image/*,.ogg,.mp3,.wav,.m4a,.aac,.flac,.mp4,.mov,.webm,.opus,.pdf,.png,.jpg,.jpeg"
                className="hidden"
                multiple
                disabled={isProcessing}
                />
                <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-14 py-5 bg-purple-600 text-white font-black uppercase tracking-[0.25em] text-xs rounded-2xl hover:bg-purple-700 transition-all transform active:scale-95 shadow-[0_0_40px_rgba(168,85,247,0.4)]"
                >
                {isProcessing ? 'System Syncing...' : 'Load Multi-Format Assets'}
                </button>
                <p className="mt-8 text-sm text-gray-500 font-bold uppercase tracking-[0.2em]">Universal Intel Processor</p>
                <div className="mt-6 flex gap-3">
                    {['AUDIO', 'VIDEO', 'PDF', 'IMAGE'].map(type => (
                        <span key={type} className="text-[10px] text-gray-600 font-black tracking-widest border border-white/5 px-4 py-1.5 rounded-full bg-black/20">{type}</span>
                    ))}
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-5 pointer-events-none">
                        <LinkIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <input type="text" className="block w-full p-5 ps-14 text-sm text-gray-300 border border-white/5 rounded-2xl bg-black/40 focus:border-purple-500/50 transition-all outline-none shadow-inner placeholder:text-gray-700" placeholder="Remote source link..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLinkUpload()} disabled={isProcessing || isFetchingLink} />
                </div>
                <button onClick={handleLinkUpload} disabled={isFetchingLink || !linkUrl || isProcessing} className="px-10 py-5 text-xs font-black uppercase tracking-widest text-white bg-white/5 border border-white/10 rounded-2xl hover:bg-purple-600 transition-all active:scale-95 shadow-xl">
                    {isFetchingLink ? 'FETCH' : 'SYNC'}
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
                    MultiTools Engine 3.0 supports high-density code-switching and 99.9% verbal accuracy across all global languages.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
