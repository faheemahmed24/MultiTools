import React, { useState, useRef, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import * as mammoth from 'mammoth';
import { jsPDF } from 'jspdf';

const WordToPdf: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setWordFile(null);
    setIsConverting(false);
    setProgress('');
    setPdfUrl(null);
  };

  const handleFileChange = (file: File | null) => {
    const validTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (file && validTypes.includes(file.type)) {
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
        
        // This is a workaround for jspdf's html method which can be tricky with complex styles.
        // We create a temporary iframe to render the HTML, then use html2canvas via jspdf.
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '210mm'; // A4 width
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) {
          throw new Error("Could not create iframe for rendering.");
        }

        iframeDoc.open();
        iframeDoc.write('<html><head><style>body { font-family: sans-serif; line-height: 1.5; } img { max-width: 100%; height: auto; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; } </style></head><body>' + html + '</body></html>');
        iframeDoc.close();

        await new Promise(resolve => setTimeout(resolve, 100)); // Allow rendering time

        await doc.html(iframeDoc.body, {
            callback: (doc) => {
                const url = doc.output('bloburl');
                setPdfUrl(url as string);
                setProgress(t.conversionComplete);
            },
            x: 15,
            y: 15,
            width: 565, // A4 width in points minus margins
            windowWidth: iframeDoc.documentElement.scrollWidth
        });

        document.body.removeChild(iframe);

      } catch (error) {
        console.error('Error converting Word to PDF:', error);
        setProgress('Error during conversion.');
      } finally {
        setIsConverting(false);
      }
    };
    reader.readAsArrayBuffer(wordFile);
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
            
            {!pdfUrl ? (
                <button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isConverting ? progress : t.convert}
                </button>
            ) : (
                <a
                    href={pdfUrl}
                    download={`${wordFile.name.replace(/\.[^/.]+$/, "")}.pdf`}
                    className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default WordToPdf;