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
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[var(--border-app)] pb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 rounded flex items-center justify-center">
                <Squares2x2Icon className="w-6 h-6 text-white dark:text-zinc-900" />
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight uppercase leading-none">
              Pure <span className="text-zinc-500">Organizer</span>
            </h2>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-14">Zero Word Alteration Architecture</p>
        </div>
        
        {result && (
          <div className="flex gap-2 animate-pop-in">
            <button onClick={exportPPTX} className="group flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-[var(--text-primary)] px-5 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest border border-[var(--border-app)] hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
               <DownloadIcon className="w-3.5 h-3.5" /> PPTX
            </button>
            <button onClick={exportXLSX} className="group flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-[var(--text-primary)] px-5 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest border border-[var(--border-app)] hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
               <SheetIcon className="w-3.5 h-3.5" /> EXCEL
            </button>
            <button onClick={exportDOCX} className="group flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-white active:scale-95 transition-all">
               <DocxIcon className="w-3.5 h-3.5" /> Word Report
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow min-h-0">
        {/* Left: Input */}
        <div className="flex flex-col gap-6 h-full">
           <div className="flex-grow bg-white dark:bg-zinc-950 border border-[var(--border-app)] rounded-lg p-6 flex flex-col relative overflow-hidden group focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-all shadow-elevation-1">
                <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste messy meeting notes, list items, or raw data fragments here. This engine will preserve every word exactly while grouping them into logical blocks..."
                    className="w-full h-full bg-transparent text-[var(--text-primary)] text-base leading-relaxed resize-none outline-none font-medium placeholder:text-zinc-400 custom-scrollbar"
                    dir="auto"
                />
                {inputText && (
                    <button onClick={() => {setInputText(''); setResult(null);}} className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded transition-all"><XCircleIcon className="w-5 h-5"/></button>
                )}
           </div>
           
           <button 
                onClick={handleOrganize}
                disabled={isProcessing || !inputText.trim()}
                className="w-full py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] rounded-md transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
            >
                {isProcessing ? (
                    <>
                        <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" /> 
                        Analyzing Patterns...
                    </>
                ) : (
                    <>
                        <BoltIcon className="w-4 h-4" /> 
                        Structure Verbatim Data
                    </>
                )}
           </button>
        </div>

        {/* Right: Structured Result */}
        <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-[var(--border-app)] rounded-lg p-8 overflow-y-auto custom-scrollbar shadow-elevation-1 relative">
            {!result && !isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-20 px-10">
                    <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center mb-6 border border-[var(--border-app)]">
                        <Squares2x2Icon className="w-10 h-10 text-zinc-400" />
                    </div>
                    <h4 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight mb-2">Structure Preview</h4>
                    <p className="text-xs font-medium text-zinc-500 leading-relaxed">Your data will appear here organized into distinct, verbatim categories with perfect typography.</p>
                </div>
            )}

            {isProcessing ? (
                <div className="space-y-8 py-4">
                    <div className="space-y-3">
                        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                        <SkeletonLoader lines={6} />
                    </div>
                    <div className="space-y-3">
                        <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                        <SkeletonLoader lines={4} />
                    </div>
                </div>
            ) : result ? (
                <div className="space-y-10 animate-fadeIn py-4">
                    {result.categories.map((cat: any, i: number) => {
                        const isCatRTL = isRTL(cat.heading);
                        return (
                            <div key={i} className={`group ${isCatRTL ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-flex items-center gap-2 mb-4 border-b border-zinc-900 dark:border-zinc-100 pb-1 ${isCatRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-1 h-4 bg-zinc-900 dark:bg-zinc-100"></div>
                                    <h3 className={`text-zinc-900 dark:text-zinc-100 text-[10px] font-bold uppercase tracking-widest ${isCatRTL ? 'font-arabic' : ''}`}>
                                        {cat.heading}
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {cat.items.map((item: string, idx: number) => {
                                        const isItemRTL = isRTL(item);
                                        return (
                                            <div 
                                                key={idx} 
                                                dir={isItemRTL ? 'rtl' : 'ltr'}
                                                className={`p-4 rounded bg-white dark:bg-zinc-950 border border-[var(--border-app)] hover:border-zinc-400 dark:hover:border-zinc-600 transition-all ${isItemRTL ? (item.length < 50 ? 'font-urdu text-2xl' : 'font-arabic text-lg') : 'text-sm font-medium'}`}
                                            >
                                                <p className="text-[var(--text-primary)] leading-relaxed tracking-wide">{item}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Visual Footnote */}
                    <div className="pt-8 flex items-center justify-center">
                        <div className="px-5 py-1.5 rounded border border-[var(--border-app)] bg-zinc-100 dark:bg-zinc-900 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                           End of Structured Data
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
      </div>
      
      {error && (
        <div className="p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-md text-xs font-bold text-center animate-shake">
            <div className="flex items-center justify-center gap-2 mb-1">
                <XCircleIcon className="w-4 h-4" />
                <span>PROCESSING FAULT</span>
            </div>
            <p className="opacity-70">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PureOrganizer;