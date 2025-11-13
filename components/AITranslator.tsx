import React, { useState } from 'react';
import type { TranslationSet } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { sourceLanguages, targetLanguages } from '../lib/languages';
import type { LanguageOption } from '../lib/languages';
import LanguageDropdown from './LanguageDropdown';
import { SwapIcon } from './icons/SwapIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { translateText } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';

const AITranslator: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [sourceLang, setSourceLang] = useState<LanguageOption>(sourceLanguages[0]);
  const [targetLang, setTargetLang] = useState<LanguageOption>(targetLanguages[0]);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [editedTranslatedText, setEditedTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const debouncedInputText = useDebounce(inputText, 500);

  const handleTranslate = async () => {
    if (!debouncedInputText.trim()) {
      setTranslatedText('');
      setEditedTranslatedText('');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await translateText(debouncedInputText, sourceLang.name, targetLang.name);
      setTranslatedText(result);
      setEditedTranslatedText(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred during translation.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    handleTranslate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInputText, sourceLang, targetLang]);

  const handleSwapLanguages = () => {
    if (sourceLang.code === 'auto') return; // Cannot swap with auto-detect
    const currentSource = sourceLang;
    const currentTarget = targetLang;
    
    const newSourceInTargetList = targetLanguages.find(l => l.code === currentTarget.code);
    const newTargetInSourceList = sourceLanguages.find(l => l.code === currentSource.code);

    if (newSourceInTargetList && newTargetInSourceList) {
        setSourceLang(newSourceInTargetList);
        setTargetLang(newTargetInSourceList);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(editedTranslatedText);
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
    const filename = `translation-${targetLang.code}`;
    if (format === 'txt') {
      const blob = new Blob([editedTranslatedText], { type: 'text/plain;charset=utf-8' });
      createDownload(`${filename}.txt`, blob);
    } else if (format === 'docx') {
      const doc = new docx.Document({
        sections: [{
          children: editedTranslatedText.split('\n').map(text => new docx.Paragraph(text)),
        }],
      });
      const blob = await docx.Packer.toBlob(doc);
      createDownload(`${filename}.docx`, blob);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(editedTranslatedText, 10, 10);
      const blob = doc.output('blob');
      createDownload(`${filename}.pdf`, blob);
    }
  };


  const characterCount = inputText.length;
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <LanguageDropdown
          languages={sourceLanguages}
          selectedLang={sourceLang}
          onSelectLang={setSourceLang}
          title={t.sourceLanguage}
          searchPlaceholder="Search source language"
        />
        <button
          onClick={handleSwapLanguages}
          disabled={sourceLang.code === 'auto'}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <SwapIcon className="w-6 h-6 text-gray-300" />
        </button>
        <LanguageDropdown
          languages={targetLanguages}
          selectedLang={targetLang}
          onSelectLang={setTargetLang}
          title={t.targetLanguage}
          searchPlaceholder="Search target language"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.enterText}
            className="w-full h-64 bg-gray-900/50 rounded-lg p-4 text-gray-200 resize-none focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-500"
          />
          <div className="text-right text-sm text-gray-400 mt-1 px-1">
            {characterCount} chars / {wordCount} words
          </div>
        </div>
        <div className="relative">
          <textarea
            value={isLoading ? `${t.translating}...` : (error || editedTranslatedText)}
            onChange={(e) => !isLoading && !error && setEditedTranslatedText(e.target.value)}
            placeholder={t.translationResult}
            className={`w-full h-64 bg-gray-900/50 rounded-lg p-4 resize-none ${error ? 'text-red-400' : 'text-gray-200'}`}
          />
          {!isLoading && !error && translatedText && (
            <div className="absolute top-3 right-3 flex items-center space-x-2">
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
                      <div className="absolute top-full mt-2 right-0 w-32 bg-gray-600 rounded-lg shadow-xl py-1 z-10">
                        <button onClick={() => handleExport('txt')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">TXT (.txt)</button>
                        <button onClick={() => handleExport('docx')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">DOCX (.docx)</button>
                        <button onClick={() => handleExport('pdf')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">PDF (.pdf)</button>
                      </div>
                    )}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITranslator;