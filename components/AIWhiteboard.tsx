
import React, { useState, useRef, useEffect } from 'react';
import type { TranslationSet } from '../types';
import { SwatchIcon } from './icons/SwatchIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';

const AIWhiteboard: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#A855F7');
  const [brushSize, setBrushSize] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const resize = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
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
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

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
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const download = () => {
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvasRef.current?.toDataURL() || '';
    link.click();
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn gap-4">
      <div className="flex items-center justify-between bg-gray-900/40 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Color</span>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer" />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Size</span>
                <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-24 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={clear} className="p-2 bg-gray-800 text-gray-400 hover:text-red-400 rounded-xl transition-all">
                <TrashIcon className="w-5 h-5" />
            </button>
            <button onClick={download} className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all">
                <DownloadIcon className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-500 transition-all">
                <SparklesIcon className="w-4 h-4" /> AI Generate
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
        <div className="absolute bottom-8 right-10 pointer-events-none opacity-20">
            <SwatchIcon className="w-48 h-48 text-purple-500" />
        </div>
      </div>
    </div>
  );
};

export default AIWhiteboard;
