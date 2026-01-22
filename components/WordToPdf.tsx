import React, { useState, useRef } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import * as mammoth from 'mammoth';
import { jsPDF } from 'jspdf';

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

  const handleFileChange = (file: File | null) => {
    if (file && (file.name.endsWith('.docx') || file.name.endsWith('.doc'))) {
      setWordFile(file);
      setPdfUrl(null);
    }
  };

  const handleConvert = async () => {
    if (!wordFile) return;
    setIsConverting(true);
    setProgress(t.converting);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result;
      if (!(buffer instanceof ArrayBuffer)) {
        setIsConverting(false);
        setProgress('Internal buffer error');
        return;
      }

      try {
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        const doc = new jsPDF();
        const splitText = doc.splitTextToSize(result.value.replace(/<[^>]*>?/gm, ''), 180);
        doc.text(splitText, 10, 10);
        setPdfUrl(doc.output('bloburl') as any);
        onConversionComplete({ fileName: wordFile.name });
        setProgress(t.conversionComplete);
      } catch (err) {
        setProgress('Conversion failed.');
      } finally {
        setIsConverting(false);
      }
    };
    reader.readAsArrayBuffer(wordFile);
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[400px] flex flex-col items-center justify-center">
      {!wordFile ? (
        <div 
          className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 transition-colors ${isDragging ? 'border-purple-500 bg-purple-500/5' : 'border-gray-700'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files[0]); }}
        >
          <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-purple-600 rounded-lg font-bold">Select Word File</button>
          <input type="file" ref={fileInputRef} hidden accept=".doc,.docx" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
        </div>
      ) : (
        <div className="w-full space-y-4">
            <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700 flex justify-between items-center">
                <span className="font-bold truncate">{wordFile.name}</span>
                <button onClick={() => setWordFile(null)} className="text-red-400 text-xs font-black uppercase">Remove</button>
            </div>
            {!pdfUrl ? (
                <button onClick={handleConvert} disabled={isConverting} className="w-full py-4 bg-purple-600 rounded-xl font-black uppercase tracking-widest">
                    {isConverting ? 'Processing...' : 'Convert to PDF'}
                </button>
            ) : (
                <a href={pdfUrl} download={`${wordFile.name}.pdf`} className="w-full py-4 bg-green-600 rounded-xl font-black uppercase tracking-widest flex justify-center items-center gap-2">
                    <DownloadIcon className="w-5 h-5" /> Download PDF
                </a>
            )}
            {progress && <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest">{progress}</p>}
        </div>
      )}
    </div>
  );
};

export default WordToPdf;