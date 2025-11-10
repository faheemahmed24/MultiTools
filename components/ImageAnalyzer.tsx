import React, { useState, useRef } from 'react';
import type { TranslationSet } from '../types';
import type { LanguageOption } from '../lib/languages';
import { UploadIcon } from './icons/UploadIcon';
import { analyzeImage, translateText } from '../services/geminiService';
import Loader from './Loader';
import LanguageDropdown from './LanguageDropdown';
import { targetLanguages } from '../lib/languages';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';


const ResultBox: React.FC<{ title: string; content: string; t: TranslationSet; onCopy: () => void, isCopied: boolean }> = ({ title, content, t, onCopy, isCopied }) => {
    const charCount = content.length;
    return (
        <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col mt-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg text-gray-200">{title}</h3>
                <button
                    onClick={onCopy}
                    className="flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                    {isCopied ? <CheckIcon className="w-4 h-4 me-2" /> : <CopyIcon className="w-4 h-4 me-2" />}
                    {isCopied ? t.copied : t.copy}
                </button>
            </div>
            <div className="overflow-y-auto flex-grow bg-gray-800/50 p-3 rounded-md">
                <div className="text-gray-300 whitespace-pre-wrap">{content}</div>
            </div>
            <div className="text-right text-sm text-gray-400 mt-1 px-1">
                {charCount} characters
            </div>
        </div>
    );
};


const ImageAnalyzer: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetLang, setTargetLang] = useState<LanguageOption>(targetLanguages[0]);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const [isOcrCopied, setIsOcrCopied] = useState(false);
  const [isTranslationCopied, setIsTranslationCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysisResult('');
      setTranslatedText('');
      setError(null);
      setTranslationError(null);
    }
  };
  
  const handleAnalyze = async () => {
    if (!imageFile) return;
    setIsLoading(true);
    setError(null);
    setAnalysisResult('');
    setTranslatedText('');
    try {
      const result = await analyzeImage(imageFile);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!analysisResult) return;
    setIsTranslating(true);
    setTranslationError(null);
    setTranslatedText('');
    try {
        const result = await translateText(analysisResult, 'auto', targetLang.name);
        setTranslatedText(result);
    } catch (err: any) {
        setTranslationError(err.message || 'An error occurred during translation.');
    } finally {
        setIsTranslating(false);
    }
  };

  const handleCopy = (type: 'ocr' | 'translation') => {
    const textToCopy = type === 'ocr' ? analysisResult : translatedText;
    navigator.clipboard.writeText(textToCopy);
    if (type === 'ocr') {
        setIsOcrCopied(true);
        setTimeout(() => setIsOcrCopied(false), 2000);
    } else {
        setIsTranslationCopied(true);
        setTimeout(() => setIsTranslationCopied(false), 2000);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] lg:h-full flex flex-col">
      <div className="flex-grow">
        {imagePreview ? (
            <div className="relative mb-4 text-center">
                <img src={imagePreview} alt="Preview" className="w-auto mx-auto rounded-lg max-h-60 object-contain"/>
            </div>
        ) : (
            <div
              onClick={handleUploadClick}
              className="flex flex-grow flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors duration-300 border-gray-600 hover:border-purple-500 cursor-pointer mb-4"
            >
              <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
              <p className="text-gray-400">{t.uploadImage}</p>
            </div>
        )}
      </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <button
            onClick={handleAnalyze}
            disabled={isLoading || !imageFile}
            className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
        >
            {isLoading ? t.analyzing : t.analyze}
        </button>

        {isLoading && <div className="mt-4"><Loader t={t} /></div>}
        {error && <div className="text-red-400 mt-4 text-center">{error}</div>}
        
        {analysisResult && (
            <>
                <ResultBox title={t.imageAnalysisResult} content={analysisResult} t={t} onCopy={() => handleCopy('ocr')} isCopied={isOcrCopied} />
                
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
                    <LanguageDropdown
                      languages={targetLanguages}
                      selectedLang={targetLang}
                      onSelectLang={setTargetLang}
                      title={t.targetLanguage}
                      searchPlaceholder="Search target language"
                    />
                    <button
                        onClick={handleTranslate}
                        disabled={isTranslating}
                        className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {isTranslating ? t.translating : t.translate}
                    </button>
                </div>

                {isTranslating && <div className="mt-4"><Loader t={{transcribing: t.translating, loadingMessage: ''}}/></div>}
                {translationError && <div className="text-red-400 mt-4 text-center">{translationError}</div>}
                {translatedText && (
                    <ResultBox title={t.translationResult} content={translatedText} t={t} onCopy={() => handleCopy('translation')} isCopied={isTranslationCopied} />
                )}
            </>
        )}
    </div>
  );
};

export default ImageAnalyzer;