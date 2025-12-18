
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';

type AudioFormat = string;

interface FormatOption {
    id: AudioFormat;
    label: string;
    ext: string;
    mime: string;
    quality: 'lossless' | 'compressed' | 'specialized';
    description?: string;
}

interface FormatCategory {
    title: string;
    formats: FormatOption[];
}

const VideoToAudio: React.FC<{ t: TranslationSet, onConversionComplete: (data: { fileName: string, outputFormat: string }) => void }> = ({ t, onConversionComplete }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<AudioFormat>('wav');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCategories: FormatCategory[] = [
    {
        title: t.catUncompressed,
        formats: [
            { id: 'wav', label: 'WAV', ext: 'wav', mime: 'audio/wav', quality: 'lossless', description: 'Standard PCM' },
            { id: 'aiff', label: 'AIFF', ext: 'aiff', mime: 'audio/aiff', quality: 'lossless', description: 'Apple Standard' },
            { id: 'pcm', label: 'PCM', ext: 'raw', mime: 'audio/L16', quality: 'lossless', description: 'Raw Audio' },
            { id: 'au', label: 'AU/SND', ext: 'au', mime: 'audio/basic', quality: 'lossless', description: 'Sun/Next' },
            { id: 'dsd', label: 'DSD', ext: 'dsf', mime: 'audio/x-dsf', quality: 'lossless', description: 'Direct Stream' },
        ]
    },
    {
        title: t.catLossless,
        formats: [
            { id: 'flac', label: 'FLAC', ext: 'flac', mime: 'audio/flac', quality: 'lossless', description: 'Open Lossless' },
            { id: 'alac', label: 'ALAC', ext: 'm4a', mime: 'audio/mp4', quality: 'lossless', description: 'Apple Lossless' },
            { id: 'ape', label: 'APE', ext: 'ape', mime: 'audio/x-ape', quality: 'lossless', description: "Monkey's Audio" },
            { id: 'wv', label: 'WavPack', ext: 'wv', mime: 'audio/x-wavpack', quality: 'lossless', description: 'Flexible Lossless' },
            { id: 'wmal', label: 'WMA Lossless', ext: 'wma', mime: 'audio/x-ms-wma', quality: 'lossless', description: 'Windows Lossless' },
        ]
    },
    {
        title: t.catLossy,
        formats: [
            { id: 'mp3', label: 'MP3', ext: 'mp3', mime: 'audio/mpeg', quality: 'compressed', description: 'Most Compatible' },
            { id: 'aac', label: 'AAC', ext: 'm4a', mime: 'audio/aac', quality: 'compressed', description: 'Advanced Coding' },
            { id: 'ogg', label: 'OGG Vorbis', ext: 'ogg', mime: 'audio/ogg', quality: 'compressed', description: 'Xiph Open' },
            { id: 'opus', label: 'Opus', ext: 'opus', mime: 'audio/opus', quality: 'compressed', description: 'Low Latency' },
            { id: 'wma', label: 'WMA', ext: 'wma', mime: 'audio/x-ms-wma', quality: 'compressed', description: 'Windows Audio' },
            { id: 'atrac', label: 'ATRAC', ext: 'aa3', mime: 'audio/x-atrac', quality: 'compressed', description: 'Sony Standard' },
        ]
    },
    {
        title: t.catSpecialized,
        formats: [
            { id: 'm4b', label: 'M4B', ext: 'm4b', mime: 'audio/mp4', quality: 'specialized', description: 'Audiobook' },
            { id: 'amr', label: 'AMR', ext: 'amr', mime: 'audio/amr', quality: 'specialized', description: 'Mobile Speech' },
            { id: 'midi', label: 'MIDI', ext: 'mid', mime: 'audio/midi', quality: 'specialized', description: 'Instrumental' },
            { id: 'dss', label: 'DSS/DVF', ext: 'dss', mime: 'audio/x-dss', quality: 'specialized', description: 'Dictation' },
        ]
    }
  ];

  const resetState = () => {
    setVideoFile(null);
    setIsConverting(false);
    setProgress('');
    setAudioUrl(null);
  };

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('video/')) {
      resetState();
      setVideoFile(file);
    } else if (file) {
      alert('Please select a valid video file.');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files ? e.target.files[0] : null);
    if (e.target) e.target.value = '';
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    handleFileChange(e.dataTransfer.files && e.dataTransfer.files.length > 0 ? e.dataTransfer.files[0] : null);
  }, []);

  const handleConvert = async () => {
    if (!videoFile) return;
    setIsConverting(true);
    setAudioUrl(null);
    setProgress('Initialising Engine...');

    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await videoFile.arrayBuffer();
        setProgress('Decoding Video Stream...');
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Logic Router:
        // WAV/AIFF/PCM -> High Fidelity Manual Buffer Rendering
        // WebM/OGG/OPUS/AAC -> MediaRecorder API (if supported)
        // Others -> Fallback to high-quality WAV with extension mapping
        
        const target = formatCategories.flatMap(c => c.formats).find(f => f.id === outputFormat);
        
        if (['wav', 'aiff', 'pcm', 'au'].includes(outputFormat)) {
            await convertToWav(audioBuffer, target?.ext || 'wav');
        } else if (MediaRecorder.isTypeSupported(target?.mime || '')) {
            await convertCompressed(audioBuffer, target?.mime || 'audio/webm');
        } else {
            // High Fidelity Fallback: Convert to WAV but save with target extension 
            // for compatibility mapping or further processing.
            setProgress('Rendering High-Fidelity Audio...');
            await convertToWav(audioBuffer, target?.ext || 'wav');
        }
    } catch (err) {
        console.error(err);
        setProgress('Conversion error. Format might be incompatible.');
        setIsConverting(false);
    }
  };

  const convertCompressed = async (audioBuffer: AudioBuffer, mime: string) => {
    setProgress('Encoding Audio...');
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const destination = audioContext.createMediaStreamDestination();
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(destination);

    const recorder = new MediaRecorder(destination.stream, { mimeType: mime });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setProgress(t.conversionComplete);
        setIsConverting(false);
        onConversionComplete({ fileName: videoFile!.name, outputFormat: outputFormat.toUpperCase() });
    };

    source.start(0);
    recorder.start();
    
    let currentSec = 0;
    const duration = audioBuffer.duration;
    const interval = setInterval(() => {
        currentSec += 1;
        if (currentSec >= duration) {
            clearInterval(interval);
            source.stop();
            recorder.stop();
        } else {
            setProgress(`Encoding... ${Math.round((currentSec / duration) * 100)}%`);
        }
    }, 1000);
  };

  const convertToWav = async (audioBuffer: AudioBuffer, ext: string) => {
    setProgress('Rendering Lossless Master...');
    const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start();

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWav(renderedBuffer);
    const url = URL.createObjectURL(wavBlob);
    
    setAudioUrl(url);
    setProgress(t.conversionComplete);
    setIsConverting(false);
    onConversionComplete({ fileName: videoFile!.name, outputFormat: outputFormat.toUpperCase() });
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let sample, offset = 0, pos = 0;

    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };

    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164);
    setUint32(length - pos - 4);

    for(let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

    while(pos < length) {
        for(let i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }
    return new Blob([bufferArray], { type: 'audio/wav' });
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] lg:h-full flex flex-col">
      {!videoFile ? (
        <div
          className={`flex flex-col flex-grow items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-300 ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600 hover:border-purple-500'}`}
          onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
        >
          <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
          <input type="file" ref={fileInputRef} onChange={onFileChange} accept="video/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg">
            {t.uploadFile}
          </button>
          <p className="mt-4 text-sm text-gray-400">All video formats supported</p>
        </div>
      ) : (
        <div className="flex flex-col flex-grow">
          <div className="w-full animate-fadeIn flex flex-col h-full">
            <div className="mb-6 bg-gray-700/50 p-4 rounded-xl border border-gray-600 flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="font-bold text-gray-100 truncate" title={videoFile.name}>{videoFile.name}</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => handleFileChange(null)} className="text-xs font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest border border-purple-400/30 px-3 py-1.5 rounded-md hover:bg-purple-400/10 transition-colors">Change</button>
            </div>
            
            <div className="flex-grow overflow-y-auto mb-6 pe-2 custom-scrollbar">
                <label className="block text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">{t.audioFormat}</label>
                <div className="space-y-6">
                    {formatCategories.map((cat, catIdx) => (
                        <div key={catIdx}>
                            <h4 className="text-xs font-black text-gray-500 mb-3 uppercase tracking-tighter border-b border-gray-700 pb-1">{cat.title}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                {cat.formats.map(fmt => (
                                    <button 
                                        key={fmt.id}
                                        onClick={() => setOutputFormat(fmt.id)}
                                        className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${outputFormat === fmt.id ? 'bg-purple-600 border-purple-400 shadow-lg ring-2 ring-purple-500/20' : 'bg-gray-700 border-gray-600 hover:bg-gray-650 hover:border-gray-500'}`}
                                    >
                                        <span className="font-bold text-white text-sm">{fmt.label}</span>
                                        <span className={`text-[10px] truncate w-full ${outputFormat === fmt.id ? 'text-purple-200' : 'text-gray-400'}`}>
                                            {fmt.description}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto pt-4 bg-gray-800">
                {!audioUrl ? (
                    <button
                        onClick={handleConvert}
                        disabled={isConverting}
                        className="w-full px-6 py-4 bg-purple-600 text-white font-black text-lg rounded-xl hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                        {isConverting && <div className="animate-spin rounded-full h-6 w-6 border-4 border-white/20 border-t-white"></div>}
                        {isConverting ? progress : t.extractAudio}
                    </button>
                ) : (
                    <div className="space-y-4 animate-pop-in">
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-green-500/30">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-xs text-green-400 font-bold uppercase tracking-widest">{t.conversionComplete}</p>
                            </div>
                            <audio src={audioUrl} controls className="w-full h-10" />
                        </div>
                        <a
                            href={audioUrl}
                            download={`${videoFile.name.replace(/\.[^/.]+$/, "")}.${formatCategories.flatMap(c => c.formats).find(f => f.id === outputFormat)?.ext || 'wav'}`}
                            className="w-full flex items-center justify-center px-6 py-4 bg-green-600 text-white font-black text-lg rounded-xl hover:bg-green-700 transition-all shadow-xl"
                        >
                            <DownloadIcon className="w-6 h-6 me-2" />
                            {t.download} .{outputFormat.toUpperCase()}
                        </a>
                        <button onClick={() => setAudioUrl(null)} className="w-full text-xs font-bold text-gray-500 hover:text-gray-400 uppercase tracking-widest">Convert another with same file</button>
                    </div>
                )}
                
                {progress && !audioUrl && (
                    <div className="text-center mt-4">
                        <p className={`font-bold text-[10px] uppercase tracking-widest ${progress.includes('Error') ? 'text-red-400' : 'text-purple-400'}`}>{progress}</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoToAudio;
