import React, { useState } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';

interface PdfToWordProps {
  t: TranslationSet;
  onConversionComplete: (data: { fileName: string }) => void;
}

const PdfToWord: React.FC<PdfToWordProps> = ({ t, onConversionComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.5.136/build/pdf.worker.mjs`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      const docx = await import('docx');
      const doc = new docx.Document({
        sections: [{
          children: fullText.split('\n').map(line => new docx.Paragraph(line))
        }]
      });

      const blob = await docx.Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.pdf', '.docx');
      a.click();
      
      onConversionComplete({ fileName: file.name });
    } catch (e) {
      console.error(e);
      alert('Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 flex flex-col items-center justify-center h-full">
      {!file ? (
        <div className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-purple-500" onClick={() => document.getElementById('pdf-upload')?.click()}>
          <input id="pdf-upload" type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <UploadIcon className="w-12 h-12 mx-auto text-gray-500 mb-4" />
          <p className="text-gray-300">Click to upload PDF</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xl text-white mb-4">{file.name}</p>
          <button onClick={handleConvert} disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Converting...' : 'Convert to Word'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfToWord;