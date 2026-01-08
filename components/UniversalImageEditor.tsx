
import React, { useState, useRef } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResultUrl(null);
    
    // Auto-fill width/height from image
    const img = new Image();
    img.src = url;
    img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
    };
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
        // Precise iterative compression
        let minQuality = 0.01;
        let maxQuality = 0.98;
        let quality = 0.9;
        let finalBlob: Blob | null = null;

        for (let i = 0; i < 10; i++) { // Max 10 iterations for precision
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
        
        if (finalBlob) {
            setResultUrl(URL.createObjectURL(finalBlob));
        } else {
            setResultUrl(canvas.toDataURL('image/jpeg', 0.1));
        }
    } else {
        setResultUrl(canvas.toDataURL('image/png'));
    }

    setIsProcessing(false);
  };

  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 animate-fadeIn h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400">
            <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-black text-white">{toolName}</h2>
        <div className="w-10"></div>
      </div>

      {!imageFile ? (
        <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-3xl p-12">
            <UploadIcon className="w-16 h-16 text-gray-600 mb-6" />
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700">Select Image</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow overflow-hidden">
            <div className="flex flex-col gap-4">
                <div className="bg-gray-900 rounded-2xl p-4 flex items-center justify-center min-h-[300px]">
                    <img src={preview!} className="max-w-full max-h-[400px] rounded-lg shadow-xl" alt="Preview" />
                </div>
                <button onClick={() => {setImageFile(null); setPreview(null);}} className="text-sm text-gray-500 hover:text-white underline">Select different image</button>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-3xl space-y-6 flex flex-col">
                <h3 className="font-bold text-gray-300 uppercase tracking-widest text-xs">Settings</h3>
                
                {toolName.toLowerCase().includes('kb') && (
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Target Size: {targetKb} KB</label>
                        <input type="range" min="5" max="2000" step="5" value={targetKb} onChange={e => setTargetKb(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                    </div>
                )}

                {(toolName.toLowerCase().includes('pixel') || toolName.toLowerCase().includes('resize') || toolName.toLowerCase().includes('passport')) ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                            <input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} className="w-full bg-gray-800 p-3 rounded-xl border border-gray-700 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                            <input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full bg-gray-800 p-3 rounded-xl border border-gray-700 text-white" />
                        </div>
                    </div>
                ) : null}

                {!resultUrl ? (
                    <button onClick={handleProcess} disabled={isProcessing} className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 disabled:bg-gray-800">
                        {isProcessing ? 'Processing...' : 'Apply Changes'}
                    </button>
                ) : (
                    <div className="space-y-4 animate-pop-in">
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400 text-sm font-bold text-center">
                            Image successfully processed!
                        </div>
                        <a href={resultUrl} download={`processed-${imageFile.name}`} className="w-full py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 flex items-center justify-center gap-2 shadow-xl shadow-green-900/20">
                            <DownloadIcon className="w-5 h-5" /> Download Result
                        </a>
                        <button onClick={() => setResultUrl(null)} className="w-full text-xs text-gray-500 hover:text-white uppercase tracking-widest font-bold">Back to Settings</button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default UniversalImageEditor;
