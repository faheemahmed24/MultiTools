import { useState, useCallback } from 'react';
import { streamGemini, type GeminiContent } from '../api';

export interface UseGeminiResult {
  generate: (prompt: string, systemInstruction?: string) => Promise<void>;
  isLoading: boolean;
  response: string;
  messages: GeminiContent[];
  error: string | null;
  reset: () => void;
}

export function useGemini(): UseGeminiResult {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [messages, setMessages] = useState<GeminiContent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setResponse('');
    setMessages([]);
    setError(null);
  }, []);

  const generate = useCallback(async (prompt: string, systemInstruction?: string) => {
    setIsLoading(true);
    setResponse('');
    setError(null);

    const userMsg: GeminiContent = { role: 'user', parts: [{ text: prompt }] };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);

    try {
      let fullResponse = '';
      for await (const chunk of streamGemini(newHistory, 'gemini-1.5-flash', systemInstruction)) {
        fullResponse += chunk;
        setResponse(fullResponse);
      }
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: fullResponse }] }]);
    } catch (err: any) {
      console.error('Gemini stream error:', err);
      setError(err.message || 'Failed to generate content');
    }
    finally {
      setIsLoading(false);
    }
  }, [messages]);

  return { generate, isLoading, response, messages, error, reset };
}