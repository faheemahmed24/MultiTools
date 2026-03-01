import React from 'react';
import { TranslatorIcon } from './icons/TranslatorIcon';
import type { TranslationSet } from '../types';

interface AITranslatorProps {
  t: TranslationSet;
  onTranslationComplete: () => void;
}

const AITranslator: React.FC<AITranslatorProps> = ({ t }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-fadeIn px-6">
      <div className="bg-zinc-50 dark:bg-zinc-900 p-10 rounded-lg border border-[var(--border-app)] mb-10 shadow-elevation-1">
        <TranslatorIcon className="w-16 h-16 text-zinc-900 dark:text-zinc-100" />
      </div>
      <h2 className="text-3xl font-bold text-[var(--text-primary)] uppercase tracking-tight mb-4">Universal Translator</h2>
      <p className="text-zinc-500 text-base max-w-lg leading-relaxed font-medium">
        Nuanced multilingual conversion. Translate text and documents across 100+ languages with neural accuracy.
      </p>
      <div className="mt-12 flex flex-col items-center gap-4">
        <div className="px-5 py-2 bg-zinc-100 dark:bg-zinc-900 border border-[var(--border-app)] rounded-md text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Module Optimization in Progress
        </div>
      </div>
    </div>
  );
};

export default AITranslator;
