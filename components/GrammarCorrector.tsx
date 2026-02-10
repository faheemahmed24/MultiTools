import React, { useState, useEffect } from 'react';
import type { TranslationSet, DiffPart } from '../types';
import { correctGrammar } from '../services/geminiService';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { GrammarIcon } from './icons/GrammarIcon';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';
import LanguageDropdown from './LanguageDropdown';
import { sourceLanguages } from '../lib/languages';
import type { LanguageOption } from '../lib/languages';
import { XCircleIcon } from './icons/XCircleIcon';
import { SkeletonLoader } from './Loader';
import { ClockIcon } from './icons/ClockIcon';

// Simple diffing function
const createDiff = (original: string, corrected: string): DiffPart[] => {
    const originalWords = original.split(/(\s+)/);
    const correctedWords = corrected.split(/(\s+)/);
    const dp = Array(originalWords.length + 1).fill(null).map(() => Array(correctedWords.length + 1).fill(0));

    for (let i = 0; i <= originalWords.length; i++) {
        for (let j = 0; j <= correctedWords.length; j++) {
            if (i === 0 || j === 0) continue;
            if (originalWords[i - 1] === correctedWords[j - 1]) {
                dp[i][j] = 1 + dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const diff: DiffPart[] = [];
    let i = originalWords.length;
    let j = correctedWords.length;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && originalWords[i - 1] === correctedWords[j - 1]) {
            diff.unshift({ value: originalWords[i - 1] });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({ value: correctedWords[j - 1], added: true });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            diff.unshift({ value: originalWords[i - 1], removed: true });
            i--;
        }
    }
    return diff;
};

const DiffView: React.FC<{ diff: DiffPart[] }> = ({ diff }) => (
    <p className="whitespace-pre-wrap">
        {diff.map((part, index) => (
            <span key={index} className={
                part.added ? "bg-green-500/20 text-green-300 rounded" :
                part.removed ? "bg-red-500/20 text-red-300 line-through rounded" : ""
            }>
                {part.value}
            </span>
        ))}
    </p>
);

interface GrammarCorrectorProps {
    t: TranslationSet;
    onCorrectionComplete: (data: { originalText: string, correctedText: string, language: string, diff: DiffPart[] }) => void;
}

const GrammarCorrector: React.FC<GrammarCorrectorProps> = ({ t, onCorrectionComplete }) => {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [diff, setDiff] = useState<DiffPart[]>([]);
  const [language, setLanguage] = useState<LanguageOption>(sourceLanguages[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Auto-save key
  const DRAFT_KEY = 'grammar_corrector_draft';

  // Initial Load from LocalStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const { text, langCode, time } = JSON.parse(savedDraft);
        if (text) setInputText(text);
        if (langCode) {
          const found = sourceLanguages.find(l => l.code === langCode);
          if (found) setLanguage(found);
        }
        if (time) setLastSaved(new Date(time).toLocaleTimeString());
      } catch (e) {
        console.error("Failed to load grammar draft", e);
      }
    }
  }, []);

  // 30-Second Auto-save Cycle
  useEffect(() => {
    const interval = setInterval(() => {
      if (inputText.trim()) {
        const timestamp = Date.now();
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          text: inputText,
          langCode: language.code,
          time: timestamp
        }));
        setLastSaved(new Date(timestamp).toLocaleTimeString());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [inputText, language]);

  const handleCorrectGrammar = async () => {
    if (!inputText.trim()) {
      setCorrectedText('');
      setDiff([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await correctGrammar(inputText, language.name);
      setCorrectedText(result);
      const newDiff = createDiff(inputText, result);
      setDiff(newDiff);

      onCorrectionComplete({
        originalText: inputText,
        correctedText: result,
        language: language.name,
        diff: newDiff
      });
      
      // Clear draft on successful explicit action if desired, 
      // but keeping it for safety is often better for "autosave".
    } catch (err: any) {
      setError(err.message || 'An error occurred during grammar correction.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(correctedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const createDownload = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExport = async (format: 'txt' | 'docx' | 'pdf') => {
    const filename = `corrected-text`;
    if (format === 'txt') {
      const blob = new Blob([correctedText], { type: 'text/plain;charset=utf-8' });
      createDownload(`${filename}.txt`, blob);
    } else if (format === 'docx') {
      const doc = new docx.Document({
        sections: [{
          children: correctedText.split('\n').map(text => new docx.Paragraph(text)),
        }],
      });
      const blob = await docx.Packer.toBlob(doc);
      createDownload(`${filename}.docx`, blob);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(correctedText, 10, 10);
      const blob = doc.output('blob');
      createDownload(`${filename}.pdf`, blob);
    }
  };

  const handleClear = () => {
    if (window.confirm("Clear all text and reset draft?")) {
        setInputText('');
        setCorrectedText('');
        setDiff([]);
        setError(null);
        localStorage.removeItem(DRAFT_KEY);
        setLastSaved(null);
    }
  };

  const characterCount = inputText.length;
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <LanguageDropdown
                languages={sourceLanguages}
                selectedLang={language}
                onSelectLang={setLanguage}
                title={t.language}
                searchPlaceholder="Search language"
            />
            {lastSaved && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/5 border border-purple-500/10 text-purple-400/60 text-[10px] font-black uppercase tracking-widest animate-fadeIn">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span>Autosaved: {lastSaved}</span>
                </div>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h3 className="font-semibold mb-2 text-gray-300">{t.originalText}</h3>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t.noTextToCorrect}
                    disabled={isLoading}
                    className="w-full h-64 bg-gray-900/50 rounded-lg p-4 text-gray-200 resize-none focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-500 disabled:opacity-70"
                />
                <div className="flex justify-end items-center gap-2 text-sm text-gray-400 mt-1 px-1">
                    <span>{characterCount} chars / {wordCount} words</span>
                     {inputText && (
                        <button onClick={handleClear} title="Clear text and draft" className="text-gray-500 hover:text-white transition-colors">
                            <XCircleIcon className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            </div>
            <div className="relative">
                <h3 className="font-semibold mb-2 text-gray-300">{t.grammarResult}</h3>
                <div className={`w-full h-64 bg-gray-900/50 rounded-lg overflow-y-auto p-4 ${error ? 'text-red-400' : 'text-gray-200'}`}>
                    {isLoading ? (
                        <div className="space-y-3">
                           <SkeletonLoader lines={1} className="w-1/2" />
                           <SkeletonLoader lines={4} />
                        </div>
                    ) : error ? (
                        <p>{error}</p>
                    ) : (
                        <DiffView diff={diff} />
                    )}
                </div>
                {!isLoading && !error && correctedText && (
                <div className="absolute top-11 end-3 flex items-center space-x-2 rtl:space-x-reverse">
                    <button
                        onClick={handleCopy}
                        className="flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                    >
                        {isCopied ? <CheckIcon className="w-4 h-4 me-2" /> : <CopyIcon className="w-4 h-4 me-2" />}
                        {isCopied ? t.copied : t.copy}
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                        >
                            <DownloadIcon className="w-4 h-4 me-2" />
                            {t.export}
                        </button>
                        {showExportMenu && (
                        <div onMouseLeave={() => setShowExportMenu(false)} className="absolute top-full mt-2 end-0 w-32 bg-gray-600 rounded-lg shadow-xl py-1 z-10 animate-slide-in-up">
                            <button onClick={() => handleExport('txt')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">TXT (.txt)</button>
                            <button onClick={() => handleExport('docx')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">DOCX (.docx)</button>
                            <button onClick={() => handleExport('pdf')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">PDF (.pdf)</button>
                        </div>
                        )}
                    </div>
                </div>
                )}
            </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-4">
            <button
                onClick={handleCorrectGrammar}
                disabled={isLoading || !inputText.trim()}
                className="px-10 py-4 bg-purple-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 shadow-2xl shadow-purple-900/20"
            >
                <GrammarIcon className="w-5 h-5" />
                {isLoading ? 'Architecting Syntax...' : t.correctGrammar}
            </button>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">Neural Proofreading Protocol v3.1</p>
        </div>
    </div>
  );
};

export default GrammarCorrector;