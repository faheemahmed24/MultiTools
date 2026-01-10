import React, { useState } from 'react';
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
// Fix: Import BoltIcon to resolve 'Cannot find name' error.
import { BoltIcon } from './icons/BoltIcon';
import { SkeletonLoader } from './Loader';

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
                part.added ? "bg-green-500/20 text-green-300 rounded px-0.5" :
                part.removed ? "bg-red-500/20 text-red-300 line-through rounded px-0.5" : ""
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
    setInputText('');
    setCorrectedText('');
    setDiff([]);
    setError(null);
  };

  const characterCount = inputText.length;
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-7xl mx-auto w-full animate-fadeIn">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-900/20 text-white">
                    <GrammarIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Grammar Fixer</h2>
            </div>
             <LanguageDropdown
                languages={sourceLanguages}
                selectedLang={language}
                onSelectLang={setLanguage}
                title={t.language}
                searchPlaceholder="Search language"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t.originalText}</h3>
                    <span className="text-[10px] font-mono text-gray-600">{characterCount} chars / {wordCount} words</span>
                </div>
                <div className="relative group bg-[#0A0A15] border border-white/5 rounded-3xl p-6 focus-within:border-purple-500/30 transition-all shadow-inner">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={t.noTextToCorrect}
                        disabled={isLoading}
                        className="w-full h-72 bg-transparent text-gray-200 text-lg leading-relaxed resize-none outline-none font-medium placeholder:text-gray-800 custom-scrollbar"
                    />
                    {inputText && !isLoading && (
                        <button onClick={handleClear} title="Clear text" className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-xl transition-all">
                            <XCircleIcon className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col relative">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">{t.grammarResult}</h3>
                    {correctedText && (
                         <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded">Analysis Complete</span>
                         </div>
                    )}
                </div>
                <div className={`relative w-full h-72 bg-[#0A0A10]/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 group`}>
                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="h-4 w-1/2 bg-purple-500/10 rounded animate-pulse"></div>
                            <SkeletonLoader lines={6} />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <XCircleIcon className="w-10 h-10 text-red-500/50" />
                            <p className="text-red-400 font-bold text-sm">{error}</p>
                        </div>
                    ) : correctedText ? (
                        <div className="h-full overflow-y-auto custom-scrollbar text-lg leading-relaxed text-gray-200 font-medium">
                            <DiffView diff={diff} />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                            <GrammarIcon className="w-12 h-12 mb-4" />
                            <p className="text-sm font-black uppercase tracking-widest">Awaiting Input</p>
                        </div>
                    )}

                    {!isLoading && !error && correctedText && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-500 shadow-xl transition-all active:scale-95"
                            >
                                {isCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                {isCopied ? t.copied : 'Copy Fixed'}
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="p-2 bg-gray-800 text-gray-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 transition-all"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                </button>
                                {showExportMenu && (
                                <div onMouseLeave={() => setShowExportMenu(false)} className="absolute top-full mt-2 right-0 w-36 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl py-2 z-50 animate-pop-in">
                                    <button onClick={() => handleExport('txt')} className="block w-full text-start px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-purple-600 transition-all">TXT (.txt)</button>
                                    <button onClick={() => handleExport('docx')} className="block w-full text-start px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-purple-600 transition-all">DOCX (.docx)</button>
                                    <button onClick={() => handleExport('pdf')} className="block w-full text-start px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-purple-600 transition-all">PDF (.pdf)</button>
                                </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="flex justify-center">
            <button
                onClick={handleCorrectGrammar}
                disabled={isLoading || !inputText.trim()}
                className="w-full sm:w-auto px-16 py-5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-black uppercase tracking-[0.3em] text-xs rounded-3xl transition-all shadow-2xl shadow-purple-900/40 active:scale-95 flex items-center justify-center gap-4 disabled:opacity-30 disabled:grayscale"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" /> 
                        Correcting...
                    </>
                ) : (
                    <>
                        <BoltIcon className="w-5 h-5" />
                        Run AI Correction
                    </>
                )}
            </button>
        </div>
    </div>
  );
};

export default GrammarCorrector;