import React, { useState } from 'react';
import type { TranslationSet, TranslationHistoryItem } from '../types';
import { translateText } from '../services/geminiService';
import LanguageDropdown from './LanguageDropdown';
import { sourceLanguages, targetLanguages } from '../lib/languages';

interface AITranslatorProps {
  t: TranslationSet;
  onTranslationComplete: (data: Partial<TranslationHistoryItem>) => void;
}

const AITranslator: React.FC<AITranslatorProps> = ({ t, onTranslationComplete }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [sourceLang, setSourceLang] = useState(sourceLanguages[0]);
  const [targetLang, setTargetLang] = useState(targetLanguages[0]);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const translated = await translateText(text, sourceLang.name, targetLang.name);
      setResult(translated);
      onTranslationComplete({
        inputText: text,
        translatedText: translated,
        sourceLang: sourceLang.code,
        targetLang: targetLang.code
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <LanguageDropdown languages={sourceLanguages} selectedLang={sourceLang} onSelectLang={setSourceLang} title="Source Language" />
        <LanguageDropdown languages={targetLanguages} selectedLang={targetLang} onSelectLang={setTargetLang} title="Target Language" />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 h-96">
        <textarea
          className="w-full h-full bg-gray-800 p-4 rounded-xl border border-gray-700 text-white resize-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter text to translate..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="w-full h-full bg-gray-900 p-4 rounded-xl border border-gray-800 text-gray-300 overflow-y-auto">
          {loading ? <div className="animate-pulse">Translating...</div> : result || <span className="text-gray-600">Translation will appear here</span>}
        </div>
      </div>

      <button onClick={handleTranslate} disabled={loading || !text} className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50">
        {loading ? 'Translating...' : 'Translate'}
      </button>
    </div>
  );
};

export default AITranslator;