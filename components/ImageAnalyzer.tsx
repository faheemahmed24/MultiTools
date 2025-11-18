
// Fix: Import useCallback from React to resolve 'Cannot find name' errors.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { TranslationSet } from '../types';
import type { LanguageOption } from '../lib/languages';
import { UploadIcon } from './icons/UploadIcon';
import { analyzeImage, translateText } from '../services/geminiService';
import LanguageDropdown from './LanguageDropdown';
import { targetLanguages } from '../lib/languages';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';
import { SkeletonLoader } from './Loader';

const ResultBox: React.FC<{ 
    title: string; 
    value: string; 
    t: TranslationSet; 
    onCopy: () => void; 
    isCopied: boolean; 
    onExport: (format: 'txt' | 'docx' | 'pdf') => void;
    onChange?: (newValue: string) => void;
    isLoading?: boolean;
}> = ({ title, value, t, onCopy, isCopied, onExport, onChange, isLoading = false }) => {
    const charCount = value.length;
    const isEditable = !!onChange;
    const [showExportMenu, setShowExportMenu] = useState(false);

    return (
        <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col mt-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg text-gray-200">{title}</h3>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="relative">
                         <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={isLoading}
                            className="flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                        >
                            <DownloadIcon className="w-4 h-4 me-2" />
                            {t.export}
                        </button>
                        {showExportMenu && (
                          <div onMouseLeave={() => setShowExportMenu(false)} className="absolute top-full mt-2 end-0 w-36 bg-gray-600 rounded-lg shadow-xl py-1 z-10">
                            <button onClick={() => onExport('txt')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">TXT (.txt)</button>
                            <button onClick={() => onExport('docx')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">DOCX (.docx)</button>
                            <button onClick={() => onExport('pdf')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">PDF (.pdf)</button>
                          </div>
                        )}
                    </div>
                    <button
                        onClick={onCopy}
                        disabled={isLoading}
                        className="flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                    >
                        {isCopied ? <CheckIcon className="w-4 h-4 me-2" /> : <CopyIcon className="w-4 h-4 me-2" />}
                        {isCopied ? t.copied : t.copy}
                    </button>
                </div>
            </div>
            <div className="overflow-y-auto flex-grow bg-gray-800/50 p-3 rounded-md min-h-[120px]">
                {isLoading ? (
                    <SkeletonLoader lines={3} />
                ) : (
                    <textarea
                        value={value}
                        readOnly={!isEditable}
                        onChange={(e) => onChange?.(e.target.value)}
                        className="w-full h-full bg-transparent text-gray-300 p-0 resize-none border-0 focus:ring-0"
                    />
                )}
            </div>
            <div className="text-end text-sm text-gray-400 mt-1 px-1">
                {!isLoading && `${charCount} characters`}
            </div>
        </div>
    );
};

interface ImageConverterOcrProps {
    t: TranslationSet;
    onAnalysisComplete: (data: { fileName: string; resultText: string; }) => void;
}

const ImageConverterOcr: React.FC<ImageConverterOcrProps> = ({ t, onAnalysisComplete }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  const [targetFormat, setTargetFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(90);

  const handleAnalyze = useCallback(async () => {
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
      onAnalysisComplete({ fileName: imageFile.name, resultText: result });
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, onAnalysisComplete]);
  
  const handleTranslate = useCallback(async () => {
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
  }, [editedAnalysisResult, targetLang.name]);

  useEffect(() => {
    if (imageFile && !analysisResult) {
      handleAnalyze();
    }
  }, [imageFile, analysisResult, handleAnalyze]);

  useEffect(() => {
    if (editedAnalysisResult && !isTranslating) {
      handleTranslate();
    }
  }, [editedAnalysisResult, targetLang, handleTranslate, isTranslating]);


  const processFile = (file: File) => {
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        processFile(file);
    }
  }, []);

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

  const handleDownloadImage = () => {
    if (!imagePreview || !imageFile) return;
  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const mimeType = `image/${targetFormat}`;
      const qualityValue = targetFormat === 'jpeg' ? quality / 100 : undefined;
      
      canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `${imageFile.name.split('.').slice(0, -1).join('.') || 'image'}.${targetFormat}`;
            createDownload(fileName, blob);
          }
      }, mimeType, qualityValue);
    };
    img.src = imagePreview;
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
                <img src={imagePreview} alt="Preview" className={`w-auto mx-auto rounded-lg max-h-60 object-contain transition-opacity duration-300 ${isLoading ? 'opacity-30' : ''}`}/>
                 {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-400"></div>
                        <p className="mt-3 text-white font-semibold">{t.analyzing}</p>
                    </div>
                )}
                <button
                    onClick={handleReset}
                    title={t.clearImage}
                    className="absolute top-2 end-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors duration-200"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
        ) : (
            <div
              onClick={handleUploadClick}
              className={`flex flex-grow flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors duration-300 cursor-pointer mb-4 ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-purple-500'}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
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
        {imageFile && (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t.imageFormat}</label>
                    <div className="flex bg-gray-700 rounded-lg p-1">
                        <button onClick={() => setTargetFormat('png')} className={`w-full py-2 rounded-md transition-colors ${targetFormat === 'png' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>PNG</button>
                        <button onClick={() => setTargetFormat('jpeg')} className={`w-full py-2 rounded-md transition-colors ${targetFormat === 'jpeg' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>JPEG</button>
                    </div>
                </div>
                {targetFormat === 'jpeg' && (
                    <div>
                    <label htmlFor="quality" className="block text-sm font-medium text-gray-300 mb-2">{t.qualityScale} ({quality}%)</label>
                    <input
                        id="quality"
                        type="range"
                        min="1"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    </div>
                )}
            </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4">
            <button
                onClick={handleDownloadImage}
                disabled={!imageFile}
                className="w-full sm:w-1/2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
            >
                {t.downloadImage}
            </button>
            <button
                onClick={handleAnalyze}
                disabled={isLoading || !imageFile}
                className="w-full sm:w-1/2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
            >
                {isLoading ? t.analyzing : (analysisResult ? t.reanalyze : t.analyze)}
            </button>
        </div>


        {error && <div className="text-red-400 mt-4 text-center">{error}</div>}
        
        {(analysisResult || isLoading) && (
            <>
                <ResultBox 
                    title={t.imageAnalysisResult} 
                    value={editedAnalysisResult} 
                    t={t} 
                    onCopy={() => handleCopy('ocr')} 
                    isCopied={isOcrCopied} 
                    onExport={(format) => handleExport(format, 'analysis')}
                    onChange={setEditedAnalysisResult}
                    isLoading={isLoading}
                />
                
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
                    <LanguageDropdown
                      languages={targetLanguages}
                      selectedLang={targetLang}
                      onSelectLang={setTargetLang}
                      title={t.targetLanguage}
                      searchPlaceholder="Search target language"
                    />
                </div>

                {translationError && <div className="text-red-400 mt-4 text-center">{translationError}</div>}
                
                {(isTranslating || translatedText || (isLoading && !error)) && (
                    <ResultBox 
                        title={t.translationResult} 
                        value={editedTranslatedText} 
                        t={t} 
                        onCopy={() => handleCopy('translation')} 
                        isCopied={isTranslationCopied} 
                        onExport={(format) => handleExport(format, 'translation')}
                        onChange={setEditedTranslatedText}
                        isLoading={isTranslating}
                    />
                )}
            </>
        )}
    </div>
  );
};

export default ImageConverterOcr;
