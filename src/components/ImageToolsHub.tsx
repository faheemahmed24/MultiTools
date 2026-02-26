import React, { useState, useEffect, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { ImageIcon } from './icons/ImageIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { CubeIcon } from './icons/CubeIcon';
import { CameraIcon } from './icons/CameraIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { BoltIcon } from './icons/BoltIcon';
import { ShareIcon } from './icons/ShareIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { Squares2x2Icon } from './icons/Squares2x2Icon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { UploadIcon } from './icons/UploadIcon';
import UniversalImageEditor from './UniversalImageEditor';
import ImageConverterOcr from './ImageAnalyzer';
import PdfToImage from './PdfToImage';
import ImageToPdf from './ImageToPdf';

interface ToolItem {
  id: string;
  name: string;
  description?: string;
  badge?: string;
  component?: 'ocr' | 'pdf2img' | 'img2pdf' | 'universal';
}

interface ToolCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
  tools: ToolItem[];
}

interface ImageToolsHubProps {
    t: TranslationSet;
    externalCategory?: string;
    onCategoryChange?: (cat: string) => void;
}

const ImageToolsHub: React.FC<ImageToolsHubProps> = ({ t, externalCategory = 'All', onCategoryChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(externalCategory);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setActiveCategory(externalCategory);
  }, [externalCategory]);

  const categories: ToolCategory[] = [
    {
      title: 'Popular & Essential',
      icon: <BoltIcon className="w-5 h-5" />,
      color: 'text-yellow-400',
      tools: [
        { id: 'reduce-kb', name: 'Compress Image in KB', description: 'Meet strict file size requirements (20KB, 50KB, 100KB).', component: 'universal', badge: 'Popular' },
        { id: 'passport', name: 'Passport Photo Maker', description: 'Standard ID sizes with background correction.', component: 'universal' },
        { id: 'ai-enhance', name: 'AI Image Enhancer', description: 'Fix blurry photos and improve resolution.', badge: 'AI', component: 'universal' },
        { id: 'gen-sig', name: 'Signature Generator', description: 'Create digital signatures from handwriting.', component: 'universal' },
      ]
    },
    {
      title: 'Official Forms & Resizing',
      icon: <DocumentDuplicateIcon className="w-5 h-5" />,
      color: 'text-green-400',
      tools: [
        { id: 'govt-presets', name: 'Govt Form Resizer (SSC/PAN/UPSC)', description: 'Exact dimensions for official portals.', component: 'universal', badge: 'New' },
        { id: 'resize-pixel', name: 'Resize by Pixels', description: 'Custom width and height adjustments.', component: 'universal' },
        { id: 'resize-cm', name: 'Resize in Centimeters/Inches', description: 'Physical dimensions for printing.', component: 'universal' },
        { id: 'add-name-dob', name: 'Add Name & DOB Label', description: 'Overlay details directly on photos for exams.', component: 'universal' },
      ]
    },
    {
      title: 'Conversion & OCR',
      icon: <ArrowPathIcon className="w-5 h-5" />,
      color: 'text-cyan-400',
      tools: [
        { id: 'ocr-tool', name: 'Extract Text (OCR)', description: 'Turn image text into editable documents.', component: 'ocr', badge: 'Pro' },
        { id: 'img-to-pdf', name: 'Images to PDF', description: 'Combine multiple photos into one PDF file.', component: 'img2pdf' },
        { id: 'pdf-to-img', name: 'PDF to Image', description: 'Convert PDF pages back to high-res JPG/PNG.', component: 'pdf2img' },
        { id: 'conv-formats', name: 'Format Converter (HEIC/WebP)', description: 'Change between JPG, PNG, WEBP, and HEIC.', component: 'universal' },
      ]
    },
    {
      title: 'Basic Editing & Retouch',
      icon: <ScissorsIcon className="w-5 h-5" />,
      color: 'text-blue-400',
      tools: [
        { id: 'bg-remove', name: 'Remove/Change Background', description: 'Isolate subjects with precision.', component: 'universal', badge: 'AI' },
        { id: 'obj-remove', name: 'Object Remover', description: 'Erase unwanted items from your photos.', component: 'universal' },
        { id: 'crop-tools', name: 'Crop (Circle/Square/Free)', description: 'Shape images for profile pics or specific ratios.', component: 'universal' },
        { id: 'rotate-flip', name: 'Rotate & Flip', description: 'Quickly fix orientation errors.', component: 'universal' },
        { id: 'watermark', name: 'Add Watermark', description: 'Protect your photos with custom logos or text.', component: 'universal' },
      ]
    },
    {
      title: 'Privacy & Effects',
      icon: <SparklesIcon className="w-5 h-5" />,
      color: 'text-purple-400',
      tools: [
        { id: 'blur-pixelate', name: 'Blur & Pixelate Faces', description: 'Hide identities for privacy protection.', component: 'universal' },
        { id: 'censor', name: 'Censor Tool', description: 'Black out sensitive data or areas.', component: 'universal' },
        { id: 'artistic', name: 'Artistic Filters', description: 'Black & White, Sepia, and Pixel Art styles.', component: 'universal' },
        { id: 'unblur', name: 'Unblur Face', description: 'Restore facial features in blurry portraits.', component: 'universal' },
      ]
    },
    {
      title: 'Social Media Optimized',
      icon: <ShareIcon className="w-5 h-5" />,
      color: 'text-indigo-400',
      tools: [
        { id: 'insta-tools', name: 'Instagram No-Crop/Grid', description: 'Fit full photos or create 3x3 grids.', component: 'universal' },
        { id: 'whatsapp-dp', name: 'WhatsApp DP Size', description: 'Perfect circle crop for profile pictures.', component: 'universal' },
        { id: 'yt-banner', name: 'YouTube Channel Art', description: 'Banner sizes optimized for all devices.', component: 'universal' },
        { id: 'zoom-out', name: 'Expand Background (Padding)', description: 'Add padding without cropping the subject.', component: 'universal' },
      ]
    }
  ];

  const handleCategorySwitch = (cat: string) => {
    setActiveCategory(cat);
    onCategoryChange?.(cat);
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Use relatedTarget to prevent flickering when hovering child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const ext = file.name.split('.').pop()?.toLowerCase();
        
        // Intelligent Routing logic
        if (ext === 'pdf') {
            setActiveToolId('pdf-to-img');
        } else if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext || '')) {
            setActiveToolId('ocr-tool');
        } else {
            setActiveToolId('reduce-kb');
        }
    }
  }, []);

  const allTools = categories.flatMap(c => c.tools);
  const currentTool = allTools.find(t => t.id === activeToolId);

  const filteredCategories = categories.map(cat => ({
    ...cat,
    tools: cat.tools.filter(tool => 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => (activeCategory === 'All' || cat.title === activeCategory) && cat.tools.length > 0);

  const categoryNames = ['All', ...categories.map(c => c.title)];

  const handleCloseTool = () => setActiveToolId(null);

  if (currentTool) {
    const renderHeader = (
        <button onClick={handleCloseTool} className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors bg-gray-900 px-4 py-2 rounded-xl border border-gray-800">
            <ArrowPathIcon className="w-4 h-4" /> Back to Tools List
        </button>
    );

    if (currentTool.component === 'ocr') {
        return (
            <div className="h-full flex flex-col">
                {renderHeader}
                <div className="flex-grow"><ImageConverterOcr t={t} onAnalysisComplete={() => {}} /></div>
            </div>
        );
    }
    if (currentTool.component === 'pdf2img') {
        return (
            <div className="h-full flex flex-col">
                {renderHeader}
                <div className="flex-grow"><PdfToImage t={t} onConversionComplete={() => {}} /></div>
            </div>
        );
    }
    if (currentTool.component === 'img2pdf') {
        return (
            <div className="h-full flex flex-col">
                {renderHeader}
                <div className="flex-grow"><ImageToPdf t={t} onConversionComplete={() => {}} /></div>
            </div>
        );
    }
    return <UniversalImageEditor toolName={currentTool.name} t={t} onClose={handleCloseTool} />;
  }

  return (
    <div 
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex flex-col h-full animate-fadeIn max-w-7xl mx-auto w-full relative"
    >
      {/* Search Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white tracking-tight mb-6 flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-purple-500" />
          Image Tool Hub
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-gray-500" />
                </div>
                <input
                    type="text"
                    placeholder="Search image tools (e.g. Passport, SSC, Grid...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl py-3.5 pl-12 pr-6 text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-xl"
                />
            </div>
            <div className="flex overflow-x-auto gap-2 pb-1 w-full md:w-auto custom-scrollbar no-scrollbar">
                {['All', 'Essential', 'Official', 'Convert', 'Edit', 'Privacy', 'Social'].map(short => {
                    const fullName = categoryNames.find(c => c.includes(short)) || 'All';
                    return (
                        <button
                            key={short}
                            onClick={() => handleCategorySwitch(fullName)}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeCategory === fullName ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'}`}
                        >
                            {short}
                        </button>
                    )
                })}
            </div>
        </div>
      </div>

      {/* List View Content */}
      <div className="flex-grow space-y-10 pb-24 overflow-y-auto pe-4 custom-scrollbar">
        {filteredCategories.map((category, idx) => (
          <section key={idx} className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-800 pb-3">
              <div className={`p-1.5 rounded-lg bg-gray-800 ${category.color}`}>
                {category.icon}
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-200">{category.title}</h3>
            </div>
            
            <div className="flex flex-col divide-y divide-gray-800/50 border border-gray-800/50 rounded-3xl overflow-hidden bg-gray-900/20 backdrop-blur-sm">
              {category.tools.map((tool) => (
                <button 
                  key={tool.id}
                  onClick={() => setActiveToolId(tool.id)}
                  className="group flex items-center justify-between p-5 hover:bg-purple-600/5 transition-all text-left w-full"
                >
                  <div className="flex-grow min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-gray-100 group-hover:text-purple-400 transition-colors leading-tight truncate">{tool.name}</span>
                        {tool.badge && (
                            <span className="text-[9px] font-black bg-purple-600/20 text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-500/20 uppercase tracking-tighter shrink-0">
                                {tool.badge}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 group-hover:text-gray-400 transition-colors">{tool.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 hidden sm:inline">Launch</span>
                    <div className="bg-purple-600/20 p-2 rounded-full text-purple-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}

        {filteredCategories.length === 0 && (
            <div className="py-24 text-center">
                <div className="inline-block p-6 bg-gray-900/50 rounded-full mb-6 border border-gray-800">
                    <SearchIcon className="w-12 h-12 text-gray-700" />
                </div>
                <p className="text-gray-500 font-bold uppercase tracking-widest">No tools match "{searchTerm}"</p>
                <button onClick={() => {setSearchTerm(''); handleCategorySwitch('All');}} className="mt-4 text-purple-400 text-sm font-black uppercase tracking-widest hover:underline">Clear Filters</button>
            </div>
        )}
      </div>

      {/* Global Neural Drop Zone Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-[60] bg-[#05050C]/80 backdrop-blur-md border-4 border-dashed border-purple-500 rounded-[3rem] flex flex-col items-center justify-center animate-fadeIn m-4 shadow-[0_0_80px_rgba(168,85,247,0.2)]">
            <div className="p-10 bg-purple-600/10 rounded-full mb-8 border border-purple-500/20 shadow-2xl animate-bounce">
                <UploadIcon className="w-24 h-24 text-purple-400" />
            </div>
            <h3 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">Neural Drop Zone</h3>
            <p className="text-purple-300 text-xl font-bold uppercase tracking-[0.25em] animate-pulse">Release to auto-select optimal tool</p>
            
            <div className="mt-12 flex gap-4">
                {['JPG', 'PNG', 'PDF', 'WEBP'].map(ext => (
                    <span key={ext} className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 tracking-widest">{ext}</span>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageToolsHub;