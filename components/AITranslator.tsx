
import React, { useState } from 'react';
import type { TranslationSet } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { sourceLanguages, targetLanguages } from '../lib/languages';
import type { LanguageOption } from '../lib/languages';
import LanguageDropdown from './LanguageDropdown';
import { SwapIcon } from './icons/SwapIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { translateText } from '../services/geminiService';

const AITranslator: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [sourceLang, setSourceLang] = useState<LanguageOption>(sourceLanguages[0]);
  const [targetLang, setTargetLang] = useState<LanguageOption>(targetLanguages[0]);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [editedTranslatedText, setEditedTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

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
             <button
                onClick={handleCopy}
                className="absolute top-3 right-3 flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
                {isCopied ? <CheckIcon className="w-4 h-4 me-2" /> : <CopyIcon className="w-4 h-4 me-2" />}
                {isCopied ? t.copied : t.copy}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITranslator;
