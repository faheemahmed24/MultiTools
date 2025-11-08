import React, { useState, useEffect } from 'react';
import type { Language, Tool, TranslationSet } from './types';
import { translations } from './lib/i18n';
import Header from './components/Header';
import TranscriberTool from './components/TranscriberTool';
import ComingSoonTool from './components/ComingSoonTool';

const App: React.FC = () => {
  const [uiLanguage, setUiLanguage] = useState<Language>('en');
  const [activeTool, setActiveTool] = useState<Tool>('transcriber');

  useEffect(() => {
    const dir = uiLanguage === 'ar' || uiLanguage === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);

  const t = translations[uiLanguage];

  const toolLabels: Record<Tool, keyof TranslationSet> = {
    transcriber: 'toolTranscriber',
    ocr: 'toolOcr',
    'pdf-to-image': 'toolPdfToImage',
    'image-to-pdf': 'toolImageToPdf',
    'pdf-to-word': 'toolPdfToWord',
    'word-to-pdf': 'toolWordToPdf',
  };

  const renderTool = () => {
    switch (activeTool) {
      case 'transcriber':
        return <TranscriberTool t={t} />;
      default:
        const toolName = t[toolLabels[activeTool]] || activeTool;
        return <ComingSoonTool t={t} toolName={toolName} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header
        t={t}
        uiLanguage={uiLanguage}
        setUiLanguage={setUiLanguage}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
      />
      {renderTool()}
    </div>
  );
};

export default App;
