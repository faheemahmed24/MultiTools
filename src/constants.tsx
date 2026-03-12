import React from 'react';
import { ToolGroup, Tool } from './types';
import { 
  Mic, 
  Languages, 
  FileSpreadsheet, 
  SpellCheck, 
  FileText, 
  Zap, 
  Files, 
  Box, 
  LayoutGrid, 
  Palette, 
  FileImage, 
  Image, 
  MessageSquare, 
  PenSquare, 
  Sparkles 
} from 'lucide-react';

export const TOOL_STRUCTURE: ToolGroup[] = [
  {
    group: 'Intelligence',
    icon: Sparkles,
    items: [
      { key: 'AI Transcriber', label: 'AI Transcriber', description: 'Neural audio/video to text.', tags: ['speech', 'voice', 'mp3', 'mp4', 'text', 'transcribe'], icon: Mic, category: 'Intelligence', isCore: true },
      { key: 'PDF Copilot', label: 'PDF Copilot', description: 'Command-based PDF management.', tags: ['automate', 'commands', 'prompt', 'pdf'], icon: Zap, category: 'Intelligence', isCore: true },
      { key: 'Chat PDF', label: 'Chat PDF', description: 'Interactive document dialogue.', tags: ['qa', 'analyze', 'reading', 'pdf'], icon: MessageSquare, category: 'Intelligence', isCore: true },
      { key: 'AI PDF Editor', label: 'AI PDF Editor', description: 'Generative document refinement.', tags: ['edit', 'rewrite', 'style', 'text'], icon: PenSquare, category: 'Intelligence' },
    ]
  },
  {
    group: 'Business',
    icon: Box,
    items: [
      { key: 'AI Whiteboard', label: 'AI Whiteboard', description: 'Sketch to technical diagram.', tags: ['draw', 'diagram', 'visual', 'sketch', 'canvas'], icon: Palette, category: 'Business' },
      { key: 'Strategic Planner', label: 'Strategic Planner', description: 'Data-driven project roadmaps.', tags: ['strategy', 'report', 'business', 'pptx', 'plan'], icon: Box, category: 'Business', isCore: true },
      { key: 'Smart Summarizer', label: 'Smart Summarizer', description: 'Deep extraction of key metrics.', tags: ['summary', 'brief', 'extract', 'intelligence'], icon: FileText, category: 'Business' },
      { key: 'Pure Organizer', label: 'Pure Organizer', description: 'Grouping data without changes.', tags: ['structure', 'data', 'cleaning', 'verbatim'], icon: LayoutGrid, category: 'Business' },
    ]
  },
  {
    group: 'Media & Docs',
    icon: Files,
    items: [
      { key: 'PDF Manager', label: 'PDF Manager', description: 'PDF merging and manipulation.', tags: ['combine', 'split', 'pages', 'merge', 'pdf'], icon: Files, category: 'Media & Docs' },
      { key: 'AI Translator', label: 'AI Translator', description: 'Nuanced multilingual conversion.', tags: ['language', 'global', 'speak', 'translate'], icon: Languages, category: 'Media & Docs' },
      { key: 'Grammar Corrector', label: 'Grammar Corrector', description: 'AI-driven stylistic proofreading.', tags: ['proofread', 'english', 'grammar', 'spellcheck'], icon: SpellCheck, category: 'Media & Docs' },
      { key: 'PDF to Image', label: 'PDF to Image', description: 'Extract pages as JPG or PNG.', tags: ['png', 'jpg', 'extract', 'pdf'], icon: FileImage, category: 'Media & Docs' },
      { key: 'Image to PDF', label: 'Image to PDF', description: 'Assemble images into documents.', tags: ['convert', 'combine', 'photos', 'pdf'], icon: Image, category: 'Media & Docs' },
      { key: 'Export to Sheets', label: 'Export to Sheets', description: 'Unstructured text to CSV/Excel.', tags: ['csv', 'excel', 'data', 'sheets'], icon: FileSpreadsheet, category: 'Media & Docs' },
    ]
  }
];

export const ALL_TOOLS: Tool[] = TOOL_STRUCTURE.flatMap(group => group.items);
