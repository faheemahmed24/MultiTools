import React, { useState } from 'react';
import type { TranslationSet, DiffPart } from '../types';
import { correctGrammar } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';
import LanguageDropdown from './LanguageDropdown';
import { sourceLanguages } from '../lib/languages';
import type { LanguageOption } from '../lib/languages';
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
    <p className="whitespace-pre-wrap text-base leading-relaxed">
        {diff.map((part, index) => (
            <span key={index} className={
                part.added ? "bg-green-500/20 text-green-300 rounded px-0.5 mx-0.5 border-b border-green-500/40" :
                part.removed ? "bg-red-500/20 text-red-300 line-through rounded px-0.5 mx-0.5 opacity-70" : ""
            }>
                {part.value}
            </span>
        ))}
    </p>
);

interface GrammarCorrectorProps {
    t: TranslationSet;
    onCorrectionComplete: (data: { originalText: string, correctedText: string, language: string, diff: DiffPart[], tone: string, explanation?: string }) => void;
}

const GrammarCorrector: React.FC<GrammarCorrectorProps> = ({ t, onCorrectionComplete }) => {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [diff, setDiff] = useState<DiffPart[]>([]);
  const [language, setLanguage] = useState<LanguageOption>(sourceLanguages[0]);
  const [tone, setTone] = useState<string>('Professional');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isToneOpen, setIsToneOpen] = useState(false);

  const tones = [
      { key: 'Professional', label: t.professional },
      { key: 'Casual', label: t.casual },
      { key: 'Academic', label: t.academic },
      { key: 'Creative', label: t.creative }
  ];

  const handleCorrectGrammar = async () => {
    if (!inputText.trim()) {
      setCorrectedText('');
      setExplanation('');
      setDiff([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // service now returns object { corrected, explanation }
      const result = await correctGrammar(inputText, language.name, tone);
      
      setCorrectedText(result.corrected);
      setExplanation(result.explanation);
      
      const newDiff = createDiff(inputText, result.corrected);
      setDiff(newDiff);

      onCorrectionComplete({
        originalText: inputText,
        correctedText: result.corrected,
        language: language.name,
        tone: tone,
        explanation: result.explanation,
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
    const contentWithExplanation = `${correctedText}\n\n--- Explanation ---\n${explanation}`;

    if (format === 'txt') {
      const blob = new Blob([contentWithExplanation], { type: 'text/plain;charset=utf-8' });
      createDownload(`${filename}.txt`, blob);
    } else if (format === 'docx') {
      const paragraphs = correctedText.split('\n').map(text => new docx.Paragraph(text));
      if (explanation) {
          paragraphs.push(new docx.Paragraph({ children: [new docx.TextRun({ text: "\nExplanation:", bold: true })] }));
          paragraphs.push(new docx.Paragraph({ children: [new docx.TextRun(explanation)] }));
      }
      const doc = new docx.Document({
        sections: [{ children: paragraphs }],
      });
      const blob = await docx.Packer.toBlob(doc);
      createDownload(`${filename}.docx`, blob);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(correctedText, 10, 10);
      if (explanation) {
          doc.text("\nExplanation:", 10, 200);
          const splitExp = doc.splitTextToSize(explanation, 180);
          doc.text(splitExp, 10, 210);
      }
      const blob = doc.output('blob');
      createDownload(`${filename}.pdf`, blob);
    }
  };

  const handleClear = () => {
    setInputText('');
    setCorrectedText('');
    setExplanation('');
    setDiff([]);
    setError(null);
  };

  const characterCount = inputText.length;
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
             <LanguageDropdown
                languages={sourceLanguages}
                selectedLang={language}
                onSelectLang={setLanguage}
                title={t.language}
                searchPlaceholder="Search language"
            />
            
            {/* Tone Selector */}
            <div className="relative w-full sm:w-56">
              <button
                onClick={() => setIsToneOpen(!isToneOpen)}
                className="w-full flex items-center justify-between bg-gray-700 px-4 py-2 rounded-lg text-gray-200 hover:bg-gray-600 transition-colors"
              >
                <div className="flex flex-col items-start">
                    <span className="text-xs text-gray-400">{t.tone}</span>
                    <span className="font-semibold">{tones.find(to => to.key === tone)?.label}</span>
                </div>
                <i className={`fas fa-chevron-down w-5 h-5 text-gray-400 transition-transform ${isToneOpen ? 'rotate-180' : ''}`} />
              </button>

              {isToneOpen && (
                <div className="absolute z-10 top-full mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl">
                  <ul className="py-1">
                    {tones.map(option => (
                      <li key={option.key}>
                        <button
                          onClick={() => {
                              setTone(option.key);
                              setIsToneOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm ${tone === option.key ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-purple-600/50'}`}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
                <h3 className="font-semibold mb-2 text-gray-300 flex items-center gap-2">
                    <i className="fas fa-info-circle w-4 h-4 text-gray-500" />
                    {t.originalText}
                </h3>
                <div className="relative flex-grow">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={t.noTextToCorrect}
                        disabled={isLoading}
                        className="w-full h-full min-h-[250px] bg-gray-900/50 rounded-lg p-4 text-gray-200 resize-none focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-500 disabled:opacity-70"
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs text-gray-500">
                        <span>{characterCount} chars / {wordCount} words</span>
                        {inputText && (
                            <button onClick={handleClear} title="Clear text" className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-700">
                                <i className="fas fa-times-circle w-4 h-4"/>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col">
                <h3 className="font-semibold mb-2 text-gray-300 flex items-center gap-2">
                    <i className="fas fa-check w-4 h-4 text-green-500" />
                    {t.grammarResult}
                </h3>
                <div className="relative flex-grow flex flex-col">
                    <div className={`w-full flex-grow min-h-[250px] bg-gray-900/50 rounded-lg overflow-y-auto p-4 ${error ? 'text-red-400 border border-red-500/30' : 'text-gray-200'}`}>
                        {isLoading ? (
                            <SkeletonLoader lines={6} />
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <i className="fas fa-times-circle w-10 h-10 text-red-500 mb-2 opacity-50" />
                                <p>{error}</p>
                            </div>
                        ) : correctedText ? (
                            <>
                                <DiffView diff={diff} />
                                {explanation && (
                                    <div className="mt-4 pt-4 border-t border-gray-700/50 animate-fadeIn">
                                        <div className="flex items-center gap-2 mb-1 text-yellow-500/90">
                                            <i className="fas fa-lightbulb w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">{t.explanation}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 italic bg-yellow-900/10 p-3 rounded border border-yellow-500/10">
                                            "{explanation}"
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-600 italic">
                                {t.noTextToCorrect}
                            </div>
                        )}
                    </div>

                    {!isLoading && !error && correctedText && (
                    <div className="absolute top-3 right-3 flex items-center space-x-2 rtl:space-x-reverse">
                        <button
                            onClick={handleCopy}
                            className="flex items-center px-3 py-1.5 bg-gray-800/80 backdrop-blur text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm border border-gray-700"
                        >
                            {isCopied ? <i className="fas fa-check w-4 h-4 me-2 text-green-400" /> : <i className="fas fa-copy w-4 h-4 me-2" />}
                            {isCopied ? t.copied : t.copy}
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="flex items-center px-3 py-1.5 bg-gray-800/80 backdrop-blur text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm border border-gray-700"
                            >
                                <i className="fas fa-download w-4 h-4 me-2" />
                                {t.export}
                            </button>
                            {showExportMenu && (
                            <div onMouseLeave={() => setShowExportMenu(false)} className="absolute top-full mt-2 right-0 w-32 bg-gray-700 border border-gray-600 rounded-lg shadow-xl py-1 z-10 animate-slide-in-up">
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
        </div>
        <div className="mt-8 flex justify-center">
            <button
                onClick={handleCorrectGrammar}
                disabled={isLoading || !inputText.trim()}
                className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2 transform hover:scale-105 active:scale-100"
            >
                <i className="fas fa-spell-check w-5 h-5" />
                {isLoading ? t.correctingGrammar : t.correctGrammar}
            </button>
        </div>
    </div>
  );
};

export default GrammarCorrector;