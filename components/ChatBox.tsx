import React, { useState, useEffect, useRef } from 'react';
import { useGemini } from '../hooks/useGemini';

export const ChatBox: React.FC = () => {
  const [input, setInput] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const { generate, isLoading, response, error, reset } = useGemini();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  // Auto-scroll to bottom as content streams in
  useEffect(() => {
    if (outputEndRef.current && isLoading) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Trigger generation
    await generate(input, systemInstruction);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">Gemini Assistant</h2>
          {(response || error) && (
            <button 
              onClick={reset}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Clear Output
            </button>
          )}
        </div>
        <input
          type="text"
          value={systemInstruction}
          onChange={(e) => setSystemInstruction(e.target.value)}
          placeholder="System Instruction (e.g., 'You are a helpful coding assistant')"
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-200 placeholder-gray-400"
        />
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
        {!response && !isLoading && !error && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <p>Type a prompt below to start generating content.</p>
          </div>
        )}

        {response && (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 leading-relaxed">
              {response}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 animate-pulse p-2">
            <div className="w-2 h-2 bg-current rounded-full"></div>
            <div className="w-2 h-2 bg-current rounded-full animation-delay-200"></div>
            <div className="w-2 h-2 bg-current rounded-full animation-delay-400"></div>
            <span className="text-sm font-medium">Generating...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-100 dark:border-red-800 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div ref={outputEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="w-full pr-12 pl-4 py-3 bg-gray-100 dark:bg-gray-900 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none max-h-32 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2.5 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            title="Send"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
        <div className="text-xs text-center text-gray-400 mt-2">
          Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};