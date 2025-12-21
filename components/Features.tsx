import React from 'react';
import type { TranslationSet } from '../types';

interface Props { t: TranslationSet }

const Features: React.FC<Props> = ({ t }) => {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold mb-4">Features</h2>
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-2">AI Transcriber</h3>
          <ul className="list-disc list-inside text-gray-300">
            <li>Media Transcription for MP3, WAV, MP4 and more</li>
            <li>Auto-language detection</li>
            <li>Speaker diarization</li>
            <li>Interactive transcript editor with timestamps</li>
            <li>Export: TXT, JSON, SRT, DOCX, PDF, CSV</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">AI Translator</h3>
          <ul className="list-disc list-inside text-gray-300">
            <li>Multi-language translation</li>
            <li>Language swapping and batch export</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Image & OCR</h3>
          <ul className="list-disc list-inside text-gray-300">
            <li>OCR extraction from images and scanned documents</li>
            <li>Batch image processing with pacing for API limits</li>
            <li>Integrated translation of OCR results</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">PDF & Documents</h3>
          <ul className="list-disc list-inside text-gray-300">
            <li>PDF → Image (PNG/JPEG) with page selection</li>
            <li>Image → PDF with layout controls</li>
            <li>PDF → DOCX and DOCX → PDF</li>
            <li>Built-in image editor (rotate, brightness, contrast)</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Audio & Video</h3>
          <ul className="list-disc list-inside text-gray-300">
            <li>Video → Audio extraction (WAV, MP3, FLAC, AAC)</li>
            <li>Audio Merger with drag-and-drop ordering</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Advanced AI</h3>
          <ul className="list-disc list-inside text-gray-300">
            <li>Text to Speech with multiple AI voices</li>
            <li>Read Online: fetch & extract page content from URLs</li>
            <li>Grammar correction with visual diff view</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Data & UX</h3>
          <ul className="list-disc list-inside text-gray-300">
            <li>Export to Sheets / CSV with preview</li>
            <li>Local-first persistent history scoped per user</li>
            <li>Multilingual UI (EN, HI, UR, AR) with RTL support</li>
            <li>Local auth (email/password + simulated Google)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Features;
