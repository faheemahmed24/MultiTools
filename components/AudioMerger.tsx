import React, { useState, useRef, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CloseIcon } from './icons/CloseIcon';

interface AudioMergerProps {
  t: TranslationSet;
  onConversionComplete: (data: any) => void;
}

interface AudioFile {
  id: string;
  file: File;
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

const AudioMerger: React.FC<AudioMergerProps> = ({ t, onConversionComplete }) => {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    if (e.target) e.target.value = '';
  };

  const addFiles = (newFiles: File[]) => {
    const audioFiles = newFiles.filter(f => f.type.startsWith('audio/'));
    if (audioFiles.length === 0) {
      alert('Please select valid audio files.');
      return;
    }
    
    const newAudioFiles = audioFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file
    }));

    setFiles(prev => [...prev, ...newAudioFiles]);
    setMergedUrl(null); // Reset previous merge
    setError(null);
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setMergedUrl(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Please select at least 2 audio files to merge.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const buffers: AudioBuffer[] = [];

      // Decode all files
      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        buffers.push(audioBuffer);
      }

      // Calculate output buffer dimensions
      const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
      const numberOfChannels = Math.max(...buffers.map(buf => buf.numberOfChannels));
      
      const outputBuffer = ctx.createBuffer(numberOfChannels, totalLength, ctx.sampleRate);

      // Merge
      let offset = 0;
      for (const buf of buffers) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const outputData = outputBuffer.getChannelData(channel);
          // If source has this channel, copy it. If not (e.g. mono source in stereo output), use channel 0.
          if (channel < buf.numberOfChannels) {
            outputData.set(buf.getChannelData(channel), offset);
          } else {
            outputData.set(buf.getChannelData(0), offset);
          }
        }
        offset += buf.length;
      }

      const wavBlob = bufferToWav(outputBuffer);
      const url = URL.createObjectURL(wavBlob);
      setMergedUrl(url);
      
      onConversionComplete({
        fileName: 'merged_audio.wav',
        fileCount: files.length
      });

    } catch (err: any) {
      console.error(err);
      setError("Failed to merge audio. Some files might be corrupted or unsupported.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-card p-6 min-h-[60vh] lg:h-full flex flex-col">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" multiple className="hidden" />
      
      <div 
        className={`flex flex-col items-center justify-center p-8 dropzone-dashed rounded-xl transition-colors duration-300 mb-6 ${isDragging ? 'dragover' : ''}`}
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
      >
        <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
        <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 btn-primary text-white font-semibold rounded-lg hover:brightness-105 transition-colors duration-200">
          Select Audio Files
        </button>
        <p className="mt-2 text-sm text-gray-400">Drag & drop audio files here</p>
      </div>

      <div className="flex-grow space-y-2 overflow-y-auto mb-6 max-h-[400px]">
        {files.map((file, index) => (
          <div key={file.id} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between border border-gray-700">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="bg-gray-700 text-gray-300 w-6 h-6 flex items-center justify-center rounded-full text-xs flex-shrink-0">{index + 1}</span>
              <span className="text-gray-200 truncate" title={file.file.name}>{file.file.name}</span>
              <span className="text-xs text-gray-500 flex-shrink-0">({(file.file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
            <button onClick={() => removeFile(file.id)} className="text-gray-500 hover:text-red-400 p-1">
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
        {files.length === 0 && <p className="text-center text-gray-500 py-4">No files selected</p>}
      </div>

      {error && <div className="text-red-400 text-center mb-4 bg-red-900/20 p-2 rounded-lg">{error}</div>}

      <div className="flex flex-col gap-4 mt-auto">
        <button 
          onClick={handleMerge} 
          disabled={isProcessing || files.length < 2}
          className="w-full py-3 btn-primary text-white font-bold rounded-lg disabled:opacity-50 transition-colors"
        >
          {isProcessing ? 'Merging...' : `Merge ${files.length} Files`}
        </button>

        {mergedUrl && (
          <div className="animate-fadeIn bg-gray-800 p-4 rounded-lg border border-green-500/30">
            <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              <DownloadIcon className="w-5 h-5" /> Merge Complete!
            </h3>
            <audio controls src={mergedUrl} className="w-full mb-3" />
            <a 
              href={mergedUrl} 
              download="merged_audio.wav"
              className="block w-full text-center py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Download Merged WAV
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioMerger;