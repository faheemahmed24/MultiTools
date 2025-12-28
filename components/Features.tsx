import React from 'react';
import type { TranslationSet } from '../types';

const Features: React.FC<{ t: TranslationSet }> = ({ t }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8">Features</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {[
          "AI Transcription with speaker diarization",
          "Batch image OCR with translation",
          "PDF/document conversion and image editor",
          "Audio/video extraction and merging",
          "Multi-personality TTS",
          "Grammar correction with visual diff"
        ].map((feature, i) => (
          <div key={i} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-200 font-medium">✅ {feature}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;