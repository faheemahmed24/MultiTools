import React from 'react';
import { Loader2 } from 'lucide-react';
import type { TranslationSet } from '../types';

interface LoaderProps {
  t: TranslationSet;
  processingMessage?: string;
}

const Loader: React.FC<LoaderProps> = ({ t, processingMessage }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 animate-fadeIn text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-purple-500/20 blur-[60px] rounded-full animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-purple-500 animate-spin relative z-10" />
      </div>
      <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">
        {t.processing || 'Neural Processing...'}
      </h3>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
        {processingMessage || 'Synthesizing data through our neural engine. This may take a few moments depending on complexity.'}
      </p>
    </div>
  );
};

export const SkeletonLoader: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-3 animate-pulse ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className="h-4 bg-gray-700/50 rounded-full" 
        style={{ width: `${Math.floor(Math.random() * (100 - 70 + 1) + 70)}%` }}
      ></div>
    ))}
  </div>
);

export default Loader;
