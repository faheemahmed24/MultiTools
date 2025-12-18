
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Transcription, TranslationSet, TranscriptionSegment } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { EditIcon } from './icons/EditIcon';
import { SaveIcon } from './icons/SaveIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useDebounce } from '../hooks/useDebounce';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';
import { TxtIcon } from './icons/TxtIcon';
import { JsonIcon } from './icons/JsonIcon';
import { SrtIcon } from './icons/SrtIcon';
import { CsvIcon } from './icons/CsvIcon';
import { PdfIcon } from './icons/PdfIcon';
import { DocxIcon } from './icons/DocxIcon';

interface TranscriptionViewProps {
  transcription: Transcription;
  onSave: () => void;
  onUpdate: (id: string, updatedSegments: TranscriptionSegment[]) => void;
  onClose: () => void;
  t: TranslationSet;
}

const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-full bg-purple-400' : ''}`}></div>
        </div>
        <div className="ms-3 text-xs font-bold text-gray-400">{label}</div>
    </label>
);

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ transcription, onSave, onUpdate, onClose, t }) => {
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showSpeaker, setShowSpeaker] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSegments, setEditedSegments] = useState<TranscriptionSegment[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [editHistory, setEditHistory] = useState<TranscriptionSegment[][]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const debouncedEditedSegments = useDebounce(editedSegments, 500);

  useEffect(() => {
    setIsEditing(false);
    setEditHistory([]);
    setCurrentHistoryIndex(-1);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [transcription.id]);

  useEffect(() => {
    if (!isEditing || !debouncedEditedSegments.length) return;
    if (editHistory[currentHistoryIndex] && JSON.stringify(editHistory[currentHistoryIndex]) === JSON.stringify(debouncedEditedSegments)) return;
    const newHistory = editHistory.slice(0, currentHistoryIndex + 1);
    setEditHistory([...newHistory, debouncedEditedSegments]);
    setCurrentHistoryIndex(newHistory.length);
  }, [debouncedEditedSegments, isEditing, currentHistoryIndex, editHistory]);

  const fullText = useMemo(() => {
    return transcription.segments
      .map(segment => {
        const timestamp = showTimestamps ? `[${segment.startTime} - ${segment.endTime}]` : '';
        const speaker = showSpeaker ? `${segment.speaker}:` : '';
        return [timestamp, speaker, segment.text].filter(Boolean).join(' ').trim();
      }).join('\n');
  }, [transcription.segments, showTimestamps, showSpeaker]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEditToggle = () => {
    if (isEditing) setIsEditing(false);
    else {
      const initial = JSON.parse(JSON.stringify(transcription.segments));
      setEditedSegments(initial);
      setEditHistory([initial]);
      setCurrentHistoryIndex(0);
      setIsEditing(true);
    }
  };

  const handleExport = async (format: 'txt' | 'json' | 'srt' | 'docx' | 'pdf' | 'csv') => {
    const base = transcription.fileName.split('.').slice(0, -1).join('.') || 'transcription';
    const download = (filename: string, content: string | Blob, mime?: string) => {
      const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    if (format === 'txt') download(`${base}.txt`, fullText, 'text/plain');
    else if (format === 'json') download(`${base}.json`, JSON.stringify(transcription, null, 2), 'application/json');
    else if (format === 'srt') {
      const srt = transcription.segments.map((s, i) => `${i+1}\n${s.startTime.replace('.', ',')} --> ${s.endTime.replace('.', ',')}\n${s.text}`).join('\n\n');
      download(`${base}.srt`, srt, 'text/plain');
    } else if (format === 'csv') {
      const rows = transcription.segments.map(s => `"${s.startTime}","${s.endTime}","${s.speaker}","${s.text.replace(/"/g, '""')}"`).join('\n');
      download(`${base}.csv`, `Start,End,Speaker,Text\n${rows}`, 'text/csv');
    } else if (format === 'docx') {
      const paragraphs = transcription.segments.map(s => new docx.Paragraph({ children: [new docx.TextRun({ text: `${s.speaker} (${s.startTime}): `, bold: true }), new docx.TextRun(s.text)], spacing: { after: 120 } }));
      const blob = await docx.Packer.toBlob(new docx.Document({ sections: [{ children: paragraphs }] }));
      download(`${base}.docx`, blob);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      let y = 15;
      transcription.segments.forEach(s => {
          const line = `${s.speaker} (${s.startTime}): ${s.text}`;
          const split = doc.splitTextToSize(line, 180);
          if (y + split.length * 7 > 280) { doc.addPage(); y = 15; }
          doc.text(split, 15, y); y += split.length * 7 + 3;
      });
      download(`${base}.pdf`, doc.output('blob'));
    }
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg p-6">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
             <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 transition-colors"><ArrowLeftIcon className="w-5 h-5" /></button>
             <div>
                <h2 className="text-xl font-bold text-gray-200">Transcription Result</h2>
                <p className="text-xs text-purple-400 font-bold uppercase tracking-wider">{transcription.detectedLanguage} detected</p>
             </div>
        </div>
        <div className="flex items-center gap-6">
          <Switch checked={showTimestamps} onChange={setShowTimestamps} label="Timestamps" />
          <Switch checked={showSpeaker} onChange={setShowSpeaker} label="Speakers" />
        </div>
      </div>

      <div ref={containerRef} className="flex-grow bg-gray-900/40 rounded-xl p-6 overflow-y-auto mb-4 border border-gray-700/30">
        <div className="space-y-6">
          {isEditing ? (
            editedSegments.map((seg, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <div className="flex gap-4 text-xs font-bold">
                    <span className="text-purple-400">{seg.startTime}</span>
                    <span className="text-pink-400">{seg.speaker}</span>
                </div>
                <textarea 
                    value={seg.text} 
                    onChange={e => { const n = [...editedSegments]; n[idx].text = e.target.value; setEditedSegments(n); }} 
                    className="w-full bg-gray-700/50 border-gray-600 rounded p-2 text-sm text-gray-200 focus:ring-1 focus:ring-purple-500"
                    rows={2}
                />
              </div>
            ))
          ) : (
            transcription.segments.map((seg, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-4 hover:bg-gray-800/20 p-2 rounded-lg transition-colors group">
                 {(showTimestamps || showSpeaker) && (
                    <div className="sm:w-32 flex-shrink-0 flex flex-col text-[10px] font-bold uppercase tracking-tighter text-gray-500 pt-1">
                        {showSpeaker && <span className="text-pink-500 truncate mb-0.5">{seg.speaker}</span>}
                        {showTimestamps && <span className="text-purple-400 font-mono">{seg.startTime}</span>}
                    </div>
                 )}
                <p className="flex-grow text-gray-200 leading-relaxed text-sm lg:text-base">{seg.text}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
           <button onClick={handleCopy} className="flex items-center px-4 py-2 bg-gray-700 text-white text-sm font-bold rounded-lg hover:bg-gray-600 transition-all">
            {isCopied ? <CheckIcon className="w-4 h-4 me-2"/> : <CopyIcon className="w-4 h-4 me-2" />}
            {isCopied ? 'COPIED' : 'COPY'}
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center px-4 py-2 bg-gray-700 text-white text-sm font-bold rounded-lg hover:bg-gray-600 transition-all">
              <DownloadIcon className="w-4 h-4 me-2" /> EXPORT
            </button>
            {showExportMenu && (
              <div className="absolute bottom-full mb-2 w-32 bg-gray-700 border border-gray-600 rounded-lg shadow-xl py-1 z-10">
                {['txt', 'json', 'srt', 'docx', 'pdf', 'csv'].map(f => (
                  <button key={f} onClick={() => handleExport(f as any)} className="w-full text-start px-4 py-2 text-xs font-bold text-gray-300 hover:bg-purple-600 uppercase">{f}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
            {isEditing ? (
              <>
                <button onClick={() => onUpdate(transcription.id, editedSegments)} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700">SAVE</button>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-700 text-white text-sm font-bold rounded-lg">CANCEL</button>
              </>
            ) : (
              <button onClick={handleEditToggle} className="flex items-center px-4 py-2 bg-gray-700 text-white text-sm font-bold rounded-lg hover:bg-gray-600 transition-all">
                <EditIcon className="w-4 h-4 me-2"/> EDIT
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;
