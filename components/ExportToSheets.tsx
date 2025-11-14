import React, { useState, useEffect } from 'react';
import type { TranslationSet } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

const ExportToSheets: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [delimiter, setDelimiter] = useState<',' | '\t' | ';'>(',');
  const [hasHeader, setHasHeader] = useState(true);

  useEffect(() => {
    if (!inputText.trim()) {
      setParsedData([]);
      return;
    }

    const rows = inputText.trim().split('\n').map(row => row.split(delimiter));
    setParsedData(rows);
  }, [inputText, delimiter]);

  const escapeCsvCell = (cell: string): string => {
    const cellStr = String(cell || '');
    if (cellStr.includes(delimiter) || cellStr.includes('"') || cellStr.includes('\n')) {
      return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
  };

  const handleDownloadCsv = () => {
    if (parsedData.length === 0) return;
    
    const csvContent = parsedData.map(row => row.map(escapeCsvCell).join(delimiter)).join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const headerRow = hasHeader && parsedData.length > 0 ? parsedData[0] : [];
  const bodyRows = hasHeader && parsedData.length > 0 ? parsedData.slice(1) : parsedData;

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] lg:h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Input Textarea */}
        <div className="flex-grow">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.pasteDataPlaceholder}
            className="w-full h-64 bg-gray-900/50 rounded-lg p-4 text-gray-200 resize-y focus:ring-2 focus:ring-purple-500 border border-gray-700 focus:border-purple-500"
          />
        </div>

        {/* Options */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.delimiter}</label>
            <div className="flex bg-gray-700 rounded-lg p-1 text-sm">
              <button onClick={() => setDelimiter(',')} className={`w-full py-2 rounded-md transition-colors ${delimiter === ',' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>{t.comma}</button>
              <button onClick={() => setDelimiter('\t')} className={`w-full py-2 rounded-md transition-colors ${delimiter === '\t' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>{t.tab}</button>
              <button onClick={() => setDelimiter(';')} className={`w-full py-2 rounded-md transition-colors ${delimiter === ';' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>{t.semicolon}</button>
            </div>
          </div>
          <label className="flex items-center cursor-pointer bg-gray-700/50 p-3 rounded-lg hover:bg-gray-700">
              <div className="relative">
                  <input type="checkbox" className="sr-only" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
                  <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${hasHeader ? 'translate-x-full bg-purple-400' : ''}`}></div>
              </div>
              <div className="ms-3 text-sm font-medium text-gray-300">{t.firstRowHeader}</div>
          </label>
           <button
              onClick={handleDownloadCsv}
              disabled={parsedData.length === 0}
              className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <DownloadIcon className="w-5 h-5 me-2" />
              {t.downloadCsv}
            </button>
        </div>
      </div>
      
      {/* Data Preview */}
      <div className="flex-grow flex flex-col min-h-0">
        <h3 className="text-lg font-bold text-gray-200 mb-2">{t.dataPreview}</h3>
        <div className="flex-grow bg-gray-900/50 rounded-lg overflow-auto border border-gray-700">
          {parsedData.length > 0 ? (
            <table className="w-full text-sm text-left text-gray-300">
              {hasHeader && (
                <thead className="text-xs text-gray-300 uppercase bg-gray-700/50 sticky top-0">
                  <tr>
                    {headerRow.map((cell, index) => (
                      <th key={index} scope="col" className="px-6 py-3 whitespace-nowrap">{cell}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {bodyRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="bg-gray-800/50 border-b border-gray-700 hover:bg-gray-700/60">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>{t.noDataToPreview}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportToSheets;
