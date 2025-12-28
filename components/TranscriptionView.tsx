import React, { useState } from 'react';
import type { Transcription, TranscriptionSegment } from '../types';

interface TranscriptionViewProps {
  transcription: Transcription;
  onSave: (transcription: Transcription) => void;
  onUpdate: (id: string, segments: TranscriptionSegment[]) => void;
  onClose: () => void;
  t: any;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ transcription, onUpdate, onClose, t }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempText, setTempText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleEdit = (index: number, text: string) => {
    setEditingId(index);
    setTempText(text);
  };

  const handleSaveSegment = (index: number) => {
    const newSegments = [...transcription.segments];
    newSegments[index] = { ...newSegments[index], text: tempText };
    onUpdate(transcription.id, newSegments);
    setEditingId(null);
  };

  const downloadFile = (content: string, type: string, extension: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcription.fileName.replace(/\.[^/.]+$/, "")}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportTxt = () => {
    const content = transcription.segments
      .map(s => `[${s.startTime} - ${s.endTime}] ${s.speaker}: ${s.text}`)
      .join('\n');
    downloadFile(content, 'text/plain', 'txt');
  };

  const exportJson = () => {
    downloadFile(JSON.stringify(transcription, null, 2), 'application/json', 'json');
  };

  const exportMarkdown = () => {
    const header = `# ${transcription.fileName}\n\n` +
      `**Date:** ${transcription.date}\n` +
      `**Language:** ${transcription.detectedLanguage}\n\n` +
      `---\n\n`;
    
    const body = transcription.segments
      .map(s => `### ${s.speaker} (${s.startTime} - ${s.endTime})\n\n${s.text}`)
      .join('\n\n');
      
    downloadFile(header + body, 'text/markdown', 'md');
  };

  const filteredSegments = transcription.segments
    .map((segment, index) => ({ ...segment, originalIndex: index }))
    .filter(s => 
      s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.speaker.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900/50">
        <div className="overflow-hidden">
            <h2 className="text-lg font-bold text-white truncate" title={transcription.fileName}>{transcription.fileName}</h2>
            <p className="text-sm text-gray-400">{transcription.date} • {transcription.detectedLanguage}</p>
        </div>
        <div className="flex-grow max-w-md w-full sm:px-4">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcript..."
                className="w-full bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2 placeholder-gray-500"
            />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex bg-gray-700 rounded-lg p-1">
                <button 
                    onClick={exportTxt} 
                    className="px-3 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    title="Export as Text"
                >
                    TXT
                </button>
                <div className="w-px bg-gray-600 my-1"></div>
                <button 
                    onClick={exportJson} 
                    className="px-3 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    title="Export as JSON"
                >
                    JSON
                </button>
                <div className="w-px bg-gray-600 my-1"></div>
                <button 
                    onClick={exportMarkdown} 
                    className="px-3 py-1 text-xs font-medium text-purple-300 hover:text-purple-100 hover:bg-gray-600 rounded transition-colors"
                    title="Export as Markdown"
                >
                    MD
                </button>
            </div>
            <button 
                onClick={onClose} 
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Close"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {filteredSegments.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">{transcription.segments.length === 0 ? "No segments found." : "No matching segments found."}</div>
        ) : (
            filteredSegments.map((segment) => (
                <div key={segment.originalIndex} className="group relative pl-4 border-l-2 border-gray-700 hover:border-purple-500 transition-colors">
                    <div className="flex items-baseline justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-purple-400 font-bold text-sm">{segment.speaker}</span>
                            <span className="text-gray-500 text-xs font-mono">[{segment.startTime} - {segment.endTime}]</span>
                        </div>
                    </div>
                    
                    {editingId === segment.originalIndex ? (
                        <div className="mt-2 space-y-2 animate-fadeIn">
                            <textarea 
                                value={tempText}
                                onChange={(e) => setTempText(e.target.value)}
                                className="w-full bg-gray-900 text-white p-3 rounded-lg border border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none resize-y min-h-[100px]"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => setEditingId(null)} 
                                    className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleSaveSegment(segment.originalIndex)} 
                                    className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 rounded transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p 
                            onClick={() => handleEdit(segment.originalIndex, segment.text)}
                            className="text-gray-300 leading-relaxed hover:text-white cursor-text whitespace-pre-wrap"
                            title="Click to edit"
                        >
                            {segment.text}
                        </p>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default TranscriptionView;