
import React, { useState, useRef } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { analyzeImage } from '../services/geminiService';
import Loader from './Loader';

const ImageAnalyzer: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile || !prompt) {
      setError('Please upload an image and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult('');
    try {
      const result = await analyzeImage(imageFile, prompt);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] lg:h-full flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
            <div className="flex flex-col">
                <div 
                    className="flex-grow flex flex-col"
                    onClick={!imagePreview ? handleUploadClick : undefined}
                >
                    {imagePreview ? (
                        <div className="relative mb-4">
                            <img src={imagePreview} alt="Preview" className="w-full rounded-lg max-h-80 object-contain"/>
                            <button onClick={handleRemoveImage} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/80 leading-none w-6 h-6 flex items-center justify-center">
                               &times;
                            </button>
                        </div>
                    ) : (
                        <div
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
                 <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="What do you want to know about the image?"
                    className="w-full bg-gray-700 rounded-lg p-3 text-gray-200 resize-none focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-500"
                    rows={3}
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !imageFile || !prompt}
                    className="mt-4 w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isLoading ? t.analyzing : t.analyze}
                </button>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col">
                <h3 className="font-semibold text-lg mb-2 text-gray-200 flex-shrink-0">{t.imageAnalysisResult}</h3>
                <div className="overflow-y-auto flex-grow">
                    {isLoading && <Loader t={t} />}
                    {error && <div className="text-red-400">{error}</div>}
                    {analysisResult && <div className="text-gray-300 whitespace-pre-wrap">{analysisResult}</div>}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ImageAnalyzer;
