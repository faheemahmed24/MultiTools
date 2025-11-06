import type { Transcription, TranscriptSegment } from './types';
// These are available globally from the CDN links in index.html
declare const jspdf: any;
declare const docx: any;

interface ExportOptions {
    timestamps: boolean;
    speakers: boolean;
}

const formatTimestamp = (seconds: number, separator: ',' | '.') => {
    const date = new Date(0);
    date.setSeconds(seconds);
    const timeStr = date.toISOString(); // Format: HH:MM:SS.sssZ
    const [time, ms] = timeStr.substr(11, 12).split('.');
    return `${time}${separator}${ms.slice(0, -1)}`;
};

export const exportAsSRT = (segments: TranscriptSegment[]) => {
    const content = segments.map((seg, i) => 
        `${i + 1}\n${formatTimestamp(seg.start, ',')} --> ${formatTimestamp(seg.end, ',')}\n${seg.text}`
    ).join('\n\n');
    downloadFile(content, 'transcription.srt', 'application/x-subrip');
};

export const exportAsVTT = (segments: TranscriptSegment[]) => {
    const content = `WEBVTT\n\n${segments.map((seg, i) => 
        `${formatTimestamp(seg.start, '.')} --> ${formatTimestamp(seg.end, '.')}\n${seg.text}`
    ).join('\n\n')}`;
    downloadFile(content, 'transcription.vtt', 'text/vtt');
};

export const exportAsTXT = (data: Transcription, options: ExportOptions) => {
  let content = `File: ${data.fileName}\nCreated: ${new Date(data.createdAt).toLocaleString()}\n\n--- TRANSCRIPTION ---\n\n`;
  
  content += data.segments.map(s => {
    let line = '';
    if (options.timestamps) line += `[${formatTimestamp(s.start, '.')}] `;
    if (options.speakers) line += `Speaker ${s.speaker}: `;
    line += s.text;
    return line;
  }).join('\n');

  if (data.summary) {
    content += `\n\n--- SUMMARY ---\n\n${data.summary}`;
  }
  downloadFile(content, 'transcription.txt', 'text/plain');
};

export const exportAsPDF = (data: Transcription, options: ExportOptions) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Transcription: ${data.fileName}`, 10, 10);
    doc.setFontSize(10);
    doc.text(`Created: ${new Date(data.createdAt).toLocaleString()}`, 10, 18);
    
    if(data.summary) {
        doc.setFontSize(12);
        doc.text('Summary', 10, 30);
        doc.setFontSize(10);
        const splitSummary = doc.splitTextToSize(data.summary, 180);
        doc.text(splitSummary, 10, 36);
    }
    
    const head: string[] = [];
    if(options.timestamps) head.push('Time');
    if(options.speakers) head.push('Speaker');
    head.push('Text');

    const tableData = data.segments.map(seg => {
        const row: string[] = [];
        if(options.timestamps) row.push(formatTimestamp(seg.start, '.'));
        if(options.speakers) row.push(`Speaker ${seg.speaker}`);
        row.push(seg.text);
        return row;
    });

    (doc as any).autoTable({
        head: [head],
        body: tableData,
        startY: data.summary ? doc.previousAutoTable.finalY + 10 : 30,
        styles: {
            fontSize: 8
        },
        headStyles: {
            fillColor: [20, 184, 166] // Turquoise color from the theme
        }
    });

    doc.save('transcription.pdf');
};

export const exportAsDOCX = (data: Transcription, options: ExportOptions) => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
    
    const paragraphs: any[] = [
        new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun(`Transcription: ${data.fileName}`)],
        }),
        new Paragraph({
            children: [new TextRun({ text: `Created: ${new Date(data.createdAt).toLocaleString()}`, italics: true })],
        }),
    ];

    if (data.summary) {
        paragraphs.push(new Paragraph({
             heading: HeadingLevel.HEADING_2,
             children: [new TextRun("Summary")],
        }));
        paragraphs.push(new Paragraph({ children: [new TextRun(data.summary)]}));
    }

    paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Full Transcript")],
    }));

    data.segments.forEach(seg => {
        const lineChildren: any[] = [];
        if(options.timestamps) {
            lineChildren.push(new TextRun({ text: `[${formatTimestamp(seg.start, '.')}] `, bold: true }));
        }
        if(options.speakers) {
            lineChildren.push(new TextRun({ text: `Speaker ${seg.speaker}: `, bold: true }));
        }
        lineChildren.push(new TextRun(seg.text));

        paragraphs.push(new Paragraph({
            children: lineChildren,
        }));
    });

    const doc = new Document({ sections: [{ children: paragraphs }] });

    Packer.toBlob(doc).then(blob => {
        downloadFile(blob, 'transcription.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
};


const downloadFile = (content: string | Blob, fileName: string, mimeType: string) => {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};