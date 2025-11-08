
import React, { useState, useEffect, useRef } from 'react';
import type { TranslationSet, TranscriptionData } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { EditIcon } from './icons/EditIcon';
import { SaveIcon } from './icons/SaveIcon';
import { summarizeText, translateText } from '../services/geminiService';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';


interface TranscriptionViewProps {
  data: TranscriptionData;
  fileName: string;
  onNewTranscription: () => void;
  onSaveEdit: (newText: string) => void;
  t: TranslationSet;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ data, fileName, onNewTranscription, onSaveEdit, t }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.transcription);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  
  const [targetLang, setTargetLang] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    setEditText(data.transcription);
  }, [data.transcription]);
  
  // Close download menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [downloadMenuRef]);


  const handleCopy = () => {
    navigator.clipboard.writeText(data.transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloadMenuOpen(false);
  };
  
  const getBaseFileName = () => fileName.split('.').slice(0, -1).join('.') || fileName;

  const handleDownloadAs = (format: 'txt' | 'json' | 'md' | 'pdf' | 'docx') => {
    const baseName = getBaseFileName();
    
    switch (format) {
      case 'txt': {
        const blob = new Blob([data.transcription], { type: 'text/plain' });
        downloadBlob(blob, `${baseName}_transcription.txt`);
        break;
      }
      case 'json': {
        const jsonData = {
          fileName: fileName,
          detectedLanguage: data.detectedLanguage,
          transcription: data.transcription,
        };
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${baseName}_transcription.json`);
        break;
      }
      case 'md': {
        const mdContent = `# Transcription: ${fileName}\n\n**Detected Language:** ${data.detectedLanguage}\n\n---\n\n${data.transcription}`;
        const blob = new Blob([mdContent], { type: 'text/markdown' });
        downloadBlob(blob, `${baseName}_transcription.md`);
        break;
      }
      case 'pdf': {
        const doc = new jsPDF();
        const text = `Transcription: ${fileName}\nDetected Language: ${data.detectedLanguage}\n\n${data.transcription}`;
        const lines = doc.splitTextToSize(text, 180);
        doc.text(lines, 15, 20);
        doc.save(`${baseName}_transcription.pdf`);
        setIsDownloadMenuOpen(false);
        break;
      }
      case 'docx': {
        const doc = new docx.Document({
            sections: [{
              children: [
                new docx.Paragraph({
                  children: [
                    new docx.TextRun({ text: `Transcription: ${fileName}`, bold: true, size: 28 }), // 14pt
                  ],
                }),
                new docx.Paragraph({
                  children: [
                    new docx.TextRun({ text: `Detected Language: ${data.detectedLanguage}`, italics: true, size: 24 }), // 12pt
                  ],
                }),
                new docx.Paragraph({ text: "" }),
                ...data.transcription.split('\n').map(p => new docx.Paragraph({ text: p })),
              ],
            }],
          });
        
          docx.Packer.toBlob(doc).then(blob => {
            downloadBlob(blob, `${baseName}_transcription.docx`);
          });
        break;
      }
    }
  };


  const handleSave = () => {
    onSaveEdit(editText);
    setIsEditing(false);
  };
  
  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummary('');
    try {
      const result = await summarizeText(data.transcription);
      setSummary(result);
    } catch (error) {
      console.error(error);
      setSummary(t.errorMessage);
    } finally {
      setIsSummarizing(false);
    }
  };
  
  const handleTranslate = async () => {
    if (!targetLang) return;
    setIsTranslating(true);
    setTranslatedText('');
    try {
      const result = await translateText(data.transcription, targetLang);
      setTranslatedText(result);
    } catch (error) {
      console.error(error);
      setTranslatedText(t.errorMessage);
    } finally {
      setIsTranslating(false);
    }
  };
  
  const translationLanguages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh', name: 'Mandarin Chinese' },
    { code: 'ja', name: 'Japanese' },
  ];


  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 w-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-xl font-bold text-gray-200">{t.transcription}</h2>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-400">{fileName}</p>
                <span className="bg-gray-700 text-purple-300 text-xs font-medium px-2 py-1 rounded-full">
                    {data.detectedLanguage}
                </span>
            </div>
        </div>
        <button
          onClick={onNewTranscription}
          className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200 whitespace-nowrap"
        >
          {t.startNew}
        </button>
      </div>
      
      <div className="relative bg-gray-900/50 rounded-lg p-4 h-64 overflow-y-auto">
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-full bg-transparent text-gray-300 focus:outline-none resize-none"
          />
        ) : (
          <p className="text-gray-300 whitespace-pre-wrap">{data.transcription}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
          {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
          {copied ? t.copied : t.copy}
        </button>

        <div ref={downloadMenuRef} className="relative">
          <button 
            onClick={() => setIsDownloadMenuOpen(prev => !prev)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <DownloadIcon className="w-4 h-4" />
            {t.download}
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          {isDownloadMenuOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-gray-600 rounded-md shadow-lg z-10">
              <div className="py-1">
                <button onClick={() => handleDownloadAs('txt')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-500">{t.downloadTxt}</button>
                <button onClick={() => handleDownloadAs('json')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-500">{t.downloadJson}</button>
                <button onClick={() => handleDownloadAs('md')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-500">{t.downloadMd}</button>
                <button onClick={() => handleDownloadAs('pdf')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-500">{t.downloadPdf}</button>
                <button onClick={() => handleDownloadAs('docx')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-500">{t.downloadDocx}</button>
              </div>
            </div>
          )}
        </div>
        
        {isEditing ? (
            <button onClick={handleSave} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <SaveIcon className="w-4 h-4" />
                {t.save}
            </button>
        ) : (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <EditIcon className="w-4 h-4" />
                {t.edit}
            </button>
        )}
      </div>

      <div className="border-t border-gray-700 pt-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-200">{t.translation}</h3>
          <div className="flex gap-2 items-center">
            <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2"
                aria-label={t.selectLanguage}
            >
                <option value="">{t.selectLanguage}</option>
                {translationLanguages.map(lang => (
                    <option key={lang.code} value={lang.name}>{lang.name}</option>
                ))}
            </select>
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !targetLang}
              className="px-4 py-2 bg-purple-600/80 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isTranslating ? t.translating : t.translate}
            </button>
          </div>
        </div>
        {(isTranslating || translatedText) && (
           <div className="mt-4 bg-gray-900/50 rounded-lg p-4 text-gray-300">
             {isTranslating ? (
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                    <span>{t.translating}</span>
                </div>
             ) : (
                <p className="whitespace-pre-wrap">{translatedText}</p>
             )}
           </div>
        )}
      </div>

      <div className="border-t border-gray-700 pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-200">{t.summary}</h3>
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="px-4 py-2 bg-purple-600/80 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSummarizing ? t.summarizing : t.summarize}
          </button>
        </div>
        {(isSummarizing || summary) && (
           <div className="mt-4 bg-gray-900/50 rounded-lg p-4 text-gray-300">
             {isSummarizing ? (
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                    <span>{t.summarizing}</span>
                </div>
             ) : (
                <p className="whitespace-pre-wrap">{summary}</p>
             )}
           </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptionView;