import React, { useState, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { analyzeImage } from '../services/geminiService';
import ImageUpload from './ImageUpload';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import Loader from './Loader';

interface OcrToolProps {
  t: TranslationSet;
}

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
};

const dataUrlToParts = (dataUrl: string): { base64: string, mimeType: string } => {
    const parts = dataUrl.split(',');
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const base64 = parts[1];
    if (!base64) {
        throw new Error("Failed to extract base64 string from data URL.");
    }
    return { base64, mimeType };
};


const OcrTool: React.FC<OcrToolProps> = ({ t }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('What is in this picture?');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleImageSelect = useCallback((file: File) => {
        setImageFile(file);
        setResult(null);
        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleAnalyze = async () => {
        if (!imageFile) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const dataUrl = await fileToDataUrl(imageFile);
            const { base64, mimeType } = dataUrlToParts(dataUrl);
            const analysisResult = await analyzeImage(base64, mimeType, prompt);
            setResult(analysisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const renderMainView = () => {
        if (isLoading) {
            return <Loader message={t.analyzing} t={t} />;
        }
        if (error) {
            return (
              <div className="m-auto text-center text-red-400">
                <h3 className="text-xl font-bold">{t.errorTitle}</h3>
                <p>{error}</p>
              </div>
            );
        }
        if (result) {
            return (
                <div className="flex flex-col h-full">
                    <h2 className="text-xl font-bold mb-4 text-gray-200">{t.imageAnalysis}</h2>
                    <div className="flex-grow bg-gray-900/50 rounded-lg p-4 overflow-y-auto mb-4 relative">
                         <button onClick={handleCopy} className="absolute top-3 right-3 z-10 flex items-center px-3 py-1 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200">
                            {isCopied ? <CheckIcon className="w-4 h-4 me-1.5"/> : <CopyIcon className="w-4 h-4 me-1.5" />}
                            {isCopied ? t.copied : t.copy}
                        </button>
                        <p className="text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">{result}</p>
                    </div>
                </div>
            )
        }
        
        return (
            <div className="m-auto text-center text-gray-400">
              <h3 className="text-2xl font-semibold">{t.welcomeOcrTitle}</h3>
              <p className="mt-2 max-w-prose mx-auto">{t.welcomeOcrMessage}</p>
            </div>
        );
    }

  return (
    <main className="flex-grow container mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <ImageUpload
            onImageSelect={handleImageSelect}
            onAnalyze={handleAnalyze}
            imageUrl={imageUrl}
            prompt={prompt}
            setPrompt={setPrompt}
            isLoading={isLoading}
            t={t}
        />
      </div>
      <div className="lg:col-span-2 bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col min-h-[60vh] lg:min-h-0">
        {renderMainView()}
      </div>
    </main>
  );
};

export default OcrTool;
