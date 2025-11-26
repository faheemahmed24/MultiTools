
import React, { useState, useEffect } from 'react';
import type { TranslationSet } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { sourceLanguages, targetLanguages } from '../lib/languages';
import type { LanguageOption } from '../lib/languages';
import LanguageDropdown from './LanguageDropdown';
import { translateText } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';
import { SkeletonLoader } from './Loader';

interface AITranslatorProps {
    t: TranslationSet;
    onTranslationComplete: (data: { inputText: string, translatedText: string, sourceLang: string, targetLang: string }) => void;
}

const AITranslator: React.FC<AITranslatorProps> = ({ t, onTranslationComplete }) => {
  const [sourceLang, setSourceLang] = useState<LanguageOption>(sourceLanguages[0]);
  const [targetLang, setTargetLang] = useState<LanguageOption>(targetLanguages[0]);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [editedTranslatedText, setEditedTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
        window.speechSynthesis.cancel();
    };
  }, []);

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
      onTranslationComplete({
        inputText: debouncedInputText,
        translatedText: result,
        sourceLang: sourceLang.name,
        targetLang: targetLang.name
      });
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
    if (sourceLang.code === 'auto' || isSwapping) return; 
    
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 500); // Animation duration

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
  
  const handleSpeak = () => {
      if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          return;
      }

      if (!editedTranslatedText) return;

      const utterance = new SpeechSynthesisUtterance(editedTranslatedText);
      // Try to match the language code
      utterance.lang = targetLang.code;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
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

  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setEditedTranslatedText('');
    setError(null);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const characterCount = inputText.length;
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-[var(--secondary-bg)] rounded-2xl shadow-[var(--shadow)] border border-[var(--border-color)] p-6">
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
          disabled={sourceLang.code === 'auto' || isLoading || isSwapping}
          className="p-2.5 rounded-full bg-[var(--bg-color)] hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[var(--text-color)]"
        >
          <i className={`fas fa-exchange-alt w-5 h-5 transition-transform duration-500 ${isSwapping ? 'rotate-[360deg]' : ''}`} />
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
            disabled={isLoading}
            className="w-full h-64 bg-[var(--bg-color)] rounded-xl p-4 text-[var(--text-color)] resize-none border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent transition-all disabled:opacity-70"
          />
          <div className="flex justify-end items-center gap-2 text-sm text-[var(--text-secondary)] mt-1 px-1">
            <span>{characterCount} chars / {wordCount} words</span>
            {inputText && (
                <button onClick={handleClear} title="Clear text" className="text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                    <i className="fas fa-times-circle w-5 h-5"/>
                </button>
            )}
          </div>
        </div>
        <div className="relative">
           <div className={`w-full h-64 bg-[var(--secondary-bg)] rounded-xl overflow-y-auto border border-[var(--border-color)] ${error ? 'text-red-500 p-4 bg-red-50' : ''}`}>
             {isLoading ? (
                <div className="p-4"><SkeletonLoader lines={4} /></div>
             ) : error ? (
                <p>{error}</p>
             ) : (
                <textarea
                    value={editedTranslatedText}
                    onChange={(e) => setEditedTranslatedText(e.target.value)}
                    placeholder={t.translationResult}
                    className="w-full h-full bg-transparent rounded-lg p-4 text-[var(--text-color)] resize-none focus:outline-none border-none"
                />
             )}
          </div>
          {!isLoading && !error && translatedText && (
            <div className="absolute top-3 right-3 flex items-center space-x-2 rtl:space-x-reverse">
                 <button
                    onClick={handleSpeak}
                    title={isSpeaking ? t.stop : t.listen}
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 shadow-sm ${isSpeaking ? 'bg-red-500 text-white' : 'bg-[var(--secondary-bg)] text-[var(--text-secondary)] hover:bg-[var(--bg-color)] border border-[var(--border-color)]'}`}
                >
                    {isSpeaking ? <i className="fas fa-stop w-3.5 h-3.5" /> : <i className="fas fa-volume-up w-3.5 h-3.5" />}
                </button>
                <button
                    onClick={handleCopy}
                    className="flex items-center justify-center w-8 h-8 bg-[var(--secondary-bg)] text-[var(--text-secondary)] rounded-full hover:bg-[var(--bg-color)] transition-colors duration-200 shadow-sm border border-[var(--border-color)]"
                >
                    {isCopied ? <i className="fas fa-check w-3.5 h-3.5 text-green-500" /> : <i className="fas fa-copy w-3.5 h-3.5" />}
                </button>
                <div className="relative">
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="flex items-center justify-center w-8 h-8 bg-[var(--secondary-bg)] text-[var(--text-secondary)] rounded-full hover:bg-[var(--bg-color)] transition-colors duration-200 shadow-sm border border-[var(--border-color)]"
                    >
                        <i className="fas fa-download w-3.5 h-3.5" />
                    </button>
                    {showExportMenu && (
                      <div className="absolute top-full mt-2 right-0 w-32 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-lg shadow-xl py-1 z-10 animate-slide-in-up">
                        <button onClick={() => handleExport('txt')} className="block w-full text-start px-4 py-2 text-sm text-[var(--text-color)] hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]">TXT (.txt)</button>
                        <button onClick={() => handleExport('docx')} className="block w-full text-start px-4 py-2 text-sm text-[var(--text-color)] hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]">DOCX (.docx)</button>
                        <button onClick={() => handleExport('pdf')} className="block w-full text-start px-4 py-2 text-sm text-[var(--text-color)] hover:bg-[var(--bg-color)] hover:text-[var(--primary-color)]">PDF (.pdf)</button>
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
