
import React from 'react';
import type { TranslationSet } from '../types';

interface LoaderProps {
  t: TranslationSet;
  timeLeft: number;
}

const Loader: React.FC<LoaderProps> = ({ t, timeLeft }) => {
  return (
    <div className="m-auto text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[color:var(--accent-primary)] mx-auto"></div>
      <p className="mt-4 text-lg font-semibold text-[color:var(--text-primary)]">{t.transcribing}</p>
      <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{t.loadingMessage}</p>
      <p className="mt-2 text-sm text-[color:var(--text-secondary)] tabular-nums">{t.timeRemaining}: {timeLeft}s</p>
    </div>
  );
};

export default Loader;