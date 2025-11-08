import React, { useState, useEffect } from 'react';
import type { TranslationSet } from '../types';
import { CheckIcon } from './icons/CheckIcon';

interface LoaderProps {
  t: TranslationSet;
  step: number;
  fileName: string;
}

const Loader: React.FC<LoaderProps> = ({ t, step, fileName }) => {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes initial estimate

  useEffect(() => {
    setTimeLeft(120);
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [fileName]);


  const steps = [
    t.progressStep1,
    t.progressStep2,
    t.progressStep3,
    t.progressStep4,
    t.progressStep5,
  ];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="m-auto text-center w-full max-w-md px-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
      <p className="mt-4 text-xl font-bold text-gray-200">{t.transcribing}</p>
      <p className="mt-1 text-sm text-gray-400 truncate" title={fileName}>{fileName}</p>

      <div className="mt-6 text-left space-y-3">
        {steps.map((stepName, index) => {
          const isActive = index + 1 === step;
          const isCompleted = index + 1 < step;

          return (
            <div key={index} className={`flex items-center gap-3 transition-all duration-300 ${isActive ? 'text-purple-300' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-purple-400' : isCompleted ? 'border-green-500 bg-green-500/20' : 'border-gray-600'}`}>
                {isCompleted ? <CheckIcon className="w-4 h-4"/> : (
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-purple-400 animate-pulse' : 'bg-gray-600'}`}></div>
                )}
              </div>
              <span className={`font-semibold ${isActive ? 'font-bold': ''}`}>{stepName}</span>
            </div>
          );
        })}
      </div>
      
      {step > 0 && step < 5 && (
        <p className="mt-6 text-xs text-gray-400">
          {t.timeRemaining} ~{formatTime(timeLeft)}
        </p>
      )}
    </div>
  );
};

export default Loader;
