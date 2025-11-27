
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

export default Loader;
