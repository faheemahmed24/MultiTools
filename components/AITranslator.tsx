import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useDebounce } from '../hooks/useDebounce';
import { sourceLanguages, targetLanguages } from '../lib/languages';
import type { LanguageOption } from '../lib/languages';
import LanguageDropdown from './LanguageDropdown';
import { SwapIcon } from './icons/SwapIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { detectLanguage } from '../services/geminiService';

const AITranslator: React.FC = () => {
  const [sourceLang, setSourceLang] = useState<LanguageOption>(sourceLanguages[0]);
  const [targetLang, setTargetLang] = useState<LanguageOption>(targetLanguages[0]);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const debouncedInputText = useDebounce(inputText, 500);

  useEffect(() => {
    if (!debouncedInputText.trim()) {
      setTranslatedText('');
      setIsLoading(false);
      setError(null);
      return;
    }

    const runTranslationFlow = async () => {
      setIsLoading(true);
      setError(null);

      // Auto-switch logic: if input lang is same as target, switch target to Urdu
      try {
        const detectedLangName = await detectLanguage(debouncedInputText);
        if (detectedLangName && targetLang.name.toLowerCase() === detectedLangName.toLowerCase() && targetLang.code !== 'ur') {
          const urduLang = targetLanguages.find(l => l.code === 'ur');
          if (urduLang) {
            setTargetLang(urduLang);
            // Abort this run; the state update will trigger a new effect run with the correct language.
            // The loader will stay on until the next run completes.
            return;
          }
        }
      } catch (err) {
        console.error("Language detection for auto-switch failed:", err);
        // Fall through to translation with the user's selected language
      }

      // Translation logic
      setTranslatedText('');
      try {
        if (!process.env.API_KEY) {
          throw new Error("API_KEY environment variable not set.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const sourceLangText = sourceLang.code === 'auto' ? 'auto-detect' : sourceLang.name;

        const prompt = `Translate the following text from ${sourceLangText} to ${targetLang.name}. Respond only with the translated text, without any additional comments or explanations.
        
        Text to translate:
        "${debouncedInputText}"`;

        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        for await (const chunk of responseStream) {
          setTranslatedText(prev => prev + chunk.text);
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred during translation.');
      } finally {
        setIsLoading(false);
      }
    };

    runTranslationFlow();
  }, [debouncedInputText, sourceLang, targetLang]);

  const handleSwapLanguages = () => {
    if (sourceLang.code === 'auto') return;

    const newSourceLang = targetLanguages.find(lang => lang.code === targetLang.code);
    const newTargetLang = sourceLanguages.find(lang => lang.code === sourceLang.code);

    if (newSourceLang && newTargetLang) {
        setSourceLang(newSourceLang);
        setTargetLang(newTargetLang);
        setInputText(translatedText);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };


  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 flex flex-col min-h-[70vh]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
            <LanguageDropdown
                languages={sourceLanguages}
                selectedLang={sourceLang}
                onSelectLang={setSourceLang}
                title="From"
            />
            <button 
                onClick={handleSwapLanguages}
                disabled={sourceLang.code === 'auto'}
                className="p-2 rounded-full bg-gray-700 hover:bg-purple-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500 text-gray-300 transition-colors"
                aria-label="Swap languages"
            >
                <SwapIcon className="w-5 h-5" />
            </button>
            <LanguageDropdown
                languages={targetLanguages}
                selectedLang={targetLang}
                onSelectLang={setTargetLang}
                title="To"
            />
        </div>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
                <div className="relative flex-grow">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter text..."
                        className="w-full h-full bg-gray-900/50 text-gray-200 p-4 rounded-xl resize-none border-2 border-transparent focus:border-purple-500 focus:ring-0 transition-colors pb-6"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {inputText.length} characters
                    </div>
                </div>
            </div>
            <div className="relative flex flex-col">
                 <div 
                    className={`flex-grow w-full bg-gray-900/50 text-gray-200 p-4 rounded-xl relative transition-all duration-300 overflow-y-auto ${isLoading ? 'border-2 border-purple-500/50 animate-pulse' : 'border-2 border-transparent'}`}
                >
                    <p className="whitespace-pre-wrap pb-6">{translatedText}</p>
                    {error && <p className="text-red-400">{error}</p>}
                    <div className="absolute bottom-3 left-3 text-xs text-gray-400">
                        {translatedText.length} characters
                    </div>
                    {translatedText && !isLoading && (
                        <button 
                            onClick={handleCopy}
                            className="absolute bottom-3 right-3 flex items-center px-3 py-1.5 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                        >
                            {isCopied ? <CheckIcon className="w-4 h-4 me-2"/> : <CopyIcon className="w-4 h-4 me-2" />}
                            {isCopied ? 'Copied' : 'Copy'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AITranslator;