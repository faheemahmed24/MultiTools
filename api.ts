// Base path configured in vite.config.ts proxy
const API_BASE = '/api/gemini';

export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  parts: GeminiPart[];
  role?: string;
}

export interface GeminiCandidate {
  content: GeminiContent;
  finishReason?: string;
  index?: number;
}

export interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: any;
}

/**
 * Generic helper to call the Gemini API via the local proxy.
 * The proxy handles authentication (API key) and CORS.
 * 
 * @param endpoint - The API endpoint (e.g., '/v1beta/models/gemini-pro:generateContent')
 * @param body - The JSON body to send
 */
export async function callGemini<T = GeminiResponse>(endpoint: string, body: any): Promise<T> {
  // Ensure endpoint starts with a slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${path}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

/**
 * Helper to generate text content from a simple prompt.
 */
export async function generateContent(prompt: string, model: string = 'gemini-pro'): Promise<string> {
  const endpoint = `/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const data = await callGemini<GeminiResponse>(endpoint, body);
  
  if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts.length > 0) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error('No content generated from Gemini API');
}

/**
 * Stream content from Gemini.
 * Yields text chunks as they arrive.
 */
export async function* streamGemini(
  input: string | GeminiContent[],
  model: string = 'gemini-1.5-flash',
  systemInstruction?: string
): AsyncGenerator<string, void, unknown> {
  const endpoint = `/v1beta/models/${model}:streamGenerateContent`;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${path}`;
  
  const body: any = {
    contents: typeof input === 'string' ? [{ parts: [{ text: input }] }] : input
  };

  if (systemInstruction) {
    body.system_instruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    throw new Error('Failed to start stream');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse the stream of JSON objects (simplified parser)
    // The API returns a JSON array: [ { ... }, { ... } ]
    while (true) {
      const startIndex = buffer.indexOf('{');
      if (startIndex === -1) {
        // Keep the buffer if it might contain a partial object, otherwise clear it if it's just whitespace/separators
        if (buffer.length > 0 && !buffer.includes('[')) buffer = ''; 
        break;
      }

      let braceCount = 0;
      let endIndex = -1;
      let inString = false;

      // Robustly find the matching closing brace
      for (let i = startIndex; i < buffer.length; i++) {
        const char = buffer[i];
        if (char === '"' && buffer[i - 1] !== '\\') {
          inString = !inString;
        }
        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        if (braceCount === 0 && i > startIndex) {
          endIndex = i;
          break;
        }
      }

      if (endIndex !== -1) {
        const jsonStr = buffer.substring(startIndex, endIndex + 1);
        try {
          const parsed = JSON.parse(jsonStr) as GeminiResponse;
          if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
            yield parsed.candidates[0].content.parts[0].text;
          }
        } catch (e) {
          // Ignore parse errors for partial chunks
        }
        buffer = buffer.substring(endIndex + 1);
      } else {
        break;
      }
    }
  }
}