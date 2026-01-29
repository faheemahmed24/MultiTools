
import React, { useState, useEffect } from 'react';
import type { TranslationSet, SmartSummary } from '../types';
import { smartSummarize, processStructuredTask } from '../services/geminiService';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SkeletonLoader } from './Loader';
import { SummarizerIcon } from './icons/SummarizerIcon';
import { SearchIcon } from './icons/SearchIcon';
import { BoltIcon } from './icons/BoltIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface DataSummarizerProps {
    t: TranslationSet;
    onComplete: (data: { inputText: string, result: SmartSummary }) => void;
    externalCategory?: string;
}

interface SummaryToolItem {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

interface SummaryCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
  tools: SummaryToolItem[];
}

const CategoryCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-900/40 rounded-2xl p-6 border border-gray-700/50 h-full flex flex-col">
        <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-4 border-b border-purple-400/10 pb-2">{title}</h3>
        <div className="flex-grow">
            {children}
        </div>
    </div>
);

const DataSummarizer: React.FC<DataSummarizerProps> = ({ t, onComplete, externalCategory = 'All' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(externalCategory);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setActiveCategory(externalCategory);
  }, [externalCategory]);

  const categories: SummaryCategory[] = [
    {
      title: 'Data Extraction',
      icon: <SummarizerIcon className="w-5 h-5" />,
      color: 'text-purple-400',
      tools: [
        { id: 'smart-sum', name: 'Smart Summarizer', description: 'Extract contacts, insights, and key metrics from any text.', badge: 'AI' },
        { id: 'entity-extract', name: 'Entity Extractor', description: 'Identify names, locations, and dates from unstructured data.' },
      ]
    },
    {
        title: 'Meeting & Business',
        icon: <BoltIcon className="w-5 h-5" />,
        color: 'text-yellow-400',
        tools: [
          { id: 'action-items', name: 'Action Item Generator', description: 'Convert meeting notes into clear tasks and deadlines.' },
          { id: 'swot-analysis', name: 'SWOT Analysis AI', description: 'Generate Strengths, Weaknesses, Opportunities, Threats from reports.' },
        ]
    }
  ];

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    const tool = categories.flatMap(c => c.tools).find(t => t.id === activeToolId);
    
    try {
      if (activeToolId === 'smart-sum') {
        const data = await smartSummarize(inputText);
        setResult(data);
        onComplete({ inputText, result: data });
      } else {
        const data = await processStructuredTask(inputText, tool?.name || 'Summarize Data');
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to extract data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    tools: cat.tools.filter(tool => 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => (activeCategory === 'All' || cat.title === activeCategory) && cat.tools.length > 0);

  const categoryNames = ['All', ...categories.map(c => c.title)];

  const handleCategorySwitch = (name: string) => {
      setActiveCategory(name);
      setActiveToolId(null);
  };

  const currentTool = categories.flatMap(c => c.tools).find(t => t.id === activeToolId);

  if (activeToolId) {
    return (
        <div className="flex flex-col h-full animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => { setActiveToolId(null); setResult(null); }} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors bg-gray-900 px-4 py-2 rounded-xl border border-gray-800">
                    <ArrowPathIcon className="w-4 h-4" /> Back to Summary List
                </button>
                <div className="text-right">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">{currentTool?.name}</h2>
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Powered by MultiTools Engine</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow min-h-0">
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="relative flex-grow flex flex-col">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={`Paste ${currentTool?.name.toLowerCase()} context here...`}
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
                        {isLoading ? 'Cognitive Rendering...' : `Execute ${currentTool?.name}`}
                    </button>
                </div>

                <div className="lg:col-span-7 overflow-y-auto pe-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="space-y-6">
                            <CategoryCard title="Global Intelligence Output"><SkeletonLoader lines={8} /></CategoryCard>
                        </div>
                    ) : result ? (
                        <div className="space-y-6 pb-12 animate-fadeIn">
                            <div className="flex justify-end gap-2 mb-2">
                                <button onClick={handleCopy} className="flex items-center px-4 py-2 bg-gray-800/80 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white border border-gray-700/50 transition-all">
                                    {isCopied ? <CheckIcon className="w-4 h-4 me-2 text-green-500"/> : <CopyIcon className="w-4 h-4 me-2"/>}
                                    {isCopied ? 'COPIED' : 'COPY OUTPUT'}
                                </button>
                            </div>

                            {activeToolId === 'smart-sum' ? (
                                <>
                                    <CategoryCard title={t.summaryLabel}>
                                        <p className="text-gray-200 leading-relaxed font-medium">{result.summary}</p>
                                    </CategoryCard>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <CategoryCard title={t.contactsFound}>
                                            <ul className="space-y-3">
                                                {result.contacts.map((c: any, i: number) => (
                                                    <li key={i} className="flex flex-col bg-gray-950/30 p-3 rounded-xl border border-gray-700/20">
                                                        <span className="text-sm font-bold text-gray-100">{c.name}</span>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xs text-purple-400 font-mono">{c.info}</span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded text-gray-500">{c.type}</span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CategoryCard>
                                        <CategoryCard title={t.numbersFound}>
                                            <ul className="space-y-3">
                                                {result.numbers.map((n: any, i: number) => (
                                                    <li key={i} className="flex items-center justify-between bg-gray-950/30 p-3 rounded-xl border border-gray-700/20">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">{n.label}</span>
                                                        <span className="text-sm font-mono font-black text-pink-400">{n.value}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CategoryCard>
                                    </div>
                                </>
                            ) : (
                                <CategoryCard title="Structured Intelligence Result">
                                    <div className="text-gray-200 leading-relaxed whitespace-pre-wrap font-medium prose prose-invert max-w-none">
                                        {result}
                                    </div>
                                </CategoryCard>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-900/20 rounded-3xl border border-gray-800/50 border-dashed border-2">
                            <SummarizerIcon className="w-16 h-16 text-gray-800 mb-6" />
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Engine Waiting for Input</p>
                            <p className="text-xs text-gray-600 mt-2 max-w-xs">Paste content into the terminal to begin high-fidelity extraction.</p>
                        </div>
                    )}
                    {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white tracking-tight mb-6 flex items-center gap-3">
          <SummarizerIcon className="w-8 h-8 text-purple-500" />
          Smart Summary Hub
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-gray-500" />
                </div>
                <input
                    type="text"
                    placeholder="Search summarizer tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl py-3.5 pl-12 pr-6 text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-xl"
                />
            </div>
            <div className="flex overflow-x-auto gap-2 pb-1 w-full md:w-auto custom-scrollbar no-scrollbar">
                {categoryNames.map(name => (
                    <button
                        key={name}
                        onClick={() => handleCategorySwitch(name)}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeCategory === name ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'}`}
                    >
                        {name}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="flex-grow space-y-10 pb-24 overflow-y-auto pe-4 custom-scrollbar">
        {filteredCategories.map((category, idx) => (
          <section key={idx} className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-800 pb-3">
              <div className={`p-1.5 rounded-lg bg-gray-800 ${category.color}`}>
                {category.icon}
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-200">{category.title}</h3>
            </div>
            
            <div className="flex flex-col divide-y divide-gray-800/50 border border-gray-800/50 rounded-3xl overflow-hidden bg-gray-900/20 backdrop-blur-sm">
              {category.tools.map((tool) => (
                <button 
                  key={tool.id}
                  onClick={() => setActiveToolId(tool.id)}
                  className="group flex items-center justify-between p-5 hover:bg-purple-600/5 transition-all text-left w-full"
                >
                  <div className="flex-grow min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-gray-100 group-hover:text-purple-400 transition-colors leading-tight truncate">{tool.name}</span>
                        {tool.badge && (
                            <span className="text-[9px] font-black bg-purple-600/20 text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-500/20 uppercase tracking-tighter shrink-0">
                                {tool.badge}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 group-hover:text-gray-400 transition-colors">{tool.description}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 hidden sm:inline">Open Terminal</span>
                    <div className="bg-purple-600/20 p-2 rounded-full text-purple-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}

        {filteredCategories.length === 0 && (
            <div className="py-24 text-center">
                <div className="inline-block p-6 bg-gray-900/50 rounded-full mb-6 border border-gray-800">
                    <SearchIcon className="w-12 h-12 text-gray-700" />
                </div>
                <p className="text-gray-500 font-bold uppercase tracking-widest">No summarizer match</p>
                <button onClick={() => {setSearchTerm(''); handleCategorySwitch('All');}} className="mt-4 text-purple-400 text-sm font-black uppercase tracking-widest hover:underline">Clear Filters</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default DataSummarizer;
