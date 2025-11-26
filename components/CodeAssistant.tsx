
import React, { useState } from 'react';
import type { TranslationSet } from '../types';
import { generateCode } from '../services/geminiService';
import { SkeletonLoader } from './Loader';

interface CodeAssistantProps {
  t: TranslationSet;
}

const CodeAssistant: React.FC<CodeAssistantProps> = ({ t }) => {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult('');
    
    try {
      const generated = await generateCode(prompt, context);
      setResult(generated);
    } catch (err: any) {
      setError(err.message || 'An error occurred during code generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-gray-200 font-semibold mb-2">{t.codePromptPlaceholder}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Create a React component for a counter..."
              className="w-full h-32 bg-gray-900/50 rounded-lg p-4 text-gray-200 resize-y focus:ring-2 focus:ring-purple-500 border border-gray-700 focus:border-purple-500"
            />
          </div>
          <div>
             <label className="block text-gray-200 font-semibold mb-2">{t.codeContextPlaceholder}</label>
             <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="// Paste existing code here if needed..."
              className="w-full h-32 bg-gray-900/50 rounded-lg p-4 text-gray-200 font-mono text-sm resize-y focus:ring-2 focus:ring-purple-500 border border-gray-700 focus:border-purple-500"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isLoading ? 'Generating...' : t.generateCode}
          </button>
           {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="bg-gray-900/50 rounded-lg border border-gray-700 flex flex-col overflow-hidden h-[500px] lg:h-auto">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
            <span className="text-gray-300 font-mono text-sm">Output</span>
            <button 
                onClick={handleCopy}
                disabled={!result}
                className="text-xs flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200 transition-colors disabled:opacity-50"
            >
               {isCopied ? <i className="fas fa-check text-green-400"/> : <i className="fas fa-copy"/>}
               {isCopied ? t.copied : t.copy}
            </button>
          </div>
          <div className="p-4 overflow-y-auto flex-grow">
            {isLoading ? (
              <SkeletonLoader lines={8} />
            ) : result ? (
              <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">{result}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 text-sm italic">
                Generated code will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeAssistant;
