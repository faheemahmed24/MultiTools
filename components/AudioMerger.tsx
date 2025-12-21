
import React, { useState, useRef, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CloseIcon } from './icons/CloseIcon';

interface AudioItem {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface AudioMergerProps {
    t: TranslationSet;
    onConversionComplete: (data: { fileName: string, fileCount: number }) => void;
}

const AudioMerger: React.FC<AudioMergerProps> = ({ t, onConversionComplete }) => {
  const [audioFiles, setAudioFiles] = useState<AudioItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [progress, setProgress] = useState('');
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('merged-audio');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleFilesSelect = (files: FileList | null) => {
    if (files) {
      const newFiles: AudioItem[] = Array.from(files)
        .filter(file => file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a') || file.name.endsWith('.ogg'))
        .map(file => ({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
        }));
      setAudioFiles(prev => [...prev, ...newFiles]);
      setMergedAudioUrl(null);
    }
  };

  const removeFile = (id: string) => {
    setAudioFiles(prev => prev.filter(f => f.id !== id));
    setMergedAudioUrl(null);
  };

  const clearAll = () => {
    setAudioFiles([]);
    setMergedAudioUrl(null);
    setProgress('');
  };

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newFiles = [...audioFiles];
    const draggedItemContent = newFiles.splice(dragItem.current, 1)[0];
    newFiles.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setAudioFiles(newFiles);
    setMergedAudioUrl(null);
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    let offset = 0;
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

  const handleMerge = async () => {
    if (audioFiles.length < 2) return;
    setIsMerging(true);
    setMergedAudioUrl(null);
    setProgress(t.mergingAudio || 'Merging audio...');

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffers: AudioBuffer[] = [];

      for (let i = 0; i < audioFiles.length; i++) {
        setProgress(`Loading & Decoding file ${i + 1} of ${audioFiles.length}...`);
        const arrayBuffer = await audioFiles[i].file.arrayBuffer();
        const buffer = await audioCtx.decodeAudioData(arrayBuffer);
        decodedBuffers.push(buffer);
      }

      setProgress('Merging tracks...');
      const totalLength = decodedBuffers.reduce((acc, buf) => acc + buf.length, 0);
      const sampleRate = decodedBuffers[0].sampleRate;
      const numberOfChannels = Math.max(...decodedBuffers.map(b => b.numberOfChannels));

      const mergedBuffer = audioCtx.createBuffer(numberOfChannels, totalLength, sampleRate);

      let currentOffset = 0;
      decodedBuffers.forEach(buffer => {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          mergedBuffer.getChannelData(channel).set(buffer.getChannelData(channel), currentOffset);
        }
        currentOffset += buffer.length;
      });

      const wavBlob = audioBufferToWav(mergedBuffer);
      const url = URL.createObjectURL(wavBlob);
      setMergedAudioUrl(url);
      setProgress(t.conversionComplete);
      onConversionComplete({ fileName: `${outputFilename}.wav`, fileCount: audioFiles.length });
    } catch (error) {
      console.error(error);
      setProgress('Error merging files. Check format compatibility.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="glass-card p-6 min-h-[60vh] lg:h-full flex flex-col">
      <input type="file" ref={fileInputRef} onChange={e => handleFilesSelect(e.target.files)} accept="audio/*" multiple className="hidden" />
      
      {audioFiles.length === 0 ? (
        <div
          className={`flex flex-col flex-grow items-center justify-center p-8 dropzone-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'dragover' : ''}`}
          onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleFilesSelect(e.dataTransfer.files); }}
        >
          <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 btn-primary text-white font-semibold rounded-lg hover:brightness-105 transition-colors">
            {t.addAudioFiles || 'Select Audio Files'}
          </button>
          <p className="mt-2 text-sm text-gray-400">{t.dropAudioFiles || 'or drop audio files here'}</p>
        </div>
      ) : (
        <div className="flex flex-col flex-grow min-h-0">
          <div className="flex justify-between items-center mb-4">
             <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 obsidian-card text-white font-semibold rounded-lg hover:brightness-105">
                    <PlusIcon className="w-5 h-5 me-2" /> {t.addMoreImages || 'Add More'}
                </button>
                <button onClick={clearAll} className="flex items-center px-4 py-2 obsidian-card text-red-400 font-semibold rounded-lg hover:brightness-95">
                    <TrashIcon className="w-5 h-5 me-2" /> {t.clearAll}
                </button>
             </div>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t.reorderAudioHint || 'Drag to reorder'}</p>
          </div>

          <div className="flex-grow overflow-y-auto space-y-2 mb-6 pe-2">
            {audioFiles.map((file, index) => (
              <div
                key={file.id}
                draggable
                onDragStart={() => dragItem.current = index}
                onDragEnter={() => dragOverItem.current = index}
                onDragEnd={handleDragSort}
                onDragOver={e => e.preventDefault()}
                className="obsidian-card p-3 rounded-lg border border-gray-600 flex items-center gap-4 group cursor-move hover:brightness-105 transition-colors"
              >
                <div className="bg-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">{index + 1}</div>
                <div className="flex-grow overflow-hidden">
                  <p className="font-semibold text-gray-200 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={() => removeFile(file.id)} className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

              <div className="obsidian-card p-4 rounded-xl space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">{t.outputFilename}</label>
                  <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700 px-3">
                    <input type="text" value={outputFilename} onChange={e => setOutputFilename(e.target.value)} className="bg-transparent flex-grow py-2 text-gray-200 outline-none" />
                    <span className="text-gray-500 font-mono text-sm">.wav</span>
                  </div>
              </div>

              {!mergedAudioUrl ? (
                <button
                  onClick={handleMerge}
                  disabled={isMerging || audioFiles.length < 2}
                  className="w-full py-3 btn-primary text-white font-bold rounded-lg disabled:opacity-60 transition-all shadow-lg"
                >
                  {isMerging ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {progress}
                    </div>
                  ) : (
                    `${t.mergeAudio || 'Merge Audio'} (${audioFiles.length} files)`
                  )}
                </button>
              ) : (
                <div className="animate-fadeIn space-y-4">
                  <div className="obsidian-card p-4 rounded-lg">
                    <p className="text-green-400 font-bold text-sm mb-2">✓ {t.conversionComplete}</p>
                    <audio src={mergedAudioUrl} controls className="w-full h-10" />
                  </div>
                  <a
                    href={mergedAudioUrl}
                    download={`${outputFilename}.wav`}
                    className="flex items-center justify-center w-full py-3 obsidian-card text-white font-bold rounded-lg transition-colors shadow-lg"
                  >
                    <DownloadIcon className="w-5 h-5 me-2" /> {t.download} .WAV
                  </a>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioMerger;
