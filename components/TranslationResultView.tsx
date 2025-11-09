import React, { useState } from 'react';
import type { TranslationItem, TranslationSet, TextTranslationTask } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface TranslationResultViewProps {
  task?: TextTranslationTask;
  item?: TranslationItem;
  onSave?: (task: TextTranslationTask) => void;
  t: TranslationSet;
  isFromHistory: boolean;
}

const TranslationResultView: React.FC<TranslationResultViewProps> = ({ task, item, onSave, t, isFromHistory }) => {
    const [isSourceCopied, setIsSourceCopied] = useState(false);
    const [isTranslationCopied, setIsTranslationCopied] = useState(false);
    const [isSaved, setIsSaved] = useState(isFromHistory);

    const resultData = isFromHistory ? item : task?.result;
    const sourceText = isFromHistory ? item?.sourceText : task?.sourceText;
    const translatedText = resultData?.translatedText;
    // FIX: Correctly access source language property based on whether the data is from history or a live task result.
    const sourceLanguage = (isFromHistory ? item?.sourceLanguage : task?.result?.detectedSourceLanguage) || 'N/A';
    const targetLanguage = isFromHistory ? item?.targetLanguage : task?.targetLanguageName;

    const handleCopy = (text: string | undefined, type: 'source' | 'translation') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        if (type === 'source') {
            setIsSourceCopied(true);
            setTimeout(() => setIsSourceCopied(false), 2000);
        } else {
            setIsTranslationCopied(true);
            setTimeout(() => setIsTranslationCopied(false), 2000);
        }
    };
    
    const handleSave = () => {
        if (task && onSave) {
            onSave(task);
            setIsSaved(true);
        }
    };

    if (!resultData) {
        return <div className="m-auto text-center text-gray-400">{t.errorTitle}</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden">
                {/* Source Text */}
                <div className="flex flex-col bg-gray-900/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-300">{t.inputText} <span className="text-xs bg-gray-700 text-purple-300 px-2 py-0.5 rounded-full ms-1">{sourceLanguage}</span></h3>
                        <button onClick={() => handleCopy(sourceText, 'source')} className="flex items-center px-3 py-1 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200">
                            {isSourceCopied ? <CheckIcon className="w-4 h-4 me-1.5" /> : <CopyIcon className="w-4 h-4 me-1.5" />}
                            {isSourceCopied ? t.copied : t.copy}
                        </button>
                    </div>
                    <textarea
                        readOnly
                        value={sourceText}
                        className="w-full h-full bg-transparent text-gray-200 resize-none border-0 focus:ring-0 p-0"
                    />
                </div>

                {/* Translated Text */}
                <div className="flex flex-col bg-gray-900/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-300">{t.outputText} <span className="text-xs bg-gray-700 text-green-300 px-2 py-0.5 rounded-full ms-1">{targetLanguage}</span></h3>
                        <button onClick={() => handleCopy(translatedText, 'translation')} className="flex items-center px-3 py-1 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200">
                            {isTranslationCopied ? <CheckIcon className="w-4 h-4 me-1.5" /> : <CopyIcon className="w-4 h-4 me-1.5" />}
                            {isTranslationCopied ? t.copied : t.copy}
                        </button>
                    </div>
                     <textarea
                        readOnly
                        value={translatedText}
                        className="w-full h-full bg-transparent text-gray-200 resize-none border-0 focus:ring-0 p-0"
                    />
                </div>
            </div>
            {!isFromHistory && (
                <div className="mt-4">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaved} 
                        className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {isSaved ? t.saved : t.save}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TranslationResultView;