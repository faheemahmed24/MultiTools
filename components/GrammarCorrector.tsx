import React, { useState } from 'react';
import type { TranslationSet, GrammarHistoryItem } from '../types';
import { correctGrammar } from '../services/geminiService';

interface GrammarCorrectorProps {
  t: TranslationSet;
  onCorrectionComplete: (data: Partial<GrammarHistoryItem>) => void;
}

const GrammarCorrector: React.FC<GrammarCorrectorProps> = ({ t, onCorrectionComplete }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCorrect = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const corrected = await correctGrammar(text, 'English');
      setResult(corrected);
      onCorrectionComplete({
        originalText: text,
        correctedText: corrected,
        language: 'en',
        diff: [] // Diff logic omitted for brevity
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <textarea
        className="w-full h-48 bg-gray-800 p-4 rounded-xl border border-gray-700 text-white resize-none"
        placeholder="Enter text to check grammar..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleCorrect} disabled={loading || !text} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50">
        {loading ? 'Checking...' : 'Check Grammar'}
      </button>
      {result && <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 text-white whitespace-pre-wrap">{result}</div>}
    </div>
  );
};

export default GrammarCorrector;