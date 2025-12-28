import React from 'react';
import type { TranslationSet } from '../types';
import ComingSoon from './ComingSoon';

interface TextToSpeechProps {
  t: TranslationSet;
  onComplete: (data: any) => void;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ t }) => {
  return <ComingSoon toolName="Text to Speech" />;
};

export default TextToSpeech;