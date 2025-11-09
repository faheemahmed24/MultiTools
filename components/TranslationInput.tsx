import React, { useState } from 'react';
import type { TranslationSet } from '../types';
import { LANGUAGES } from '../lib/languages';

interface TranslationInputProps {
    onTranslate: (sourceText: string, targetLanguageCode: string, sourceLanguageCode: string) => void;
    t: TranslationSet;
    isLoading: boolean;
}

const TranslationInput: React.FC<TranslationInputProps> = ({ onTranslate, t, isLoading }) => {
    const [sourceText, setSourceText] = useState('');
    const [sourceLanguage, setSourceLanguage] = useState('auto');
    const [targetLanguage, setTargetLanguage] = useState('es');

    const sourceLanguageOptions = [{ code: 'auto', name: t.autoDetect }, ...LANGUAGES];
    const targetLanguageOptions = LANGUAGES;

    const handleTranslateClick = () => {
        if (!sourceText.trim() || isLoading) return;
        onTranslate(sourceText, targetLanguage, sourceLanguage);
    };

    return (
        <div className="bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="source-language-select" className="block text-sm font-medium text-gray-300 mb-1">{t.sourceLanguage}</label>
                    <select
                        id="source-language-select"
                        value={sourceLanguage}
                        onChange={(e) => setSourceLanguage(e.target.value)}
                        disabled={isLoading}
                        className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5"
                    >
                        {sourceLanguageOptions.map(opt => (
                            <option key={opt.code} value={opt.code}>{opt.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="target-language-select" className="block text-sm font-medium text-gray-300 mb-1">{t.targetLanguage}</label>
                    <select
                        id="target-language-select"
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        disabled={isLoading}
                        className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5"
                    >
                        {targetLanguageOptions.map(opt => (
                            <option key={opt.code} value={opt.code}>{opt.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div>
                <label htmlFor="source-text-area" className="block text-sm font-medium text-gray-300 mb-1">{t.inputText}</label>
                <textarea
                    id="source-text-area"
                    rows={6}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5"
                    placeholder="Enter text to translate..."
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    disabled={isLoading}
                />
            </div>

            <button
                onClick={handleTranslateClick}
                disabled={isLoading || !sourceText.trim()}
                className="mt-4 w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
            >
                {isLoading ? t.translatingText : t.translateTextAction}
            </button>
        </div>
    );
};

export default TranslationInput;