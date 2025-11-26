
import React, { useState, useEffect } from 'react';
import type { TranslationSet } from '../types';

interface VoiceGeneratorProps {
  t: TranslationSet;
}

const VoiceGenerator: React.FC<VoiceGeneratorProps> = ({ t }) => {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
          // Prefer English by default if available
          const defaultVoice = availableVoices.find(v => v.lang.includes('en')) || availableVoices[0];
          setSelectedVoice(defaultVoice.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
        window.speechSynthesis.cancel();
    }
  }, [selectedVoice]);

  const handleSpeak = () => {
    if (!text) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full flex-grow">
        
        {/* Controls */}
        <div className="md:col-span-1 space-y-6">
            <div>
                <label className="block text-gray-300 font-medium mb-2">{t.voice}</label>
                <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                    {voices.map(voice => (
                        <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                        </option>
                    ))}
                </select>
            </div>
            
            <div>
                <div className="flex justify-between mb-1">
                    <label className="text-gray-300 font-medium">{t.speed}</label>
                    <span className="text-gray-400 text-sm">{rate}x</span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
            </div>

            <div>
                <div className="flex justify-between mb-1">
                    <label className="text-gray-300 font-medium">{t.pitch}</label>
                    <span className="text-gray-400 text-sm">{pitch}</span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
            </div>
            
             <div className="flex gap-4 pt-4">
                <button
                    onClick={handleSpeak}
                    disabled={!text}
                    className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                    <i className="fas fa-play"/> {t.speak}
                </button>
                 <button
                    onClick={handleStop}
                    disabled={!isSpeaking}
                    className="flex-1 py-3 bg-red-600/80 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                    <i className="fas fa-stop"/> {t.stop}
                </button>
            </div>
        </div>

        {/* Text Input */}
        <div className="md:col-span-2 flex flex-col">
            <label className="text-gray-300 font-medium mb-2">{t.textToSpeechPlaceholder}</label>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.textToSpeechPlaceholder}
                className="w-full flex-grow bg-gray-900/50 rounded-lg p-4 text-gray-200 resize-none focus:ring-2 focus:ring-purple-500 border border-gray-700 focus:border-purple-500 min-h-[300px]"
            />
            <div className="text-right text-gray-500 text-sm mt-2">
                {text.length} characters
            </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceGenerator;
