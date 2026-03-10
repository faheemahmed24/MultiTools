# MultiTools Industrial v4.0

A high-precision neural architecture for speech intelligence, strategic planning, and universal data processing.

## Features
- **AI Transcriber**: World-class accuracy across 100+ global languages.
- **PDF Copilot**: Intelligent PDF analysis and chat.
- **AI PDF Editor**: Edit PDFs with neural assistance.
- **AI Whiteboard**: Synthesize and enhance sketches.
- **Pure Organizer**: Verbatim data categorization.
- **Strategic Planner**: High-density executive reporting.
- **AI Translator**: Nuanced translation between global dialects.
- **Grammar Corrector**: High-fidelity style and grammar correction.
- **PDF Manager**: Merge, split, and rotate PDF pages.
- **PDF to Image / Image to PDF**: High-quality format conversion.
- **Export to Sheets**: Intelligent data extraction to spreadsheets.
- **Video to Audio**: Extract high-fidelity audio from video files.
- **Text to Speech**: Neural voice synthesis.
- **Smart Summarizer**: Executive data extraction and analysis.

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. API Key Configuration
The app requires a Google Gemini API key.
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Open `.env.local` and set your key:
   ```text
   GEMINI_API_KEY=your_secret_key_here
   ```

### 3. Installation
```bash
npm install
```

### 4. Development
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## Troubleshooting
- **Microphone Permissions**: Ensure your browser has permission to use the mic.
- **API Errors**: Check your API key and ensure it's enabled for the Gemini API.
- **PDF Issues**: For large PDFs, ensure your browser has enough memory.
- **Local Storage**: If the app crashes on startup, try clearing your browser's local storage for the site.
