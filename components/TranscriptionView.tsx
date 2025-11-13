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

interface TranscriptionViewProps {
  transcription: Transcription;
  onSave: () => void;
  onUpdate: (id: string, updatedSegments: TranscriptionSegment[]) => void;
  t: TranslationSet;
}

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

    // Avoid adding the same state twice, which can happen after undo/redo
    if (editHistory[currentHistoryIndex] && JSON.stringify(editHistory[currentHistoryIndex]) === JSON.stringify(debouncedEditedSegments)) {
        return;
    }
    
    // If we've undone, and then make a new edit, truncate the "future" history
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
      // Cancel editing
      setIsEditing(false);
      setEditHistory([]);
      setCurrentHistoryIndex(-1);
    } else {
      // Start editing
      const initialSegments = JSON.parse(JSON.stringify(transcription.segments)); // Deep copy
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

      const BG_COLOR = '#111827'; // bg-gray-900
      const TIMESTAMP_COLOR = '#A78BFA'; // purple-400
      const SPEAKER_COLOR = '#F472B6'; // pink-400
      const TEXT_COLOR = '#E5E7EB'; // gray-200

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;
      
      context.font = FONT;
      
      let totalHeight = PADDING * 2;
      const lines: {y: number, parts: {text: string, color: string}[]}[] = [];

      transcription.segments.forEach(segment => {
          let lineParts = [];
          if (showTimestamps) lineParts.push({ text: `[${segment.startTime} - ${segment.endTime}] `, color: TIMESTAMP_COLOR });
          if (showSpeaker) lineParts.push({ text: `${segment.speaker}: `, color: SPEAKER_COLOR });
          lineParts.push({ text: segment.text, color: TEXT_COLOR });

          const textToMeasure = lineParts.map(p => p.text).join('');
          const textWidth = context.measureText(textToMeasure).width;

          if (textWidth > CANVAS_WIDTH - PADDING * 2) {
              // Basic wrapping for long lines
              const words = segment.text.split(' ');
              let currentLine = (showTimestamps ? `[${segment.startTime} - ${segment.endTime}] ` : '') + (showSpeaker ? `${segment.speaker}: ` : '');
              
              for (const word of words) {
                  const testLine = currentLine + word + ' ';
                  if (context.measureText(testLine).width > CANVAS_WIDTH - PADDING * 2 && currentLine.length > 0) {
                      // Fix: The argument to lines.push should be an object, not an array containing an object.
                      lines.push({y: totalHeight + FONT_SIZE, parts: [{text: currentLine.trim(), color: TEXT_COLOR}] });
                      totalHeight += LINE_HEIGHT;
                      currentLine = '  ' + word + ' '; // Indent wrapped line
                  } else {
                      currentLine = testLine;
                  }
              }
              // Fix: The argument to lines.push should be an object, not an array containing an object.
              lines.push({y: totalHeight + FONT_SIZE, parts: [{text: currentLine.trim(), color: TEXT_COLOR}]});
          } else {
              // Fix: The argument to lines.push should be an object, not an array containing an object.
              lines.push({y: totalHeight + FONT_SIZE, parts: lineParts });
          }
          totalHeight += LINE_HEIGHT;
      });

      canvas.width = CANVAS_WIDTH;
      canvas.height = totalHeight;
      context.fillStyle = BG_COLOR;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = FONT;
      
      lines.flat().forEach(line => {
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
    if (format === 'txt') {
      createDownload(`${baseFilename}.txt`, fullText, 'text/plain;charset=utf-8');
    } else if (format === 'json') {
      createDownload(`${baseFilename}.json`, JSON.stringify(transcription, null, 2), 'application/json;charset=utf-8');
    } else if (format === 'srt') {
      const toSrtTime = (time: string) => time.replace('.', ',');
      const srtContent = transcription.segments.map((seg, i) => 
        `${i + 1}\n${toSrtTime(seg.startTime)} --> ${toSrtTime(seg.endTime)}\n${seg.text}`
      ).join('\n\n');
      createDownload(`${baseFilename}.srt`, srtContent, 'application/x-subrip;charset=utf-8');
    // Fix: Changed 'jpeg' to 'jpg' to match the type of format, and pass 'jpeg' to the canvas function.
    } else if (format === 'png' || format === 'jpg') {
        const dataUrl = renderTranscriptionToCanvas(format === 'jpg' ? 'jpeg' : 'png');
        if (dataUrl) {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `${baseFilename}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setShowExportMenu(false);
        }
    } else if (format === 'csv') {
        const header = "startTime,endTime,speaker,text\n";
        const rows = transcription.segments.map(s => `"${s.startTime}","${s.endTime}","${s.speaker}","${s.text.replace(/"/g, '""')}"`).join('\n');
        createDownload(`${baseFilename}.csv`, header + rows, 'text/csv;charset=utf-8');
    } else if (format === 'docx') {
        const paragraphs = transcription.segments.map(seg => {
            const parts = [];
            // Fix: Corrected variable name from 'segment' to 'seg'.
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
            if (y > 280) {
                doc.addPage();
                y = 10;
            }
            // Fix: Corrected variable name from 'segment' to 'seg'.
            const line = (showTimestamps ? `[${seg.startTime} - ${seg.endTime}] ` : '') + (showSpeaker ? `${seg.speaker}: ` : '') + seg.text;
            const splitLines = doc.splitTextToSize(line, 180);
            doc.text(splitLines, 10, y);
            y += splitLines.length * 7;
        });
        createDownload(`${baseFilename}.pdf`, doc.output('blob'));
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
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
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
                  {showSpeaker && <strong className="text-pink-400 me-2">{segment.speaker}:</strong>}
                  {segment.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="text-end text-sm text-gray-400 mb-2 px-1">
        {characterCount} characters
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
              <div className="absolute bottom-full mb-2 w-48 bg-gray-600 rounded-lg shadow-xl py-1 z-10" onMouseLeave={() => setShowExportMenu(false)}>
                <button onClick={() => handleExport('txt')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">TXT (.txt)</button>
                <button onClick={() => handleExport('json')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">JSON (.json)</button>
                <button onClick={() => handleExport('srt')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">SRT (.srt)</button>
                <button onClick={() => handleExport('csv')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">CSV (.csv)</button>
                 <div className="h-px bg-gray-500 my-1"></div>
                <button onClick={() => handleExport('pdf')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">PDF (.pdf)</button>
                <button onClick={() => handleExport('docx')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">DOCX (.docx)</button>
                 <div className="h-px bg-gray-500 my-1"></div>
                <button onClick={() => handleExport('png')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">PNG (.png)</button>
                <button onClick={() => handleExport('jpg')} className="block w-full text-start px-4 py-2 text-sm text-gray-200 hover:bg-purple-600">JPG (.jpeg)</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
            {isEditing && (
              <>
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title={t.undo}
                  className="flex items-center p-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <UndoIcon className="w-5 h-5"/>
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title={t.redo}
                  className="flex items-center p-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RedoIcon className="w-5 h-5"/>
                </button>
                <div className="w-px bg-gray-600 mx-1"></div>
                <button
                  onClick={handleSaveChanges}
                  className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <SaveIcon className="w-5 h-5 me-2"/> {t.saveChanges}
                </button>
              </>
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