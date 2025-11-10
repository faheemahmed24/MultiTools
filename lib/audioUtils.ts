// lib/audioUtils.ts

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


export const processAudioForTranscription = async (file: File): Promise<{ base64: string, mimeType: string }> => {
    // Skip client-side processing to speed up the process.
    // Convert the file directly to base64 and let Gemini handle the format.
    const dataUrl = await fileToDataUrl(file);
    return dataUrlToBase64(dataUrl, file.type);
};
