// lib/audioUtils.ts

const TARGET_SAMPLE_RATE = 16000;

// Helper to convert a File/Blob to a Base64 string and its MIME type
const dataUrlToBase64 = (dataUrl: string, originalMimeType: string): { base64: string, mimeType: string } => {
    const parts = dataUrl.split(',');
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || originalMimeType;
    const base64 = parts[1];
    if (!base64) {
        throw new Error("Failed to extract base64 string from data URL.");
    }
    return { base64, mimeType };
};

const fileToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};


// Helper to encode an AudioBuffer into a WAV file (Blob)
const bufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i, sample;
    let pos = 0;

    // Helper function
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // Write WAV container
    writeString(view, pos, 'RIFF'); pos += 4;
    view.setUint32(pos, length - 8, true); pos += 4;
    writeString(view, pos, 'WAVE'); pos += 4;

    // Write 'fmt ' chunk
    writeString(view, pos, 'fmt '); pos += 4;
    view.setUint32(pos, 16, true); pos += 4; // chunk size
    view.setUint16(pos, 1, true); pos += 2;  // format (PCM)
    view.setUint16(pos, numOfChan, true); pos += 2;
    view.setUint32(pos, buffer.sampleRate, true); pos += 4;
    view.setUint32(pos, buffer.sampleRate * 2 * numOfChan, true); pos += 4; // byte rate
    view.setUint16(pos, numOfChan * 2, true); pos += 2; // block align
    view.setUint16(pos, 16, true); pos += 2; // bits per sample

    // Write 'data' chunk
    writeString(view, pos, 'data'); pos += 4;
    view.setUint32(pos, length - pos - 4, true); pos += 4;

    // Write PCM samples
    for (i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    let offset = 0;
    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: 'audio/wav' });
};


export const processAudioForTranscription = async (file: File): Promise<{ base64: string, mimeType: string }> => {
    // If it's a video, don't process it client-side. Let Gemini handle it.
    if (file.type.startsWith('video/')) {
        const dataUrl = await fileToDataUrl(file);
        return dataUrlToBase64(dataUrl, file.type);
    }
    
    // For audio, process it to a standard format for better performance.
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // No need to process if it's already in the target format
        if (originalBuffer.sampleRate === TARGET_SAMPLE_RATE && originalBuffer.numberOfChannels === 1) {
             const dataUrl = await fileToDataUrl(file);
             return dataUrlToBase64(dataUrl, file.type);
        }

        const duration = originalBuffer.duration;
        const offlineContext = new OfflineAudioContext(1, duration * TARGET_SAMPLE_RATE, TARGET_SAMPLE_RATE);
        
        const source = offlineContext.createBufferSource();
        source.buffer = originalBuffer;
        source.connect(offlineContext.destination);
        source.start();

        const resampledBuffer = await offlineContext.startRendering();
        
        const wavBlob = bufferToWavBlob(resampledBuffer);
        
        const wavFile = new File([wavBlob], file.name.replace(/\.[^/.]+$/, "") + ".wav", { type: 'audio/wav' });
        const dataUrl = await fileToDataUrl(wavFile);
        return dataUrlToBase64(dataUrl, 'audio/wav');
        
    } catch (error) {
        console.warn("Could not process audio client-side, falling back to original file.", error);
        // Fallback to sending the original file if processing fails
        const dataUrl = await fileToDataUrl(file);
        return dataUrlToBase64(dataUrl, file.type);
    }
};
