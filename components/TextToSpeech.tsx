import React, { useState, useRef } from 'react';
import type { TranslationSet } from '../types';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { generateSpeech, decode, decodeAudioData, extractTextFromUrl } from '../services/geminiService';
import { SkeletonLoader } from './Loader';

const VOICES = [
    { id: 'Zephyr', name: 'Zephyr (Warm & Professional)' },
    { id: 'Puck', name: 'Puck (Youthful & Energetic)' },
    { id: 'Charon', name: 'Charon (Deep & Calm)' },
    { id: 'Kore', name: 'Kore (Friendly & Bright)' },
    { id: 'Fenrir', name: 'Fenrir (Strong & Authoritative)' },
];

const TextToSpeech: React.FC<{ t: TranslationSet, onComplete: (data: { text: string, voice: string }) => void }> = ({ t, onComplete }) => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState(VOICES[0].id);
  const [style, setStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Web reading states
  const [url, setUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setIsFetching(true);
    setError(null);
    try {
        const extracted = await extractTextFromUrl(url);
        setText(extracted);
        setUrl('');
    } catch (err: any) {
        setError(err.message || "Could not fetch web content.");
    } finally {
        setIsFetching(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      // Prompt for multimodal audio generation.
      // Explicitly tell the model to process the language as is.
      const promptText = style 
        ? `Read the text provided exactly as written in its language with a ${style} tone: ${text}` 
        : `Read this text clearly in its original language: ${text}`;
      
      const base64Audio = await generateSpeech(promptText, voice);
      
      // Raw PCM 16-bit at 24kHz
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const bytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
      
      const wavBlob = audioBufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      onComplete({ text: text.trim(), voice });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate speech.");
    } finally {
      setIsGenerating(false);
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    let pos = 0;

    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1); // PCM
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    const channels = [];
    for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));

    let offset = 0;
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    return new Blob([bufferArray], { type: 'audio/wav' });
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] lg:h-full flex flex-col gap-6">
      
      {/* Read Online / URL Import */}
      <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/50 shadow-inner">
         <label className="block text-xs font-bold text-purple-400 mb-3 uppercase tracking-widest flex items-center gap-2">
            <GlobeIcon className="w-4 h-4" />
            {t.readOnline}
         </label>
         <div className="flex gap-2">
            <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.urlPlaceholder}
                className="flex-grow bg-gray-800/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
            />
            <button 
                onClick={handleFetchUrl}
                disabled={isFetching || !url.trim()}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg"
            >
                {isFetching ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        {t.fetchingContent}
                    </>
                ) : t.fetchUrl}
            </button>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-grow min-h-0">
        <div className="flex-grow flex flex-col">
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">{t.enterText}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full flex-grow bg-gray-900/50 rounded-xl p-4 text-gray-200 resize-none focus:ring-2 focus:ring-purple-500 border border-gray-700 outline-none min-h-[150px]"
            placeholder="Type content, or use the 'Read Online' tool above to process any website or article..."
          />
          <div className="text-right text-xs text-gray-500 mt-1">{text.length} characters</div>
        </div>

        <div className="w-full md:w-80 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">{t.selectVoice}</label>
            <div className="space-y-2">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoice(v.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-sm font-medium ${voice === v.id ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">{t.voiceStyle}</label>
            <input
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder={t.voiceStylePlaceholder}
            />
            <p className="text-[10px] text-gray-500 mt-1 leading-tight">Gemini TTS automatically handles all languages. The voice personality remains consistent across dialects.</p>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        {!audioUrl ? (
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="w-full py-4 bg-purple-600 text-white font-black text-xl rounded-xl hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-white/20 border-t-white"></div>
                {t.generatingSpeech}
              </>
            ) : (
              <>
                <SpeakerIcon className="w-6 h-6" />
                {t.generateSpeech}
              </>
            )}
          </button>
        ) : (
          <div className="animate-pop-in space-y-4">
            <div className="bg-gray-900/60 p-5 rounded-xl border border-purple-500/30">
              <label className="block text-xs font-bold text-purple-400 mb-3 uppercase tracking-widest">{t.speechPreview}</label>
              <audio src={audioUrl} controls className="w-full h-12" autoPlay />
            </div>
            <div className="flex gap-4">
              <a
                href={audioUrl}
                download={`speech-${new Date().getTime()}.wav`}
                className="flex-1 flex items-center justify-center py-4 bg-green-600 text-white font-black text-xl rounded-xl hover:bg-green-700 transition-all shadow-xl"
              >
                <DownloadIcon className="w-6 h-6 me-2" />
                {t.download} .WAV
              </a>
              <button
                onClick={() => setAudioUrl(null)}
                className="px-6 py-4 bg-gray-700 text-gray-300 font-bold rounded-xl hover:bg-gray-600 transition-all"
              >
                New
              </button>
            </div>
          </div>
        )}
        {error && <p className="mt-4 text-center text-red-400 font-bold text-sm bg-red-900/20 p-3 rounded-lg border border-red-800">{error}</p>}
      </div>
    </div>
  );
};

export default TextToSpeech;