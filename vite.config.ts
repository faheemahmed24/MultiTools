import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative base path so the app works in subfolders (like GitHub Pages /repo-name/)
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'esnext'
  }
})