
import React, { useState, useRef } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { runAICommand } from '../services/geminiService';

interface UniversalImageEditorProps {
    toolName: string;
    t: TranslationSet;
    onClose: () => void;
}

const UniversalImageEditor: React.FC<UniversalImageEditorProps> = ({ toolName, t, onClose }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [targetKb, setTargetKb] = useState(50);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResultUrl(null);
    setAiInsight(null);
    
    const img = new Image();
    img.src = url;
    img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
    };
  };

  const handleAIMagic = async () => {
    if (!imageFile) return;
    setIsProcessing(true);
    try {
        const result = await runAICommand(`Analyze this image for the purpose of '${toolName}'. Provide specific technical advice or text extraction if relevant.`, imageFile);
        setAiInsight(result);
    } catch (err) {
        setAiInsight("Vision link failed. Please try a different asset.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!imageFile || !preview) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = preview;
    await new Promise(resolve => img.onload = resolve);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, width, height);

    if (toolName.toLowerCase().includes('kb')) {
        let minQuality = 0.01;
        let maxQuality = 0.98;
        let quality = 0.9;
        let finalBlob: Blob | null = null;

        for (let i = 0; i < 10; i++) {
            quality = (minQuality + maxQuality) / 2;
            const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
            if (!blob) break;
            
            const sizeKb = blob.size / 1024;
            if (sizeKb < targetKb) {
                minQuality = quality;
                finalBlob = blob;
            } else {
                maxQuality = quality;
            }
        }
        
        if (finalBlob) setResultUrl(URL.createObjectURL(finalBlob));
        else setResultUrl(canvas.toDataURL('image/jpeg', 0.1));
    } else {
        setResultUrl(canvas.toDataURL('image/png'));
    }

    setIsProcessing(false);
  };

  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 animate-fadeIn h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{toolName}</h2>
            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mt-1">MultiTools Vision Engine</p>
        </div>
        <div className="w-10"></div>
      </div>

      {!imageFile ? (
        <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-3xl p-12 hover:border-purple-500/50 transition-colors group">
            <UploadIcon className="w-16 h-16 text-gray-600 mb-6 group-hover:text-purple-400 transition-colors" />
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 shadow-xl shadow-purple-900/20 active:scale-95 transition-all">Initialize Assets</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow overflow-hidden">
            <div className="flex flex-col gap-4">
                <div className="bg-gray-900 rounded-2xl p-6 flex items-center justify-center min-h-[300px] border border-white/5 relative overflow-hidden">
                    <img src={preview!} className="max-w-full max-h-[400px] rounded-lg shadow-2xl relative z-10" alt="Preview" />
                    <div className="absolute inset-0 bg-purple-500/5 blur-3xl"></div>
                </div>
                <div className="flex justify-between items-center">
                    <button onClick={() => {setImageFile(null); setPreview(null); setAiInsight(null);}} className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors underline">Switch Asset</button>
                    <button onClick={handleAIMagic} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-500/20 transition-all">
                        <SparklesIcon className="w-4 h-4" /> AI Magic Analysis
                    </button>
                </div>

                {aiInsight && (
                    <div className="mt-4 p-5 bg-purple-600/5 border border-purple-500/20 rounded-2xl animate-fadeIn">
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-2">Cognitive Insight</span>
                        <p className="text-xs text-gray-300 leading-relaxed italic">{aiInsight}</p>
                    </div>
                )}
            </div>

            <div className="bg-gray-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-8 flex flex-col shadow-inner">
                <div>
                    <h3 className="font-black text-gray-500 uppercase tracking-[0.3em] text-[10px] mb-6">Adjustment Terminal</h3>
                    
                    {toolName.toLowerCase().includes('kb') && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-widest">Target Density</label>
                                <span className="text-sm font-mono text-purple-400">{targetKb} KB</span>
                            </div>
                            <input type="range" min="5" max="2000" step="5" value={targetKb} onChange={e => setTargetKb(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                    )}

                    {(toolName.toLowerCase().includes('pixel') || toolName.toLowerCase().includes('resize') || toolName.toLowerCase().includes('passport')) ? (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Width (PX)</label>
                                <input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500/50 transition-all font-mono" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Height (PX)</label>
                                <input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500/50 transition-all font-mono" />
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Basic Adjustments for {toolName}</p>
                        </div>
                    )}
                </div>

                <div className="mt-auto">
                    {!resultUrl ? (
                        <button onClick={handleProcess} disabled={isProcessing} className="w-full py-5 bg-purple-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-purple-500 shadow-2xl shadow-purple-900/30 transition-all disabled:grayscale disabled:opacity-30">
                            {isProcessing ? 'Rendering Logic...' : 'Synthesize Result'}
                        </button>
                    ) : (
                        <div className="space-y-4 animate-pop-in">
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-[10px] font-black uppercase tracking-widest text-center">
                                Task Executed Successfully
                            </div>
                            <a href={resultUrl} download={`MultiTools-${toolName.replace(/\s+/g, '-')}-${imageFile.name}`} className="w-full py-5 bg-green-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-green-500 flex items-center justify-center gap-3 shadow-2xl shadow-green-900/30 active:scale-95 transition-all">
                                <DownloadIcon className="w-5 h-5" /> Download Digital Master
                            </a>
                            <button onClick={() => setResultUrl(null)} className="w-full text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-[0.3em] transition-colors py-2">Re-process Asset</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UniversalImageEditor;
