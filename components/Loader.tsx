
import React from 'react';
import type { TranslationSet } from '../types';

interface LoaderProps {
  t: TranslationSet;
}

const Loader: React.FC<LoaderProps> = ({ t }) => {
  return (
    <div className="m-auto text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto"></div>
      <p className="mt-4 text-lg font-semibold text-gray-300">{t.transcribing}</p>
      <p className="mt-2 text-sm text-gray-400">{t.loadingMessage}</p>
    </div>
  );
};

export const SkeletonLoader: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-3 animate-pulse ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className="h-4 bg-gray-700 rounded" 
        style={{ width: `${Math.floor(Math.random() * (100 - 70 + 1) + 70)}%` }}
      ></div>
    ))}
  </div>
);

export default Loader;
