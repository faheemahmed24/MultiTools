
import React, { useState, useRef, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import * as mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import * as docx from 'docx';

interface WordToPdfProps {
    t: TranslationSet;
    onConversionComplete: (data: { fileName: string }) => void;
}

const WordToPdf: React.FC<WordToPdfProps> = ({ t, onConversionComplete }) => {
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [isTextCopied, setIsTextCopied] = useState(false);
  const [showTextExportMenu, setShowTextExportMenu] = useState(false);

  const resetState = () => {
    setWordFile(null);
    setIsConverting(false);
    setProgress('');
    setPdfUrl(null);
    setExtractedText('');
    setIsExtracting(false);
    setExtractionError('');
  };

  const handleFileChange = (file: File | null) => {
    const validTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (file && (validTypes.includes(file.type) || file.name.endsWith('.docx') || file.name.endsWith('.doc'))) {
      resetState();
      setWordFile(file);
    } else if (file) {
      alert('Please select a .doc or .docx file.');
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
    if (!wordFile) return;

    setIsConverting(true);
    setPdfUrl(null);
    setProgress(t.converting);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result;
      if (!arrayBuffer) {
        setIsConverting(false);
        setProgress('Error reading file.');
        return;
      }

      try {
        setProgress('Extracting content...');
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;

        setProgress(t.generatingPdf);
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'a4'
        });
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const style = document.createElement('style');
        style.innerHTML = `
          p { margin-bottom: 12px; }
          h1 { font-size: 24px; font-weight: bold; margin-bottom: 16px; margin-top: 24px; }
          h2 { font-size: 20px; font-weight: bold; margin-bottom: 14px; margin-top: 20px; }
          h3 { font-size: 16px; font-weight: bold; margin-bottom: 12px; margin-top: 16px; }
          ul, ol { padding-left: 20px; margin-bottom: 12px; }
          li { margin-bottom: 6px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { font-weight: bold; background-color: #f2f2f2; }
        `;
        tempDiv.prepend(style);
        tempDiv.style.width = '595px';
        tempDiv.style.padding = '40px';
        tempDiv.style.fontFamily = 'Times New Roman, serif';
        tempDiv.style.fontSize = '12pt';
        tempDiv.style.lineHeight = '1.5';
        tempDiv.style.boxSizing = 'border-box';
        
        // Hide it
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);


        await doc.html(tempDiv, {
            callback: (doc) => {
                const url = doc.output('bloburl');
                // Fix: Convert URL to string using unknown as intermediate type to avoid TS error
                setPdfUrl(url as unknown as string);
                setProgress(t.conversionComplete);
                onConversionComplete({fileName: wordFile.name});
            },
            x: 0,
            y: 0,
            width: 595,
            windowWidth: 595,
            autoPaging: 'text'
        });

        document.body.removeChild(tempDiv);

      } catch (error) {
        console.error('Error converting Word to PDF:', error);
        setProgress('Error during conversion.');
      } finally {
        setIsConverting(false);
      }
    };
    reader.readAsArrayBuffer(wordFile);
  };
  
  const handleExtractText = async () => {
    if (!wordFile) return;
    setIsExtracting(true);
    setExtractedText('');
    setExtractionError('');
    setProgress('');

    const reader = new FileReader();
    reader.onload = async (event) => {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) {
            setIsExtracting(false);
            setExtractionError('Error reading file.');
            return;
        }
        try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            setExtractedText(result.value);
        } catch (err) {
            setExtractionError('Could not extract text from this document.');
            console.error(err);
        } finally {
            setIsExtracting(false);
        }
    };
    reader.readAsArrayBuffer(wordFile);
  };
  
  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    setIsTextCopied(true);
    setTimeout(() => setIsTextCopied(false), 2000);
  };

  const handleExportText = async (format: 'txt' | 'docx') => {
    if (!extractedText || !wordFile) return;
    const baseFilename = wordFile.name.replace(/\.[^/.]+$/, "") || 'word-text-extract';
    
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
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] lg:h-full flex flex-col">
      {!wordFile ? (
        <div
          className={`flex flex-col flex-grow items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600 hover:border-purple-500'}`}
          onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
        >
          <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
          <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200">
            {t.uploadWord}
          </button>
          <p className="mt-2 text-sm text-gray-400">{t.dropWord}</p>
          <p className="mt-4 text-center text-gray-500 max-w-sm">{t.wordToPdfDescription}</p>
        </div>
      ) : (
        <div className="flex flex-col flex-grow items-center justify-center">
          <div className="w-full max-w-lg">
            <div className="mb-6 bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-200 truncate" title={wordFile.name}>{wordFile.name}</p>
                <p className="text-sm text-gray-400">{(wordFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => handleFileChange(null)} className="text-sm text-purple-400 hover:underline flex-shrink-0 ml-4">Change File</button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleConvert}
                    disabled={isConverting || isExtracting}
                    className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isConverting ? progress : t.convertToPdf}
                </button>
                 <button
                    onClick={handleExtractText}
                    disabled={isConverting || isExtracting}
                    className="w-full px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isExtracting ? t.analyzing : t.extractText}
                </button>
            </div>

            {pdfUrl && !isConverting && (
                <a
                    href={pdfUrl}
                    download={`${wordFile.name.replace(/\.[^/.]+$/, "")}.pdf`}
                    className="w-full mt-4 flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                    <DownloadIcon className="w-5 h-5 me-2" />
                    {t.downloadPdf}
                </a>
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

            {extractionError && <p className="text-center mt-4 font-semibold text-red-400">{extractionError}</p>}
            {(extractedText || isExtracting) && (
              <div className="mt-6 w-full">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-300">Extracted Text</h3>
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
                <textarea
                  readOnly
                  value={isExtracting ? 'Extracting text...' : extractedText}
                  className="w-full h-48 bg-gray-900/50 rounded-lg p-4 text-gray-300 resize-y border border-gray-600 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordToPdf;
