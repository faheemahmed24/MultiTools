import React, { useState, useRef, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface VideoToAudioProps {
  t: TranslationSet;
  onConversionComplete: (data: any) => void;
}

// Helper to convert AudioBuffer to WAV Blob
const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      // clamp
      sample = Math.max(-1, Math.min(1, channels[i][offset])); 
      // scale to 16-bit signed int
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; 
      view.setInt16(pos, sample, true); 
      pos += 2;
    }
    offset++; 
  }

  return new Blob([outBuffer], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
};

const VideoToAudio: React.FC<VideoToAudioProps> = ({ t, onConversionComplete }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setAudioUrl(null);
        setError(null);
      } else {
        alert('Please select a valid video file.');
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setAudioUrl(null);
        setError(null);
      } else {
        alert('Please select a valid video file.');
      }
    }
  }, []);

  const handleExtract = async () => {
    if (!videoFile) return;
    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await videoFile.arrayBuffer();
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      // Decode audio data from the video file
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      // Convert to WAV
      const wavBlob = bufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      
      setAudioUrl(url);
      onConversionComplete({
        fileName: videoFile.name,
        outputFormat: 'wav'
      });
    } catch (err: any) {
      console.error(err);
      setError("Failed to extract audio. The video format might not be supported by your browser's audio decoder.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-card p-6 min-h-[60vh] lg:h-full flex flex-col">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
      
      {!videoFile ? (
        <div 
            className={`flex flex-col flex-grow items-center justify-center p-8 dropzone-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'dragover' : ''}`}
            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
        >
            <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
            <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 btn-primary text-white font-semibold rounded-lg hover:brightness-105 transition-colors duration-200">
            Select Video File
            </button>
            <p className="mt-2 text-sm text-gray-400">Drag & drop video file here</p>
        </div>
      ) : (
        <div className="flex flex-col flex-grow items-center justify-center">
             <div className="w-full max-w-lg">
                <div className="mb-6 obsidian-card p-4 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-gray-200 truncate" title={videoFile.name}>{videoFile.name}</p>
                        <p className="text-sm text-gray-400">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={() => { setVideoFile(null); setAudioUrl(null); }} className="text-sm text-purple-400 hover:underline flex-shrink-0 ml-4">Change File</button>
                </div>

                {error && <div className="text-red-400 text-center mb-4 bg-red-900/20 p-2 rounded-lg">{error}</div>}

                <button 
                    onClick={handleExtract} 
                    disabled={isProcessing}
                    className="w-full py-3 btn-primary text-white font-bold rounded-lg disabled:opacity-50 transition-colors mb-6"
                >
                    {isProcessing ? 'Extracting Audio...' : 'Extract Audio (WAV)'}
                </button>

                {audioUrl && (
                    <div className="animate-fadeIn bg-gray-800 p-4 rounded-lg border border-green-500/30">
                        <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                        <DownloadIcon className="w-5 h-5" /> Extraction Complete!
                        </h3>
                        <audio controls src={audioUrl} className="w-full mb-3" />
                        <a 
                        href={audioUrl} 
                        download={`${videoFile.name.replace(/\.[^/.]+$/, "")}.wav`}
                        className="block w-full text-center py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                        >
                        Download WAV
                        </a>
                    </div>
                )}
             </div>
        </div>
      )}
    </div>
  );
};

export default VideoToAudio;