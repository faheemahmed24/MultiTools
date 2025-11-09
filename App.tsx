import React, { useState, useEffect } from 'react';
import type { Language, Tool, TranslationSet } from './types';
import { translations } from './lib/i18n';
import Header from './components/Header';
import TranscriberTool from './components/TranscriberTool';
import TranslatorTool from './components/TranslatorTool';
import ComingSoonTool from './components/ComingSoonTool';
import { TaskProvider } from './contexts/TaskProvider';

const App: React.FC = () => {
  const [uiLanguage, setUiLanguage] = useState<Language>('en');
  const [activeTool, setActiveTool] = useState<Tool>('transcriber');

  useEffect(() => {
    const dir = uiLanguage === 'ar' || uiLanguage === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Construct an absolute URL to the service worker script to avoid
      // cross-origin errors in sandboxed or iframe-based environments.
      // The path is resolved against the current page's origin.
      const swUrl = new URL('service-worker.js', window.location.origin);
      navigator.serviceWorker.register(swUrl.href, { type: 'module' })
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  const t = translations[uiLanguage];

  const toolLabels: Record<Tool, keyof TranslationSet> = {
    transcriber: 'toolTranscriber',
    translator: 'toolTranslator',
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
      case 'translator':
        return <TranslatorTool t={t} />;
      default:
        const toolName = t[toolLabels[activeTool]] || activeTool;
        return <ComingSoonTool t={t} toolName={toolName} />;
    }
  };

  return (
    <TaskProvider>
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
    </TaskProvider>
  );
};

export default App;