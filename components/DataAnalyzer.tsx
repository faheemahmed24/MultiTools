
import React, { useState } from 'react';
import type { TranslationSet } from '../types';
import { analyzeData } from '../services/geminiService';
import { SkeletonLoader } from './Loader';
import ReactMarkdown from 'react-markdown';

interface DataAnalyzerProps {
  t: TranslationSet;
}

const DataAnalyzer: React.FC<DataAnalyzerProps> = ({ t }) => {
  const [dataInput, setDataInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!dataInput.trim()) return;
    setIsLoading(true);
    setError(null);
    setAnalysisResult('');
    
    try {
      const result = await analyzeData(dataInput);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred during data analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <label className="text-gray-200 font-semibold">{t.dataInputPlaceholder}</label>
        <textarea
          value={dataInput}
          onChange={(e) => setDataInput(e.target.value)}
          placeholder={t.dataInputPlaceholder}
          className="w-full h-48 bg-gray-900/50 rounded-lg p-4 text-gray-200 resize-y focus:ring-2 focus:ring-purple-500 border border-gray-700 focus:border-purple-500"
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !dataInput.trim()}
          className="self-start px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {isLoading ? t.analyzing : t.analyzeData}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {(analysisResult || isLoading) && (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700 flex-grow">
          <h3 className="text-xl font-bold text-gray-200 mb-4">{t.analysisResult}</h3>
          {isLoading ? (
            <SkeletonLoader lines={6} />
          ) : (
            <div className="prose prose-invert max-w-none text-gray-300">
                <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataAnalyzer;
