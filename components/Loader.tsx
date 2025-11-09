import React from 'react';
import type { TranslationSet } from '../types';
import CountdownTimer from './CountdownTimer';

interface LoaderProps {
  message: string;
  subMessage?: string;
  duration?: number;
  t: TranslationSet;
}

const Loader: React.FC<LoaderProps> = ({ message, subMessage, duration, t }) => {
  return (
    <div className="m-auto text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto"></div>
      <p className="mt-4 text-lg font-semibold text-gray-300">{message}</p>
      {subMessage && <p className="mt-2 text-sm text-gray-400">{subMessage}</p>}
      {duration && <CountdownTimer duration={duration} t={t} />}
    </div>
  );
};

export default Loader;
