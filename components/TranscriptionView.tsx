import React, { useState, useEffect, useRef } from 'react';
import type { Transcription, TranslationSet, TranscriptSegment } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { EditIcon } from './icons/EditIcon';
import { SaveIcon } from './icons/SaveIcon';
import { SearchIcon } from './icons/SearchIcon';
import { exportAsSRT, exportAsVTT, exportAsTXT, exportAsPDF, exportAsDOCX } from '../lib/exportUtils';
import { supportedLanguages } from '../lib/languages';

interface TranscriptionViewProps {
  data: Transcription;
  t: TranslationSet;
  onUpdate: (updatedData: Transcription) => void;
  onSummarize: (targetLanguage: string) => void;
  isSummarizing: boolean;
  onTranslate: (targetLanguage: string) => void;
  isTranslating: boolean;
  onDetectLanguage: () => Promise<void>;
  processTimeLeft: number;
}

const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(11, 8);

const Toggle: React.FC<{label: string; checked: boolean; onChange: () => void}> = ({ label, checked, onChange }) => (
  <label className="flex items-center cursor-pointer text-sm" role="switch" aria-checked={checked}>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-[color:var(--accent-primary)]' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
    </div>
    <div className="ml-2 text-[color:var(--text-secondary)] rtl:mr-2 rtl:ml-0">{label}</div>
  </label>
);

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ data, t, onUpdate, onSummarize, isSummarizing, onTranslate, isTranslating, onDetectLanguage, processTimeLeft }) => {
  const [activeTab, setActiveTab] = useState<'transcription' | 'summary' | 'translation'>('transcription');
  const [viewMode, setViewMode] = useState<'segmented' | 'paragraph'>('segmented');
  const [copied, setCopied] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingSegment, setEditingSegment] = useState<number | null>(null);
  const [editedText, setEditedText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSegment, setCurrentSegment] = useState(-1);
  const [targetSummaryLanguage, setTargetSummaryLanguage] = useState('en');
  const [targetTranslationLanguage, setTargetTranslationLanguage] = useState('en');
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [showInfo, setShowInfo] = useState({ timestamps: true, speakers: true });
  const [exportOptions, setExportOptions] = useState({ timestamps: true, speakers: true });
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    const detect = async () => {
      if (activeTab === 'translation' && !data.translation && !data.detectedLanguage) {
        setIsDetectingLanguage(true);
        try {
          await onDetectLanguage();
        } catch(e) {
          console.error(e)
        } finally {
          setIsDetectingLanguage(false);
        }
      }
    };
    detect();
  }, [activeTab, data.detectedLanguage, data.translation, onDetectLanguage]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSegment = (index: number, text: string) => {
    setEditingSegment(index);
    setEditedText(text);
  };

  const handleSaveSegment = (index: number) => {
    const updatedSegments = [...data.segments];
    updatedSegments[index] = { ...updatedSegments[index], text: editedText };
    onUpdate({ ...data, segments: updatedSegments });
    setEditingSegment(null);
    setEditedText('');
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
        const currentTime = audioRef.current.currentTime;
        const activeIndex = data.segments.findIndex(seg => currentTime >= seg.start && currentTime <= seg.end);
        if (activeIndex !== -1 && activeIndex !== currentSegment) {
            setCurrentSegment(activeIndex);
            document.getElementById(`segment-${data.id}-${activeIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  };

  const fullTranscriptText = data.segments.map(s => `${t.speaker} ${s.speaker}:\n${s.text}`).join('\n\n');
  const paragraphText = data.segments.map(s => s.text).join(' ');

  const filteredSegments = data.segments.filter(segment => 
    segment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    segment.speaker.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="bg-[color:var(--bg-secondary)] rounded-lg shadow-sm flex flex-col h-[calc(100vh-12rem)]">
      {data.audioUrl && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <audio ref={audioRef} src={data.audioUrl} controls className="w-full" onTimeUpdate={handleTimeUpdate} />
        </div>
      )}

      <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
        <button
          onClick={() => setActiveTab('transcription')}
          className={`py-3 text-sm font-semibold transition-colors ${activeTab === 'transcription' ? 'text-[color:var(--accent-primary)] border-b-2 border-[color:var(--accent-secondary)]' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
        >
          {t.transcription}
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`mx-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'summary' ? 'text-[color:var(--accent-primary)] border-b-2 border-[color:var(--accent-secondary)]' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
        >
          {t.summary}
        </button>
        <button
          onClick={() => setActiveTab('translation')}
          className={`py-3 text-sm font-semibold transition-colors ${activeTab === 'translation' ? 'text-[color:var(--accent-primary)] border-b-2 border-[color:var(--accent-secondary)]' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
        >
          {t.translation}
        </button>
      </div>
      
      {activeTab === 'transcription' && (
        <div className="flex-grow flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-4 flex-wrap">
               <div className="bg-gray-200 dark:bg-gray-700/50 rounded-full p-1 flex items-center space-x-1 rtl:space-x-reverse">
                <button
                  onClick={() => setViewMode('segmented')}
                  className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-200 ${
                    viewMode === 'segmented'
                      ? 'bg-[color:var(--accent-primary)] text-white'
                      : 'text-[color:var(--text-secondary)] hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {t.segmentedView}
                </button>
                <button
                  onClick={() => setViewMode('paragraph')}
                  className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-200 ${
                    viewMode === 'paragraph'
                      ? 'bg-[color:var(--accent-primary)] text-white'
                      : 'text-[color:var(--text-secondary)] hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {t.paragraphView}
                </button>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse flex-shrink-0">
                <button onClick={() => handleCopy(viewMode === 'paragraph' ? paragraphText : fullTranscriptText)} className="p-2 text-gray-500 hover:text-[color:var(--accent-primary)] rounded-full" title={t.copy}>
                  {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
                </button>
                <div className="relative">
                  <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-2 text-gray-500 hover:text-[color:var(--accent-primary)] rounded-full" title={t.download}>
                    <DownloadIcon className="w-5 h-5" />
                  </button>
                  {showExportMenu && (
                    <div onMouseLeave={() => setShowExportMenu(false)} className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-56 bg-[color:var(--bg-secondary)] rounded-md shadow-lg z-10">
                      <button onClick={() => { exportAsSRT(data.segments); setShowExportMenu(false); }} className="block w-full text-left rtl:text-right px-4 py-2 text-sm text-[color:var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-600">{t.exportSRT}</button>
                      <button onClick={() => { exportAsVTT(data.segments); setShowExportMenu(false); }} className="block w-full text-left rtl:text-right px-4 py-2 text-sm text-[color:var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-600">{t.exportVTT}</button>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                      <div className="px-4 py-2 space-y-2">
                        <label className="flex items-center text-sm text-[color:var(--text-secondary)] cursor-pointer">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[color:var(--accent-primary)] focus:ring-[color:var(--accent-primary-hover)] dark:bg-gray-600 dark:border-gray-500" checked={exportOptions.timestamps} onChange={() => setExportOptions(p => ({ ...p, timestamps: !p.timestamps }))} />
                          <span className="ml-2 rtl:mr-2">{t.includeTimestamps}</span>
                        </label>
                        <label className="flex items-center text-sm text-[color:var(--text-secondary)] cursor-pointer">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[color:var(--accent-primary)] focus:ring-[color:var(--accent-primary-hover)] dark:bg-gray-600 dark:border-gray-500" checked={exportOptions.speakers} onChange={() => setExportOptions(p => ({ ...p, speakers: !p.speakers }))} />
                          <span className="ml-2 rtl:mr-2">{t.includeSpeakers}</span>
                        </label>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                      <button onClick={() => { exportAsTXT(data, exportOptions); setShowExportMenu(false); }} className="block w-full text-left rtl:text-right px-4 py-2 text-sm text-[color:var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-600">{t.exportTXT}</button>
                      <button onClick={() => { exportAsPDF(data, exportOptions); setShowExportMenu(false); }} className="block w-full text-left rtl:text-right px-4 py-2 text-sm text-[color:var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-600">{t.exportPDF}</button>
                      <button onClick={() => { exportAsDOCX(data, exportOptions); setShowExportMenu(false); }} className="block w-full text-left rtl:text-right px-4 py-2 text-sm text-[color:var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-600">{t.exportDOCX}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {viewMode === 'segmented' && (
              <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="relative flex-grow min-w-[200px]">
                  <SearchIcon className="w-5 h-5 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input 
                    type="text"
                    placeholder={t.searchTranscript}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-700/80 rounded-full py-2 pl-10 pr-4 rtl:pr-10 rtl:pl-4 focus:ring-[color:var(--accent-primary)] focus:border-[color:var(--accent-primary)] text-sm"
                  />
                </div>
                <div className="flex items-center gap-x-4 gap-y-2 flex-wrap flex-shrink-0">
                  <Toggle label={t.showTimestamps} checked={showInfo.timestamps} onChange={() => setShowInfo(p => ({ ...p, timestamps: !p.timestamps }))} />
                  <Toggle label={t.showSpeakers} checked={showInfo.speakers} onChange={() => setShowInfo(p => ({ ...p, speakers: !p.speakers }))} />
                </div>
              </div>
            )}
          </div>

          <div className="flex-grow overflow-y-auto p-4">
            {viewMode === 'segmented' ? (
              <div className="space-y-4">
                {filteredSegments.map((segment, index) => (
                  <div id={`segment-${data.id}-${index}`} key={index} className={`flex gap-4 p-2 rounded-md ${currentSegment === index ? 'bg-[color:var(--accent-primary)]/10' : ''}`}>
                    {(showInfo.timestamps || showInfo.speakers) && (
                      <div className="w-24 flex-shrink-0">
                        {showInfo.timestamps && (
                          <button onClick={() => audioRef.current && (audioRef.current.currentTime = segment.start)} className="text-sm font-mono text-[color:var(--accent-primary)] hover:underline">
                            {formatTime(segment.start)}
                          </button>
                        )}
                        {showInfo.speakers && (
                          <p className="text-xs font-semibold text-[color:var(--text-secondary)] mt-1">{t.speaker} {segment.speaker}</p>
                        )}
                      </div>
                    )}
                    <div className="flex-grow">
                      {editingSegment === index ? (
                        <div>
                          <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="w-full h-24 p-2 bg-gray-50 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-[color:var(--accent-primary)] focus:border-[color:var(--accent-primary)]"
                          />
                          <button onClick={() => handleSaveSegment(index)} className="mt-2 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                            {t.save}
                          </button>
                        </div>
                      ) : (
                        <p dir="auto" className="text-[color:var(--text-primary)] leading-loose">{segment.text}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {editingSegment !== index && (
                        <button onClick={() => handleEditSegment(index, segment.text)} className="p-2 text-gray-400 hover:text-[color:var(--accent-primary)] rounded-full" title={t.edit}>
                          <EditIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p dir="auto" className="text-[color:var(--text-primary)] leading-loose">{paragraphText}</p>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'summary' && (
        <div className="p-6 flex-grow flex flex-col">
          {data.summary ? (
             <div className="w-full h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                      <select
                          value={targetSummaryLanguage}
                          onChange={(e) => setTargetSummaryLanguage(e.target.value)}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[color:var(--accent-primary)] focus:border-[color:var(--accent-primary)] block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      >
                          {supportedLanguages.map(lang => (
                              <option key={lang.code} value={lang.code}>{lang.name}</option>
                          ))}
                      </select>
                      <button
                          onClick={() => onSummarize(targetSummaryLanguage)}
                          disabled={isSummarizing}
                          className="px-5 py-2.5 bg-[color:var(--accent-primary)] text-white font-semibold rounded-lg shadow-md hover:bg-[color:var(--accent-primary-hover)] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                          {t.summarize}
                      </button>
                  </div>
                  <button onClick={() => handleCopy(data.summary!)} className="p-2 text-gray-500 hover:text-[color:var(--accent-primary)] rounded-full" title={t.copy}>
                    {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
                  </button>
              </div>
              {isSummarizing ? (
                 <div className="flex-grow flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent-primary)] mx-auto"></div>
                    <p className="mt-4 text-md font-semibold text-[color:var(--text-primary)]">{t.summarizing}</p>
                    <p className="mt-2 text-sm text-[color:var(--text-secondary)] tabular-nums">{t.timeRemaining}: {processTimeLeft}s</p>
                  </div>
              ) : (
                <div className="flex-grow overflow-y-auto">
                  <p dir="auto" className="text-[color:var(--text-primary)] whitespace-pre-wrap leading-loose">{data.summary}</p>
                </div>
              )}
            </div>
          ) : isSummarizing ? (
            <div className="flex-grow flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent-primary)] mx-auto"></div>
              <p className="mt-4 text-md font-semibold text-[color:var(--text-primary)]">{t.summarizing}</p>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)] tabular-nums">{t.timeRemaining}: {processTimeLeft}s</p>
            </div>
          ) : (
             <div className="flex-grow flex flex-col items-center justify-center">
                <div className="flex items-center gap-4 mb-4">
                    <select
                        value={targetSummaryLanguage}
                        onChange={(e) => setTargetSummaryLanguage(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[color:var(--accent-primary)] focus:border-[color:var(--accent-primary)] block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    >
                        <option value="" disabled>{t.selectSummaryLanguagePrompt}</option>
                        {supportedLanguages.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => onSummarize(targetSummaryLanguage)}
                        disabled={isSummarizing}
                        className="px-5 py-2.5 bg-[color:var(--accent-primary)] text-white font-semibold rounded-lg shadow-md hover:bg-[color:var(--accent-primary-hover)] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {t.summarize}
                    </button>
                </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'translation' && (
        <div className="p-6 flex-grow flex flex-col">
          {data.translation ? (
             <div className="w-full h-full flex flex-col flex-grow">
                 <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <select
                            value={targetTranslationLanguage}
                            onChange={(e) => setTargetTranslationLanguage(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[color:var(--accent-primary)] focus:border-[color:var(--accent-primary)] block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        >
                            {supportedLanguages.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => onTranslate(targetTranslationLanguage)}
                            disabled={isTranslating}
                            className="px-5 py-2.5 bg-[color:var(--accent-primary)] text-white font-semibold rounded-lg shadow-md hover:bg-[color:var(--accent-primary-hover)] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {t.translate}
                        </button>
                    </div>
                    <button onClick={() => handleCopy(data.translation!)} className="p-2 text-gray-500 hover:text-[color:var(--accent-primary)] rounded-full" title={t.copy}>
                        {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
                    </button>
                </div>
                {isTranslating ? (
                    <div className="flex-grow flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent-primary)] mx-auto"></div>
                        <p className="mt-4 text-md font-semibold text-[color:var(--text-primary)]">{t.translating}</p>
                        <p className="mt-2 text-sm text-[color:var(--text-secondary)] tabular-nums">{t.timeRemaining}: {processTimeLeft}s</p>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto">
                        <p dir="auto" className="text-[color:var(--text-primary)] whitespace-pre-wrap leading-loose">{data.translation}</p>
                    </div>
                )}
            </div>
          ) : isTranslating ? (
            <div className="flex-grow flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent-primary)] mx-auto"></div>
              <p className="mt-4 text-md font-semibold text-[color:var(--text-primary)]">{t.translating}</p>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)] tabular-nums">{t.timeRemaining}: {processTimeLeft}s</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                <select
                    value={targetTranslationLanguage}
                    onChange={(e) => setTargetTranslationLanguage(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[color:var(--accent-primary)] focus:border-[color:var(--accent-primary)] block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                >
                    <option value="" disabled>{t.selectLanguagePrompt}</option>
                    {supportedLanguages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                </select>
                <button
                    onClick={() => onTranslate(targetTranslationLanguage)}
                    disabled={isTranslating}
                    className="px-5 py-2.5 bg-[color:var(--accent-primary)] text-white font-semibold rounded-lg shadow-md hover:bg-[color:var(--accent-primary-hover)] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {t.translate}
                </button>
              </div>
              {isDetectingLanguage && (
                <div className="text-center text-sm text-[color:var(--text-secondary)] my-4">
                  {t.detectingLanguage}
                </div>
              )}
              {data.detectedLanguage && !isDetectingLanguage && (
                <div className="text-center text-sm text-[color:var(--text-primary)] my-4 p-2 bg-gray-100 dark:bg-gray-700/80 rounded-md">
                  {t.detectedLanguage}: <span className="font-semibold">{data.detectedLanguage}</span>
                </div>
              )}
              <div className="flex-grow flex items-center justify-center">
                {!isDetectingLanguage && <p className="text-[color:var(--text-secondary)]">{t.selectLanguagePrompt}</p>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptionView;