import React, { useState, useRef, useCallback } from 'react';
import type { TranslationSet } from '../types';
import { jsPDF } from 'jspdf';
import * as docx from 'docx';
import { UploadIcon } from './icons/UploadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import ImageEditModal, { type ImageEditState, defaultEdits } from './ImageEditModal';
import { EditIcon } from './icons/EditIcon';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  edits: ImageEditState;
}

type PageSize = 'a4' | 'letter';
type Orientation = 'p' | 'l';
type Margin = 'none' | 'small' | 'medium' | 'large';
type ImageFit = 'contain' | 'cover';

const MARGIN_VALUES: Record<Margin, number> = {
  none: 0,
  small: 10,
  medium: 20,
  large: 30,
};

const ImageToPdf: React.FC<{ t: TranslationSet }> = ({ t }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionMessage, setConversionMessage] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<ImageFile | null>(null);

  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('p');
  const [margin, setMargin] = useState<Margin>('small');
  const [imageFit, setImageFit] = useState<ImageFit>('contain');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newImages: ImageFile[] = Array.from(selectedFiles)
        .filter(file => file.type.startsWith('image/'))
        .map(file => ({
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          edits: { ...defaultEdits },
        }));
      setImages(prev => [...prev, ...newImages]);
      setPdfUrl(null);
    }
  };

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newImages = [...images];
    const draggedItemContent = newImages.splice(dragItem.current, 1)[0];
    newImages.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setImages(newImages);
  };
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, []);

  const removeImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if(imageToRemove) URL.revokeObjectURL(imageToRemove.preview);
    setImages(images.filter(img => img.id !== id));
  };
  
  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setPdfUrl(null);
  };

  const handleSaveEdits = (newEdits: ImageEditState) => {
    if (!editingImage) return;
    setImages(prevImages =>
      prevImages.map(img =>
        img.id === editingImage.id ? { ...img, edits: newEdits } : img
      )
    );
    setEditingImage(null);
  };

  const applyEditsToImage = (image: ImageFile): Promise<string> => {
    return new Promise((resolve, reject) => {
        const edits = image.edits;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = image.preview;
        img.onload = () => {
            const isSideways = edits.rotate % 180 !== 0;
            const canvasWidth = isSideways ? img.height : img.width;
            const canvasHeight = isSideways ? img.width : img.height;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            ctx.filter = `brightness(${edits.brightness}%) contrast(${edits.contrast}%) saturate(${edits.saturate}%)`;
            
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(edits.rotate * Math.PI / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = () => reject('Image failed to load');
    });
  };
  
  const handleConvertToPdf = async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    setConversionMessage(t.generatingPdf);
    setPdfUrl(null);

    const doc = new jsPDF({ orientation, unit: 'mm', format: pageSize });
    const marginValue = MARGIN_VALUES[margin];
    
    for (let i = 0; i < images.length; i++) {
        if (i > 0) doc.addPage();
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const usableW = pageW - marginValue * 2;
        const usableH = pageH - marginValue * 2;

        const editedImageDataUrl = await applyEditsToImage(images[i]);
        
        const tempImg = new Image();
        tempImg.src = editedImageDataUrl;
        await new Promise(resolve => { tempImg.onload = resolve; });

        const imgW = tempImg.width;
        const imgH = tempImg.height;
        const imgRatio = imgW / imgH;
        const pageRatio = usableW / usableH;

        let finalW, finalH, finalX, finalY;

        if (imageFit === 'contain') {
            if (imgRatio > pageRatio) {
                finalW = usableW;
                finalH = usableW / imgRatio;
            } else {
                finalH = usableH;
                finalW = usableH * imgRatio;
            }
        } else { // cover
            if (imgRatio > pageRatio) {
                finalH = usableH;
                finalW = usableH * imgRatio;
            } else {
                finalW = usableW;
                finalH = usableW / imgRatio;
            }
        }

        finalX = marginValue + (usableW - finalW) / 2;
        finalY = marginValue + (usableH - finalH) / 2;

        doc.addImage(editedImageDataUrl, 'JPEG', finalX, finalY, finalW, finalH);
    }
    
    const url = doc.output('bloburl');
    setPdfUrl(url as string);
    setIsConverting(false);
    setConversionMessage('');
  };

  const handleConvertToWord = async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    setConversionMessage(t.generatingWord);
    setPdfUrl(null);

    const imageParagraphs: docx.Paragraph[] = [];

    for (const image of images) {
        const editedImageDataUrl = await applyEditsToImage(image);
        const base64Data = editedImageDataUrl.split(',')[1];
        
        const tempImg = new Image();
        tempImg.src = editedImageDataUrl;
        await new Promise(resolve => { tempImg.onload = resolve; });

        // A4 page dimensions in EMU (English Metric Units)
        const a4Width = 792 * 12700;
        
        const imageRun = new docx.ImageRun({
            data: base64Data,
            transformation: {
                width: a4Width, 
                height: (a4Width * tempImg.height) / tempImg.width,
            },
        });
        imageParagraphs.push(new docx.Paragraph({ children: [imageRun] }));
    }
    
    const doc = new docx.Document({
        sections: [{ children: imageParagraphs }],
    });

    const blob = await docx.Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.docx';
    a.click();
    URL.revokeObjectURL(url);

    setIsConverting(false);
    setConversionMessage('');
  };

  const OptionButton: React.FC<{label: string, value: any, selectedValue: any, onClick: (value: any) => void}> = ({label, value, selectedValue, onClick}) => (
    <button onClick={() => onClick(value)} className={`w-full py-2 px-1 text-sm rounded-md transition-colors ${selectedValue === value ? 'bg-purple-600 text-white' : 'hover:bg-gray-600 text-gray-300'}`}>{label}</button>
  );

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[60vh] lg:h-full flex flex-col">
      <input type="file" ref={fileInputRef} onChange={e => handleFileChange(e.target.files)} accept="image/*" multiple className="hidden" />
      {images.length === 0 ? (
        <div className={`flex flex-col flex-grow items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600 hover:border-purple-500'}`}
          onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
          <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200">{t.uploadImages}</button>
          <p className="mt-2 text-sm text-gray-400">{t.dropImages}</p>
        </div>
      ) : (
        <div className="flex flex-col flex-grow min-h-0">
          <div className="flex flex-wrap gap-2 items-center mb-4">
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200">
                  <PlusIcon className="w-5 h-5 me-2"/>{t.addMoreImages}
              </button>
              <button onClick={clearAll} className="flex items-center px-4 py-2 bg-red-600/50 text-white font-semibold rounded-lg hover:bg-red-600/80 transition-colors duration-200">
                  <TrashIcon className="w-5 h-5 me-2"/>{t.clearAll}
              </button>
              <p className="text-sm text-gray-400 flex-grow text-end">{t.reorderHint}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto p-1 -m-1 flex-grow mb-6">
              {images.map((img, index) => (
                  <div key={img.id} draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleDragSort} onDragOver={(e) => e.preventDefault()}
                      className="group relative bg-gray-900/50 p-2 rounded-lg aspect-square cursor-move flex items-center justify-center">
                      <img src={img.preview} alt={img.file.name} className="max-w-full max-h-full object-contain rounded-md transition-transform duration-200" style={{ transform: `rotate(${img.edits.rotate}deg)` }} />
                      <button onClick={() => removeImage(img.id)} title={t.removeImage} className="absolute top-1 end-1 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <CloseIcon className="w-4 h-4" />
                      </button>
                       <button onClick={() => setEditingImage(img)} title={t.editImage} className="absolute top-1 start-1 p-1.5 bg-black/50 rounded-full text-white hover:bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <EditIcon className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-1 start-1 px-2 py-0.5 bg-black/50 rounded-full text-white text-xs font-bold">{index + 1}</div>
                  </div>
              ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.pageSize}</label>
                  <div className="flex bg-gray-700 rounded-lg p-1"><OptionButton label="A4" value="a4" selectedValue={pageSize} onClick={setPageSize} /><OptionButton label="Letter" value="letter" selectedValue={pageSize} onClick={setPageSize} /></div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.orientation}</label>
                  <div className="flex bg-gray-700 rounded-lg p-1"><OptionButton label={t.portrait} value="p" selectedValue={orientation} onClick={setOrientation} /><OptionButton label={t.landscape} value="l" selectedValue={orientation} onClick={setOrientation} /></div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.margin}</label>
                  <div className="flex bg-gray-700 rounded-lg p-1"><OptionButton label={t.none} value="none" selectedValue={margin} onClick={setMargin} /><OptionButton label={t.small} value="small" selectedValue={margin} onClick={setMargin} /><OptionButton label={t.medium} value="medium" selectedValue={margin} onClick={setMargin} /></div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.imageFit}</label>
                  <div className="flex bg-gray-700 rounded-lg p-1"><OptionButton label={t.contain} value="contain" selectedValue={imageFit} onClick={setImageFit} /><OptionButton label={t.cover} value="cover" selectedValue={imageFit} onClick={setImageFit} /></div>
              </div>
          </div>

          {!pdfUrl ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleConvertToPdf} disabled={isConverting} className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200">
                  {isConverting ? conversionMessage : `${t.convertToPdf} (${images.length} ${images.length === 1 ? 'image' : 'images'})`}
              </button>
              <button onClick={handleConvertToWord} disabled={isConverting} className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200">
                  {isConverting ? conversionMessage : `${t.convertToWord}`}
              </button>
            </div>
          ) : (
            <a href={pdfUrl} download="converted.pdf" className="w-full text-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center">
                <DownloadIcon className="w-5 h-5 me-2" /> {t.downloadPdf}
            </a>
          )}
        </div>
      )}
       {editingImage && (
        <ImageEditModal
            imagePreview={editingImage.preview}
            initialEdits={editingImage.edits}
            onSave={handleSaveEdits}
            onClose={() => setEditingImage(null)}
            t={t}
        />
      )}
    </div>
  );
};

export default ImageToPdf;