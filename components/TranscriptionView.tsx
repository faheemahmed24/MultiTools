import React, { useState, useMemo, useEffect } from 'react';
import type { Transcription, TranslationSet, TranscriptionSegment } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { EditIcon } from './icons/EditIcon';
import { SaveIcon } from './icons/SaveIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { useDebounce } from '../hooks/useDebounce';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';
import { TxtIcon } from './icons/TxtIcon';
import { JsonIcon } from './icons/JsonIcon';
import { SrtIcon } from './icons/SrtIcon';
import { CsvIcon } from './icons/CsvIcon';
import { PdfIcon } from './icons/PdfIcon';
import { DocxIcon } from './icons/DocxIcon';
import { PngIcon } from './icons/PngIcon';
import { JpgIcon } from './icons/JpgIcon';

interface TranscriptionViewProps {
  transcription: Transcription;
  onSave: () => void;
  onUpdate: (id: string, updatedSegments: TranscriptionSegment[]) => void;
  t: TranslationSet;
}

const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-full bg-purple-400' : ''}`}></div>
        </div>
        <div className="ms-3 text-sm font-medium text-gray-300">{label}</div>
    </label>
);

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ transcription, onSave, onUpdate, t }) => {
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showSpeaker, setShowSpeaker] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSegments, setEditedSegments] = useState<TranscriptionSegment[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // State for undo/redo
  const [editHistory, setEditHistory] = useState<TranscriptionSegment[][]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const debouncedEditedSegments = useDebounce(editedSegments, 500);

  useEffect(() => {
    // Reset state when a new transcription is loaded
    setIsSaved(false);
    setIsEditing(false);
    setShowExportMenu(false);
    setEditHistory([]);
    setCurrentHistoryIndex(-1);
  }, [transcription.id]);

  // Effect to update history on debounced changes
  useEffect(() => {
    if (!isEditing || !debouncedEditedSegments.length) return;

    if (editHistory[currentHistoryIndex] && JSON.stringify(editHistory[currentHistoryIndex]) === JSON.stringify(debouncedEditedSegments)) {
        return;
    }
    
    const newHistory = editHistory.slice(0, currentHistoryIndex + 1);
    setEditHistory([...newHistory, debouncedEditedSegments]);
    setCurrentHistoryIndex(newHistory.length);

  }, [debouncedEditedSegments, isEditing]);


  const fullText = useMemo(() => {
    return transcription.segments
      .map(segment => {
        const timestamp = showTimestamps ? `[${segment.startTime} - ${segment.endTime}]` : '';
        const speaker = showSpeaker ? `${segment.speaker}:` : '';
        return [timestamp, speaker, segment.text].filter(Boolean).join(' ').trim();
      })
      .join('\n');
  }, [transcription.segments, showTimestamps, showSpeaker]);

  const characterCount = useMemo(() => {
    const segmentsToCount = isEditing ? editedSegments : transcription.segments;
    return segmentsToCount.reduce((acc, segment) => acc + segment.text.length, 0);
  }, [isEditing, editedSegments, transcription.segments]);

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
      setIsEditing(false);
      setEditHistory([]);
      setCurrentHistoryIndex(-1);
    } else {
      const initialSegments = JSON.parse(JSON.stringify(transcription.segments));
      setEditedSegments(initialSegments);
      setEditHistory([initialSegments]);
      setCurrentHistoryIndex(0);
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
    setEditHistory([]);
    setCurrentHistoryIndex(-1);
  };
  
  const canUndo = isEditing && currentHistoryIndex > 0;
  const canRedo = isEditing && currentHistoryIndex < editHistory.length - 1;

  const handleUndo = () => {
    if (canUndo) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      setEditedSegments(editHistory[newIndex]);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      setEditedSegments(editHistory[newIndex]);
    }
  };

  const createDownload = (filename: string, content: string | Blob, mime?: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
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
  
  const renderTranscriptionToCanvas = (format: 'png' | 'jpeg') => {
      const PADDING = 25;
      const LINE_HEIGHT = 28;
      const FONT_SIZE = 16;
      const FONT = `${FONT_SIZE}px monospace`;
      const CANVAS_WIDTH = 1200;

      const BG_COLOR = '#1f2937';
      const TIMESTAMP_COLOR = '#A78BFA';
      const SPEAKER_COLOR = '#F472B6';
      const TEXT_COLOR = '#E5E7EB';

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;
      
      context.font = FONT;
      
      let totalHeight = PADDING;
      const lines: {y: number, parts: {text: string, color: string}[]}[] = [];

      transcription.segments.forEach(segment => {
          const prefixParts: {text: string, color: string}[] = [];
          if (showTimestamps) prefixParts.push({ text: `[${segment.startTime} - ${segment.endTime}] `, color: TIMESTAMP_COLOR });
          if (showSpeaker) prefixParts.push({ text: `${segment.speaker}: `, color: SPEAKER_COLOR });
          
          const prefixWidth = prefixParts.reduce((acc, part) => acc + context.measureText(part.text).width, 0);
          const availableWidth = CANVAS_WIDTH - PADDING * 2;
          
          const words = segment.text.split(' ');
          let currentLineText = '';
          const textLines: string[] = [];
          
          words.forEach((word) => {
              const testLine = currentLineText + word + ' ';
              const widthLimit = textLines.length === 0 ? availableWidth - prefixWidth : availableWidth;
              const testWidth = context.measureText(testLine).width;

              if (testWidth > widthLimit && currentLineText) {
                  textLines.push(currentLineText.trim());
                  currentLineText = word + ' ';
              } else {
                  currentLineText = testLine;
              }
          });
          if (currentLineText.trim()) {
              textLines.push(currentLineText.trim());
          }

          if(textLines.length === 0) textLines.push('');

          textLines.forEach((lineText, index) => {
              totalHeight += LINE_HEIGHT;
              if (index === 0) {
                  lines.push({ y: totalHeight, parts: [...prefixParts, { text: lineText, color: TEXT_COLOR }] });
              } else {
                  lines.push({ y: totalHeight, parts: [{ text: '    ' + lineText, color: TEXT_COLOR }] });
              }
          });
      });
      
      totalHeight += PADDING;

      canvas.width = CANVAS_WIDTH;
      canvas.height = totalHeight;
      context.fillStyle = BG_COLOR;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = FONT;
      
      lines.forEach(line => {
          let currentX = PADDING;
          line.parts.forEach(part => {
              context.fillStyle = part.color;
              context.fillText(part.text, currentX, line.y);
              currentX += context.measureText(part.text).width;
          });
      });
      
      return canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : undefined);
  }

  const handleExport = async (format: 'txt' | 'json' | 'srt' | 'png' | 'jpg' | 'docx' | 'pdf' | 'csv') => {
    const baseFilename = transcription.fileName.split('.').slice(0, -1).join('.') || transcription.fileName;
    if (format === 'txt') createDownload(`${baseFilename}.txt`, fullText, 'text/plain;charset=utf-8');
    else if (format === 'json') createDownload(`${baseFilename}.json`, JSON.stringify(transcription, null, 2), 'application/json;charset=utf-8');
    else if (format === 'srt') {
      const toSrtTime = (time: string) => time.replace('.', ',');
      const srtContent = transcription.segments.map((seg, i) => `${i + 1}\n${toSrtTime(seg.startTime)} --> ${toSrtTime(seg.endTime)}\n${seg.text}`).join('\n\n');
      createDownload(`${baseFilename}.srt`, srtContent, 'application/x-subrip;charset=utf-8');
    } else if (format === 'png' || format === 'jpg') {
        const dataUrl = renderTranscriptionToCanvas(format === 'jpg' ? 'jpeg' : 'png');
        if (dataUrl) {
            const a = document.createElement('a'); a.href = dataUrl; a.download = `${baseFilename}.${format}`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); setShowExportMenu(false);
        }
    } else if (format === 'csv') {
        const header = "startTime,endTime,speaker,text\n";
        const rows = transcription.segments.map(s => `"${s.startTime}","${s.endTime}","${s.speaker}","${s.text.replace(/"/g, '""')}"`).join('\n');
        createDownload(`${baseFilename}.csv`, header + rows, 'text/csv;charset=utf-8');
    } else if (format === 'docx') {
        const paragraphs = transcription.segments.map(seg => {
            const parts = [];
            if (showTimestamps) parts.push(new docx.TextRun({ text: `[${seg.startTime} - ${seg.endTime}] `, color: "A78BFA" }));
            if (showSpeaker) parts.push(new docx.TextRun({ text: `${seg.speaker}: `, bold: true, color: "F472B6"}));
            parts.push(new docx.TextRun(seg.text));
            return new docx.Paragraph({ children: parts });
        });
        const doc = new docx.Document({ sections: [{ children: paragraphs }] });
        const blob = await docx.Packer.toBlob(doc);
        createDownload(`${baseFilename}.docx`, blob);
    } else if (format === 'pdf') {
        const doc = new jsPDF();
        let y = 10;
        transcription.segments.forEach(seg => {
            if (y > 280) { doc.addPage(); y = 10; }
            const line = (showTimestamps ? `[${seg.startTime} - ${seg.endTime}] ` : '') + (showSpeaker ? `${seg.speaker}: ` : '') + seg.text;
            const splitLines = doc.splitTextToSize(line, 180);
            doc.text(splitLines, 10, y);
            y += splitLines.length * 7;
        });
        createDownload(`${baseFilename}.pdf`, doc.output('blob'));
    }
  };

  const exportOptions = [
    { format: 'txt', icon: TxtIcon }, { format: 'json', icon: JsonIcon }, 
    { format: 'srt', icon: SrtIcon }, { format: 'csv', icon: CsvIcon },
    { format: 'pdf', icon: PdfIcon, separator: true }, { format: 'docx', icon: DocxIcon },
    { format: 'png', icon: PngIcon, separator: true }, { format: 'jpg', icon: JpgIcon }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-start justify-between mb-4 gap-4">
        <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-200">{t.transcription}</h2>
            <p className="text-sm text-gray-400 truncate max-w-xs" title={transcription.fileName}>{transcription.fileName}</p>
            <p className="text-xs text-purple-400 mt-1">{t.detectedLanguage}: <span className="font-semibold">{transcription.detectedLanguage}</span></p>
        </div>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <Switch checked={showTimestamps} onChange={setShowTimestamps} label={showTimestamps ? t.hideTimestamps : t.showTimestamps} />
          <Switch checked={showSpeaker} onChange={setShowSpeaker} label={showSpeaker ? t.hideSpeaker : t.showSpeaker} />
        </div>
      </div>

      <div className="flex-grow bg-gray-900/50 rounded-lg p-4 overflow-y-auto mb-4 min-h-[200px]">
        <div className="text-gray-200 whitespace-pre-wrap leading-relaxed font-mono text-sm">
          {isEditing ? (
            editedSegments.map((segment, index) => (
              <div key={index} className="mb-2 flex items-start gap-3">
                {showTimestamps && <span className="text-purple-400 whitespace-nowrap pt-1">[{segment.startTime}]</span>}
                {showSpeaker && <strong className="text-pink-400 whitespace-nowrap pt-1">{segment.speaker}:</strong>}
                <textarea
                  value={segment.text}
                  onChange={(e) => handleSegmentChange(index, e.target.value)}
                  className="w-full bg-gray-700/80 text-gray-200 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-y"
                  rows={Math.max(1, segment.text.split('\n').length)}
                />
              </div>
            ))
          ) : (
            transcription.segments.map((segment, index) => (
              <div key={index} className="mb-2 flex flex-row flex-wrap">
                {showTimestamps && <span className="text-purple-400 me-3">[{segment.startTime} - {segment.endTime}]</span>}
                <p className="flex-1 min-w-[200px]">
                  {showSpeaker && <strong className="text-pink-400 me-2">{segment.speaker}:</strong>}
                  {segment.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="text-end text-sm text-gray-400 mb-4 px-1">
        {characterCount} characters
      </div>

      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
           <button onClick={handleCopy} className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200">
            {isCopied ? <CheckIcon className="w-5 h-5 me-2"/> : <CopyIcon className="w-5 h-5 me-2" />}
            {isCopied ? t.copied : t.copy}
          </button>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200">
              <DownloadIcon className="w-5 h-5 me-2" />
              {t.export}
            </button>
            {showExportMenu && (
              <div className="absolute bottom-full mb-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-xl py-1 z-10" onMouseLeave={() => setShowExportMenu(false)}>
                {exportOptions.map(({ format, icon: Icon, separator }) => (
                  <React.Fragment key={format}>
                    {separator && <div className="h-px bg-gray-600 my-1"></div>}
                    <button onClick={() => handleExport(format as any)} className="flex items-center gap-3 w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600 rounded-md mx-1 w-[calc(100%-0.5rem)]">
                      <Icon className="w-5 h-5 text-gray-400" /> {format.toUpperCase()}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
            {isEditing && (
              <>
                <button onClick={handleUndo} disabled={!canUndo} title={t.undo} className="flex items-center p-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><UndoIcon className="w-5 h-5"/></button>
                <button onClick={handleRedo} disabled={!canRedo} title={t.redo} className="flex items-center p-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><RedoIcon className="w-5 h-5"/></button>
                <div className="w-px bg-gray-600 mx-1"></div>
                <button onClick={handleSaveChanges} className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"><SaveIcon className="w-5 h-5 me-2"/> {t.saveChanges}</button>
              </>
            )}
            <button onClick={handleEditToggle} className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200">
              <EditIcon className="w-5 h-5 me-2"/> {isEditing ? t.cancel : t.edit}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;