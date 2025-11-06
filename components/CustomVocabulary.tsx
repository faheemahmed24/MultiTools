import React from 'react';
import type { TranslationSet } from '../types';

interface CustomVocabularyProps {
  value: string;
  onChange: (value: string) => void;
  t: TranslationSet;
}

const CustomVocabulary: React.FC<CustomVocabularyProps> = ({ value, onChange, t }) => {
  return (
    <div className="mt-6">
      <label htmlFor="custom-vocabulary" className="block text-sm font-medium text-[color:var(--text-secondary)] mb-2">
        {t.customVocabulary}
      </label>
      <textarea
        id="custom-vocabulary"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.customVocabularyPlaceholder}
        className="w-full p-2 bg-[color:var(--bg-secondary)] border border-gray-300 dark:border-gray-600 rounded-md focus:ring-[color:var(--accent-primary)] focus:border-[color:var(--accent-primary)] text-[color:var(--text-primary)] shadow-sm text-sm"
      />
    </div>
  );
};

export default CustomVocabulary;