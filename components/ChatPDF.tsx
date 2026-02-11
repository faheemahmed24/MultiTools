
import React, { useState } from 'react';
import type { TranslationSet } from '../types';
import FileUpload from './FileUpload';
import { transcribeAudio } from '../services/geminiService';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { BoltIcon } from './icons/BoltIcon';
import { GoogleGenAI } from "@google/genai";
import Loader from './Loader';

const ChatPDF: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const result = await transcribeAudio(files[0], 'auto');
      const text = result.segments.map(s => s.text).join('\n');
      setDocumentContent(text);
      setFileName(files[0].name);
      setChatHistory([{ role: 'ai', text: `System initialized. I have indexed "${files[0].name}". How can I help you analyze it today?` }]);
    } catch (err) {
      console.error(err);
      alert("Terminal fault in document indexing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isResponding || !documentContent) return;

    const userQuery = input;
    setInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userQuery }]);
    setIsResponding(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert document analyzer. Base your answers strictly on the following text:\n\n--- DOCUMENT START ---\n${documentContent}\n--- DOCUMENT END ---\n\nQuestion: ${userQuery}`,
      });
      setChatHistory(prev => [...prev, { role: 'ai', text: response.text || "Logic error in response generation." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Error connecting to AI node." }]);
    } finally {
      setIsResponding(false);
    }
  };

  if (isProcessing) return <Loader t={t} />;

  if (!documentContent) {
    return (
      <div className="flex flex-col h-full animate-fadeIn">
        <div className="mb-10 text-center">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Chat <span className="text-purple-500">PDF</span></h2>
            <p className="text-gray-500 text-sm">Upload a document to start a cognitive dialogue with the AI.</p>
        </div>
        <FileUpload onFilesSelect={handleFileSelect} t={t} isProcessing={isProcessing} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full animate-fadeIn">
      <div className="flex items-center justify-between mb-6 bg-gray-900/40 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
            <div className="bg-purple-600/20 p-2 rounded-lg">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
                <p className="text-xs font-black text-white uppercase truncate max-w-[200px]">{fileName}</p>
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Active Document Node</p>
            </div>
        </div>
        <button onClick={() => setDocumentContent(null)} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-400 transition-colors">Detach File</button>
      </div>

      <div className="flex-grow bg-[#0A0A15] border border-white/5 rounded-[2.5rem] p-8 flex flex-col overflow-hidden shadow-2xl relative">
        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-6 mb-6">
            {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-purple-600 text-white font-bold' : 'bg-white/5 border border-white/10 text-gray-200'}`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {isResponding && (
                <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <form onSubmit={handleSend} className="relative">
            <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about the document summary, specific facts, or translation..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 pr-16 text-white outline-none focus:border-purple-500/50 transition-all shadow-inner placeholder:text-gray-700"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 bg-purple-600 p-3 rounded-xl text-white hover:bg-purple-500 transition-all shadow-lg active:scale-90">
                <BoltIcon className="w-5 h-5" />
            </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPDF;
