import React, { useState, useMemo, useEffect } from 'react';
import type { Transcription, TranslationSet, TranscriptionSegment, Task, TranslationTask } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { EditIcon } from './icons/EditIcon';
import { SaveIcon } from './icons/SaveIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import Loader from './Loader';
import { useTasks } from '../hooks/useTasks';
import { LANGUAGES } from '../lib/languages';

interface TranscriptionViewProps {
  transcription: Transcription;
  onSave: (transcription: Transcription) => void;
  onUpdate: (id: string, updatedSegments: TranscriptionSegment[]) => void;
  t: TranslationSet;
  isFromHistory: boolean;
}

const translationLanguages = LANGUAGES;

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ transcription, onSave, onUpdate, t, isFromHistory }) => {
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showSpeaker, setShowSpeaker] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(isFromHistory);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSegments, setEditedSegments] = useState<TranscriptionSegment[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Translation state from context
  const [activeView, setActiveView] = useState<'transcription' | 'translation'>('transcription');
  const [targetLanguageCode, setTargetLanguageCode] = useState('es');

  const { tasks, startTranslation } = useTasks();

  const relevantTranslationTask = tasks.find(task => 
    task.type === 'translation' && 
    task.parentId === transcription.id && 
    task.targetLanguageCode === targetLanguageCode
  ) as TranslationTask | undefined;

  const isTranslating = relevantTranslationTask?.status === 'processing';
  const translationError = relevantTranslationTask?.status === 'error' ? relevantTranslationTask.error : null;
  const translatedSegments = relevantTranslationTask?.status === 'completed' ? relevantTranslationTask.result : null;
  
  const [isTranslationCopied, setIsTranslationCopied] = useState(false);

  useEffect(() => {
    setIsSaved(isFromHistory);
    setIsEditing(false);
    setShowExportMenu(false);
    setActiveView('transcription');
  }, [transcription.id, isFromHistory]);

  const fullText = useMemo(() => {
    return transcription.segments
      .map(segment => {
        const parts = [];
        if (showTimestamps) parts.push(`[${segment.startTime} - ${segment.endTime}]`);
        if (showSpeaker) parts.push(`${segment.speaker}:`);
        parts.push(segment.text);
        return parts.join(' ');
      })
      .join('\n');
  }, [transcription.segments, showTimestamps, showSpeaker]);

  const fullTranslatedText = useMemo(() => {
    if (!translatedSegments) return '';
    return translatedSegments
      .map(segment => {
        const parts = [];
        if (showTimestamps) parts.push(`[${segment.startTime} - ${segment.endTime}]`);
        if (showSpeaker) parts.push(`${segment.speaker}:`);
        parts.push(segment.text);
        return parts.join(' ');
      })
      .join('\n');
  }, [translatedSegments, showTimestamps, showSpeaker]);


  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleCopyTranslation = () => {
    navigator.clipboard.writeText(fullTranslatedText);
    setIsTranslationCopied(true);
    setTimeout(() => setIsTranslationCopied(false), 2000);
  };

  const handleSave = () => {
    onSave(transcription);
    setIsSaved(true);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
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
      const toSrtTime = (time: string) => time.replace('.', ',') + ',000';
      const srtContent = transcription.segments.map((seg, i) => 
        `${i + 1}\n${toSrtTime(seg.startTime)} --> ${toSrtTime(seg.endTime)}\n${seg.text}`
      ).join('\n\n');
      createDownload(`${baseFilename}.srt`, srtContent, 'application/x-subrip;charset=utf-8');
    }
  };

  const handleTranslate = async () => {
    if (isTranslating || translatedSegments) return; // Don't re-translate if already translated or in progress
    const targetLanguage = translationLanguages.find(l => l.code === targetLanguageCode);
    if (targetLanguage) {
      startTranslation(transcription.segments, targetLanguage, transcription.id);
    }
  };

  const renderTranscriptionView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={showTimestamps} onChange={() => setShowTimestamps(!showTimestamps)} />
              <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showTimestamps ? 'translate-x-full bg-purple-400' : ''}`}></div>
            </div>
            <div className="ms-3 text-sm font-medium text-gray-300">{showTimestamps ? t.hideTimestamps : t.showTimestamps}</div>
          </label>
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={showSpeaker} onChange={() => setShowSpeaker(!showSpeaker)} />
              <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showSpeaker ? 'translate-x-full bg-purple-400' : ''}`}></div>
            </div>
            <div className="ms-3 text-sm font-medium text-gray-300">{showSpeaker ? t.hideSpeaker : t.showSpeaker}</div>
          </label>
        </div>
      <div className="flex-grow bg-gray-900/50 rounded-lg p-4 overflow-y-auto mb-4">
        <div className="text-gray-200 whitespace-pre-wrap leading-relaxed font-mono text-sm">
          {isEditing ? (
            editedSegments.map((segment, index) => (
              <div key={index} className="mb-2 flex items-start gap-3">
                {showTimestamps && <span className="text-purple-400 whitespace-nowrap pt-1">[{segment.startTime}]</span>}
                {showSpeaker && <strong className="text-pink-400 whitespace-nowrap pt-1">{segment.speaker}:</strong>}
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
                <p className="flex-1 min-w-[200px]">
                  {showSpeaker && <><strong className="text-pink-400">{segment.speaker}:</strong> </>}
                  {segment.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
           <button onClick={handleCopy} className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200">
            {isCopied ? <CheckIcon className="w-5 h-5 me-2"/> : <CopyIcon className="w-5 h-5 me-2" />}
            {isCopied ? t.copied : t.copy}
          </button>
          <button onClick={handleSave} disabled={isSaved} className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed transition-colors duration-200">
            {isSaved ? t.saved : t.save}
          </button>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200">
              <DownloadIcon className="w-5 h-5 me-2" /> {t.export}
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
              <button onClick={handleSaveChanges} className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200">
                <SaveIcon className="w-5 h-5 me-2"/> {t.saveChanges}
              </button>
            )}
            <button onClick={handleEditToggle} className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200">
              <EditIcon className="w-5 h-5 me-2"/> {isEditing ? t.cancel : t.edit}
            </button>
        </div>
      </div>
    </div>
  );

  const renderTranslationView = () => (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label htmlFor="target-language" className="text-sm font-medium text-gray-300">{t.selectTargetLanguage}</label>
        <select
          id="target-language"
          value={targetLanguageCode}
          onChange={(e) => setTargetLanguageCode(e.target.value)}
          disabled={isTranslating}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5"
        >
          {translationLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
        </select>
        <button
          onClick={handleTranslate}
          disabled={isTranslating || !!translatedSegments}
          className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isTranslating ? t.translating : t.translate}
        </button>
      </div>
      <div className="flex-grow bg-gray-900/50 rounded-lg p-4 overflow-y-auto mb-4 relative">
        {isTranslating && <div className="absolute inset-0 bg-gray-800/50 flex items-center justify-center"><Loader message={t.translating} duration={30} t={t} /></div>}
        {translationError && <div className="text-center text-red-400 m-auto">{translationError}</div>}
        {!isTranslating && !translationError && translatedSegments && (
          <>
            <button onClick={handleCopyTranslation} className="absolute top-3 right-3 z-10 flex items-center px-3 py-1 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200">
              {isTranslationCopied ? <CheckIcon className="w-4 h-4 me-1.5"/> : <CopyIcon className="w-4 h-4 me-1.5" />}
              {isTranslationCopied ? t.copied : t.copy}
            </button>
            <div className="text-gray-200 whitespace-pre-wrap leading-relaxed font-mono text-sm">
              {translatedSegments.map((segment, index) => (
                <div key={index} className="mb-2 flex flex-row flex-wrap">
                  {showTimestamps && <span className="text-purple-400 me-3">[{segment.startTime} - {segment.endTime}]</span>}
                  <p className="flex-1 min-w-[200px]">
                    {showSpeaker && <><strong className="text-pink-400">{segment.speaker}:</strong> </>}
                    {segment.text}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
        {!isTranslating && !translatedSegments && !translationError && (
          <div className="text-center text-gray-500 m-auto">
            <p>Select a language and click Translate to begin.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
        <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-200" title={transcription.fileName}>{transcription.fileName}</h2>
            <p className="text-xs text-purple-400 mt-1">{t.detectedLanguage}: <span className="font-semibold">{transcription.detectedLanguage}</span></p>
        </div>

        <div className="flex border-b border-gray-700 my-4">
          <button onClick={() => setActiveView('transcription')} className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeView === 'transcription' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t.transcription}
          </button>
          <button onClick={() => setActiveView('translation')} className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeView === 'translation' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t.translation}
          </button>
        </div>
        
        <div className="flex-grow overflow-hidden flex flex-col">
          {activeView === 'transcription' ? renderTranscriptionView() : renderTranslationView()}
        </div>
    </div>
  );
};

export default TranscriptionView;