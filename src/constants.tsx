import React from 'react';
import { ToolGroup, Tool } from './types';

// Icons
import { TranscriberIcon } from './components/icons/TranscriberIcon';
import { TranslatorIcon } from './components/icons/TranslatorIcon';
import { SheetIcon } from './components/icons/SheetIcon';
import { GrammarIcon } from './components/icons/GrammarIcon';
import { SummarizerIcon } from './components/icons/SummarizerIcon';
import { BoltIcon } from './components/icons/BoltIcon';
import { DocumentDuplicateIcon } from './components/icons/DocumentDuplicateIcon';
import { CubeIcon } from './components/icons/CubeIcon';
import { Squares2x2Icon } from './components/icons/Squares2x2Icon';
import { SwatchIcon } from './components/icons/SwatchIcon';
import { PdfToImageIcon } from './components/icons/PdfToImageIcon';
import { ImageToPdfIcon } from './components/icons/ImageToPdfIcon';
import { ChatBubbleLeftRightIcon } from './components/icons/ChatBubbleLeftRightIcon';
import { PencilSquareIcon } from './components/icons/PencilSquareIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';

export const TOOL_STRUCTURE: ToolGroup[] = [
  {
    group: 'Intelligence',
    icon: SparklesIcon,
    items: [
      { key: 'AI Transcriber', label: 'Universal Transcriber', description: 'Neural audio/video to text.', tags: ['speech', 'voice', 'mp3', 'mp4', 'text', 'transcribe'], icon: TranscriberIcon, category: 'Intelligence', isCore: true },
      { key: 'PDF Copilot', label: 'AI Copilot', description: 'Command-based PDF management.', tags: ['automate', 'commands', 'prompt', 'pdf'], icon: BoltIcon, category: 'Intelligence', isCore: true },
      { key: 'Chat PDF', label: 'Chat PDF', description: 'Interactive document dialogue.', tags: ['qa', 'analyze', 'reading', 'pdf'], icon: ChatBubbleLeftRightIcon, category: 'Intelligence', isCore: true },
      { key: 'AI PDF Editor', label: 'AI Text Editor', description: 'Generative document refinement.', tags: ['edit', 'rewrite', 'style', 'text'], icon: PencilSquareIcon, category: 'Intelligence' },
    ]
  },
  {
    group: 'Business',
    icon: CubeIcon,
    items: [
      { key: 'AI Whiteboard', label: 'Whiteboards', description: 'Sketch to technical diagram.', tags: ['draw', 'diagram', 'visual', 'sketch', 'canvas'], icon: SwatchIcon, category: 'Business' },
      { key: 'Strategic Planner', label: 'Plan Architect', description: 'Data-driven project roadmaps.', tags: ['strategy', 'report', 'business', 'pptx', 'plan'], icon: CubeIcon, category: 'Business', isCore: true },
      { key: 'Smart Summarizer', label: 'Auto Summarize', description: 'Deep extraction of key metrics.', tags: ['summary', 'brief', 'extract', 'intelligence'], icon: SummarizerIcon, category: 'Business' },
      { key: 'Pure Organizer', label: 'Verbatim Node', description: 'Grouping data without changes.', tags: ['structure', 'data', 'cleaning', 'verbatim'], icon: Squares2x2Icon, category: 'Business' },
    ]
  },
  {
    group: 'Media & Docs',
    icon: DocumentDuplicateIcon,
    items: [
      { key: 'PDF Manager', label: 'Page Architect', description: 'PDF merging and manipulation.', tags: ['combine', 'split', 'pages', 'merge', 'pdf'], icon: DocumentDuplicateIcon, category: 'Media & Docs' },
      { key: 'AI Translator', label: 'Universal Translator', description: 'Nuanced multilingual conversion.', tags: ['language', 'global', 'speak', 'translate'], icon: TranslatorIcon, category: 'Media & Docs' },
      { key: 'Grammar Corrector', label: 'Syntax Refiner', description: 'AI-driven stylistic proofreading.', tags: ['proofread', 'english', 'grammar', 'spellcheck'], icon: GrammarIcon, category: 'Media & Docs' },
      { key: 'PDF to Image', label: 'PDF to Image', description: 'Extract pages as JPG or PNG.', tags: ['png', 'jpg', 'extract', 'pdf'], icon: PdfToImageIcon, category: 'Media & Docs' },
      { key: 'Image to PDF', label: 'Image to PDF', description: 'Assemble images into documents.', tags: ['convert', 'combine', 'photos', 'pdf'], icon: ImageToPdfIcon, category: 'Media & Docs' },
      { key: 'Export to Sheets', label: 'Data to Sheets', description: 'Unstructured text to CSV/Excel.', tags: ['csv', 'excel', 'data', 'sheets'], icon: SheetIcon, category: 'Media & Docs' },
    ]
  }
];

export const ALL_TOOLS: Tool[] = TOOL_STRUCTURE.flatMap(group => group.items);
