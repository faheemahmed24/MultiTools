
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
            <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-purple-600' : 'bg-gray-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-full' : ''}`}></div>
        </div>
        <div className="ms-3 text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">{label}</div>
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
              new docx.TextRun({ text: `[${s.startTime}] `, bold: true, color: "8b5cf6" }),
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
    <div className="flex flex-col h-full bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between p-6 border-b border-gray-700/50 bg-gray-800/50">
        <div className="flex items-center gap-4">
             <button onClick={onClose} className="p-2.5 hover:bg-gray-700/50 rounded-xl text-gray-400 hover:text-white transition-all transform hover:-translate-x-1">
                <ArrowLeftIcon className="w-5 h-5" />
             </button>
             <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">{t.transcription}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em]">{transcription.detectedLanguage} detected</p>
                </div>
             </div>
        </div>
        <div className="flex items-center gap-8">
          <Switch checked={showTimestamps} onChange={setShowTimestamps} label="Timestamps" />
          <Switch checked={showSpeaker} onChange={setShowSpeaker} label="Speakers" />
        </div>
      </div>

      {/* Main Viewport */}
      <div ref={containerRef} className="flex-grow p-8 overflow-y-auto custom-scrollbar">
        {isEditing ? (
          <div className="max-w-4xl mx-auto space-y-4">
            {editedSegments.map((seg, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-4 bg-gray-900/40 rounded-2xl border border-gray-700/30 focus-within:border-purple-500/50 transition-colors">
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest mb-1">
                    <span className="text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">{seg.startTime}</span>
                    <span className="text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded">{seg.speaker}</span>
                </div>
                <textarea 
                    value={seg.text} 
                    onChange={e => { const n = [...editedSegments]; n[idx].text = e.target.value; setEditedSegments(n); }} 
                    className="w-full bg-transparent border-0 rounded p-0 text-sm md:text-base text-gray-200 focus:ring-0 resize-none min-h-[60px]"
                    placeholder="Edit segment text..."
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {transcription.segments.map((seg, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-6 p-4 rounded-2xl transition-all hover:bg-gray-700/20 group">
                 {(showTimestamps || showSpeaker) && (
                    <div className="md:w-32 flex-shrink-0 flex flex-col text-[10px] font-black uppercase tracking-tighter pt-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        {showSpeaker && <span className="text-pink-500 truncate mb-1 bg-pink-500/10 self-start px-2 py-0.5 rounded">{seg.speaker}</span>}
                        {showTimestamps && <span className="text-purple-400 font-mono tracking-widest">{seg.startTime}</span>}
                    </div>
                 )}
                <div className="flex-grow">
                    <p className="text-gray-200 leading-relaxed text-sm lg:text-lg font-medium selection:bg-purple-500/30 selection:text-white">
                        {seg.text}
                    </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-6 border-t border-gray-700/50 bg-gray-800/80 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
           <button onClick={handleCopy} className="flex items-center px-5 py-2.5 bg-gray-700/50 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-700 transition-all transform active:scale-95">
            {isCopied ? <CheckIcon className="w-4 h-4 me-2 text-green-400"/> : <CopyIcon className="w-4 h-4 me-2" />}
            {isCopied ? 'COPIED' : 'COPY'}
          </button>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center px-5 py-2.5 bg-gray-700/50 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-700 transition-all transform active:scale-95">
              <DownloadIcon className="w-4 h-4 me-2" /> EXPORT
            </button>
            {showExportMenu && (
              <div onMouseLeave={() => setShowExportMenu(false)} className="absolute bottom-full mb-3 left-0 w-36 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl py-2 z-50 animate-pop-in">
                {['txt', 'json', 'srt', 'docx', 'pdf', 'csv'].map(f => (
                  <button key={f} onClick={() => handleExport(f as any)} className="w-full text-start px-5 py-2.5 text-[10px] font-black text-gray-400 hover:text-white hover:bg-purple-600 transition-colors uppercase tracking-widest">{f}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => { onUpdate(transcription.id, editedSegments); setIsEditing(false); }} className="px-6 py-2.5 bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-green-700 shadow-lg shadow-green-900/20 transition-all">SAVE CHANGES</button>
                <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-gray-700 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-650 transition-all">CANCEL</button>
              </>
            ) : (
              <button onClick={handleEditToggle} className="flex items-center px-6 py-2.5 bg-purple-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-900/20 transition-all transform hover:scale-105 active:scale-95">
                <EditIcon className="w-4 h-4 me-2"/> EDIT TEXT
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;
