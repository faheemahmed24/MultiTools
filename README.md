<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/13TyrNh1XXvSvltSdNcdyqTW0C26-145h

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to your Gemini API key
   ```bash
   cp .env.example .env
   # then edit .env and add your GEMINI_API_KEY
   ```
3. Run the app:
   `npm run dev`

## Deploy to Production

This project is configured for automatic deployment to Hostinger via GitHub integration.

1. Ensure `GEMINI_API_KEY` is set in your Hostinger environment variables or GitHub secrets
2. Push changes to the main branch
3. Hostinger will automatically build and deploy the site to https://multitools.click

The build output is in the `dist` folder, served as a static site.

## Cloudflare Deployment (recommended: Pages)

This repository can be deployed to Cloudflare in two ways:

- Recommended (Cloudflare Pages - static site):
   1. In Cloudflare Dashboard → Pages → Create project → Connect your GitHub repo
   2. Framework preset: `Vite`
   3. Build command: `npm run build`
   4. Build output directory: `dist`
   5. Remove any custom Deploy command (leave blank)
   6. Ensure Node version is 18+

- Alternative (Workers static assets using Wrangler):
   - If your Cloudflare integration runs `npx wrangler deploy`, this repo includes `wrangler.jsonc` which points to `./dist` so Wrangler will upload the built assets.

After pushing changes, Cloudflare will build and publish the `dist/` directory.

## Features

MultiTools is a comprehensive media processing and productivity platform. Core tools and functionality include:

1. **AI Transcriber**
   - Media Transcription: Converts audio and video files (MP3, WAV, MP4, etc.) into structured text.
   - Auto-Language Detection: Automatically identifies the spoken language.
   - Speaker Diarization: Identifies and labels different speakers.
   - Transcript Editor: Interactive editor to adjust timestamps, speakers, and text.
   - Multi-Format Export: TXT, JSON, SRT, DOCX, PDF, CSV.

2. **AI Translator**
   - Multi-Language Translation between dozens of languages.
   - Language Swapping and Batch Export (TXT, DOCX, PDF).

3. **Image & OCR Tools**
   - OCR extraction from images or scanned documents.
   - Batch image processing with pacing for API limits.
   - Integrated translation of OCR results.

4. **PDF & Document Management**
   - PDF → Image (PNG/JPEG) with page range selection.
   - Image → PDF with page / orientation / margin controls.
   - PDF → Word (DOCX) extraction.
   - Word → PDF rendering.
   - Image editor (rotate, brightness, contrast, saturation) before conversion.

5. **Audio & Video Utilities**
   - Video → Audio (WAV, MP3, FLAC, AAC).
   - Audio Merger: merge multiple audio tracks into one.

6. **Advanced AI Features**
   - Text to Speech (TTS) with multiple AI voices.
   - Read Online: Fetch & extract page text from any URL.
   - Grammar Corrector with visual diff view.

7. **Data & Organization**
   - Export to Sheets (CSV) with preview and cleanup.
   - Persistent local-first history scoped per user.
   - Multilingual UI (English, Hindi, Urdu, Arabic with RTL support).
   - Local auth (email/password + simulated Google login).

