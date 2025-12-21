
import React, { useState, useRef, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
// pdfjs-dist is lazy-loaded to avoid import-time issues in some hosting environments
import { analyzeImage } from '../services/geminiService';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import * as docx from 'docx';


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
        const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.5.136/build/pdf.worker.mjs`;
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
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
    const jszipMod = await import('jszip');
    const JSZip = jszipMod.default || jszipMod;
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
            setProgress(`Extracting text from page ${img.pageNumber} (pacing for API limits)...`);
            
            // Rate limiting: Add SIGNIFICANT delay between requests to avoid 429 errors (15 RPM max = 4s per req)
            // We use 5000ms to be safe.
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
      const docxMod = await import('docx');
      const doc = new docxMod.Document({
        sections: [{
          children: extractedText.split('\n').map((line: string) => new docxMod.Paragraph(line)),
        }],
      });
      const blob = await docxMod.Packer.toBlob(doc);
      await download(`${baseFilename}.docx`, blob);
    }
    setShowTextExportMenu(false);
  };

  return (
    <div className="glass-card p-6 min-h-[60vh] lg:h-full flex flex-col">
      {!pdfFile ? (
        <div
          className={`flex flex-col flex-grow items-center justify-center p-8 dropzone-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'dragover' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
          <input type="file" ref={fileInputRef} onChange={onFileChange} accept="application/pdf" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 btn-primary text-white font-semibold rounded-lg hover:brightness-105 transition-colors duration-200">
            {t.uploadPdf}
          </button>
          <p className="mt-2 text-sm text-gray-400">{t.dropPdf}</p>
        </div>
      ) : (
        <>
          <div className="mb-6 obsidian-card p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-200">{pdfFile.name}</p>
              <p className="text-sm text-gray-400">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={() => handleFileChange(null)} className="text-sm text-purple-400 hover:underline">Change File</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.imageFormat}</label>
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button onClick={() => setImageFormat('png')} className={`w-full py-2 rounded-md transition-colors ${imageFormat === 'png' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>PNG</button>
                <button onClick={() => setImageFormat('jpeg')} className={`w-full py-2 rounded-md transition-colors ${imageFormat === 'jpeg' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>JPEG</button>
              </div>
            </div>
            <div>
                <div className='flex justify-between items-center mb-2'>
                    <label htmlFor="scale" className="text-sm font-medium text-gray-300">{t.qualityScale} ({scale.toFixed(1)}x)</label>
                    <span className="text-xs text-gray-400">{t.qualityScaleDetail}</span>
                </div>
              <input
                id="scale"
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.pageSelection}</label>
                <div className="flex bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setPageSelectionMode('all')} className={`w-full py-2 rounded-md transition-colors ${pageSelectionMode === 'all' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>{t.allPages}</button>
                    <button onClick={() => setPageSelectionMode('custom')} className={`w-full py-2 rounded-md transition-colors ${pageSelectionMode === 'custom' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>{t.customRange}</button>
                </div>
                {pageSelectionMode === 'custom' && (
                    <input
                        type="text"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        placeholder={t.pageRangePlaceholder}
                        className="mt-2 w-full bg-gray-900/50 text-gray-200 px-3 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500"
                    />
                )}
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={isConverting}
            className="w-full px-6 py-3 btn-primary text-white font-semibold rounded-lg disabled:opacity-60 transition-colors duration-200"
          >
            {isConverting ? progress : t.convert}
          </button>

          {progress && !isConverting && <p className={`text-center mt-4 font-semibold ${progress === t.invalidPageRange ? 'text-red-400' : 'text-green-400'}`}>{progress}</p>}

          {generatedImages.length > 0 && (
            <div className="mt-6 flex-grow flex flex-col min-h-0">
              <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-200">Results ({generatedImages.length} images)</h3>
                <div className="flex gap-2">
                  <button onClick={handleExtractText} disabled={isExtracting} className="flex items-center px-4 py-2 btn-primary font-semibold rounded-lg disabled:opacity-60 transition-colors duration-200">
                    {isExtracting ? (isConverting ? progress : t.analyzing) : t.extractText}
                  </button>
                  <button onClick={handleDownloadAll} className="flex items-center px-4 py-2 obsidian-card text-white font-semibold rounded-lg transition-colors duration-200">
                    <DownloadIcon className="w-5 h-5 me-2" />
                    {t.downloadAll}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto p-1 -m-1 flex-grow">
                {generatedImages.map((img, index) => (
                  <div
                    key={img.pageNumber}
                    className="group relative obsidian-card p-2 rounded-lg animate-pop-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <img src={img.src} alt={`Page ${img.pageNumber}`} className="w-full h-auto rounded-md" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                       <a
                        href={img.src}
                        download={`${pdfFile?.name.replace('.pdf', '') || 'page'}-${img.pageNumber}.${imageFormat}`}
                        title={t.downloadPage.replace('{pageNumber}', img.pageNumber.toString())}
                        className="p-3 btn-primary rounded-full text-white mb-2"
                      >
                        <DownloadIcon className="w-6 h-6" />
                      </a>
                      <p className="text-white font-bold text-sm">Page {img.pageNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {extractionError && <p className="text-center mt-4 font-semibold text-red-400">{extractionError}</p>}

          {extractedText && (
            <div className="mt-4 obsidian-card p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-200">{t.imageAnalysisResult}</h4>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button onClick={() => setShowTextExportMenu(!showTextExportMenu)} className="flex items-center px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm">
                            <DownloadIcon className="w-4 h-4 me-2" /> {t.export}
                        </button>
                        {showTextExportMenu && (
                            <div onMouseLeave={() => setShowTextExportMenu(false)} className="absolute top-full mt-2 end-0 w-36 bg-gray-600 rounded-lg shadow-xl py-1 z-10 animate-slide-in-up">
                                <button onClick={() => handleExportText('txt')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">TXT (.txt)</button>
                                <button onClick={() => handleExportText('docx')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">DOCX (.docx)</button>
                            </div>
                        )}
                    </div>
                    <button onClick={handleCopyText} className="flex items-center px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm">
                        {isTextCopied ? <CheckIcon className="w-4 h-4 me-2"/> : <CopyIcon className="w-4 h-4 me-2" />}
                        {isTextCopied ? t.copied : t.copy}
                    </button>
                </div>
                </div>
                <textarea readOnly value={extractedText} className="w-full h-48 bg-gray-800 text-gray-300 p-2 rounded-md resize-y border-gray-700 focus:ring-purple-500 focus:border-purple-500"/>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PdfToImage;
