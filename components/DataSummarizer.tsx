
import React, { useState } from 'react';
import type { TranslationSet, SmartSummary } from '../types';
import { smartSummarize } from '../services/geminiService';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SkeletonLoader } from './Loader';
import { SummarizerIcon } from './icons/SummarizerIcon';

interface DataSummarizerProps {
    t: TranslationSet;
    onComplete: (data: { inputText: string, result: SmartSummary }) => void;
}

const CategoryCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-900/40 rounded-2xl p-6 border border-gray-700/50 h-full flex flex-col">
        <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-4 border-b border-purple-400/10 pb-2">{title}</h3>
        <div className="flex-grow">
            {children}
        </div>
    </div>
);

const DataSummarizer: React.FC<DataSummarizerProps> = ({ t, onComplete }) => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<SmartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await smartSummarize(inputText);
      setResult(data);
      onComplete({ inputText, result: data });
    } catch (err: any) {
      setError(err.message || 'Failed to extract data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-extraction-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <div className="mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight mb-2 flex items-center gap-2">
            <SummarizerIcon className="w-6 h-6 text-purple-500" />
            {t.smartSummarizer}
          </h2>
          <p className="text-sm text-gray-400">{t.smartSummarizerDescription || 'Extract contacts, languages, numbers and insights from any text or transcription.'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow min-h-0">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative flex-grow flex flex-col">
             <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste transcribed text, logs, or any unstructured data here..."
                disabled={isLoading}
                className="w-full flex-grow bg-gray-800/50 rounded-2xl p-6 text-gray-200 resize-none focus:ring-2 focus:ring-purple-500 border border-gray-700/50 outline-none shadow-inner"
              />
              {inputText && !isLoading && (
                  <button onClick={() => setInputText('')} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                      <XCircleIcon className="w-6 h-6"/>
                  </button>
              )}
          </div>
          
          <button
            onClick={handleProcess}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-4 bg-purple-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-xl shadow-purple-900/20 active:scale-95"
          >
            {isLoading ? t.extracting : t.extractEntities}
          </button>
        </div>

        <div className="lg:col-span-7 overflow-y-auto pe-2 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-6">
                <CategoryCard title={t.summaryLabel}><SkeletonLoader lines={3} /></CategoryCard>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CategoryCard title={t.contactsFound}><SkeletonLoader lines={4} /></CategoryCard>
                    <CategoryCard title={t.numbersFound}><SkeletonLoader lines={4} /></CategoryCard>
                </div>
            </div>
          ) : result ? (
            <div className="space-y-6 pb-12 animate-fadeIn">
              <div className="flex justify-end gap-2 mb-2">
                  <button onClick={handleCopy} className="flex items-center px-4 py-2 bg-gray-800/80 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white border border-gray-700/50 transition-all">
                      {isCopied ? <CheckIcon className="w-4 h-4 me-2 text-green-500"/> : <CopyIcon className="w-4 h-4 me-2"/>}
                      {isCopied ? 'COPIED' : 'COPY JSON'}
                  </button>
                  <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gray-800/80 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white border border-gray-700/50 transition-all">
                      <DownloadIcon className="w-4 h-4 me-2"/> JSON
                  </button>
              </div>

              <CategoryCard title={t.summaryLabel}>
                <p className="text-gray-200 leading-relaxed font-medium">{result.summary}</p>
              </CategoryCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CategoryCard title={t.contactsFound}>
                   {result.contacts.length > 0 ? (
                       <ul className="space-y-3">
                           {result.contacts.map((c, i) => (
                               <li key={i} className="flex flex-col bg-gray-950/30 p-3 rounded-xl border border-gray-700/20">
                                   <span className="text-sm font-bold text-gray-100">{c.name}</span>
                                   <div className="flex justify-between items-center mt-1">
                                       <span className="text-xs text-purple-400 font-mono">{c.info}</span>
                                       <span className="text-[10px] font-black uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded text-gray-500">{c.type}</span>
                                   </div>
                               </li>
                           ))}
                       </ul>
                   ) : <p className="text-xs text-gray-500 italic">No contacts identified.</p>}
                </CategoryCard>

                <CategoryCard title={t.numbersFound}>
                   {result.numbers.length > 0 ? (
                       <ul className="space-y-3">
                           {result.numbers.map((n, i) => (
                               <li key={i} className="flex items-center justify-between bg-gray-950/30 p-3 rounded-xl border border-gray-700/20">
                                   <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">{n.label}</span>
                                   <span className="text-sm font-mono font-black text-pink-400">{n.value}</span>
                               </li>
                           ))}
                       </ul>
                   ) : <p className="text-xs text-gray-500 italic">No metrics identified.</p>}
                </CategoryCard>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CategoryCard title={t.languagesFound}>
                    <div className="flex flex-wrap gap-2">
                        {result.languages.map((l, i) => (
                            <span key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-bold uppercase tracking-widest">{l}</span>
                        ))}
                        {result.languages.length === 0 && <span className="text-xs text-gray-500 italic">Not detected.</span>}
                    </div>
                </CategoryCard>

                <CategoryCard title={t.keyInsights}>
                    <ul className="space-y-2">
                        {result.keyInsights.map((ki, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-300">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                {ki}
                            </li>
                        ))}
                        {result.keyInsights.length === 0 && <li className="text-xs text-gray-500 italic">No significant insights.</li>}
                    </ul>
                </CategoryCard>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-900/20 rounded-3xl border border-gray-800/50 dashed border-2">
                <SummarizerIcon className="w-16 h-16 text-gray-800 mb-6" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Ready for extraction</p>
                <p className="text-xs text-gray-600 mt-2 max-w-xs">Paste text on the left and click extract to see structured results here.</p>
            </div>
          )}
          {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default DataSummarizer;
