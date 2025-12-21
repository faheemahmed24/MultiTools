import React, { useState, useEffect } from 'react';
import type { TranslationSet } from '../types';
import { RotateLeftIcon } from './icons/RotateLeftIcon';
import { RotateRightIcon } from './icons/RotateRightIcon';

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
  onSave: (newEdits: ImageEditState) => void;
  onClose: () => void;
  t: TranslationSet;
}

const Slider: React.FC<{ label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, min?: number, max?: number, step?: number }> = ({ label, value, onChange, min=0, max=200, step=1 }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{label} ({value}%)</label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
    </div>
);

const ImageEditModal: React.FC<ImageEditModalProps> = ({ imagePreview, initialEdits, onSave, onClose, t }) => {
  const [edits, setEdits] = useState<ImageEditState>(initialEdits);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleRotate = (direction: 'left' | 'right') => {
    setEdits(prev => ({
      ...prev,
      rotate: (prev.rotate + (direction === 'left' ? -90 : 90) + 360) % 360,
    }));
  };

  const handleSliderChange = (filter: keyof Omit<ImageEditState, 'rotate'>, value: string) => {
    setEdits(prev => ({
        ...prev,
        [filter]: parseInt(value, 10),
    }));
  };
  
  const handleReset = () => {
    setEdits(defaultEdits);
  };

  const imageStyle = {
    transform: `rotate(${edits.rotate}deg)`,
    filter: `brightness(${edits.brightness}%) contrast(${edits.contrast}%) saturate(${edits.saturate}%)`,
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-4xl h-full max-h-[90vh] flex flex-col p-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-gray-100">{t.editImage}</h2>
        
        <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
            {/* Image Preview */}
            <div className="flex-grow obsidian-card rounded-lg flex items-center justify-center p-4 overflow-hidden">
              <img src={imagePreview} alt="Editing preview" className="max-w-full max-h-full object-contain transition-all duration-200" style={imageStyle} />
            </div>

            {/* Controls */}
            <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t.rotate}</label>
                    <div className="flex gap-2">
                        <button onClick={() => handleRotate('left')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700/60 text-white font-semibold rounded-lg hover:brightness-105 transition-colors">
                            <RotateLeftIcon className="w-5 h-5"/> {t.rotateLeft}
                        </button>
                        <button onClick={() => handleRotate('right')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700/60 text-white font-semibold rounded-lg hover:brightness-105 transition-colors">
                            <RotateRightIcon className="w-5 h-5"/> {t.rotateRight}
                        </button>
                    </div>
                </div>

                <Slider label={t.brightness} value={edits.brightness} onChange={(e) => handleSliderChange('brightness', e.target.value)} />
                <Slider label={t.contrast} value={edits.contrast} onChange={(e) => handleSliderChange('contrast', e.target.value)} />
                <Slider label={t.saturation} value={edits.saturate} onChange={(e) => handleSliderChange('saturate', e.target.value)} />

                <button onClick={handleReset} className="w-full px-4 py-2 bg-gray-700/60 text-white font-semibold rounded-lg hover:brightness-105 transition-colors">
                  {t.reset}
                </button>
            </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
              <button onClick={onClose} className="px-6 py-2 bg-gray-700/60 text-white font-semibold rounded-lg hover:brightness-105 transition-colors">{t.cancel}</button>
              <button onClick={() => onSave(edits)} className="px-6 py-2 btn-primary font-semibold rounded-lg">{t.saveChanges}</button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditModal;