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
    <div className="bg-white dark:bg-zinc-950 border border-[var(--border-app)] rounded-lg shadow-elevation-1 h-full flex flex-col overflow-hidden animate-fadeIn relative font-sans">
      <input type="file" ref={fileInputRef} onChange={e => handleFilesSelect(e.target.files)} accept=".pdf,image/*" multiple className="hidden" />

      {/* Integration Protocol Modal */}
      {pendingGroup && (
        <div className="fixed inset-0 z-[100] bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-[var(--border-app)] rounded-lg p-8 max-w-lg w-full animate-pop-in shadow-elevation-2">
            <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-zinc-900 dark:bg-zinc-100 rounded">
                  <BoltIcon className="w-6 h-6 text-white dark:text-zinc-900" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Import Protocol</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{pendingGroup.files.length} Source Nodes Detected</p>
               </div>
            </div>

            <div className="space-y-6">
              {pendingGroup.isMultiPagePdf && (
                <div className="p-5 bg-zinc-50 dark:bg-zinc-950 rounded border border-[var(--border-app)]">
                   <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Extract Pages From Source</label>
                   <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        value={importRange} 
                        onChange={e => setImportRange(e.target.value)}
                        className="flex-grow bg-white dark:bg-zinc-900 border border-[var(--border-app)] rounded px-4 py-2.5 text-[var(--text-primary)] focus:border-zinc-900 dark:focus:border-zinc-100 outline-none font-bold text-sm"
                        placeholder="e.g., 1-5, 8, 10-12"
                      />
                      <span className="text-zinc-400 font-bold text-[10px]">MAX: {pendingGroup.totalPages}</span>
                   </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Placement Strategy</label>
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
                      className={`py-2.5 rounded border text-[10px] font-bold uppercase tracking-widest transition-all ${insertionMode === mode.id ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900' : 'bg-white dark:bg-zinc-950 border-[var(--border-app)] text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                {insertionMode === 'after_page' && (
                  <input type="number" value={targetPageIndex} onChange={e => setTargetPageIndex(parseInt(e.target.value))} className="mt-2 w-full bg-white dark:bg-zinc-950 border border-[var(--border-app)] rounded p-2.5 text-[var(--text-primary)] text-xs font-bold" placeholder="Index (1...)" />
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button onClick={() => setPendingGroup(null)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold uppercase text-[10px] tracking-widest rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">Cancel</button>
              <button onClick={integrateNodes} disabled={isProcessing} className="flex-1 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase text-[10px] tracking-widest rounded hover:bg-zinc-800 dark:hover:bg-white transition-all">Confirm Import</button>
            </div>
          </div>
        </div>
      )}

      {/* App Ribbon Header */}
      <header className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-[var(--border-app)] px-6 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded flex items-center justify-center">
                <Squares2x2Icon className="w-4 h-4 text-white dark:text-zinc-900" />
             </div>
             <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">PDF Architect</h2>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">MultiTools Workstation</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded border border-[var(--border-app)]">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Name</span>
                <input type="text" value={outputFilename} onChange={e => setOutputFilename(e.target.value)} className="bg-transparent border-0 text-[var(--text-primary)] text-xs font-bold w-40 outline-none" />
             </div>
             <div className="flex gap-1">
                <button onClick={() => handleExport('pdf')} disabled={nodes.length === 0 || isProcessing} className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30">Export PDF</button>
             </div>
          </div>
        </div>

        {/* Ribbon Tools */}
        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border-app)] pt-4 overflow-x-auto no-scrollbar">
           <div className="flex items-center gap-2 pr-4 border-r border-[var(--border-app)]">
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-w-[60px]">
                 <PlusIcon className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                 <span className="text-[9px] font-bold text-zinc-400 uppercase">Add</span>
              </button>
              <button onClick={clearAll} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors min-w-[60px]">
                 <TrashIcon className="w-4 h-4 text-red-500/70" />
                 <span className="text-[9px] font-bold text-zinc-400 uppercase">Clear All</span>
              </button>
           </div>

           <div className="flex items-center gap-3 pr-4 border-r border-[var(--border-app)]">
              <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Range Select</span>
                 <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={rangeSelectionQuery} 
                      onChange={e => setRangeSelectionQuery(e.target.value)}
                      placeholder="e.g. 1-10" 
                      className="bg-white dark:bg-zinc-950 border border-[var(--border-app)] rounded px-3 py-1.5 text-[10px] text-[var(--text-primary)] w-24 outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    />
                    <button onClick={handleRangeSelect} className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"><BoltIcon className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100"/></button>
                 </div>
              </div>
              <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Global</span>
                 <div className="flex gap-1">
                    <button onClick={() => setSelectedIds(new Set(nodes.map(n => n.id)))} className="px-2 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-zinc-500 rounded hover:text-[var(--text-primary)]">All</button>
                    <button onClick={() => setSelectedIds(new Set())} className="px-2 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-zinc-500 rounded hover:text-[var(--text-primary)]">None</button>
                 </div>
              </div>
           </div>

           {selectedIds.size > 0 && (
             <div className="flex items-center gap-2 animate-pop-in">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{selectedIds.size} Selected</span>
                   <div className="flex gap-1">
                      <button onClick={batchRotate} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-[9px] font-bold text-white dark:text-zinc-900 rounded hover:bg-zinc-800 dark:hover:bg-white transition-all">
                        <RotateRightIcon className="w-3 h-3" /> Rotate
                      </button>
                      <button onClick={() => batchMove('start')} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-zinc-500 rounded hover:text-[var(--text-primary)]">Top</button>
                      <button onClick={() => batchMove('end')} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-zinc-500 rounded hover:text-[var(--text-primary)]">End</button>
                      <button onClick={batchDelete} className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-[9px] font-bold text-red-600 dark:text-red-400 rounded hover:bg-red-600 hover:text-white transition-all">Delete</button>
                   </div>
                </div>
             </div>
           )}
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-grow overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950">
        {nodes.length === 0 ? (
          <div 
            className={`flex-grow flex flex-col items-center justify-center p-20 m-8 rounded-lg border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-900' : 'border-[var(--border-app)] hover:border-zinc-400 dark:hover:border-zinc-600'}`}
            onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFilesSelect(e.dataTransfer.files); }}
          >
            <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-6">
               <UploadIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] uppercase tracking-tight mb-2 text-center">Architectural Core Offline</h3>
            <p className="text-zinc-500 max-w-sm text-center text-xs font-medium leading-relaxed mb-8">Upload your PDF assets or high-resolution images to begin master assembly.</p>
            <button onClick={() => fileInputRef.current?.click()} className="px-10 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-zinc-800 dark:hover:bg-white transition-all active:scale-95">Initialize Core</button>
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
                    className={`group relative aspect-[3/4] bg-white dark:bg-zinc-900 rounded border transition-all duration-300 ${isSelected ? 'border-zinc-900 dark:border-zinc-100 scale-105 shadow-elevation-2 z-10' : 'border-[var(--border-app)] hover:border-zinc-400 dark:hover:border-zinc-600 hover:-translate-y-0.5'}`}
                  >
                    <div className="w-full h-full overflow-hidden rounded relative">
                        <img 
                            src={node.preview} 
                            alt={`Pg ${index + 1}`} 
                            className="w-full h-full object-cover select-none pointer-events-none transition-transform" 
                            style={{ transform: `rotate(${node.rotation}deg)` }}
                        />
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-0.5 rounded-full shadow-elevation-1">
                           <CheckCircleIcon className="w-4 h-4" />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col justify-end p-2">
                        <p className="text-[8px] font-bold text-white/70 uppercase truncate mb-1">{node.sourceFile.name}</p>
                    </div>
                    
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-[var(--text-primary)] border border-[var(--border-app)]">#{index + 1}</div>
                        <div className={`px-1.5 py-0.5 rounded text-[7px] font-bold text-white dark:text-zinc-900 uppercase tracking-widest backdrop-blur-sm ${node.type === 'image' ? 'bg-zinc-500/80' : 'bg-zinc-900/80 dark:bg-zinc-100/80'}`}>
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
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-white dark:bg-zinc-900 border border-[var(--border-app)] px-8 py-4 rounded shadow-elevation-2 flex items-center gap-6 animate-slide-in-up">
           <div className="flex flex-col">
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Operational Logic</span>
              <span className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-tight">{progress}</span>
           </div>
           <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-zinc-900 dark:bg-zinc-100 animate-loading-bar"></div>
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