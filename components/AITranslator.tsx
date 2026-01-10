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
import { XCircleIcon } from './icons/XCircleIcon';
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
  }, [debouncedInputText, sourceLang, targetLang]);

  const handleSwapLanguages = () => {
    if (sourceLang.code === 'auto' || isSwapping) return; 
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 500);
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

  const isRTL = (text: string) => {
    const rtlChars = /[\u0590-\u083F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlChars.test(text);
  };

  const handleExport = async (format: 'txt' | 'docx' | 'pdf') => {
    const content = editedTranslatedText;
    const filename = `translation-${targetLang.code}`;
    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${filename}.txt`; a.click();
    } else if (format === 'docx') {
      const doc = new docx.Document({ sections: [{ children: content.split('\n').map(text => new docx.Paragraph(text)) }] });
      const blob = await docx.Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${filename}.docx`; a.click();
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(content, 10, 10);
      doc.save(`${filename}.pdf`);
    }
    setShowExportMenu(false);
  };

  return (
    <div className="bg-[#05050C] rounded-[2.5rem] border border-white/5 p-8 max-w-7xl mx-auto w-full animate-fadeIn shadow-2xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
        <LanguageDropdown languages={sourceLanguages} selectedLang={sourceLang} onSelectLang={setSourceLang} title="From" searchPlaceholder="Search source" />
        <button onClick={handleSwapLanguages} disabled={sourceLang.code === 'auto' || isLoading} className="p-4 rounded-2xl bg-white/5 hover:bg-purple-600/20 text-gray-400 hover:text-purple-400 transition-all">
          <SwapIcon className={`w-6 h-6 transition-transform duration-500 ${isSwapping ? 'rotate-[360deg]' : ''}`} />
        </button>
        <LanguageDropdown languages={targetLanguages} selectedLang={targetLang} onSelectLang={setTargetLang} title="To" searchPlaceholder="Search target" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-3 ml-2">Source Terminal</h3>
            <div className="relative group bg-[#0A0A15] border border-white/5 rounded-[2rem] p-6 focus-within:border-purple-500/30 transition-all">
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="w-full h-80 bg-transparent text-gray-200 text-lg leading-relaxed resize-none outline-none font-medium custom-scrollbar"
                    dir="auto"
                />
            </div>
        </div>

        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-3 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Translation Outcome</h3>
                {editedTranslatedText && (
                    <div className="flex items-center gap-3">
                        <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-500 transition-all">
                            {isCopied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                            {isCopied ? 'Copied' : 'Copy'}
                        </button>
                        <div className="relative">
                            <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-1.5 bg-white/5 text-gray-500 hover:text-white rounded-lg border border-white/10">
                                <DownloadIcon className="w-4 h-4" />
                            </button>
                            {showExportMenu && (
                                <div onMouseLeave={() => setShowExportMenu(false)} className="absolute top-full mt-2 right-0 w-32 bg-gray-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                                    {['txt', 'docx', 'pdf'].map(fmt => (
                                        <button key={fmt} onClick={() => handleExport(fmt as any)} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-gray-400 hover:text-white hover:bg-purple-600 transition-all">{fmt}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className={`relative bg-[#0A0A10]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 h-80 transition-all ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                {isLoading ? (
                    <div className="space-y-4"><SkeletonLoader lines={6} /></div>
                ) : (
                    <textarea
                        value={editedTranslatedText}
                        onChange={(e) => setEditedTranslatedText(e.target.value)}
                        className={`w-full h-full bg-transparent text-gray-100 text-xl leading-relaxed resize-none outline-none font-medium custom-scrollbar ${isRTL(editedTranslatedText) ? 'font-urdu' : ''}`}
                        placeholder="Outcome will appear here..."
                        dir="auto"
                    />
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AITranslator;