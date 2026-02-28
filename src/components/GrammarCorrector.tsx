import React from 'react';
import { GrammarIcon } from './icons/GrammarIcon';
import type { TranslationSet } from '../types';

interface GrammarCorrectorProps {
  t: TranslationSet;
  onCorrectionComplete: () => void;
}

const GrammarCorrector: React.FC<GrammarCorrectorProps> = ({ t }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-fadeIn">
      <div className="bg-purple-600/10 p-8 rounded-[3rem] border border-purple-500/20 mb-8 shadow-2xl">
        <GrammarIcon className="w-20 h-20 text-purple-500 animate-pulse" />
      </div>
      <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Grammar Corrector</h2>
      <p className="text-gray-500 text-lg max-w-xl leading-relaxed">
        AI-driven stylistic proofreading. Refine your syntax, correct grammar, and improve the overall flow of your writing.
      </p>
      <div className="mt-12 flex flex-col items-center gap-4">
        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">
          Module Optimization in Progress
        </div>
      </div>
    </div>
  );
};

export default GrammarCorrector;
