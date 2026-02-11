import React from 'react';
import type { TranslationSet } from '../types';

interface LoaderProps {
  t: TranslationSet;
  processingMessage?: string;
}

const Loader: React.FC<LoaderProps> = ({ t, processingMessage }) => {
  return (
    <div className="m-auto text-center animate-fadeIn">
      <div className="relative inline-block mb-10">
          <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"></div>
          <div className="relative animate-spin rounded-full h-24 w-24 border-b-2 border-purple-400 border-t-2 border-t-transparent mx-auto"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-purple-600/10 rounded-full flex items-center justify-center border border-purple-500/20">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
      </div>
      <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{t.transcribing}</h3>
      <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em] mb-6">{t.loadingMessage}</p>
      
      {processingMessage && (
        <div className="max-w-md mx-auto px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl animate-pop-in">
           <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest block mb-1">Current Logic Node</span>
           <p className="text-sm font-bold text-gray-300 truncate">{processingMessage}</p>
        </div>
      )}
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