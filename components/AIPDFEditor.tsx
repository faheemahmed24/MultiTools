
import React, { useState } from 'react';
import type { TranslationSet } from '../types';
import FileUpload from './FileUpload';
import { transcribeAudio } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import Loader from './Loader';

const AIPDFEditor: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [content, setContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleFile = async (files: File[]) => {
    setIsProcessing(true);
    try {
      const result = await transcribeAudio(files[0], 'auto');
      setContent(result.segments.map(s => s.text).join('\n\n'));
    } catch (err) {
      alert("Error parsing document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIAction = async (action: string) => {
    if (!content) return;
    setIsEditing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Task: ${action}\n\nTarget Text:\n${content}`,
      });
      setContent(response.text || content);
    } catch (err) {
      alert("AI Node failure.");
    } finally {
      setIsEditing(false);
    }
  };

  if (isProcessing) return <Loader t={t} />;

  if (!content) {
    return (
      <div className="flex flex-col h-full animate-fadeIn">
        <div className="mb-10 text-center">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">AI Text <span className="text-purple-500">Editor</span></h2>
            <p className="text-gray-500 text-sm">Upload any document to rewrite and edit with generative intelligence.</p>
        </div>
        <FileUpload onFilesSelect={handleFile} t={t} isProcessing={isProcessing} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn gap-6">
      <div className="flex items-center justify-between bg-gray-900/40 p-4 rounded-2xl border border-white/5">
        <div className="flex gap-2">
            <button onClick={() => handleAIAction("Summarize this text concisely")} disabled={isEditing} className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-500/20 transition-all">Summarize</button>
            <button onClick={() => handleAIAction("Rewrite this in a more professional tone")} disabled={isEditing} className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-500/20 transition-all">Professionalize</button>
            <button onClick={() => handleAIAction("Fix all grammar and expand on the key points")} disabled={isEditing} className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-500/20 transition-all">Refine & Expand</button>
        </div>
        <button onClick={() => setContent('')} className="text-[10px] font-black uppercase text-gray-500 hover:text-white">Clear</button>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-8 bg-[#0A0A10] border border-white/10 rounded-[2.5rem] p-8 relative flex flex-col">
            {isEditing && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center rounded-[2.5rem]">
                    <div className="flex items-center gap-3 bg-gray-900 p-6 rounded-2xl border border-purple-500/30">
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-black uppercase tracking-widest text-white">AI Logic active...</span>
                    </div>
                </div>
            )}
            <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full h-full bg-transparent text-gray-200 text-lg leading-relaxed outline-none resize-none custom-scrollbar font-medium"
            />
        </div>
        
        <div className="lg:col-span-4 space-y-4">
            <div className="bg-gray-900/40 border border-white/5 rounded-3xl p-6">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Custom Command</h3>
                <textarea 
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g. Translate to German, or make this into a bulleted list..."
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-purple-500/50 transition-all mb-4"
                />
                <button 
                    onClick={() => { handleAIAction(prompt); setPrompt(''); }}
                    disabled={isEditing || !prompt.trim()}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all disabled:bg-gray-800"
                >
                    Apply AI Command
                </button>
            </div>
            <div className="bg-purple-600/5 border border-purple-500/10 rounded-3xl p-6">
                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest leading-relaxed">Changes are applied in-place. Use the 'Summarize' or 'Refine' presets for faster document processing.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIPDFEditor;
