import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { TranslationSet } from '../types';
import type { LanguageOption } from '../lib/languages';
import { UploadIcon } from './icons/UploadIcon';
import { FolderPlusIcon } from './icons/FolderPlusIcon';
import { analyzeImage, translateText } from '../services/geminiService';
import LanguageDropdown from './LanguageDropdown';
import { targetLanguages } from '../lib/languages';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';

const SkeletonLoader: React.FC = () => (
    <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
    </div>
);

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
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom if loading new content
    useEffect(() => {
        if (isLoading && textAreaRef.current) {
            textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
        }
    }, [value, isLoading]);

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
                {isLoading && !value ? (
                    <SkeletonLoader />
                ) : (
                    <textarea
                        ref={textAreaRef}
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

interface ImageFileItem {
    id: string;
    file: File;
    preview: string;
}

const ImageConverterOcr: React.FC<ImageConverterOcrProps> = ({ t, onAnalysisComplete }) => {
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  
  const [analysisResult, setAnalysisResult] = useState('');
  const [editedAnalysisResult, setEditedAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [targetLang, setTargetLang] = useState<LanguageOption>(targetLanguages[0]);
  const [translatedText, setTranslatedText] = useState('');
  const [editedTranslatedText, setEditedTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const [isOcrCopied, setIsOcrCopied] = useState(false);
  const [isTranslationCopied, setIsTranslationCopied] = useState(false);

  const [targetFormat, setTargetFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(90);

  const activeImage = images[activeIndex];
  
  // Use a ref to track images for cleanup on unmount, ensuring we have the latest list
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
        // Cleanup object URLs when component unmounts
        imagesRef.current.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  // Reset results when switching active image
  useEffect(() => {
    if (!isLoading && !batchProgress) {
        setAnalysisResult('');
        setEditedAnalysisResult('');
        setTranslatedText('');
        setEditedTranslatedText('');
        setError(null);
        setTranslationError(null);
        setIsTranslating(false);
    }
  }, [activeIndex, isLoading, batchProgress]);

  const handleAnalyze = useCallback(async () => {
    if (!activeImage) return;
    setIsLoading(true);
    setError(null);
    setAnalysisResult('');
    setEditedAnalysisResult('');
    setTranslatedText('');
    setEditedTranslatedText('');
    setBatchProgress('');
    try {
      const result = await analyzeImage(activeImage.file);
      setAnalysisResult(result);
      setEditedAnalysisResult(result);
      onAnalysisComplete({ fileName: activeImage.file.name, resultText: result });
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  }, [activeImage, onAnalysisComplete]);

  const handleAnalyzeAll = useCallback(async () => {
      if (images.length === 0) return;
      setIsLoading(true);
      setError(null);
      setAnalysisResult('');
      setEditedAnalysisResult('');
      setTranslatedText('');
      setEditedTranslatedText('');
      
      let combinedResult = '';
      
      try {
          for (let i = 0; i < images.length; i++) {
              const img = images[i];
              setBatchProgress(`${t.analyzing} (${i + 1}/${images.length})`);
              setActiveIndex(i); // Show the image being analyzed
              
              const result = await analyzeImage(img.file);
              const header = `--- ${img.file.name} ---\n`;
              const chunk = `${header}${result}\n\n`;
              combinedResult += chunk;
              
              // Update UI progressively
              setEditedAnalysisResult(prev => prev + chunk);
          }
          setAnalysisResult(combinedResult);
          // Final update to ensure consistency
          setEditedAnalysisResult(combinedResult);
          onAnalysisComplete({ fileName: `Batch Analysis (${images.length} files)`, resultText: combinedResult });
      } catch (err: any) {
          setError(err.message || 'An error occurred during batch analysis.');
      } finally {
          setIsLoading(false);
          setBatchProgress('');
      }
  }, [images, onAnalysisComplete, t.analyzing]);
  
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
    // Auto analyze only if new image and no result yet
    if (activeImage && !analysisResult && !isLoading && !error && !batchProgress) {
      handleAnalyze();
    }
  }, [activeImage, analysisResult, handleAnalyze, isLoading, error, batchProgress]);

  useEffect(() => {
    if (editedAnalysisResult && !isTranslating && !translatedText && !translationError) {
      handleTranslate();
    }
  }, [editedAnalysisResult, targetLang, handleTranslate, isTranslating, translatedText, translationError]);


  const processFiles = (files: File[]) => {
      const newImages = files.map(file => ({
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file)
      }));
      setImages(prev => {
          const updated = [...prev, ...newImages];
          if (prev.length === 0 && newImages.length > 0) {
            setActiveIndex(0);
          }
          return updated;
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        processFiles(Array.from(e.target.files));
    }
    if(e.target) e.target.value = '';
  };
  
  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files) as File[];
        // Filter using MIME type AND extension for better reliability
        const supportedFiles = files.filter((file: File) => {
            const type = file.type;
            const name = file.name.toLowerCase();
            return type.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp|tiff|svg|ico|heic)$/i.test(name);
        });
        
        if (supportedFiles.length > 0) {
             processFiles(supportedFiles);
        } else {
            alert('No supported image files found in the selected folder.');
        }
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
      URL.revokeObjectURL(images[index].preview);
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      if (index === activeIndex) {
          setActiveIndex(0);
      } else if (index > newImages.length - 1) {
          setActiveIndex(Math.max(0, newImages.length - 1));
      }
  };

  const handleReset = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setActiveIndex(0);
    setAnalysisResult('');
    setEditedAnalysisResult('');
    setIsLoading(false);
    setError(null);
    setTranslatedText('');
    setEditedTranslatedText('');
    setIsTranslating(false);
    setTranslationError(null);
    setBatchProgress('');
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
    if (!activeImage) return;
  
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
            const fileName = `${activeImage.file.name.split('.').slice(0, -1).join('.') || 'image'}.${targetFormat}`;
            createDownload(fileName, blob);
          }
      }, mimeType, qualityValue);
    };
    img.src = activeImage.preview;
  };

  const handleExport = async (format: 'txt' | 'docx' | 'pdf', type: 'analysis' | 'translation') => {
    const content = type === 'analysis' ? editedAnalysisResult : editedTranslatedText;
    if (!content || !activeImage) return;
    const baseFilename = images.length > 1 && type === 'analysis' && batchProgress ? 'batch-analysis' : (activeImage.file.name.split('.').slice(0, -1).join('.') || 'image-export');
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

  const handleFolderUploadClick = () => {
      folderInputRef.current?.click();
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] lg:h-full flex flex-col">
       <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
        <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderChange}
            {...({ webkitdirectory: "", directory: "" } as any)}
            multiple
            className="hidden"
        />

      {/* File List / Empty State */}
      <div className="flex-grow">
        {images.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar File List */}
                <div className="w-full lg:w-48 flex-shrink-0 flex flex-col gap-2">
                     <div className="flex gap-2 mb-2">
                        <button onClick={handleUploadClick} className="flex-1 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex justify-center items-center" title="Add Images">
                             <PlusIcon className="w-5 h-5"/>
                        </button>
                         <button onClick={handleFolderUploadClick} className="flex-1 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex justify-center items-center" title={t.uploadFolder}>
                             <FolderPlusIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={handleReset} className="flex-1 py-2 bg-red-900/50 rounded-lg hover:bg-red-900 flex justify-center items-center" title="Clear All">
                             <TrashIcon className="w-5 h-5"/>
                        </button>
                     </div>
                     <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto gap-2 max-h-32 lg:max-h-[600px] p-1">
                        {images.map((img, idx) => (
                            <div 
                                key={img.id} 
                                onClick={() => !isLoading && setActiveIndex(idx)}
                                className={`relative flex-shrink-0 w-20 h-20 lg:w-full lg:h-24 rounded-lg cursor-pointer border-2 overflow-hidden group ${activeIndex === idx ? 'border-purple-500' : 'border-gray-700 hover:border-gray-500'} ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
                            >
                                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                {!isLoading && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <CloseIcon className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                     </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-grow min-w-0">
                    <div className="relative mb-4 text-center">
                        <img src={activeImage.preview} alt="Preview" className={`w-auto mx-auto rounded-lg max-h-80 object-contain transition-opacity duration-300 ${isLoading ? 'opacity-30' : ''}`}/>
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-400"></div>
                                <p className="mt-3 text-white font-semibold">{batchProgress || t.analyzing}</p>
                            </div>
                        )}
                         {/* Format controls for download */}
                         <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-700/30 p-4 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t.imageFormat}</label>
                                <div className="flex bg-gray-700 rounded-lg p-1">
                                    <button onClick={() => setTargetFormat('png')} disabled={isLoading} className={`w-full py-1.5 text-sm rounded-md transition-colors ${targetFormat === 'png' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>PNG</button>
                                    <button onClick={() => setTargetFormat('jpeg')} disabled={isLoading} className={`w-full py-1.5 text-sm rounded-md transition-colors ${targetFormat === 'jpeg' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>JPEG</button>
                                </div>
                            </div>
                            <div className="flex flex-col justify-end">
                                 {targetFormat === 'jpeg' && (
                                    <div className="mb-2">
                                        <label htmlFor="quality" className="text-xs text-gray-300">{t.qualityScale} ({quality}%)</label>
                                        <input id="quality" type="range" min="1" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value, 10))} disabled={isLoading} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50" />
                                    </div>
                                )}
                                <div className="flex gap-2">
                                     <button onClick={handleDownloadImage} disabled={isLoading} className="flex-1 px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        {t.downloadImage}
                                    </button>
                                    <button onClick={handleAnalyze} disabled={isLoading} className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 transition-colors disabled:cursor-not-allowed">
                                        {isLoading && !batchProgress ? t.analyzing : (analysisResult && !batchProgress ? t.reanalyze : t.analyze)}
                                    </button>
                                    {images.length > 1 && (
                                        <button onClick={handleAnalyzeAll} disabled={isLoading} className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 transition-colors disabled:cursor-not-allowed">
                                            {t.analyzeAll}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
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
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors duration-300 border-gray-600 hover:border-purple-500 min-h-[400px]">
              <UploadIcon className="w-16 h-16 text-gray-500 mb-6" />
              <div className="flex gap-4">
                  <button onClick={handleUploadClick} className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200">
                    {t.uploadImage}
                  </button>
                   <button onClick={handleFolderUploadClick} className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2">
                    <FolderPlusIcon className="w-5 h-5"/>
                    {t.uploadFolder}
                  </button>
              </div>
              <p className="mt-4 text-gray-400">{t.dropImages}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageConverterOcr;