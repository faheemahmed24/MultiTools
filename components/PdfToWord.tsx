import React, { useState, useRef, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
// Heavy libraries are dynamically imported inside handlers to avoid import-time failures
import { ChevronDownIcon } from './icons/ChevronDownIcon';

// Configure the worker
// Lazy-load heavy libraries at runtime to avoid import-time failures on some hosts

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

    try {
      // read file as ArrayBuffer
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(pdfFile);
      });

      // load pdfjs dynamically
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.5.136/build/pdf.worker.mjs`;

      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const numPages = pdf.numPages;

      const paragraphs: Array<any> = [];
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
            .sort((a, b) => Number(a) - Number(b))
            .forEach(y => {
              const lineText = lines[Number(y)].sort((a, b) => a.x - b.x).map(item => item.text).join(' ');
              if (lineText.trim()) {
                allTextLines.push(lineText);
                paragraphs.push(lineText);
              }
            });
        }
      }

      setProgress(t.generatingWord);
      const textContent = allTextLines.join('\n').replace(/\f/g, '\n\n--- Page Break ---\n\n');
      setExtractedText(textContent);

      // build docx dynamically
      const docxMod = await import('docx');
      const doc = new docxMod.Document({
        sections: [{
          children: paragraphs.map((p: string) => new docxMod.Paragraph(p)),
        }],
      });

      const blob = await docxMod.Packer.toBlob(doc);
      setDocxBlob(blob);
      setProgress(t.conversionComplete);
      onConversionComplete({ fileName: pdfFile.name });

    } catch (error) {
      console.error('Error converting PDF to Word:', error);
      setProgress('Error during conversion.');
    } finally {
      setIsConverting(false);
    }
  };
  
  const handleDownload = async (format: 'docx' | 'txt' | 'pdf') => {
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
      try {
        const jsPDFMod = await import('jspdf');
        const pdfDoc = new jsPDFMod.jsPDF();
        const lines = extractedText.split('\n');
        // join lines into a single string; jspdf will wrap as needed
        pdfDoc.text(lines.join('\n'), 10, 10);
        const blob = pdfDoc.output('blob');
        download(`${baseFilename}.pdf`, blob);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
        alert('Failed to generate PDF.');
      }
    }
  };

  return (
    <div className="glass-card p-6 min-h-[60vh] lg:h-full flex flex-col">
      {!pdfFile ? (
        <div
          className={`flex flex-col flex-grow items-center justify-center p-8 dropzone-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'dragover' : ''}`}
          onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
        >
          <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
          <input type="file" ref={fileInputRef} onChange={onFileChange} accept="application/pdf" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 btn-primary text-white font-semibold rounded-lg hover:brightness-105 transition-colors duration-200">
            {t.uploadPdf}
          </button>
          <p className="mt-2 text-sm text-gray-400">{t.dropPdf}</p>
          <p className="mt-4 text-center text-gray-500 max-w-sm">{t.pdfToWordDescription}</p>
        </div>
      ) : (
        <div className="flex flex-col flex-grow items-center justify-center">
          <div className="w-full max-w-lg">
            <div className="mb-6 obsidian-card p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-200 truncate" title={pdfFile.name}>{pdfFile.name}</p>
                <p className="text-sm text-gray-400">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => handleFileChange(null)} className="text-sm text-purple-400 hover:underline flex-shrink-0 ml-4">Change File</button>
            </div>
            
            {!docxBlob ? (
                <button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="w-full px-6 py-3 btn-primary text-white font-semibold rounded-lg disabled:opacity-60 transition-colors duration-200"
                >
                  {isConverting ? progress : t.convert}
                </button>
            ) : (
                 <div className="relative w-full" onMouseLeave={() => setShowDownloadMenu(false)}>
                    <button
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      className="w-full flex items-center justify-center px-6 py-3 btn-primary text-white font-semibold rounded-lg transition-colors duration-200"
                    >
                        <DownloadIcon className="w-5 h-5 me-2" />
                        {t.download}
                        <ChevronDownIcon className="w-5 h-5 ms-2" />
                    </button>
                    {showDownloadMenu && (
                         <div className="absolute bottom-full mb-2 w-full bg-gray-600 rounded-lg shadow-xl py-1 z-10">
                            <button onClick={() => handleDownload('docx')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">Word (.docx)</button>
                            <button onClick={() => handleDownload('txt')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">Text (.txt)</button>
                            <button onClick={() => handleDownload('pdf')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">PDF (.pdf)</button>
                         </div>
                    )}
                </div>
            )}
            
            {progress && (
                <div className="text-center mt-4">
                    {isConverting ? (
                        <>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                            <p className="mt-2 text-gray-300">{progress}</p>
                        </>
                    ) : (
                       <p className={`font-semibold ${progress.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{progress}</p>
                    )}
                </div>
            )}

            {extractedText && !isConverting && (
              <div className="mt-6 w-full obsidian-card p-4 rounded-lg">
                <h3 className="font-semibold text-gray-300 mb-2">Extracted Text Preview</h3>
                <textarea
                  readOnly
                  value={extractedText}
                  className="w-full h-48 bg-transparent text-gray-300 p-2 resize-y border-0 focus:ring-0"
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