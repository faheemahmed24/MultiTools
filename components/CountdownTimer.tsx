import React, { useState, useEffect } from 'react';
import type { TranslationSet } from '../types';

interface CountdownTimerProps {
  duration: number; // in seconds
  t: TranslationSet;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ duration, t }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => prevTime > 0 ? prevTime - 1 : 0);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-2 text-sm text-gray-400">
      {timeLeft > 0 ? (
        <span>{t.estimatedTime} {formatTime(timeLeft)}</span>
      ) : (
        <span>{t.takingLonger}</span>
      )}
    </div>
  );
};

export default CountdownTimer;
