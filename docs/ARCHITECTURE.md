# MultiTools — Architecture & Technical Overview

## 1. Core Architecture & Tech Stack

- **Framework:** React 19 with TypeScript for a strongly-typed, component-driven frontend.
- **Styling:** Tailwind CSS with a custom "Obsidian" dark palette, glassmorphism (backdrop-blur), and fluid animations.
- **AI Engine:** Integrated via `@google/genai` with multiple Gemini models:
  - `gemini-3-pro-preview` — complex reasoning, transcription, diarization
  - `gemini-3-flash-preview` — fast OCR and image analysis
  - `gemini-2.5-flash-preview-tts` — multi-personality TTS
- **Storage:** Local-first using `localStorage` and a `useUserLocalStorage` hook to scope data per user account.
- **Media Libraries:** `pdfjs-dist`, `jsPDF`, `docx`, `JSZip`, `mammoth`.

## 2. Feature Summary

- **AI Transcriber:** Multi-format audio/video transcription, auto-language detection, speaker diarization, interactive editor with undo/redo, and exports to SRT/JSON/DOCX/PDF/CSV/TXT.
- **Image Converter & OCR:** Batch scanning with a pacing engine to respect API rate limits, translation pipeline, and high-fidelity layout handling.
- **PDF & Document Suite:** Page-range extraction, image-to-PDF/Word with layout options, and an image editor for preprocessing.
- **Audio & Video Lab:** Video-to-audio conversion across quality profiles and an audio merger with drag-and-drop sequencing.
- **TTS & Web Reader:** Multiple AI personalities, fetch-and-read web content with summarization, and downloadable speech assets.
- **Grammar Corrector:** Visual diff highlighting edits with inline accept/reject controls.

## 3. UI/UX Highlights

- Responsive, collapsible sidebar with mobile-first interactions.
- Multilingual interface and full RTL support (Arabic, Urdu).
- Local-first authentication simulation enabling multiple scoped user profiles.

## 4. Data Privacy & Local-First Principles

- No cloud storage by default — user files and transcripts are stored locally.
- Scoped local storage keys prevent cross-account data leakage on shared machines.
- Zero tracking — no analytics or external trackers by design.

## 5. Developer Notes & Runtime Considerations

- **Environment variables:** `GEMINI_API_KEY` (or equivalent) required for features that call the Gemini API. The app defers client initialization and throws only when a protected feature is invoked if the key is missing.
- **Build & Deploy:** Vite builds to `dist/`. Recommended deployment: Cloudflare Pages or any static hosting that serves `dist/` (do not serve raw `.tsx` files).
- **Rate Limiting:** Long-running batch jobs (image OCR, large transcripts) should use the built-in pacing engine to throttle requests and retry with exponential backoff.
- **Local-First Caveat:** Because large media files are stored in browser storage, consider using IndexedDB for large binaries and keep localStorage for metadata only.

## 6. File Locations (Quick Reference)

- `services/geminiService.ts` — AI wrappers and safe initialization patterns.
- `hooks/useUserLocalStorage.ts` — scoped local storage helper.
- `components/TranscriptionView.tsx` — main transcriber UI and editor.
- `components/ImageEditModal.tsx` — image editing prior to conversions.

## 7. Recommended Next Steps for Production

- Add `GEMINI_API_KEY` to production environment variables.
- Configure Cloudflare Pages to run `npm run build` and deploy the `dist/` directory. Remove any custom `npx wrangler deploy` commands unless deploying Workers.
- Monitor bundle sizes and enable manual chunking in `vite.config.ts` to keep large vendor chunks split.

---
This document is intended for maintainers and contributors. For user-facing marketing copy, see `README_EXTENDED.md`.
