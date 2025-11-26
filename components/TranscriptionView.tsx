import React, { useState, useEffect } from 'react';
import type { Transcription, TranslationSet, TranscriptionSegment } from '../types';
import { summarizeTranscription, analyzeSentiment } from '../services/geminiService';
import { SkeletonLoader } from './Loader';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';

interface TranscriptionViewProps {
  transcription: Transcription;
  onSave: () => void;
  onUpdate: (id: string, updatedSegments: TranscriptionSegment[], summary?: string, sentiment?: string) => void;
  t: TranslationSet;
}

const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer select-none">
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const [summary, setSummary] = useState(transcription.summary || '');
  const [sentiment, setSentiment] = useState(transcription.sentiment || '');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);

  useEffect(() => {
    setEditedSegments(transcription.segments || []);
    setSummary(transcription.summary || '');
    setSentiment(transcription.sentiment || '');
  }, [transcription]);

  const handleSegmentChange = (index: number, field: keyof TranscriptionSegment, value: string) => {
    const newSegments = [...editedSegments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setEditedSegments(newSegments);
  };

  const handleSaveChanges = () => {
    onUpdate(transcription.id, editedSegments, summary, sentiment);
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    onSave();
  };

  const handleCopy = () => {
    const text = editedSegments.map(s => {
        const time = showTimestamps ? `[${s.startTime}] ` : '';
        const speaker = showSpeaker ? `${s.speaker}: ` : '';
        return `${time}${speaker}${s.text}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerateSummary = async () => {
      if (summary) return;
      setIsSummarizing(true);
      try {
          const fullText = transcription.segments.map(s => s.text).join(' ');
          const result = await summarizeTranscription(fullText);
          setSummary(result);
          onUpdate(transcription.id, editedSegments, result, sentiment);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSummarizing(false);
      }
  };

  const handleAnalyzeSentiment = async () => {
      if (sentiment) return;
      setIsAnalyzingSentiment(true);
      try {
          const fullText = transcription.segments.map(s => s.text).join(' ');
          const result = await analyzeSentiment(fullText);
          setSentiment(result);
          onUpdate(transcription.id, editedSegments, summary, result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsAnalyzingSentiment(false);
      }
  };

  const handleExport = async (format: 'txt' | 'json' | 'srt' | 'csv' | 'pdf' | 'docx') => {
      const filename = (transcription.fileName || 'transcription').split('.')[0];
      let content = '';
      let mimeType = 'text/plain';
      let blob: Blob | null = null;

      switch (format) {
          case 'txt':
              content = editedSegments.map(s => {
                  const time = showTimestamps ? `[${s.startTime}] ` : '';
                  const speaker = showSpeaker ? `${s.speaker}: ` : '';
                  return `${time}${speaker}${s.text}`;
              }).join('\n');
              blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
              break;
          case 'json':
              content = JSON.stringify(transcription, null, 2);
              mimeType = 'application/json';
              blob = new Blob([content], { type: mimeType });
              break;
          case 'srt':
             content = editedSegments.map((s, i) => {
                 return `${i + 1}\n${s.startTime.replace('.', ',')} --> ${s.endTime.replace('.', ',')}\n${s.speaker ? s.speaker + ': ' : ''}${s.text}\n`;
             }).join('\n');
             blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
             break;
          case 'csv':
              content = 'Start Time,End Time,Speaker,Text\n' + editedSegments.map(s => `"${s.startTime}","${s.endTime}","${s.speaker}","${s.text.replace(/"/g, '""')}"`).join('\n');
              mimeType = 'text/csv';
              blob = new Blob([content], { type: mimeType });
              break;
          case 'pdf': {
               const doc = new jsPDF();
               let y = 10;
               editedSegments.forEach(s => {
                   if (y > 280) { doc.addPage(); y = 10; }
                   const line = `${showTimestamps ? `[${s.startTime}] ` : ''}${showSpeaker ? `${s.speaker}: ` : ''}${s.text}`;
                   const splitText = doc.splitTextToSize(line, 190);
                   doc.text(splitText, 10, y);
                   y += (splitText.length * 7) + 5;
               });
               blob = doc.output('blob');
               break;
          }
          case 'docx': {
              const paragraphs = editedSegments.map(s => {
                  return new docx.Paragraph({
                      children: [
                          new docx.TextRun({ text: showTimestamps ? `[${s.startTime}] ` : '', bold: true, color: "888888" }),
                          new docx.TextRun({ text: showSpeaker ? `${s.speaker}: ` : '', bold: true }),
                          new docx.TextRun({ text: s.text }),
                      ],
                      spacing: { after: 200 }
                  });
              });
              const doc = new docx.Document({ sections: [{ children: paragraphs }] });
              blob = await docx.Packer.toBlob(doc);
              break;
          }
      }

      if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      }
      setShowExportMenu(false);
  };

  const filteredSegments = editedSegments.filter(s => 
      s.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.speaker && s.speaker.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700/50">
        <div className="p-4 border-b border-gray-700/50 bg-gray-800/30 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
                <Switch checked={showTimestamps} onChange={setShowTimestamps} label={t.showTimestamps} />
                <Switch checked={showSpeaker} onChange={setShowSpeaker} label={t.showSpeaker} />
            </div>
            
            <div className="flex items-center gap-2">
                 <div className="relative">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchTranscription}
                        className="bg-gray-700 text-gray-200 text-sm rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-purple-500 border-none w-48"
                    />
                    <i className="fas fa-search w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
                
                {isEditing ? (
                    <button onClick={handleSaveChanges} className="p-2 bg-green-600 rounded-lg hover:bg-green-700 text-white" title={t.save}>
                        <i className="fas fa-save w-5 h-5" />
                    </button>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-white" title={t.edit}>
                        <i className="fas fa-edit w-5 h-5" />
                    </button>
                )}

                <button onClick={handleCopy} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-white" title={t.copy}>
                    {isCopied ? <i className="fas fa-check w-5 h-5 text-green-400" /> : <i className="fas fa-copy w-5 h-5" />}
                </button>
                
                <div className="relative">
                    <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-white" title={t.export}>
                        <i className="fas fa-download w-5 h-5" />
                    </button>
                    {showExportMenu && (
                        <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-10" onMouseLeave={() => setShowExportMenu(false)}>
                            <button onClick={() => handleExport('txt')} className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-purple-600 hover:text-white"><i className="fas fa-file-alt w-4 h-4 mr-2" /> TXT</button>
                            <button onClick={() => handleExport('json')} className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-purple-600 hover:text-white"><i className="fas fa-file-code w-4 h-4 mr-2" /> JSON</button>
                            <button onClick={() => handleExport('srt')} className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-purple-600 hover:text-white"><i className="fas fa-closed-captioning w-4 h-4 mr-2" /> SRT</button>
                            <button onClick={() => handleExport('csv')} className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-purple-600 hover:text-white"><i className="fas fa-file-csv w-4 h-4 mr-2" /> CSV</button>
                            <button onClick={() => handleExport('pdf')} className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-purple-600 hover:text-white"><i className="fas fa-file-pdf w-4 h-4 mr-2" /> PDF</button>
                            <button onClick={() => handleExport('docx')} className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-purple-600 hover:text-white"><i className="fas fa-file-word w-4 h-4 mr-2" /> DOCX</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <div className="p-4 border-b border-gray-700/50 bg-gray-800/20 flex gap-4">
             <div className="flex-1">
                 <div className="flex justify-between items-center mb-2">
                     <h4 className="text-sm font-semibold text-gray-300">{t.summary}</h4>
                     <button 
                        onClick={handleGenerateSummary} 
                        disabled={isSummarizing || !!summary}
                        className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded hover:bg-purple-600/40 disabled:opacity-50"
                     >
                        {isSummarizing ? t.summarizing : (summary ? 'Regenerate' : t.summarize)}
                     </button>
                 </div>
                 <div className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded min-h-[40px] max-h-[100px] overflow-y-auto">
                     {isSummarizing ? <SkeletonLoader lines={2} /> : (summary || "Click summarize to generate AI summary.")}
                 </div>
             </div>
             <div className="flex-1">
                 <div className="flex justify-between items-center mb-2">
                     <h4 className="text-sm font-semibold text-gray-300">{t.sentimentAnalysis}</h4>
                     <button 
                        onClick={handleAnalyzeSentiment} 
                        disabled={isAnalyzingSentiment || !!sentiment}
                        className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded hover:bg-purple-600/40 disabled:opacity-50"
                     >
                        {isAnalyzingSentiment ? t.analyzingSentiment : (sentiment ? 'Regenerate' : t.analyze)}
                     </button>
                 </div>
                 <div className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded min-h-[40px]">
                     {isAnalyzingSentiment ? <SkeletonLoader lines={1} /> : (sentiment || "Click analyze to get sentiment.")}
                 </div>
             </div>
        </div>

        <div className="overflow-y-auto flex-grow p-4 space-y-4">
            {filteredSegments.length > 0 ? filteredSegments.map((segment, index) => (
                <div key={index} className="flex gap-4 group">
                    {showTimestamps && (
                        <div className="text-xs text-gray-500 font-mono pt-1 w-20 flex-shrink-0 select-none">
                            {segment.startTime}
                        </div>
                    )}
                    <div className="flex-grow">
                        {showSpeaker && (
                            <div className="text-xs font-bold text-purple-400 mb-0.5 select-none">{segment.speaker}</div>
                        )}
                        {isEditing ? (
                            <textarea 
                                className="w-full bg-gray-800 text-gray-200 text-sm p-2 rounded border border-gray-600 focus:ring-1 focus:ring-purple-500"
                                value={segment.text}
                                onChange={(e) => handleSegmentChange(index, 'text', e.target.value)}
                                rows={Math.max(2, Math.ceil(segment.text.length / 80))}
                            />
                        ) : (
                            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{segment.text}</p>
                        )}
                    </div>
                </div>
            )) : (
                <div className="text-center text-gray-500 py-10">
                    No segments found matching your search.
                </div>
            )}
        </div>
    </div>
  );
};

export default TranscriptionView;