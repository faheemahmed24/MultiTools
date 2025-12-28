import React, { useState } from 'react';
import type { TranslationSet } from '../types';

export interface ImageEditState {
  rotate: number;
  brightness: number;
  contrast: number;
  saturate: number;
}

export const defaultEdits: ImageEditState = {
  rotate: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
};

interface ImageEditModalProps {
  imagePreview: string;
  initialEdits: ImageEditState;
  onSave: (edits: ImageEditState) => void;
  onClose: () => void;
  t: TranslationSet;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ imagePreview, initialEdits, onSave, onClose, t }) => {
  const [edits, setEdits] = useState<ImageEditState>(initialEdits);

  const handleChange = (key: keyof ImageEditState, value: number) => {
    setEdits(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">{t.editImage}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 bg-black/50 p-4 flex items-center justify-center overflow-hidden">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain transition-all duration-200"
              style={{
                transform: `rotate(${edits.rotate}deg)`,
                filter: `brightness(${edits.brightness}%) contrast(${edits.contrast}%) saturate(${edits.saturate}%)`
              }}
            />
          </div>
          
          <div className="w-full md:w-80 bg-gray-900 p-6 space-y-6 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.rotate}</label>
              <div className="flex gap-2">
                <button onClick={() => handleChange('rotate', edits.rotate - 90)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm">{t.rotateLeft}</button>
                <button onClick={() => handleChange('rotate', edits.rotate + 90)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm">{t.rotateRight}</button>
              </div>
            </div>

            {[
              { key: 'brightness', label: t.brightness, min: 0, max: 200 },
              { key: 'contrast', label: t.contrast, min: 0, max: 200 },
              { key: 'saturate', label: t.saturation, min: 0, max: 200 },
            ].map((control) => (
              <div key={control.key}>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-gray-300">{control.label}</label>
                  <span className="text-xs text-gray-400">{edits[control.key as keyof ImageEditState]}%</span>
                </div>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  value={edits[control.key as keyof ImageEditState]}
                  onChange={(e) => handleChange(control.key as keyof ImageEditState, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            ))}

            <div className="pt-4 flex gap-3">
              <button onClick={() => setEdits(defaultEdits)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">{t.reset}</button>
              <button onClick={() => onSave(edits)} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">{t.saveChanges}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditModal;