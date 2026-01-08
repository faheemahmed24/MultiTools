
import React, { useState, useRef } from 'react';
import type { TranslationSet } from '../types';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { generateSpeech, decode, decodeAudioData, extractTextFromUrl } from '../services/geminiService';
import { SkeletonLoader } from './Loader';

const VOICES = [
    { id: 'Zephyr', name: 'Zephyr (Warm & Professional)' },
    { id: 'Puck', name: 'Puck (Youthful & Energetic)' },
    { id: 'Charon', name: 'Charon (Deep & Calm)' },
    { id: 'Kore', name: 'Kore (Friendly & Bright)' },
    { id: 'Fenrir', name: 'Fenrir (Strong & Authoritative)' },
];

const DOWNLOAD_FORMATS = [
    { id: 'wav', label: 'WAV (Lossless)', ext: 'wav' },
    { id: 'mp3', label: 'MP3 (MPEG)', ext: 'mp3' },
    { id: 'aac', label: 'AAC', ext: 'aac' },
    { id: 'ogg', label: 'OGG', ext: 'ogg' },
];

const TextToSpeech: React.FC<{ t: TranslationSet, onComplete: (data: { text: string, voice: string }) => void }> = ({ t, onComplete }) => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState(VOICES[0].id);
  const [style, setStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFormatsMenu, setShowFormatsMenu] = useState(false);
  
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
      const promptText = style 
        ? `Read the text provided exactly as written in its language with a ${style} tone: ${text}` 
        : `Read this text clearly in its original language: ${text}`;
      
      const base64Audio = await generateSpeech(promptText, voice);
      
      // Decode raw PCM to AudioBuffer for preview
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
            <div className="flex flex-col gap-2">
              <div className="relative w-full">
                <div className="flex gap-1">
                    <a
                        href={audioUrl}
                        download={`speech-${new Date().getTime()}.wav`}
                        className="flex-grow flex items-center justify-center py-4 bg-green-600 text-white font-black text-xl rounded-xl hover:bg-green-700 transition-all shadow-xl"
                    >
                        <DownloadIcon className="w-6 h-6 me-2" />
                        {t.download} .WAV
                    </a>
                    <button 
                        onClick={() => setShowFormatsMenu(!showFormatsMenu)}
                        className="px-4 bg-green-700 hover:bg-green-800 rounded-xl text-white transition-all shadow-xl"
                    >
                        <ChevronDownIcon className={`w-6 h-6 transition-transform ${showFormatsMenu ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showFormatsMenu && (
                    <div className="absolute bottom-full mb-3 right-0 w-48 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl py-2 z-50 animate-pop-in" onMouseLeave={() => setShowFormatsMenu(false)}>
                        <p className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.moreFormats}</p>
                        {DOWNLOAD_FORMATS.map(fmt => (
                            <a
                                key={fmt.id}
                                href={audioUrl}
                                download={`speech-${new Date().getTime()}.${fmt.ext}`}
                                onClick={() => setShowFormatsMenu(false)}
                                className="block w-full text-start px-5 py-2.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-purple-600 transition-colors uppercase"
                            >
                                Download as {fmt.id.toUpperCase()}
                            </a>
                        ))}
                    </div>
                )}
              </div>
              
              <button
                onClick={() => setAudioUrl(null)}
                className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-400 uppercase tracking-widest"
              >
                Reset & Create New
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
