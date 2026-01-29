
import React, { useState, useRef, useEffect } from 'react';
import type { TranslationSet } from '../types';
import { SwatchIcon } from './icons/SwatchIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { generateWhiteboardImage } from '../services/geminiService';

const AIWhiteboard: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#A855F7');
  const [brushSize, setBrushSize] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('a professional technical diagram with a modern aesthetic');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            ctx.fillStyle = "#05050C";
            ctx.fillRect(0,0, canvas.width, canvas.height);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
        ctx.fillStyle = "#05050C";
        ctx.fillRect(0,0, canvas.width, canvas.height);
    }
  };

  const handleAIGenerate = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isGenerating) return;
    setIsGenerating(true);
    try {
        const base64 = canvas.toDataURL('image/png');
        const enhancedUrl = await generateWhiteboardImage(base64, prompt);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = enhancedUrl;
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
    } catch (err) {
        alert("Vision Node Error: Could not generate asset.");
    } finally {
        setIsGenerating(false);
    }
  };

  const download = () => {
    const link = document.createElement('a');
    link.download = 'multi-whiteboard.png';
    link.href = canvasRef.current?.toDataURL() || '';
    link.click();
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn gap-4">
      <div className="flex flex-wrap items-center justify-between bg-gray-900/40 p-4 rounded-2xl border border-white/5 gap-4">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Brush</span>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer" />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Size</span>
                <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-24 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
            </div>
        </div>
        
        <div className="flex-grow max-w-sm flex gap-2">
            <input 
                type="text" 
                value={prompt} 
                onChange={e => setPrompt(e.target.value)}
                className="flex-grow bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-gray-300 outline-none focus:border-purple-500"
                placeholder="AI generation prompt..."
            />
            <button 
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-500 transition-all disabled:opacity-50"
            >
                {isGenerating ? 'Morphing...' : <><SparklesIcon className="w-4 h-4" /> AI Generate</>}
            </button>
        </div>

        <div className="flex gap-2">
            <button onClick={clear} className="p-2 bg-gray-800 text-gray-400 hover:text-red-400 rounded-xl transition-all">
                <TrashIcon className="w-5 h-5" />
            </button>
            <button onClick={download} className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all">
                <DownloadIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="flex-grow bg-white/[0.02] border border-white/10 rounded-[2.5rem] relative overflow-hidden cursor-crosshair">
        <canvas 
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
            className="absolute inset-0 w-full h-full"
        />
        {isGenerating && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black uppercase tracking-widest text-purple-400">Generative Engine Active</p>
                </div>
            </div>
        )}
        <div className="absolute bottom-8 right-10 pointer-events-none opacity-10">
            <SwatchIcon className="w-48 h-48 text-purple-500" />
        </div>
      </div>
    </div>
  );
};

export default AIWhiteboard;
