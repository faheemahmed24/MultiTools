import React, { useState, useCallback, useRef } from 'react';
import type { TranslationSet } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { LANGUAGES } from '../lib/languages';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  t: TranslationSet;
  isLoading: boolean;
  language: string;
  onLanguageChange: (language: string) => void;
  context: string;
  onContextChange: (context: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, t, isLoading, language, onLanguageChange, context, onContextChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const languageOptions = [
    { code: 'auto', name: t.autoDetect },
    ...LANGUAGES
  ];

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRecording) return;
    setIsDragging(true);
  }, [isRecording]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRecording) return;
    setIsDragging(false);
  }, [isRecording]);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRecording) return;
  }, [isRecording]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRecording) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect, isRecording]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (isRecording) return;
    fileInputRef.current?.click();
  };
  
  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordingError("Voice recording is not supported by your browser.");
      return;
    }
    setRecordingError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const fileExtension = mimeType.split('/')[1].split(';')[0];
        const audioFile = new File([audioBlob], `recording-${new Date().toISOString()}.${fileExtension}`, { type: mimeType });
        onFileSelect(audioFile);

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      if (err instanceof Error) {
          switch (err.name) {
              case 'NotAllowedError':
              case 'PermissionDeniedError': // Some browsers might use this name
                  setRecordingError(t.microphonePermissionDenied);
                  break;
              case 'NotFoundError':
                  setRecordingError(t.microphoneNotFound);
                  break;
              case 'NotReadableError':
                  setRecordingError(t.microphoneNotReadable);
                  break;
              default:
                  setRecordingError(t.microphoneError);
          }
      } else {
        setRecordingError(t.microphoneError);
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleRecordClick = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const isDisabled = isLoading || isRecording;

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
      <div className="mb-4">
        <label htmlFor="language-select" className="block text-sm font-medium text-gray-300 mb-1">{t.selectLanguagePrompt}</label>
        <select 
          id="language-select" 
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          disabled={isDisabled}
          className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 disabled:opacity-50"
        >
          {languageOptions.map(opt => (
            <option key={opt.code} value={opt.code}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label htmlFor="context-input" className="block text-sm font-medium text-gray-300 mb-1">
            {t.transcriptionContextPrompt}
        </label>
        <textarea
          id="context-input"
          rows={2}
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          disabled={isDisabled}
          placeholder={t.transcriptionContextPlaceholder}
          className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 disabled:opacity-50 resize-none"
        />
      </div>
      <div
        className={`flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*,video/*"
          className="hidden"
          disabled={isDisabled}
        />
        <button
          onClick={handleClick}
          disabled={isDisabled}
          className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? t.transcribing : t.uploadFile}
        </button>
        <p className="mt-2 text-sm text-gray-400">{t.dropFile}</p>
      </div>

      <div className="flex items-center my-4">
        <div className="flex-grow border-t border-gray-600"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-sm font-semibold">OR</span>
        <div className="flex-grow border-t border-gray-600"></div>
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={handleRecordClick}
          disabled={isLoading}
          className={`flex items-center justify-center w-full px-6 py-3 text-white font-semibold rounded-lg transition-colors duration-200 ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : 'bg-purple-600 hover:bg-purple-700'
          } disabled:bg-gray-500 disabled:cursor-not-allowed`}
        >
          {isRecording ? (
            <>
              <StopIcon className="w-6 h-6 me-2" />
              {t.stopRecording}
            </>
          ) : (
            <>
              <MicrophoneIcon className="w-6 h-6 me-2" />
              {t.recordAudio}
            </>
          )}
        </button>
        {recordingError && <p className="mt-2 text-sm text-red-400 text-center">{recordingError}</p>}
      </div>
    </div>
  );
};

export default FileUpload;