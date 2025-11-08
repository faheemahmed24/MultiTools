import React from 'react';
import type { TranslationSet } from '../types';

interface ComingSoonToolProps {
  t: TranslationSet;
  toolName: string;
}

const ComingSoonTool: React.FC<ComingSoonToolProps> = ({ t, toolName }) => {
  return (
    <main className="flex-grow container mx-auto p-4 md:p-6 flex items-center justify-center">
      <div className="text-center text-gray-400 bg-gray-800 rounded-2xl shadow-lg p-12">
        <h2 className="text-3xl font-bold mb-2 text-gray-200">{toolName}</h2>
        <p className="text-xl text-purple-400">{t.comingSoon}</p>
      </div>
    </main>
  );
};

export default ComingSoonTool;
