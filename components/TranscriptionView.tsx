import React, { useState, useMemo, useEffect } from 'react';
import type { Transcription, TranslationSet, TranscriptionSegment } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { EditIcon } from './icons/EditIcon';
import { SaveIcon } from './icons/SaveIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface TranscriptionViewProps {
  transcription: Transcription;
  onSave: () => void;
  onUpdate: (id: string, updatedSegments: TranscriptionSegment[]) => void;
  t: TranslationSet;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ transcription, onSave, onUpdate, t }) => {
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSegments, setEditedSegments] = useState<TranscriptionSegment[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    // Reset state when a new transcription is loaded
    setIsSaved(false);
    setIsEditing(false);
    setShowExportMenu(false);
  }, [transcription.id]);

  const fullText = useMemo(() => {
    return transcription.segments
      .map(segment => {
        const timestamp = showTimestamps ? `[${segment.startTime} - ${segment.endTime}]` : '';
        const speaker = `${segment.speaker}:`;
        return `${timestamp} ${speaker} ${segment.text}`.trim();
      })
      .join('\n');
  }, [transcription.segments, showTimestamps]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleSave = () => {
    onSave();
    setIsSaved(true);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setIsEditing(false);
    } else {
      // Start editing
      setEditedSegments(JSON.parse(JSON.stringify(transcription.segments))); // Deep copy
      setIsEditing(true);
    }
  };

  const handleSegmentChange = (index: number, newText: string) => {
    const newSegments = [...editedSegments];
    newSegments[index].text = newText;
    setEditedSegments(newSegments);
  };

  const handleSaveChanges = () => {
    onUpdate(transcription.id, editedSegments);
    setIsEditing(false);
  };

  const createDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExport = (format: 'txt' | 'json' | 'srt') => {
    const baseFilename = transcription.fileName.split('.').slice(0, -1).join('.') || transcription.fileName;
    if (format === 'txt') {
      createDownload(`${baseFilename}.txt`, fullText, 'text/plain;charset=utf-8');
    } else if (format === 'json') {
      createDownload(`${baseFilename}.json`, JSON.stringify(transcription, null, 2), 'application/json;charset=utf-8');
    } else if (format === 'srt') {
      // Fix: Improved SRT timestamp generation to correctly handle milliseconds.
      const toSrtTime = (time: string) => {
        const parts = time.split('.');
        const hms = parts[0];
        const ms = (parts[1] || '0').padEnd(3, '0').substring(0, 3);
        return `${hms},${ms}`;
      };
      const srtContent = transcription.segments.map((seg, i) => 
        `${i + 1}\n${toSrtTime(seg.startTime)} --> ${toSrtTime(seg.endTime)}\n${seg.text}`
      ).join('\n\n');
      createDownload(`${baseFilename}.srt`, srtContent, 'application/x-subrip;charset=utf-8');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-start justify-between mb-4 gap-4">
        <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-200">{t.transcription}</h2>
            <p className="text-sm text-gray-400 truncate max-w-xs" title={transcription.fileName}>{transcription.fileName}</p>
            <p className="text-xs text-purple-400 mt-1">{t.detectedLanguage}: <span className="font-semibold">{transcription.detectedLanguage}</span></p>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={showTimestamps} onChange={() => setShowTimestamps(!showTimestamps)} />
              <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showTimestamps ? 'translate-x-full bg-purple-400' : ''}`}></div>
            </div>
            <div className="ms-3 text-sm font-medium text-gray-300">{showTimestamps ? t.hideTimestamps : t.showTimestamps}</div>
          </label>
        </div>
      </div>

      <div className="flex-grow bg-gray-900/50 rounded-lg p-4 overflow-y-auto mb-4">
        <div className="text-gray-200 whitespace-pre-wrap leading-relaxed font-mono text-sm">
          {isEditing ? (
            editedSegments.map((segment, index) => (
              <div key={index} className="mb-2 flex items-start gap-3">
                {showTimestamps && <span className="text-purple-400 whitespace-nowrap pt-1">[{segment.startTime}]</span>}
                <strong className="text-pink-400 whitespace-nowrap pt-1">{segment.speaker}:</strong>
                <textarea
                  value={segment.text}
                  onChange={(e) => handleSegmentChange(index, e.target.value)}
                  className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-md p-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  rows={Math.max(1, segment.text.split('\n').length)}
                />
              </div>
            ))
          ) : (
            transcription.segments.map((segment, index) => (
              <div key={index} className="mb-2 flex flex-row flex-wrap">
                {showTimestamps && <span className="text-purple-400 me-3">[{segment.startTime} - {segment.endTime}]</span>}
                <p className="flex-1 min-w-[200px]"><strong className="text-pink-400">{segment.speaker}:</strong> {segment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
           <button 
            onClick={handleCopy}
            className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            {isCopied ? <CheckIcon className="w-5 h-5 me-2"/> : <CopyIcon className="w-5 h-5 me-2" />}
            {isCopied ? t.copied : t.copy}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaved}
            className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSaved ? t.saved : t.save}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              <DownloadIcon className="w-5 h-5 me-2" />
              {t.export}
            </button>
            {showExportMenu && (
              <div className="absolute bottom-full mb-2 w-48 bg-gray-600 rounded-lg shadow-xl py-1 z-10">
                <button onClick={() => handleExport('txt')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">TXT (.txt)</button>
                <button onClick={() => handleExport('json')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">JSON (.json)</button>
                <button onClick={() => handleExport('srt')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">SRT (.srt)</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
            {isEditing && (
              <button
                onClick={handleSaveChanges}
                className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <SaveIcon className="w-5 h-5 me-2"/> {t.saveChanges}
              </button>
            )}
            <button
              onClick={handleEditToggle}
              className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              <EditIcon className="w-5 h-5 me-2"/> {isEditing ? t.cancel : t.edit}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;