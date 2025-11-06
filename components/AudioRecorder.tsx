import React, { useState, useRef } from 'react';
import { RecordIcon } from './icons/RecordIcon';
import { StopIcon } from './icons/StopIcon';
import type { TranslationSet } from '../types';

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  t: TranslationSet;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, t }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // FIX: Changed NodeJS.Timeout to ReturnType<typeof setInterval> for browser compatibility.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${new Date().toISOString()}.webm`, { type: 'audio/webm' });
        onRecordingComplete(audioFile);
        stream.getTracks().forEach(track => track.stop()); // Release microphone
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error starting recording:", err);
      // You might want to show an error to the user here
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if(timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="flex items-center gap-3 px-6 py-3 bg-[color:var(--accent-primary)] text-white font-semibold rounded-lg shadow-md hover:bg-[color:var(--accent-primary-hover)] transition-colors"
        >
          <RecordIcon className="w-6 h-6" />
          {t.startRecording}
        </button>
      ) : (
        <div className="text-center">
            <p className="text-lg font-semibold text-red-500 mb-4">{t.recording}</p>
            <p className="text-3xl font-mono tabular-nums text-[color:var(--text-primary)] mb-6">{formatTime(recordingTime)}</p>
            <button
            onClick={stopRecording}
            className="flex items-center gap-3 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
            >
            <StopIcon className="w-6 h-6" />
            {t.stopRecording}
            </button>
        </div>
      )}
    </div>
  );
};