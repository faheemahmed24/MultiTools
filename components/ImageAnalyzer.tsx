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
import { DownloadIcon } from './icons/DownloadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';

const ResultBox: React.FC<{ 
    title: string; 
    value: string; 
    t: TranslationSet; 
    onCopy: () => void; 
    isCopied: boolean; 
    onExport: (format: 'txt' | 'docx' | 'pdf') => void;
    onChange?: (newValue: string) => void; 
}> = ({ title, value, t, onCopy, isCopied, onExport, onChange }) => {
    const charCount = value.length;
    const isEditable = !!onChange;
    const [showExportMenu, setShowExportMenu] = useState(false);

    return (
        <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col mt-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg text-gray-200">{title}</h3>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                         <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                        >
                            <DownloadIcon className="w-4 h-4 me-2" />
                            {t.export}
                        </button>
                        {showExportMenu && (
                          <div onMouseLeave={() => setShowExportMenu(false)} className="absolute top-full mt-2 right-0 w-36 bg-gray-600 rounded-lg shadow-xl py-1 z-10">
                            <button onClick={() => onExport('txt')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">TXT (.txt)</button>
                            <button onClick={() => onExport('docx')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">DOCX (.docx)</button>
                            <button onClick={() => onExport('pdf')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">PDF (.pdf)</button>
                          </div>
                        )}
                    </div>
                    <button
                        onClick={onCopy}
                        className="flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                    >
                        {isCopied ? <CheckIcon className="w-4 h-4 me-2" /> : <CopyIcon className="w-4 h-4 me-2" />}
                        {isCopied ? t.copied : t.copy}
                    </button>
                </div>
            </div>
            <div className="overflow-y-auto flex-grow bg-gray-800/50 p-3 rounded-md min-h-[120px]">
                <textarea
                    value={value}
                    readOnly={!isEditable}
                    onChange={(e) => onChange?.(e.target.value)}
                    className="w-full h-full bg-transparent text-gray-300 p-0 resize-none border-0 focus:ring-0"
                />
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
  const [editedAnalysisResult, setEditedAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetLang, setTargetLang] = useState<LanguageOption>(targetLanguages[0]);
  const [translatedText, setTranslatedText] = useState('');
  const [editedTranslatedText, setEditedTranslatedText] = useState('');
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
      setEditedAnalysisResult('');
      setTranslatedText('');
      setEditedTranslatedText('');
      setError(null);
      setTranslationError(null);
    }
  };
  
  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult('');
    setEditedAnalysisResult('');
    setIsLoading(false);
    setError(null);
    setTranslatedText('');
    setEditedTranslatedText('');
    setIsTranslating(false);
    setTranslationError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setIsLoading(true);
    setError(null);
    setAnalysisResult('');
    setEditedAnalysisResult('');
    setTranslatedText('');
    setEditedTranslatedText('');
    try {
      const result = await analyzeImage(imageFile);
      setAnalysisResult(result);
      setEditedAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!editedAnalysisResult) return;
    setIsTranslating(true);
    setTranslationError(null);
    setTranslatedText('');
    setEditedTranslatedText('');
    try {
        const result = await translateText(editedAnalysisResult, 'auto', targetLang.name);
        setTranslatedText(result);
        setEditedTranslatedText(result);
    } catch (err: any) {
        setTranslationError(err.message || 'An error occurred during translation.');
    } finally {
        setIsTranslating(false);
    }
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
  };

  const handleExport = async (format: 'txt' | 'docx' | 'pdf', type: 'analysis' | 'translation') => {
    const content = type === 'analysis' ? editedAnalysisResult : editedTranslatedText;
    if (!content || !imageFile) return;
    const baseFilename = imageFile.name.split('.').slice(0, -1).join('.') || 'image-export';
    const filename = type === 'analysis' ? `${baseFilename}-analysis` : `${baseFilename}-translation-${targetLang.code}`;

    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      createDownload(`${filename}.txt`, blob);
    } else if (format === 'docx') {
       const doc = new docx.Document({
        sections: [{
          children: content.split('\n').map(text => new docx.Paragraph(text)),
        }],
      });
      const blob = await docx.Packer.toBlob(doc);
      createDownload(`${filename}.docx`, blob);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(content, 10, 10);
      const blob = doc.output('blob');
      createDownload(`${filename}.pdf`, blob);
    }
  };

  const handleCopy = (type: 'ocr' | 'translation') => {
    const textToCopy = type === 'ocr' ? editedAnalysisResult : editedTranslatedText;
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
                <button
                    onClick={handleReset}
                    title={t.clearImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors duration-200"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>
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
                <ResultBox 
                    title={t.imageAnalysisResult} 
                    value={editedAnalysisResult} 
                    t={t} 
                    onCopy={() => handleCopy('ocr')} 
                    isCopied={isOcrCopied} 
                    onExport={(format) => handleExport(format, 'analysis')}
                    onChange={setEditedAnalysisResult}
                />
                
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
                    <ResultBox 
                        title={t.translationResult} 
                        value={editedTranslatedText} 
                        t={t} 
                        onCopy={() => handleCopy('translation')} 
                        isCopied={isTranslationCopied} 
                        onExport={(format) => handleExport(format, 'translation')}
                        onChange={setEditedTranslatedText}
                    />
                )}
            </>
        )}
    </div>
  );
};

export default ImageAnalyzer;