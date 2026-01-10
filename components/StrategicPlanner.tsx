import React, { useState, useRef } from 'react';
import type { TranslationSet } from '../types';
import { runStrategicPlanning } from '../services/geminiService';
import { SkeletonLoader } from './Loader';
import { UploadIcon } from './icons/UploadIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { CubeIcon } from './icons/CubeIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CopyIcon } from './icons/CopyIcon';
import { BoltIcon } from './icons/BoltIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SheetIcon } from './icons/SheetIcon';
import PptxGenJS from 'pptxgenjs';
import * as XLSX from 'xlsx';

interface PlannerProps {
    t: TranslationSet;
    onComplete?: (data: any) => void;
}

const StrategicPlanner: React.FC<PlannerProps> = ({ t }) => {
  const [inputText, setInputText] = useState('');
  const [pastedImages, setPastedImages] = useState<{data: string, mime: string, id: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = (event.target?.result as string).split(',')[1];
                    setPastedImages(prev => [...prev, { data: base64, mime: blob.type, id: Math.random().toString() }]);
                };
                reader.readAsDataURL(blob);
            }
        }
    }
  };

  const removeImage = (id: string) => setPastedImages(prev => prev.filter(img => img.id !== id));

  const handleProcess = async () => {
    if (!inputText.trim() && pastedImages.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
        const result = await runStrategicPlanning(inputText, pastedImages);
        setPlan(result);
    } catch (err: any) {
        setError(err.message || "Engine failure during planning.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCopyBriefing = () => {
    if (!plan) return;
    const text = `EXECUTIVE SUMMARY:\n${plan.executiveSummary}\n\nSTRATEGIC ANALYSIS:\n${plan.strategicAnalysis}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const exportPPTX = () => {
    if (!plan) return;
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    let slide = pptx.addSlide();
    slide.background = { color: '05050C' };
    slide.addText('STRATEGIC ARCHITECT REPORT', { x: 0.5, y: 1.5, w: '90%', fontSize: 44, bold: true, color: 'A855F7', fontFace: 'Montserrat' });
    plan.slides.forEach((s: any) => {
        slide = pptx.addSlide();
        slide.addText(s.title, { x: 0.5, y: 0.3, w: '90%', fontSize: 24, bold: true, color: '6B21A8' });
        slide.addText(s.content.join('\n'), { x: 0.5, y: 1.2, w: '90%', fontSize: 14, bullet: true });
    });
    pptx.writeFile({ fileName: `Strategy-Plan-${Date.now()}.pptx` });
  };

  const exportXLSX = () => {
    if (!plan) return;
    const ws = XLSX.utils.json_to_sheet(plan.tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Task_Matrix");
    XLSX.writeFile(wb, `Plan-Matrix-${Date.now()}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn max-w-7xl mx-auto w-full gap-6">
      {!plan ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="bg-gray-900/60 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative flex flex-col flex-grow min-h-[400px] transition-all focus-within:border-purple-500/20">
                    <div className="flex items-center gap-3 mb-6">
                        <SparklesIcon className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl font-black uppercase tracking-widest text-white">Plan Architect</h2>
                    </div>
                    <textarea 
                        onPaste={handlePaste}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste messy department data, meeting snippets, or raw goals..."
                        className="w-full flex-grow bg-transparent text-lg text-gray-200 resize-none outline-none custom-scrollbar font-medium placeholder:text-gray-700"
                    />
                </div>
                <button 
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="w-full py-6 bg-purple-600 text-white font-black uppercase tracking-[0.3em] rounded-3xl transition-all shadow-2xl hover:bg-purple-500 active:scale-[0.98] flex items-center justify-center gap-4"
                >
                    {isProcessing ? 'Processing Master Node...' : 'Generate Strategic Blueprint'}
                </button>
            </div>
            <div className="lg:col-span-4 bg-[#0A0A10] border border-white/5 rounded-[2.5rem] p-6 flex flex-col">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-6 ml-2">Resources (Pasted Images)</h3>
                <div className="grid grid-cols-2 gap-4">
                    {pastedImages.map(img => (
                        <div key={img.id} className="relative group aspect-square bg-black rounded-2xl overflow-hidden border border-white/5">
                            <img src={`data:${img.mime};base64,${img.data}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                            <button onClick={() => removeImage(img.id)} className="absolute top-2 right-2 p-1 bg-red-500/20 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><XCircleIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      ) : (
        <div className="space-y-8 pb-20 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-[2rem]">
                <div className="flex items-center gap-4">
                    <div className="bg-purple-600 p-3 rounded-2xl shadow-xl shadow-purple-900/20"><CubeIcon className="w-6 h-6 text-white" /></div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Blueprint Ready</h2>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleCopyBriefing} className="px-6 py-3 bg-white/5 text-purple-400 text-[10px] font-black uppercase rounded-xl hover:bg-purple-600/10 border border-purple-500/20 transition-all flex items-center gap-2">
                        {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                        {isCopied ? 'Copied Brief' : 'Copy Analysis'}
                    </button>
                    <button onClick={exportPPTX} className="px-6 py-3 bg-purple-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-purple-500 transition-all flex items-center gap-2">PPTX</button>
                    <button onClick={exportXLSX} className="px-6 py-3 bg-green-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-green-500 transition-all flex items-center gap-2">XLSX</button>
                    <button onClick={() => setPlan(null)} className="px-6 py-3 bg-red-600/10 text-red-400 text-[10px] font-black uppercase rounded-xl border border-red-500/20">Reset</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl group">
                    <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-6">Original Mirror</h3>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-arabic">{plan.mirror}</p>
                </div>
                <div className="bg-purple-900/20 border border-purple-500/20 rounded-[2.5rem] p-8 shadow-2xl">
                    <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-6">Strategic Briefing</h3>
                    <div className="space-y-6">
                        <div>
                            <span className="text-[9px] font-black text-gray-500 uppercase block mb-2">Executive Summary</span>
                            <p className="text-gray-200 text-sm leading-relaxed">{plan.executiveSummary}</p>
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-gray-500 uppercase block mb-2">Strategic Direction</span>
                            <p className="text-gray-200 text-lg leading-relaxed font-urdu">{plan.strategicAnalysis}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                    <h3 className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-6">Workflow Gaps</h3>
                    <div className="space-y-4">
                        {plan.missingWorkflows.map((m: string, i: number) => (
                            <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 items-start">
                                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-1.5 shrink-0"></div>
                                <span className="text-xs font-bold text-gray-300">{m}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StrategicPlanner;