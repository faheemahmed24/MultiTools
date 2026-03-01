import React, { useState, useRef, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import * as docx from 'docx';
import { jsPDF } from 'jspdf';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

// Configure the worker to match the library version from esm.sh
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@5.4.624/build/pdf.worker.mjs`;

interface PdfToWordProps {
    t: TranslationSet;
    onConversionComplete: (data: { fileName: string }) => void;
}

const PdfToWord: React.FC<PdfToWordProps> = ({ t, onConversionComplete }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setPdfFile(null);
    setIsConverting(false);
    setProgress('');
    setExtractedText('');
    setDocxBlob(null);
    setShowDownloadMenu(false);
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
    if(e.target) e.target.value = '';
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
    setDocxBlob(null);
    setExtractedText('');
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
        
        const paragraphs: docx.Paragraph[] = [];
        const allTextLines: string[] = [];

        for (let i = 1; i <= numPages; i++) {
          setProgress(t.convertingPage.replace('{currentPage}', i.toString()).replace('{totalPages}', numPages.toString()));
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          if (textContent.items.length > 0) {
            const lines = textContent.items.reduce((acc: Record<number, {x: number, text: string}[]>, item: any) => {
              const y = Math.round(item.transform[5]);
              if (!acc[y]) acc[y] = [];
              acc[y].push({ x: Math.round(item.transform[4]), text: item.str });
              return acc;
            }, {} as Record<number, {x: number, text: string}[]>);

            Object.keys(lines)
              .sort((a: string, b: string) => Number(b) - Number(a))
              .forEach(y => {
                const lineText = lines[Number(y)].sort((a: {x: number}, b: {x: number}) => a.x - b.x).map(item => item.text).join(' ');
                if (lineText.trim()) {
                  paragraphs.push(new docx.Paragraph(lineText));
                  allTextLines.push(lineText);
                }
              });
          }
           if (i < numPages) {
            paragraphs.push(new docx.Paragraph({ children: [new docx.PageBreak()] }));
            allTextLines.push('\f'); // Form feed for page break
          }
        }
        
        setProgress(t.generatingWord);
        const textContent = allTextLines.join('\n').replace(/\f/g, '\n\n--- Page Break ---\n\n');
        setExtractedText(textContent);
        const doc = new docx.Document({
            sections: [{
                children: paragraphs,
            }],
        });

        const blob = await docx.Packer.toBlob(doc);
        setDocxBlob(blob);
        setProgress(t.conversionComplete);
        onConversionComplete({fileName: pdfFile.name});
        
      } catch (error) {
        console.error('Error converting PDF to Word:', error);
        setProgress('Error during conversion.');
      } finally {
        setIsConverting(false);
      }
    };
    reader.readAsArrayBuffer(pdfFile);
  };
  
  const handleDownload = (format: 'docx' | 'txt' | 'pdf') => {
    if (!pdfFile) return;
    const baseFilename = pdfFile.name.replace(/\.[^/.]+$/, "");
    const download = (filename: string, blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowDownloadMenu(false);
    }

    if (format === 'docx' && docxBlob) {
        download(`${baseFilename}.docx`, docxBlob);
    } else if (format === 'txt') {
        const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
        download(`${baseFilename}.txt`, blob);
    } else if (format === 'pdf') {
        const doc = new jsPDF();
        const lines = extractedText.split('\n');
        doc.text(lines, 10, 10);
        const blob = doc.output('blob');
        download(`${baseFilename}.pdf`, blob);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-[var(--border-app)] rounded-lg shadow-elevation-1 p-8 min-h-[60vh] lg:h-full flex flex-col animate-fadeIn">
      {!pdfFile ? (
        <div
          className={`flex flex-col flex-grow items-center justify-center p-12 border-2 border-dashed rounded-lg transition-all duration-300 ${isDragging ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900' : 'border-[var(--border-app)] hover:border-zinc-400 dark:hover:border-zinc-600'}`}
          onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
        >
          <UploadIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-6" />
          <input type="file" ref={fileInputRef} onChange={onFileChange} accept="application/pdf" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-zinc-800 dark:hover:bg-white transition-all active:scale-95">
            {t.uploadPdf}
          </button>
          <p className="mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.dropPdf}</p>
          <p className="mt-6 text-center text-zinc-500 max-w-sm text-xs font-medium leading-relaxed">{t.pdfToWordDescription}</p>
        </div>
      ) : (
        <div className="flex flex-col flex-grow items-center justify-center">
          <div className="w-full max-w-lg">
            <div className="mb-8 bg-zinc-50 dark:bg-zinc-900 border border-[var(--border-app)] p-5 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-bold text-[var(--text-primary)] truncate text-sm" title={pdfFile.name}>{pdfFile.name}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => handleFileChange(null)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 uppercase tracking-widest transition-colors">Change File</button>
            </div>
            
            {!docxBlob ? (
                <button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="w-full px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-zinc-800 dark:hover:bg-white disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    {isConverting ? progress : t.convert}
                </button>
            ) : (
                 <div className="relative w-full" onMouseLeave={() => setShowDownloadMenu(false)}>
                    <button
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        className="w-full flex items-center justify-center px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-zinc-800 dark:hover:bg-white transition-all active:scale-95"
                    >
                        <DownloadIcon className="w-4 h-4 me-2" />
                        {t.download}
                        <ChevronDownIcon className="w-4 h-4 ms-2" />
                    </button>
                    {showDownloadMenu && (
                         <div className="absolute bottom-full mb-2 w-full bg-white dark:bg-zinc-900 border border-[var(--border-app)] rounded shadow-elevation-2 py-1 z-10 animate-pop-in">
                            <button onClick={() => handleDownload('docx')} className="block w-full text-start px-5 py-2.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 uppercase tracking-widest">Word (.docx)</button>
                            <button onClick={() => handleDownload('txt')} className="block w-full text-start px-5 py-2.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 uppercase tracking-widest">Text (.txt)</button>
                            <button onClick={() => handleDownload('pdf')} className="block w-full text-start px-5 py-2.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 uppercase tracking-widest">PDF (.pdf)</button>
                         </div>
                    )}
                </div>
            )}
            
            {progress && (
                <div className="text-center mt-6">
                    {isConverting ? (
                        <>
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100 mx-auto"></div>
                            <p className="mt-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{progress}</p>
                        </>
                    ) : (
                       <p className={`text-[10px] font-bold uppercase tracking-widest ${progress.includes('Error') ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-100'}`}>{progress}</p>
                    )}
                </div>
            )}

            {extractedText && !isConverting && (
              <div className="mt-8 w-full animate-fadeIn">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Extracted Text Preview</h3>
                <textarea
                  readOnly
                  value={extractedText}
                  className="w-full h-48 bg-zinc-50 dark:bg-zinc-900 border border-[var(--border-app)] rounded-lg p-5 text-[var(--text-primary)] text-sm leading-relaxed resize-y outline-none focus:border-zinc-400 dark:focus:border-zinc-600 custom-scrollbar"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToWord;