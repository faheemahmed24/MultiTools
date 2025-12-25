# MultiTools — Local-First AI Media Suite

<div align="center">
  <img width="1200" height="475" alt="MultiTools Banner" src="https://via.placeholder.com/1200x475?text=MultiTools+AI+Media+Suite" />
</div>

MultiTools is a privacy-first, professional-grade media processing and productivity platform that brings Google Gemini capabilities to the browser. It is designed for journalists, researchers, students, and professionals who need powerful, offline-first tools for transcription, OCR, PDF/document conversions, TTS, and media utilities.

## Quick Start (Developer)

Prerequisites: Node.js (18+), npm

1. Install dependencies:

```bash
npm ci
```

2. Copy `.env.example` to `.env` and add your Gemini API key if you want AI features:

```bash
cp .env.example .env
# edit .env and set GEMINI_API_KEY=your_key_here
```

3. Run the dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Deployment

Recommended: Cloudflare Pages (static site)

- In Cloudflare Dashboard → Pages → Create project → Connect GitHub repo
- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Leave the Deploy command blank (do not run `npx wrangler deploy`)

Alternative: Hostinger (via GitHub integration) — ensure `GEMINI_API_KEY` is set in the environment variables.

Important: Do not serve raw `.tsx`/`.ts` files from the server — always serve built assets in `dist/`.

## Features

- **AI Transcription** with speaker diarization, auto-language detection, and exports (SRT, DOCX, PDF, JSON, TXT)
- **Batch OCR** with pacing engine and integrated translation
- **PDF/Document Tools:** PDF→Image, Image→PDF/Word, page-range extraction, image editor for preprocessing
- **Audio/Video Utilities:** Video→Audio, audio merging, multiple quality profiles
- **Text-to-Speech** with multiple AI personalities and Web Reader for fetching and reading URLs
- **Grammar Correction** with visual diff view
- **Export to Sheets (CSV)** with preview and cleanup
- **Local-first user-scoped history** and zero-tracking privacy model

For a developer-focused architecture overview, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Privacy & Local-First Principles

- Files and transcripts are stored locally by default; no cloud storage unless explicitly configured.
- Local storage keys are scoped per user profile to prevent cross-account leakage.
- No analytics or tracking code is included in the default distribution.

## Contributing & Development Notes

- See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for runtime considerations, environment variables, and deployment hints.
- Tests and CI: The project includes a GitHub Actions workflow that builds the app and checks that compiled `dist/` files do not reference `.tsx`.

---

If you need a marketing-friendly overview or metadata for app stores, see [`README_EXTENDED.md`](README_EXTENDED.md).
