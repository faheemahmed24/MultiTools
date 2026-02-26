
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
  const [step, setStep] = useState(1);

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

  const exportPPTX = () => {
    if (!plan) return;
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    // Title Slide
    let slide = pptx.addSlide();
    slide.background = { color: '4a148c' };
    slide.addText('STRATEGIC ARCHITECT REPORT', { x: 0.5, y: 1.5, w: '90%', fontSize: 44, bold: true, color: 'd4af37', fontFace: 'Montserrat' });
    slide.addText('Burooj Institute Theme | AI Generated Strategy', { x: 0.5, y: 2.5, w: '90%', fontSize: 18, color: 'ffffff' });

    // Summary Slide
    slide = pptx.addSlide();
    slide.addText('Executive Briefing', { x: 0.5, y: 0.3, w: '90%', fontSize: 28, bold: true, color: '4a148c' });
    slide.addText(plan.executiveSummary, { x: 0.5, y: 1, w: '90%', h: 4, fontSize: 14, color: '333333' });

    // Content Slides
    plan.slides.forEach((s: any) => {
        slide = pptx.addSlide();
        slide.addText(s.title, { x: 0.5, y: 0.3, w: '90%', fontSize: 24, bold: true, color: '4a148c' });
        slide.addText(s.content.join('\n'), { x: 0.5, y: 1.2, w: '60%', fontSize: 14, bullet: true });
        
        if (s.criticalDetail) {
            slide.addShape(pptx.ShapeType.rect, { x: 7, y: 1.2, w: 5, h: 3, fill: { color: 'fffde7' }, line: { color: 'd4af37', width: 2 } });
            slide.addText('CRITICAL DETAIL', { x: 7.2, y: 1.4, w: 4.6, fontSize: 12, bold: true, color: '4a148c' });
            slide.addText(s.criticalDetail, { x: 7.2, y: 1.8, w: 4.6, fontSize: 11 });
        }
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
      {/* Input Stage */}
      {!plan && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="bg-gray-900/60 p-6 rounded-[2rem] border-2 border-gray-800 shadow-2xl relative flex flex-col flex-grow min-h-[400px]">
                    <div className="flex items-center gap-3 mb-4">
                        <SparklesIcon className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl font-black uppercase tracking-widest text-white">Multimodal Planner</h2>
                    </div>
                    <textarea 
                        onPaste={handlePaste}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste your raw department lists, project mess, or event details here. You can also paste screenshots directly..."
                        className="w-full flex-grow bg-transparent text-lg text-gray-200 resize-none outline-none custom-scrollbar font-medium"
                    />
                    <div className="absolute bottom-6 right-6 flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em]">Ho Bahu Logic Enabled</span>
                    </div>
                </div>
                
                <button 
                    onClick={handleProcess}
                    disabled={isProcessing || (!inputText && pastedImages.length === 0)}
                    className="w-full py-6 bg-purple-700 hover:bg-purple-600 text-white font-black uppercase tracking-[0.3em] rounded-3xl transition-all shadow-2xl shadow-purple-900/40 active:scale-95 flex items-center justify-center gap-4 disabled:bg-gray-800"
                >
                    {isProcessing ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                            Architecting...
                        </>
                    ) : (
                        <>
                            <CubeIcon className="w-6 h-6" />
                            Run Strategic Engine
                        </>
                    )}
                </button>
            </div>

            <div className="lg:col-span-4 bg-gray-900/40 border border-gray-800 rounded-[2rem] p-6 flex flex-col">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                    <DocumentDuplicateIcon className="w-4 h-4" /> Resource Bin
                </h3>
                {pastedImages.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center opacity-30">
                        <UploadIcon className="w-12 h-12 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">Images appearing here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-2">
                        {pastedImages.map(img => (
                            <div key={img.id} className="relative group aspect-square bg-black rounded-xl overflow-hidden border border-gray-700">
                                <img src={`data:${img.mime};base64,${img.data}`} className="w-full h-full object-cover" />
                                <button onClick={() => removeImage(img.id)} className="absolute top-2 right-2 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <XCircleIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 text-[10px] text-purple-400 font-bold leading-relaxed">
                    PRO TIP: Paste screenshots of handwritten meeting notes or Excel sheets for OCR extraction.
                </div>
            </div>
        </div>
      )}

      {/* Result Stage */}
      {plan && (
        <div className="animate-fadeIn space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/80 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="bg-purple-600 p-3 rounded-2xl">
                        <CubeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Strategy Blueprint</h2>
                        <p className="text-[10px] text-pink-500 font-black uppercase tracking-[0.3em]">Architectural Suite v1.0</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPlan(null)} className="px-5 py-2.5 bg-gray-800 text-gray-400 text-xs font-black uppercase rounded-xl hover:bg-gray-700 transition-all">New Project</button>
                    <button onClick={exportPPTX} className="px-5 py-2.5 bg-purple-600 text-white text-xs font-black uppercase rounded-xl hover:bg-purple-500 transition-all flex items-center gap-2 shadow-lg shadow-purple-900/30">
                        <DownloadIcon className="w-4 h-4" /> PowerPoint
                    </button>
                    <button onClick={exportXLSX} className="px-5 py-2.5 bg-green-600 text-white text-xs font-black uppercase rounded-xl hover:bg-green-500 transition-all flex items-center gap-2 shadow-lg shadow-green-900/30">
                        <SheetIcon className="w-4 h-4" /> Spreadsheet
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mirroring Section */}
                <div className="bg-[#fffde7] rounded-[2.5rem] p-8 border-[6px] border-[#d4af37] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <BoltIcon className="w-32 h-32 text-[#d4af37]" />
                    </div>
                    <h3 className="text-[#4a148c] font-black uppercase tracking-widest text-sm mb-6 border-b border-[#4a148c]/10 pb-2">Step 1: The Mirror (Data Mirror)</h3>
                    <div className="text-gray-800 text-sm leading-relaxed font-medium whitespace-pre-wrap font-arabic">
                        {plan.mirror}
                    </div>
                </div>

                {/* Analysis Section */}
                <div className="bg-[#4a148c] rounded-[2.5rem] p-8 border-[6px] border-[#5e35b1] shadow-2xl text-white">
                    <h3 className="text-[#d4af37] font-black uppercase tracking-widest text-sm mb-6 border-b border-[#d4af37]/20 pb-2">Step 2: The Briefing (Strategic)</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest block mb-1">Executive Summary</span>
                            <p className="text-sm font-medium leading-relaxed">{plan.executiveSummary}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest block mb-1">Strategic Analysis</span>
                            <p className="text-sm font-medium leading-relaxed font-urdu text-lg">{plan.strategicAnalysis}</p>
                        </div>
                    </div>
                </div>

                {/* Gaps Section */}
                <div className="bg-gray-950 rounded-[2.5rem] p-8 border-[6px] border-gray-900 shadow-2xl">
                    <h3 className="text-pink-500 font-black uppercase tracking-widest text-sm mb-6 border-b border-pink-500/10 pb-2">Step 3: Gap Analysis</h3>
                    <ul className="space-y-4">
                        {plan.missingWorkflows.map((m: string, i: number) => (
                            <li key={i} className="flex gap-4 p-3 bg-gray-900/50 rounded-2xl border border-gray-800">
                                <div className="bg-pink-600/20 text-pink-500 w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black flex-shrink-0">!</div>
                                <span className="text-sm font-bold text-gray-300">{m}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Slides Preview Section */}
            <div>
                 <h3 className="text-lg font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <SparklesIcon className="w-5 h-5 text-purple-400" />
                    Visual Architecture (Slides)
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plan.slides.map((s: any, i: number) => (
                        <div key={i} className="bg-gray-900/40 rounded-[2rem] border border-gray-800 overflow-hidden flex flex-col group hover:border-purple-500/30 transition-all">
                            <div className="bg-gray-800/80 p-4 border-b border-gray-700/50 flex justify-between items-center">
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">SLIDE {i+1} • {s.visualSuggestion}</span>
                                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                            </div>
                            <div className="p-8 flex-grow">
                                <h4 className="text-xl font-black text-white mb-4 font-montserrat">{s.title}</h4>
                                <ul className="space-y-2 mb-6">
                                    {s.content.map((c: string, idx: number) => (
                                        <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mt-1.5"></div>
                                            {c}
                                        </li>
                                    ))}
                                </ul>
                                {s.criticalDetail && (
                                    <div className="mt-auto p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">CRITICAL DETAIL</span>
                                        <p className="text-xs text-purple-200 font-medium">{s.criticalDetail}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
      )}

      {error && (
        <div className="p-8 bg-red-900/20 border border-red-800 rounded-3xl text-center">
            <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 font-bold">{error}</p>
            <button onClick={() => setError(null)} className="mt-4 text-xs font-black uppercase text-gray-500 hover:text-white transition-colors">Dismiss</button>
        </div>
      )}
    </div>
  );
};

export default StrategicPlanner;
