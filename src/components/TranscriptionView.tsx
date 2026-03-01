import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Transcription, TranslationSet, TranscriptionSegment } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { EditIcon } from './icons/EditIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';

interface TranscriptionViewProps {
  transcription: Transcription;
  onSave: () => void;
  onUpdate: (id: string, updatedSegments: TranscriptionSegment[]) => void;
  onClose: () => void;
  t: TranslationSet;
}

const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer group">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-9 h-5 rounded-full transition-colors ${checked ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
            <div className={`dot absolute left-0.5 top-0.5 bg-white dark:bg-zinc-900 w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`}></div>
        </div>
        <div className="ms-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[var(--text-primary)] transition-colors">{label}</div>
    </label>
);

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ transcription, onUpdate, onClose, t }) => {
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showSpeaker, setShowSpeaker] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSegments, setEditedSegments] = useState<TranscriptionSegment[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsEditing(false);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [transcription.id]);

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
      setEditedSegments(JSON.parse(JSON.stringify(transcription.segments)));
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
      const paragraphs = transcription.segments.map(s => new docx.Paragraph({ 
          children: [
              new docx.TextRun({ text: `[${s.startTime}] `, bold: true, color: "09090b" }),
              new docx.TextRun({ text: `${s.speaker}: `, bold: true }), 
              new docx.TextRun(s.text)
          ], 
          spacing: { after: 200 } 
      }));
      const blob = await docx.Packer.toBlob(new docx.Document({ sections: [{ children: paragraphs }] }));
      download(`${base}.docx`, blob);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(10);
      let y = 15;
      transcription.segments.forEach(s => {
          const line = `[${s.startTime}] ${s.speaker}: ${s.text}`;
          const split = doc.splitTextToSize(line, 180);
          if (y + split.length * 5 > 280) { doc.addPage(); y = 15; }
          doc.text(split, 15, y); 
          y += split.length * 5 + 2;
      });
      download(`${base}.pdf`, doc.output('blob'));
    }
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border border-[var(--border-app)] rounded-lg shadow-elevation-1 overflow-hidden animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-[var(--border-app)] bg-zinc-50 dark:bg-zinc-900/50 gap-4">
        <div className="flex items-center gap-4">
             <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-[var(--text-primary)] transition-all">
                <ArrowLeftIcon className="w-4 h-4" />
             </button>
             <div>
                <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">{t.transcription}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100"></span>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{transcription.detectedLanguage} detected</p>
                </div>
             </div>
        </div>
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <Switch checked={showTimestamps} onChange={setShowTimestamps} label="Timestamps" />
          <Switch checked={showSpeaker} onChange={setShowSpeaker} label="Speakers" />
        </div>
      </div>

      {/* Main Viewport */}
      <div ref={containerRef} className="flex-grow p-5 md:p-10 overflow-y-auto custom-scrollbar">
        {isEditing ? (
          <div className="max-w-4xl mx-auto space-y-3">
            {editedSegments.map((seg, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-[var(--border-app)] focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
                <div className="flex gap-3 text-[9px] font-bold uppercase tracking-widest mb-1">
                    <span className="text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded">{seg.startTime}</span>
                    <span className="text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded">{seg.speaker}</span>
                </div>
                <textarea 
                    value={seg.text} 
                    onChange={e => { const n = [...editedSegments]; n[idx].text = e.target.value; setEditedSegments(n); }} 
                    className="w-full bg-transparent border-0 rounded p-0 text-sm text-[var(--text-primary)] focus:ring-0 resize-none min-h-[60px]"
                    placeholder="Edit segment text..."
                    dir="auto"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {transcription.segments.map((seg, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-4 md:gap-8 p-3 rounded-md transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 group">
                 {(showTimestamps || showSpeaker) && (
                    <div className="md:w-28 flex-shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-1 text-[9px] font-bold uppercase tracking-widest pt-0 md:pt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        {showSpeaker && <span className="text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded truncate max-w-full">{seg.speaker}</span>}
                        {showTimestamps && <span className="text-zinc-400 font-mono">{seg.startTime}</span>}
                    </div>
                 )}
                <div className="flex-grow">
                    <p className="text-[var(--text-primary)] leading-relaxed text-sm md:text-base font-medium selection:bg-zinc-900/10 dark:selection:bg-zinc-100/10" dir="auto">
                        {seg.text}
                    </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 md:p-6 border-t border-[var(--border-app)] bg-zinc-50 dark:bg-zinc-900/80 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
           <button onClick={handleCopy} className="flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[var(--border-app)] text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95">
            {isCopied ? <CheckIcon className="w-3.5 h-3.5 me-2 text-zinc-900 dark:text-zinc-100"/> : <CopyIcon className="w-3.5 h-3.5 me-2" />}
            {isCopied ? 'COPIED' : 'COPY'}
          </button>
          <div className="relative flex-1 sm:flex-none">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="w-full flex items-center justify-center px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[var(--border-app)] text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95">
              <DownloadIcon className="w-3.5 h-3.5 me-2" /> EXPORT
            </button>
            {showExportMenu && (
              <div onMouseLeave={() => setShowExportMenu(false)} className="absolute bottom-full mb-2 left-0 w-full sm:w-32 bg-white dark:bg-zinc-900 border border-[var(--border-app)] rounded-md shadow-elevation-2 py-1 z-50 animate-pop-in">
                {['txt', 'json', 'srt', 'docx', 'pdf', 'csv'].map(f => (
                  <button key={f} onClick={() => handleExport(f as any)} className="w-full text-start px-4 py-2 text-[10px] font-bold text-zinc-500 hover:text-[var(--text-primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors uppercase tracking-widest">{f}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            {isEditing ? (
              <>
                <button onClick={() => { onUpdate(transcription.id, editedSegments); setIsEditing(false); }} className="flex-1 sm:flex-none px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-zinc-800 dark:hover:bg-white transition-all">SAVE</button>
                <button onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none px-6 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-[var(--border-app)] text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">CANCEL</button>
              </>
            ) : (
              <button onClick={handleEditToggle} className="w-full flex items-center justify-center px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-zinc-800 dark:hover:bg-white transition-all active:scale-95">
                <EditIcon className="w-3.5 h-3.5 me-2"/> EDIT TEXT
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;