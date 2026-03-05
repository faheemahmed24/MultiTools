import React, { useState } from 'react';
import type { TranslationSet } from '../types';
import { pureOrganizeData } from '../services/geminiService';
import { Squares2x2Icon } from './icons/Squares2x2Icon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SheetIcon } from './icons/SheetIcon';
import { DocxIcon } from './icons/DocxIcon';
import { BoltIcon } from './icons/BoltIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SkeletonLoader } from './Loader';
import PptxGenJS from 'pptxgenjs';
import * as XLSX from 'xlsx';
import * as docx from 'docx';

const PureOrganizer: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRTL = (text: string) => {
    // Fixed Regex: Using a more robust character set range for RTL languages (Arabic, Urdu, Persian, Hebrew)
    const rtlChars = /[\u0590-\u083F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlChars.test(text);
  };

  const handleOrganize = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const data = await pureOrganizeData(inputText);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to organize data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportPPTX = () => {
    if (!result) return;
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    // Title Slide with Premium Design
    let slide = pptx.addSlide();
    slide.background = { color: '05050C' };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: 'A855F7' } });
    slide.addText('ORGANIZED DATA REPORT', { 
        x: 0.5, y: 2.0, w: '90%', fontSize: 44, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Montserrat' 
    });
    slide.addText('Verbatim Extraction Engine v3.0', { 
        x: 0.5, y: 3.2, w: '90%', fontSize: 18, color: 'A855F7', align: 'center', italic: true 
    });

    // Data Slides
    result.categories.forEach((cat: any) => {
      let s = pptx.addSlide();
      s.background = { color: 'FFFFFF' };
      s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.4, h: '100%', fill: { color: 'F3E8FF' } });
      
      const isArabic = isRTL(cat.heading);
      
      s.addText(cat.heading.toUpperCase(), { 
        x: 0.6, y: 0.4, w: '90%', fontSize: 28, color: '6B21A8', bold: true, 
        align: isArabic ? 'right' : 'left'
      });

      const content = cat.items.join('\n\n');
      s.addText(content, { 
        x: 0.6, y: 1.2, w: '85%', h: 5.5, fontSize: 14, color: '374151',
        align: isRTL(content) ? 'right' : 'left',
        rtl: isRTL(content)
      } as any);
    });

    pptx.writeFile({ fileName: `MultiTools-Organized-${Date.now()}.pptx` });
  };

  const exportXLSX = () => {
    if (!result) return;
    const ws = XLSX.utils.json_to_sheet(result.structuredTable);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Verbatim_Data");
    XLSX.writeFile(wb, `MultiTools-Data-${Date.now()}.xlsx`);
  };

  const exportDOCX = async () => {
    if (!result) return;
    const sections = result.categories.map((cat: any) => {
        const isHeadingRTL = isRTL(cat.heading);
        return [
            new docx.Paragraph({ 
                text: cat.heading, 
                heading: docx.HeadingLevel.HEADING_1,
                bidirectional: isHeadingRTL,
                alignment: isHeadingRTL ? docx.AlignmentType.RIGHT : docx.AlignmentType.LEFT,
                spacing: { before: 400, after: 200 }
            }),
            ...cat.items.map((item: string) => {
                const isItemRTL = isRTL(item);
                return new docx.Paragraph({ 
                    text: item, 
                    bullet: { level: 0 },
                    bidirectional: isItemRTL,
                    alignment: isItemRTL ? docx.AlignmentType.RIGHT : docx.AlignmentType.LEFT,
                    spacing: { after: 120 }
                });
            }),
            new docx.Paragraph({ text: "" })
        ];
    }).flat();

    const doc = new docx.Document({ 
        sections: [{ 
            properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
            children: sections 
        }] 
    });
    const blob = await docx.Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Organized-Report-${Date.now()}.docx`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn max-w-7xl mx-auto w-full gap-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <Squares2x2Icon className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
              Pure <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-600">Organizer</span>
            </h2>
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-16">Zero Word Alteration Architecture</p>
        </div>
        
        {result && (
          <div className="flex gap-3 animate-pop-in">
            <button onClick={exportPPTX} className="group flex items-center gap-3 bg-white/5 hover:bg-purple-600/20 text-gray-300 hover:text-purple-400 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-white/10 hover:border-purple-500/30 transition-all">
               <DownloadIcon className="w-4 h-4" /> PPTX
            </button>
            <button onClick={exportXLSX} className="group flex items-center gap-3 bg-white/5 hover:bg-green-600/20 text-gray-300 hover:text-green-400 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-white/10 hover:border-green-500/30 transition-all">
               <SheetIcon className="w-4 h-4" /> EXCEL
            </button>
            <button onClick={exportDOCX} className="group flex items-center gap-3 bg-purple-600 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 hover:scale-105 active:scale-95 transition-all">
               <DocxIcon className="w-4 h-4" /> Word Report
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-grow min-h-0">
        {/* Left: Input */}
        <div className="flex flex-col gap-6 h-full">
           <div className="flex-grow bg-[#0A0A15] border border-white/5 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden group focus-within:border-purple-500/30 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-[80px] -z-10 group-focus-within:bg-purple-600/10 transition-all"></div>
                <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste messy meeting notes, list items, or raw data fragments here. This engine will preserve every word exactly while grouping them into logical blocks..."
                    className="w-full h-full bg-transparent text-gray-300 text-lg leading-relaxed resize-none outline-none font-medium placeholder:text-gray-700 custom-scrollbar"
                    dir="auto"
                />
                {inputText && (
                    <button onClick={() => {setInputText(''); setResult(null);}} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-xl transition-all"><XCircleIcon className="w-6 h-6"/></button>
                )}
           </div>
           
           <button 
                onClick={handleOrganize}
                disabled={isProcessing || !inputText.trim()}
                className="w-full py-6 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-black uppercase tracking-[0.3em] text-xs rounded-3xl transition-all shadow-2xl shadow-purple-900/40 active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-30 disabled:grayscale"
            >
                {isProcessing ? (
                    <>
                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" /> 
                        Analyzing Patterns...
                    </>
                ) : (
                    <>
                        <BoltIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
                        Structure Verbatim Data
                    </>
                )}
           </button>
        </div>

        {/* Right: Structured Result */}
        <div className="bg-[#0A0A10]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 overflow-y-auto custom-scrollbar shadow-2xl relative">
            {!result && !isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-20 px-10">
                    <div className="w-32 h-32 bg-purple-500/10 rounded-full flex items-center justify-center mb-8 border border-purple-500/20">
                        <Squares2x2Icon className="w-12 h-12 text-purple-400" />
                    </div>
                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Structure Preview</h4>
                    <p className="text-sm font-medium text-gray-400 leading-relaxed">Your data will appear here organized into distinct, verbatim categories with perfect typography.</p>
                </div>
            )}

            {isProcessing ? (
                <div className="space-y-10 py-4">
                    <div className="space-y-4">
                        <div className="h-4 w-32 bg-purple-500/10 rounded-full animate-pulse"></div>
                        <SkeletonLoader lines={6} />
                    </div>
                    <div className="space-y-4">
                        <div className="h-4 w-40 bg-purple-500/10 rounded-full animate-pulse"></div>
                        <SkeletonLoader lines={4} />
                    </div>
                </div>
            ) : result ? (
                <div className="space-y-12 animate-fadeIn py-4">
                    {result.categories.map((cat: any, i: number) => {
                        const isCatRTL = isRTL(cat.heading);
                        return (
                            <div key={i} className={`group ${isCatRTL ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-flex items-center gap-3 mb-6 border-b-2 border-purple-500/30 pb-2 ${isCatRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                                    <h3 className={`text-purple-400 text-sm font-black uppercase tracking-[0.25em] ${isCatRTL ? 'font-arabic' : ''}`}>
                                        {cat.heading}
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {cat.items.map((item: string, idx: number) => {
                                        const isItemRTL = isRTL(item);
                                        return (
                                            <div 
                                                key={idx} 
                                                dir={isItemRTL ? 'rtl' : 'ltr'}
                                                className={`p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-all group-hover:bg-white/[0.03] ${isItemRTL ? (item.length < 50 ? 'font-urdu text-3xl' : 'font-arabic text-xl') : 'text-base font-medium'}`}
                                            >
                                                <p className="text-gray-200 leading-relaxed tracking-wide">{item}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Visual Footnote */}
                    <div className="pt-10 flex items-center justify-center">
                        <div className="px-6 py-2 rounded-full border border-white/5 bg-white/[0.01] text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
                           End of Structured Data
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
      </div>
      
      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl text-sm font-bold text-center animate-shake">
            <div className="flex items-center justify-center gap-3 mb-1">
                <XCircleIcon className="w-5 h-5" />
                <span>HEAVY PROCESSING FAULT</span>
            </div>
            <p className="opacity-60">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PureOrganizer;