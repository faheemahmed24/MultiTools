import React, { useState, useRef, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import JSZip from 'jszip';
import { analyzeImage } from '../services/geminiService';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import * as docx from 'docx';

// Configure the worker to match the library version from esm.sh
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@5.4.624/build/pdf.worker.mjs`;

interface GeneratedImage {
  src: string;
  pageNumber: number;
}

const parsePageRange = (rangeStr: string, maxPage: number): number[] => {
  const pages = new Set<number>();
  if (!rangeStr) return [];

  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmedPart = part.trim();
    if (trimmedPart.includes('-')) {
      const [start, end] = trimmedPart.split('-').map(p => parseInt(p.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          if (i > 0 && i <= maxPage) {
            pages.add(i);
          }
        }
      }
    } else {
      const page = parseInt(trimmedPart, 10);
      if (!isNaN(page) && page > 0 && page <= maxPage) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

interface PdfToImageProps {
    t: TranslationSet;
    onConversionComplete: (data: { fileName: string, pageCount: number }) => void;
}

const PdfToImage: React.FC<PdfToImageProps> = ({ t, onConversionComplete }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [scale, setScale] = useState(3);
  const [pageSelectionMode, setPageSelectionMode] = useState<'all' | 'custom'>('all');
  const [pageRange, setPageRange] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTextCopied, setIsTextCopied] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [showTextExportMenu, setShowTextExportMenu] = useState(false);

  const resetState = () => {
    setPdfFile(null);
    setIsConverting(false);
    setProgress('');
    setGeneratedImages([]);
    setPageRange('');
    setPageSelectionMode('all');
    setExtractedText('');
    setExtractionError('');
    setIsExtracting(false);
  };

  const handleFileChange = (file: File | null) => {
    if (file && file.type === 'application/pdf') {
      resetState();
      setPdfFile(file);
    } else if (file) {
      alert('Please select a PDF file.');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files ? e.target.files[0] : null);
    e.target.value = ''; // Reset file input
  };
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files && e.dataTransfer.files.length > 0 ? e.dataTransfer.files[0] : null);
  }, []);

  const handleConvert = async () => {
    if (!pdfFile) return;

    setIsConverting(true);
    setGeneratedImages([]);
    setExtractedText('');
    setExtractionError('');
    setProgress(t.converting);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result;
      if (!arrayBuffer) {
        setIsConverting(false);
        return;
      }

      try {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const images: GeneratedImage[] = [];

        let pagesToConvert: number[];

        if (pageSelectionMode === 'custom') {
            pagesToConvert = parsePageRange(pageRange, numPages);
            if (pagesToConvert.length === 0) {
                setProgress(t.invalidPageRange);
                setIsConverting(false);
                return;
            }
        } else {
            pagesToConvert = Array.from({ length: numPages }, (_, i) => i + 1);
        }
        
        const totalPagesToConvert = pagesToConvert.length;

        for (let i = 0; i < totalPagesToConvert; i++) {
          const pageNumber = pagesToConvert[i];
          setProgress(t.convertingPage.replace('{currentPage}', (i + 1).toString()).replace('{totalPages}', totalPagesToConvert.toString()));
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };
            await page.render(renderContext).promise;
            
            const mimeType = `image/${imageFormat}`;
            const src = canvas.toDataURL(mimeType, imageFormat === 'jpeg' ? 0.9 : undefined);
            images.push({ src, pageNumber });
          }
        }
        setGeneratedImages(images);
        setProgress(t.conversionComplete);
        onConversionComplete({fileName: pdfFile.name, pageCount: totalPagesToConvert });

      } catch (error) {
        console.error('Error converting PDF:', error);
        setProgress('Error during conversion.');
      } finally {
        setIsConverting(false);
      }
    };
    reader.readAsArrayBuffer(pdfFile);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const baseFilename = pdfFile?.name.replace('.pdf', '') || 'pdf-export';

    generatedImages.forEach((img) => {
      const base64Data = img.src.split(',')[1];
      zip.file(`${baseFilename}-page-${img.pageNumber}.${imageFormat}`, base64Data, { base64: true });
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseFilename}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExtractText = async () => {
    if (generatedImages.length === 0) return;
    setIsExtracting(true);
    setExtractedText('');
    setExtractionError('');
    let allText = '';
    
    try {
        for (let i = 0; i < generatedImages.length; i++) {
            const img = generatedImages[i];
            setProgress(`Extracting text from page ${img.pageNumber}...`);
            
            if (i > 0) await new Promise(resolve => setTimeout(resolve, 5000));
            
            const file = dataURLtoFile(img.src, `page-${img.pageNumber}.${imageFormat}`);
            const text = await analyzeImage(file);
            allText += `--- Page ${img.pageNumber} ---\n${text}\n\n`;
        }
        setExtractedText(allText.trim());
    } catch (err: any) {
        setExtractionError(err.message || 'An error occurred during text extraction.');
    } finally {
        setIsExtracting(false);
        setProgress('');
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    setIsTextCopied(true);
    setTimeout(() => setIsTextCopied(false), 2000);
  };

  const handleExportText = async (format: 'txt' | 'docx') => {
    if (!extractedText || !pdfFile) return;
    const baseFilename = pdfFile.name.replace('.pdf', '') || 'pdf-text-extract';
    
    const download = async (filename: string, blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    if (format === 'txt') {
        const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
        await download(`${baseFilename}.txt`, blob);
    } else if (format === 'docx') {
        const doc = new docx.Document({
            sections: [{
                children: extractedText.split('\n').map(line => new docx.Paragraph(line)),
            }],
        });
        const blob = await docx.Packer.toBlob(doc);
        await download(`${baseFilename}.docx`, blob);
    }
    setShowTextExportMenu(false);
  };

  return (
    <div className="bg-[#1a2131] rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto min-h-[60vh] lg:h-auto flex flex-col">
      {!pdfFile ? (
        <div
          className={`flex flex-col flex-grow items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-800' : 'border-gray-700 hover:border-purple-500'}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <UploadIcon className="w-16 h-16 text-gray-600 mb-6" />
          <input type="file" ref={fileInputRef} onChange={onFileChange} accept="application/pdf" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-10 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg">
            {t.uploadPdf}
          </button>
          <p className="mt-4 text-sm text-gray-500">{t.dropPdf}</p>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-black/20 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-100 text-lg truncate max-w-md">{pdfFile.name}</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={() => handleFileChange(null)} className="text-sm font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest transition-colors">Change File</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">{t.imageFormat}</label>
              <div className="flex bg-black/30 rounded-xl p-1.5 border border-white/5">
                <button onClick={() => setImageFormat('png')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${imageFormat === 'png' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>PNG</button>
                <button onClick={() => setImageFormat('jpeg')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${imageFormat === 'jpeg' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>JPEG</button>
              </div>
            </div>
            <div>
                <div className='flex justify-between items-center mb-4'>
                    <label htmlFor="scale" className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{t.qualityScale} ({scale.toFixed(1)}x)</label>
                    <span className="text-[9px] text-gray-600 uppercase tracking-widest">{t.qualityScaleDetail}</span>
                </div>
              <input
                id="scale"
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
            <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">{t.pageSelection}</label>
                <div className="flex bg-black/30 rounded-xl p-1.5 border border-white/5">
                    <button onClick={() => setPageSelectionMode('all')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${pageSelectionMode === 'all' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>{t.allPages}</button>
                    <button onClick={() => setPageSelectionMode('custom')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${pageSelectionMode === 'custom' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>{t.customRange}</button>
                </div>
                {pageSelectionMode === 'custom' && (
                    <input
                        type="text"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        placeholder={t.pageRangePlaceholder}
                        className="mt-3 w-full bg-black/40 text-gray-200 px-4 py-3 rounded-xl border border-white/10 focus:border-purple-500/50 outline-none text-sm transition-all"
                    />
                )}
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={isConverting}
            className="w-full py-5 bg-purple-600 text-white font-black uppercase tracking-[0.25em] text-sm rounded-xl hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-2xl shadow-purple-900/30 active:scale-[0.98]"
          >
            {isConverting ? progress : t.convert}
          </button>

          {progress && !isConverting && (
              <p className={`text-center mt-2 text-sm font-black uppercase tracking-widest ${progress.includes('Error') || progress.includes('invalid') ? 'text-red-500' : 'text-green-500'}`}>
                  {progress}
              </p>
          )}

          {generatedImages.length > 0 && (
            <div className="mt-8 flex-grow flex flex-col min-h-0 pt-8 border-t border-white/5">
              <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Library Nodes ({generatedImages.length})</h3>
                <div className="flex gap-2">
                  <button onClick={handleExtractText} disabled={isExtracting} className="flex items-center px-5 py-2 bg-pink-600/10 text-pink-400 border border-pink-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-pink-600 hover:text-white transition-all">
                    {isExtracting ? 'Synthesizing...' : t.extractText}
                  </button>
                  <button onClick={handleDownloadAll} className="flex items-center px-5 py-2 bg-gray-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-700 transition-all">
                    <DownloadIcon className="w-4 h-4 me-2" />
                    {t.downloadAll}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 overflow-y-auto p-1 max-h-[400px] custom-scrollbar">
                {generatedImages.map((img, index) => (
                  <div
                    key={img.pageNumber}
                    className="group relative bg-black/40 p-2 rounded-xl border border-white/5 animate-pop-in"
                  >
                    <img src={img.src} alt={`Page ${img.pageNumber}`} className="w-full h-auto rounded-lg shadow-xl" />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 rounded-xl backdrop-blur-sm">
                       <a
                        href={img.src}
                        download={`${pdfFile?.name.replace('.pdf', '') || 'page'}-${img.pageNumber}.${imageFormat}`}
                        className="p-3 bg-purple-600 rounded-full text-white hover:bg-purple-500 mb-2 shadow-2xl active:scale-90 transition-all"
                      >
                        <DownloadIcon className="w-5 h-5" />
                      </a>
                      <p className="text-white font-black text-[10px] uppercase tracking-widest">Page {img.pageNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {extractionError && <p className="text-center mt-4 text-[10px] font-black uppercase text-red-500 tracking-widest">{extractionError}</p>}

          {extractedText && (
            <div className="mt-8 bg-black/40 p-6 rounded-[2rem] border border-white/5 animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.imageAnalysisResult}</h4>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button onClick={() => setShowTextExportMenu(!showTextExportMenu)} className="flex items-center px-4 py-2 bg-gray-800 text-white text-[10px] font-black uppercase rounded-lg hover:bg-gray-700 transition-all">
                            <DownloadIcon className="w-4 h-4 me-2" /> {t.export}
                        </button>
                        {showTextExportMenu && (
                            <div onMouseLeave={() => setShowTextExportMenu(false)} className="absolute bottom-full mb-2 end-0 w-36 bg-[#0D0D15] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                                <button onClick={() => handleExportText('txt')} className="block w-full text-start px-4 py-2 text-[10px] font-black text-gray-400 hover:text-white hover:bg-purple-600 uppercase tracking-widest">TXT (.txt)</button>
                                <button onClick={() => handleExportText('docx')} className="block w-full text-start px-4 py-2 text-[10px] font-black text-gray-400 hover:text-white hover:bg-purple-600 uppercase tracking-widest">DOCX (.docx)</button>
                            </div>
                        )}
                    </div>
                    <button onClick={handleCopyText} className="flex items-center px-4 py-2 bg-gray-800 text-white text-[10px] font-black uppercase rounded-lg hover:bg-gray-700 transition-all">
                        {isTextCopied ? <CheckIcon className="w-4 h-4 me-2 text-green-500"/> : <CopyIcon className="w-4 h-4 me-2" />}
                        {isTextCopied ? t.copied : t.copy}
                    </button>
                </div>
                </div>
                <textarea readOnly value={extractedText} className="w-full h-64 bg-black/20 text-gray-300 p-4 rounded-xl resize-y border border-white/5 focus:border-purple-500/30 outline-none text-sm leading-relaxed custom-scrollbar"/>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToImage;