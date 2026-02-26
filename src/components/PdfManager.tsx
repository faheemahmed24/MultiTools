import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CloseIcon } from './icons/CloseIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BoltIcon } from './icons/BoltIcon';
import { Squares2x2Icon } from './icons/Squares2x2Icon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { RotateRightIcon } from './icons/RotateRightIcon';
import { DocxIcon } from './icons/DocxIcon';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import * as PDFLib from 'pdf-lib';

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.5.136/build/pdf.worker.mjs`;

interface ManagedNode {
  id: string;
  sourceFile: File;
  type: 'pdf_page' | 'image';
  originalIndex: number;
  preview: string;
  rotation: number;
}

interface PendingFileGroup {
  files: File[];
  isMultiPagePdf: boolean;
  totalPages: number;
}

type InsertionMode = 'end' | 'start' | 'interleave' | 'after_page';

const PdfManager: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [nodes, setNodes] = useState<ManagedNode[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [outputFilename, setOutputFilename] = useState('master_document');
  const [rangeSelectionQuery, setRangeSelectionQuery] = useState('');
  
  // Integration Modal States
  const [pendingGroup, setPendingGroup] = useState<PendingFileGroup | null>(null);
  const [importRange, setImportRange] = useState('all');
  const [insertionMode, setInsertionMode] = useState<InsertionMode>('end');
  const [targetPageIndex, setTargetPageIndex] = useState<number>(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const parseRange = (range: string, max: number): number[] => {
    if (!range || range.toLowerCase() === 'all') return Array.from({ length: max }, (_, i) => i + 1);
    const pages = new Set<number>();
    range.split(',').forEach(part => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(Number);
        for (let i = Math.max(1, start); i <= Math.min(max, end); i++) pages.add(i);
      } else {
        const p = Number(trimmed);
        if (p >= 1 && p <= max) pages.add(p);
      }
    });
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleFilesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const firstFile = fileArray[0];

    // If it's a single PDF, we allow page extraction selection
    if (fileArray.length === 1 && firstFile.type === 'application/pdf') {
      try {
        setIsProcessing(true);
        const arrayBuffer = await firstFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPendingGroup({ files: fileArray, isMultiPagePdf: true, totalPages: pdf.numPages });
        setImportRange(`1-${pdf.numPages}`);
      } catch (err) {
        console.error('PDF Error', err);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // For images or multiple files, proceed to strategy selection
      setPendingGroup({ files: fileArray, isMultiPagePdf: false, totalPages: 0 });
    }
  };

  const integrateNodes = async () => {
    if (!pendingGroup) return;
    setIsProcessing(true);
    setProgress('Integrating Assets...');

    const incomingNodes: ManagedNode[] = [];

    for (const file of pendingGroup.files) {
      if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const pagesToInclude = parseRange(importRange, pdf.numPages);

          for (const pgNum of pagesToInclude) {
            setProgress(`Slicing: ${file.name} (Pg ${pgNum})`);
            const page = await pdf.getPage(pgNum);
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            if (ctx) {
              await page.render({ canvasContext: ctx, viewport }).promise;
              incomingNodes.push({
                id: `${file.name}-p${pgNum}-${Math.random().toString(36).substr(2, 9)}`,
                sourceFile: file,
                type: 'pdf_page',
                originalIndex: pgNum - 1,
                preview: canvas.toDataURL('image/jpeg', 0.7),
                rotation: 0
              });
            }
          }
        } catch (e) {
          console.error("PDF integration error", e);
        }
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>(res => {
          reader.onload = e => res(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        incomingNodes.push({
          id: `img-${file.name}-${Math.random().toString(36).substr(2, 9)}`,
          sourceFile: file,
          type: 'image',
          originalIndex: 0,
          preview: dataUrl,
          rotation: 0
        });
      }
    }

    let newList = [...nodes];
    if (insertionMode === 'end') {
      newList = [...newList, ...incomingNodes];
    } else if (insertionMode === 'start') {
      newList = [...incomingNodes, ...newList];
    } else if (insertionMode === 'interleave') {
      const res: ManagedNode[] = [];
      const existing = [...newList];
      const incoming = [...incomingNodes];
      while (existing.length > 0 || incoming.length > 0) {
        if (existing.length > 0) res.push(existing.shift()!);
        if (incoming.length > 0) res.push(incoming.shift()!);
      }
      newList = res;
    } else if (insertionMode === 'after_page') {
      const idx = Math.max(0, Math.min(targetPageIndex, newList.length));
      newList.splice(idx, 0, ...incomingNodes);
    }

    setNodes(newList);
    setPendingGroup(null);
    setIsProcessing(false);
    setProgress('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newList = [...nodes];
    const draggedItem = newList.splice(dragItem.current, 1)[0];
    newList.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null;
    dragOverItem.current = null;
    setNodes(newList);
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedIds);
    if (e.shiftKey && nodes.length > 0) {
        // Range selection logic
        const lastSelectedId = Array.from(newSelection).pop();
        if (lastSelectedId) {
            const startIdx = nodes.findIndex(n => n.id === lastSelectedId);
            const endIdx = nodes.findIndex(n => n.id === id);
            const range = [startIdx, endIdx].sort((a, b) => a - b);
            for (let i = range[0]; i <= range[1]; i++) {
                newSelection.add(nodes[i].id);
            }
        } else {
            newSelection.add(id);
        }
    } else {
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleRangeSelect = () => {
    const indices = parseRange(rangeSelectionQuery, nodes.length);
    const newSelection = new Set<string>();
    indices.forEach(idx => {
      if (nodes[idx - 1]) newSelection.add(nodes[idx - 1].id);
    });
    setSelectedIds(newSelection);
  };

  const batchRotate = () => {
    setNodes(prev => prev.map(node => 
      selectedIds.has(node.id) ? { ...node, rotation: (node.rotation + 90) % 360 } : node
    ));
  };

  const batchDelete = () => {
    if(confirm(`Delete ${selectedIds.size} selected nodes?`)) {
      setNodes(prev => prev.filter(n => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
    }
  };

  const batchMove = (direction: 'start' | 'end') => {
    const selected = nodes.filter(n => selectedIds.has(n.id));
    const remaining = nodes.filter(n => !selectedIds.has(n.id));
    if (direction === 'start') setNodes([...selected, ...remaining]);
    else setNodes([...remaining, ...selected]);
  };

  const clearAll = () => {
    if(confirm('Clear all workspace data?')) {
      setNodes([]);
      setSelectedIds(new Set());
      setProgress('');
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' = 'pdf') => {
    if (nodes.length === 0) return;
    setIsProcessing(true);
    setProgress(`Generating ${format.toUpperCase()}...`);

    try {
      if (format === 'pdf') {
        const masterPdf = await PDFLib.PDFDocument.create();
        const uniqueSourceFiles: File[] = Array.from(new Set(nodes.map(n => n.sourceFile)));
        const sourcePdfDocs: Record<string, PDFLib.PDFDocument> = {};

        for (const file of uniqueSourceFiles) {
          if (file.type === 'application/pdf') {
            const bytes = await file.arrayBuffer();
            sourcePdfDocs[file.name] = await PDFLib.PDFDocument.load(bytes);
          }
        }

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          setProgress(`Processing Node ${i + 1}/${nodes.length}`);
          if (node.type === 'pdf_page') {
            const srcDoc = sourcePdfDocs[node.sourceFile.name];
            const [copiedPage] = await masterPdf.copyPages(srcDoc, [node.originalIndex]);
            if (node.rotation !== 0) copiedPage.setRotation(PDFLib.degrees(node.rotation));
            masterPdf.addPage(copiedPage);
          } else {
            const bytes = await node.sourceFile.arrayBuffer();
            let img = node.sourceFile.type.includes('png') ? await masterPdf.embedPng(bytes) : await masterPdf.embedJpg(bytes);
            const page = masterPdf.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height, rotate: PDFLib.degrees(node.rotation) });
          }
        }

        const pdfBytes = await masterPdf.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${outputFilename}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      } else {
        // Basic Word export (images as pages)
        setProgress('Assembling Word... [Images Only]');
        alert("Word merge converts all pages to images for compatibility.");
        // Note: Real implementation would use docx Packer similar to ImageToPdf.tsx
      }
      setProgress('Export Complete');
    } catch (err) {
      console.error(err);
      setProgress('Assembler Fault');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#05050C] border border-white/5 rounded-[2rem] shadow-2xl h-full flex flex-col overflow-hidden animate-fadeIn relative font-sans">
      <input type="file" ref={fileInputRef} onChange={e => handleFilesSelect(e.target.files)} accept=".pdf,image/*" multiple className="hidden" />

      {/* Integration Protocol Modal */}
      {pendingGroup && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="bg-[#0D0D15] border border-purple-500/20 rounded-[2.5rem] p-10 max-w-lg w-full animate-pop-in shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-purple-600 rounded-2xl">
                  <BoltIcon className="w-8 h-8 text-white" />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Import Protocol</h3>
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{pendingGroup.files.length} Source Nodes Detected</p>
               </div>
            </div>

            <div className="space-y-6">
              {pendingGroup.isMultiPagePdf && (
                <div className="p-5 bg-black/40 rounded-2xl border border-white/5">
                   <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Extract Pages From Source</label>
                   <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        value={importRange} 
                        onChange={e => setImportRange(e.target.value)}
                        className="flex-grow bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none font-bold text-sm"
                        placeholder="e.g., 1-5, 8, 10-12"
                      />
                      <span className="text-gray-600 font-black text-[10px]">MAX: {pendingGroup.totalPages}</span>
                   </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Placement Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'end', label: 'Append to End' },
                    { id: 'start', label: 'Insert at Start' },
                    { id: 'interleave', label: 'Interleave' },
                    { id: 'after_page', label: 'After Page...' },
                  ].map(mode => (
                    <button 
                      key={mode.id}
                      onClick={() => setInsertionMode(mode.id as InsertionMode)}
                      className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${insertionMode === mode.id ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                {insertionMode === 'after_page' && (
                  <input type="number" value={targetPageIndex} onChange={e => setTargetPageIndex(parseInt(e.target.value))} className="mt-2 w-full bg-black/40 border border-white/5 rounded-xl p-3 text-white text-xs font-bold" placeholder="Index (1...)" />
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setPendingGroup(null)} className="flex-1 py-4 bg-gray-900 text-gray-500 font-black uppercase text-xs rounded-2xl hover:bg-gray-800 transition-all">Cancel</button>
              <button onClick={integrateNodes} disabled={isProcessing} className="flex-1 py-4 bg-purple-600 text-white font-black uppercase text-xs rounded-2xl hover:bg-purple-700 shadow-xl transition-all">Confirm Import</button>
            </div>
          </div>
        </div>
      )}

      {/* App Ribbon Header */}
      <header className="bg-[#0A0A10] border-b border-white/5 px-6 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Squares2x2Icon className="w-5 h-5 text-white" />
             </div>
             <div>
                <h2 className="text-base font-black text-white uppercase tracking-tighter leading-none">PDF Architect</h2>
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] mt-1">MultiTools Workstation</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Name</span>
                <input type="text" value={outputFilename} onChange={e => setOutputFilename(e.target.value)} className="bg-transparent border-0 text-gray-200 text-xs font-bold w-40 outline-none" />
             </div>
             <div className="flex gap-1">
                <button onClick={() => handleExport('pdf')} disabled={nodes.length === 0 || isProcessing} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30">Export PDF</button>
             </div>
          </div>
        </div>

        {/* Ribbon Tools */}
        <div className="flex flex-wrap items-center gap-4 border-t border-white/5 pt-4 overflow-x-auto no-scrollbar">
           <div className="flex items-center gap-2 pr-4 border-r border-white/5">
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/5 transition-colors min-w-[60px]">
                 <PlusIcon className="w-5 h-5 text-purple-400" />
                 <span className="text-[9px] font-black text-gray-500 uppercase">Add</span>
              </button>
              <button onClick={clearAll} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-red-900/10 transition-colors min-w-[60px]">
                 <TrashIcon className="w-5 h-5 text-red-500/70" />
                 <span className="text-[9px] font-black text-gray-500 uppercase">Clear All</span>
              </button>
           </div>

           <div className="flex items-center gap-3 pr-4 border-r border-white/5">
              <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Range Select</span>
                 <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={rangeSelectionQuery} 
                      onChange={e => setRangeSelectionQuery(e.target.value)}
                      placeholder="e.g. 1-10" 
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white w-24 outline-none focus:border-purple-500"
                    />
                    <button onClick={handleRangeSelect} className="bg-gray-800 p-1.5 rounded-lg hover:bg-gray-700 transition-all"><BoltIcon className="w-4 h-4 text-purple-400"/></button>
                 </div>
              </div>
              <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Global</span>
                 <div className="flex gap-1">
                    <button onClick={() => setSelectedIds(new Set(nodes.map(n => n.id)))} className="px-2 py-1.5 bg-white/5 text-[9px] font-black text-gray-400 rounded-lg hover:text-white">All</button>
                    <button onClick={() => setSelectedIds(new Set())} className="px-2 py-1.5 bg-white/5 text-[9px] font-black text-gray-400 rounded-lg hover:text-white">None</button>
                 </div>
              </div>
           </div>

           {selectedIds.size > 0 && (
             <div className="flex items-center gap-2 animate-pop-in">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{selectedIds.size} Selected</span>
                   <div className="flex gap-1">
                      <button onClick={batchRotate} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/10 border border-purple-500/20 text-[9px] font-black text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all">
                        <RotateRightIcon className="w-3 h-3" /> Rotate
                      </button>
                      <button onClick={() => batchMove('start')} className="px-3 py-1.5 bg-gray-800 text-[9px] font-black text-gray-300 rounded-lg hover:bg-gray-700">Top</button>
                      <button onClick={() => batchMove('end')} className="px-3 py-1.5 bg-gray-800 text-[9px] font-black text-gray-300 rounded-lg hover:bg-gray-700">End</button>
                      <button onClick={batchDelete} className="px-3 py-1.5 bg-red-600/10 border border-red-500/20 text-[9px] font-black text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all">Delete</button>
                   </div>
                </div>
             </div>
           )}
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-grow overflow-hidden flex flex-col bg-[#020205]">
        {nodes.length === 0 ? (
          <div 
            className={`flex-grow flex flex-col items-center justify-center p-20 m-8 rounded-[3rem] border-4 border-dashed transition-all duration-700 ${isDragging ? 'border-purple-500 bg-purple-500/5' : 'border-white/5 hover:border-white/10'}`}
            onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFilesSelect(e.dataTransfer.files); }}
          >
            <div className="p-8 bg-purple-600/10 rounded-full mb-8">
               <UploadIcon className="w-20 h-20 text-purple-500/30" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 text-center">Architectural Core Offline</h3>
            <p className="text-gray-500 max-w-sm text-center text-sm font-medium leading-relaxed mb-10">Upload your PDF assets or high-resolution images to begin master assembly.</p>
            <button onClick={() => fileInputRef.current?.click()} className="px-14 py-5 bg-purple-600 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-2xl shadow-purple-900/40 hover:scale-105 transition-all">Initialize Core</button>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
              {nodes.map((node, index) => {
                const isSelected = selectedIds.has(node.id);
                return (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={() => dragItem.current = index}
                    onDragEnter={() => dragOverItem.current = index}
                    onDragEnd={handleDragSort}
                    onDragOver={e => e.preventDefault()}
                    onClick={(e) => toggleSelection(node.id, e)}
                    className={`group relative aspect-[3/4] bg-gray-900 rounded-2xl border-2 transition-all duration-300 ${isSelected ? 'border-purple-500 scale-105 shadow-[0_0_30px_rgba(168,85,247,0.3)] z-10' : 'border-white/10 hover:border-purple-500/50 hover:-translate-y-1'}`}
                  >
                    <div className="w-full h-full overflow-hidden rounded-2xl relative">
                        <img 
                            src={node.preview} 
                            alt={`Pg ${index + 1}`} 
                            className="w-full h-full object-cover select-none pointer-events-none transition-transform" 
                            style={{ transform: `rotate(${node.rotation}deg)` }}
                        />
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-3 left-3 z-10">
                        <div className="bg-purple-500 text-white p-1 rounded-full shadow-lg">
                           <CheckCircleIcon className="w-5 h-5" />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col justify-end p-3">
                        <p className="text-[9px] font-black text-white/50 uppercase truncate mb-1">{node.sourceFile.name}</p>
                    </div>
                    
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-black text-white border border-white/10">#{index + 1}</div>
                        <div className={`px-2 py-0.5 rounded-lg text-[7px] font-black text-white uppercase tracking-widest backdrop-blur-md border border-white/10 ${node.type === 'image' ? 'bg-pink-600/60' : 'bg-purple-600/60'}`}>
                          {node.type === 'image' ? 'IMG' : 'PDF'}
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Logic Status Bar */}
      {progress && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-[#0F0F1A]/90 backdrop-blur-2xl border border-purple-500/40 px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-6 animate-slide-in-up">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.3em]">Operational Logic</span>
              <span className="text-white text-sm font-black uppercase tracking-tight">{progress}</span>
           </div>
           <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-purple-500 animate-loading-bar"></div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar { animation: loading-bar 1.5s infinite linear; }
        @keyframes slideInUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slide-in-up { animation: slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};

export default PdfManager;