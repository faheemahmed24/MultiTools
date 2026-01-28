
import React, { useState, useRef } from 'react';
import type { TranslationSet } from '../types';
import { BoltIcon } from './icons/BoltIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { XCircleIcon } from './icons/XCircleIcon';

const AICopilot: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<Array<{role: 'user' | 'ai', text: string}>>([]);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    const currentCmd = command;
    setCommand('');
    setHistory(prev => [...prev, { role: 'user', text: currentCmd }]);
    setIsProcessing(true);

    try {
        // Here we would call geminiService for "PDF Copilot" logic
        await new Promise(res => setTimeout(res, 2000));
        setHistory(prev => [...prev, { role: 'ai', text: `Executing pattern analysis for: "${currentCmd}". Task queue updated.` }]);
    } catch (err) {
        setHistory(prev => [...prev, { role: 'ai', text: "Error in logic execution terminal." }]);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn max-w-5xl mx-auto w-full">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <BoltIcon className="w-3 h-3" /> System Copilot v4.0
        </div>
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Command <span className="text-purple-500">Center</span></h2>
        <p className="text-gray-500 text-sm mt-2">Control your documents with natural language commands.</p>
      </div>

      <div className="flex-grow bg-[#0A0A15] border border-white/5 rounded-[2.5rem] p-8 flex flex-col overflow-hidden shadow-2xl relative">
        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4 mb-6">
            {history.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10">
                    <SparklesIcon className="w-16 h-16 text-purple-400 mb-6" />
                    <p className="text-sm font-bold uppercase tracking-widest text-white">"Merge the first two pages and rotate them 90 degrees"</p>
                    <p className="text-xs mt-2">Try commands like the one above.</p>
                </div>
            )}
            {history.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white font-bold' : 'bg-white/5 border border-white/10 text-gray-300'}`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {isProcessing && (
                <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Processing Logic</span>
                    </div>
                </div>
            )}
        </div>

        <form onSubmit={handleCommand} className="relative group">
            <input 
                type="text" 
                value={command}
                onChange={e => setCommand(e.target.value)}
                placeholder="Instruct the engine (e.g. Translate to Spanish and save as Word)"
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 pr-16 text-white outline-none focus:border-purple-500/50 transition-all shadow-inner placeholder:text-gray-700"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 bg-purple-600 p-3 rounded-xl text-white hover:bg-purple-500 transition-all shadow-lg active:scale-90">
                <BoltIcon className="w-5 h-5" />
            </button>
        </form>
      </div>

      <div className="mt-6 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                <UploadIcon className="w-4 h-4" /> 
                {activeFile ? activeFile.name : 'Load Context File'}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={e => setActiveFile(e.target.files?.[0] || null)} />
            {activeFile && <button onClick={() => setActiveFile(null)} className="text-red-500"><XCircleIcon className="w-4 h-4"/></button>}
        </div>
        <div className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">MultiTools Cognitive Terminal</div>
      </div>
    </div>
  );
};

export default AICopilot;
