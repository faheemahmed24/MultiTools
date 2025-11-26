import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { TranslationSet } from '../types';
import type { LanguageOption } from '../lib/languages';
import { analyzeImage, translateText } from '../services/geminiService';
import LanguageDropdown from './LanguageDropdown';
import { targetLanguages } from '../lib/languages';
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
                            disabled={isLoading || !value}
                            className="flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                        >
                            <i className="fas fa-download w-4 h-4 me-2" />
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
                        disabled={isLoading || !value}
                        className="flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                    >
                        {isCopied ? <i className="fas fa-check w-4 h-4 me-2" /> : <i className="fas fa-copy w-4 h-4 me-2" />}
                        {isCopied ? t.copied : t.copy}
                    </button>
                </div>
            </div>
            <div className="overflow-y-auto flex-grow bg-gray-800/50 p-3 rounded-md min-h-[150px] max-h-[400px]">
                {isLoading ? (
                    <SkeletonLoader lines={6} />
                ) : (
                    <textarea
                        value={value}
                        readOnly={!isEditable}
                        onChange={(e) => onChange?.(e.target.value)}
                        className="w-full h-full bg-transparent text-gray-300 p-0 resize-y border-0 focus:ring-0 min-h-[150px]"
                        placeholder={isLoading ? '' : "Extracted text will appear here..."}
                    />
                )}
            </div>
            <div className="text-end text-sm text-gray-400 mt-1 px-1">
                {!isLoading && `${charCount} characters`}
            </div>
        </div>
    );
};

interface AnalyzableImage {
    id: string;
    file: File;
    preview: string;
    status: 'pending' | 'analyzing' | 'done' | 'error';
}

interface ImageConverterOcrProps {
    t: TranslationSet;
    onAnalysisComplete: (data: { fileName: string; resultText: string; }) => void;
}

