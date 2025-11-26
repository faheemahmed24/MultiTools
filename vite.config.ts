import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base to './' to allow the app to be served from any subdirectory or domain.
  // This ensures assets (JS/CSS) are requested relatively (e.g., "./assets/index.js")
  // rather than absolutely (e.g., "/assets/index.js"), preventing 404s.
  base: './',
})