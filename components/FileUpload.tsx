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
    { code: 'hi', name: 'Hindi / हिन्दी' },
    { code: 'ur', name: 'Urdu / اردو' },
    { code: 'ar', name: 'Arabic / العربية' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
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
        setLinkError(t.linkError || 'CORS restriction or invalid link.');
    } finally {
        setIsFetchingLink(false);
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-10 max-w-4xl mx-auto animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 flex flex-col gap-6">
            <div
                className={`relative flex-grow flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2rem] transition-all duration-500 ${isProcessing ? 'border-gray-800' : (isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/40')}`}
                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
            >
                <div className="p-5 bg-purple-500/10 rounded-full mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <UploadIcon className="w-16 h-16 text-purple-400" />
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
                className="px-10 py-4 bg-purple-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-purple-700 transition-all transform active:scale-95 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                >
                {isProcessing ? 'Engine Active' : 'Browse Files'}
                </button>
                <p className="mt-6 text-sm text-gray-500 font-bold uppercase tracking-widest">{t.dropFile}</p>
                <p className="mt-3 text-[10px] text-gray-600 font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/5">Multi-Format Node (Max 2GB)</p>
            </div>

            <div className="flex gap-2">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                        <LinkIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <input type="text" className="block w-full p-4 ps-12 text-sm text-gray-300 border border-white/5 rounded-2xl bg-black/40 focus:border-purple-500/50 transition-all outline-none" placeholder="Paste media URL..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLinkUpload()} disabled={isProcessing || isFetchingLink} />
                </div>
                <button onClick={handleLinkUpload} disabled={isFetchingLink || !linkUrl || isProcessing} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white bg-white/5 border border-white/10 rounded-2xl hover:bg-purple-600 transition-all active:scale-95">
                    {isFetchingLink ? '...' : 'Add'}
                </button>
            </div>
            {linkError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-2">{linkError}</p>}
        </div>

        <div className="md:col-span-4 space-y-6">
            <div className="p-6 bg-black/20 rounded-[2rem] border border-white/5">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <GlobeIcon className="w-4 h-4" /> Language Node
                </label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => setLanguageHint(lang.code === 'auto' ? 'auto' : lang.name)}
                            className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border ${languageHint === (lang.code === 'auto' ? 'auto' : lang.name) ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-lg shadow-purple-900/10' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-6 bg-purple-500/5 rounded-[2rem] border border-purple-500/10">
                <p className="text-[9px] font-black text-purple-400/60 uppercase tracking-widest leading-relaxed">
                    Gemini 3 Pro auto-detects code-switching (mixed languages) with precision. Manual selection is only required for rare dialects.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;