const ImageConverterOcr: React.FC<ImageConverterOcrProps> = ({ t, onAnalysisComplete }) => {
  const [images, setImages] = useState<AnalyzableImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const [analysisResult, setAnalysisResult] = useState('');
  const [editedAnalysisResult, setEditedAnalysisResult] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Translation State
  const [targetLang, setTargetLang] = useState<LanguageOption>(targetLanguages[0]);
  const [translatedText, setTranslatedText] = useState('');
  const [editedTranslatedText, setEditedTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const [isOcrCopied, setIsOcrCopied] = useState(false);
  const [isTranslationCopied, setIsTranslationCopied] = useState(false);

  const handleAnalyzeAll = useCallback(async () => {
    if (images.length === 0) return;
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult('');
    setEditedAnalysisResult('');
    setTranslatedText('');
    setEditedTranslatedText('');
    
    let combinedText = "";
    
    try {
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            
            // Update status to analyzing
            setImages(prev => prev.map(item => item.id === img.id ? { ...item, status: 'analyzing' } : item));
            setProgressMessage(`Analyzing image ${i + 1} of ${images.length}...`);

            // Rate Limiting: Pause if not the first image
            if (i > 0) {
                 setProgressMessage(`Pacing request for image ${i + 1} (waiting 5s)...`);
                 await new Promise(resolve => setTimeout(resolve, 5000));
            }

            try {
                const text = await analyzeImage(img.file);
                const sectionHeader = images.length > 1 ? `\n\n--- Image ${i + 1}: ${img.file.name} ---\n\n` : "";
                combinedText += sectionHeader + text;
                
                // Update status to done
                setImages(prev => prev.map(item => item.id === img.id ? { ...item, status: 'done' } : item));
            } catch (err) {
                console.error(err);
                setImages(prev => prev.map(item => item.id === img.id ? { ...item, status: 'error' } : item));
                const sectionHeader = images.length > 1 ? `\n\n--- Image ${i + 1}: ${img.file.name} ---\n\n` : "";
                combinedText += sectionHeader + "[Error extracting text from this image]";
            }
        }

        setAnalysisResult(combinedText.trim());
        setEditedAnalysisResult(combinedText.trim());
        
        // Notify parent of completion (using first filename as reference)
        if (images.length > 0) {
            onAnalysisComplete({ 
                fileName: images.length === 1 ? images[0].file.name : `Batch Scan (${images.length} files)`, 
                resultText: combinedText.trim() 
            });
        }

    } catch (err: any) {
      setError(err.message || 'An error occurred during batch analysis.');
    } finally {
      setIsAnalyzing(false);
      setProgressMessage('');
    }
  }, [images, onAnalysisComplete]);
  
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

  // Auto-translate only if a single image was analyzed and result appeared newly, 
  // otherwise for bulk, user should manually click (to save quota).
  useEffect(() => {
    if (editedAnalysisResult && !isTranslating && !translatedText && images.length === 1) {
      handleTranslate();
    }
  }, [editedAnalysisResult, targetLang, handleTranslate, isTranslating, translatedText, images.length]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const newFiles: AnalyzableImage[] = (Array.from(e.target.files) as File[])
            .filter((file: File) => file.type.startsWith('image/'))
            .map((file: File) => ({
                id: `${file.name}-${Date.now()}-${Math.random()}`,
                file,
                preview: URL.createObjectURL(file),
                status: 'pending'
            }));
        
        // If adding new files, reset previous results
        setAnalysisResult('');
        setEditedAnalysisResult('');
        setTranslatedText('');
        setEditedTranslatedText('');
        setError(null);
        
        setImages(prev => [...prev, ...newFiles]);
    }
    if (e.target) e.target.value = '';
  };
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
         const newFiles: AnalyzableImage[] = (Array.from(e.dataTransfer.files) as File[])
            .filter((f: File) => f.type.startsWith('image/'))
            .map((file: File) => ({
                id: `${file.name}-${Date.now()}-${Math.random()}`,
                file,
                preview: URL.createObjectURL(file),
                status: 'pending'
            }));
            
        if (newFiles.length > 0) {
             setAnalysisResult('');
             setEditedAnalysisResult('');
             setTranslatedText('');
             setEditedTranslatedText('');
             setError(null);
             setImages(prev => [...prev, ...newFiles]);
        }
    }
  }, []);

  const handleRemoveImage = (id: string) => {
    const img = images.find(i => i.id === id);
    if (img) URL.revokeObjectURL(img.preview);
    setImages(prev => prev.filter(i => i.id !== id));
  };

  const handleClearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setAnalysisResult('');
    setEditedAnalysisResult('');
    setTranslatedText('');
    setEditedTranslatedText('');
    setError(null);
    setTranslationError(null);
    setIsAnalyzing(false);
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
    if (!content) return;
    
    const baseFilename = images.length === 1 
        ? images[0].file.name.split('.').slice(0, -1).join('.') 
        : `batch-scan-${images.length}-files`;
        
    const filename = type === 'analysis' ? `${baseFilename}-ocr` : `${baseFilename}-translation-${targetLang.code}`;

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
      const splitText = doc.splitTextToSize(content, 180);
      let y = 10;
      splitText.forEach((line: string) => {
          if (y > 280) {
              doc.addPage();
              y = 10;
          }
          doc.text(line, 10, y);
          y += 7;
      });
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

  const StatusIcon = ({ status }: { status: AnalyzableImage['status'] }) => {
      if (status === 'analyzing') return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>;
      if (status === 'done') return <i className="fas fa-check-circle w-5 h-5 text-green-400 bg-black/50 rounded-full" />;
      if (status === 'error') return <i className="fas fa-times-circle w-5 h-5 text-red-400 bg-black/50 rounded-full" />;
      return <i className="fas fa-clock w-5 h-5 text-gray-400 bg-black/50 rounded-full" />;
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
          onChange={handleFileChange}
          accept="image/*"
          multiple
          {...({ webkitdirectory: "", directory: "" } as any)}
          className="hidden"
        />

      {images.length === 0 ? (
         <div className="flex-grow flex flex-col">
            <div
              className={`flex flex-grow flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors duration-300 mb-4 min-h-[300px] ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600'}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <i className="fas fa-cloud-upload-alt w-16 h-16 text-gray-500 mb-6 text-6xl" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">{t.uploadImages}</h3>
              <p className="text-gray-400 mb-6 text-center max-w-sm">Drag & drop images or folders here, or use the buttons below.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={handleUploadClick} className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-lg">
                      Select Files
                  </button>
                   <button onClick={handleFolderUploadClick} className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors flex items-center shadow-lg border border-gray-600">
                      <i className="fas fa-folder w-5 h-5 me-2" />
                      Select Folder
                  </button>
              </div>
            </div>
        </div>
      ) : (
        <div className="flex-grow">
             <div className="flex flex-wrap gap-2 items-center mb-4 justify-between">
                <div className="flex gap-2">
                     <button onClick={handleUploadClick} disabled={isAnalyzing} className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50">
                        <i className="fas fa-plus w-5 h-5 me-2"/>{t.addMoreImages}
                    </button>
                    <button onClick={handleFolderUploadClick} disabled={isAnalyzing} className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50">
                        <i className="fas fa-folder w-5 h-5 me-2"/>Add Folder
                    </button>
                    <button onClick={handleClearAll} disabled={isAnalyzing} className="flex items-center px-4 py-2 bg-red-600/20 text-red-300 font-semibold rounded-lg hover:bg-red-600/40 transition-colors duration-200 disabled:opacity-50">
                        <i className="fas fa-trash w-5 h-5 me-2"/>{t.clearAll}
                    </button>
                </div>
                <div className="text-sm text-gray-400">
                    {images.length} {images.length === 1 ? 'image' : 'images'} selected
                </div>
             </div>

             {/* Image Grid */}
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6 max-h-[40vh] overflow-y-auto p-1">
                {images.map((img, index) => (
                    <div key={img.id} className="group relative bg-gray-900/50 p-2 rounded-lg aspect-square flex items-center justify-center border border-gray-700">
                        <img src={img.preview} alt={img.file.name} className="max-w-full max-h-full object-contain rounded-md" />
                        
                        <div className="absolute top-1 right-1">
                             {isAnalyzing || img.status !== 'pending' ? (
                                <StatusIcon status={img.status} />
                             ) : (
                                <button onClick={() => handleRemoveImage(img.id)} className="p-1 bg-black/60 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i className="fas fa-times w-4 h-4" />
                                </button>
                             )}
                        </div>
                        
                        <div className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 rounded text-xs text-white truncate max-w-[90%]">
                            {index + 1}. {img.file.name}
                        </div>
                    </div>
                ))}
             </div>

             {/* Action Button */}
             <div className="flex justify-center mb-6">
                <button
                    onClick={handleAnalyzeAll}
                    disabled={isAnalyzing || images.length === 0}
                    className="w-full md:w-auto min-w-[200px] px-8 py-3 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20"
                >
                    {isAnalyzing ? (progressMessage || t.analyzing) : (analysisResult ? t.reanalyze : t.analyze)}
                </button>
             </div>

             {error && <div className="text-red-400 mb-4 text-center bg-red-900/20 p-3 rounded-lg border border-red-800">{error}</div>}

             {/* Results Section */}
             {(analysisResult || isAnalyzing) && (
                <div className="animate-fadeIn">
                    <ResultBox 
                        title={t.imageAnalysisResult} 
                        value={editedAnalysisResult} 
                        t={t} 
                        onCopy={() => handleCopy('ocr')} 
                        isCopied={isOcrCopied} 
                        onExport={(format) => handleExport(format, 'analysis')}
                        onChange={setEditedAnalysisResult}
                        isLoading={isAnalyzing}
                    />
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 border-t border-gray-700 pt-6">
                        <div className="flex-grow w-full">
                             <LanguageDropdown
                                languages={targetLanguages}
                                selectedLang={targetLang}
                                onSelectLang={setTargetLang}
                                title={t.targetLanguage}
                                searchPlaceholder="Search target language"
                                />
                        </div>
                        <button 
                            onClick={handleTranslate}
                            disabled={isTranslating || !editedAnalysisResult}
                            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors h-[42px] mt-auto"
                        >
                            {isTranslating ? t.translating : t.translate}
                        </button>
                    </div>

                    {translationError && <div className="text-red-400 mt-4 text-center">{translationError}</div>}
                    
                    {(isTranslating || translatedText) && (
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
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ImageConverterOcr;