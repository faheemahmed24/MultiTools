import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/gemini': {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, _req, _res) => {
                proxyReq.path += (proxyReq.path.includes('?') ? '&' : '?') + `key=${env.GEMINI_API_KEY}`;
              });
            },
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(process.cwd(), '.'),
        }
      }
      ,
      build: {
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
          output: {
            manualChunks(id: string) {
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) return 'vendor_react';
                if (id.includes('pdfjs-dist') || id.includes('html2canvas') || id.includes('jspdf') || id.includes('docx') || id.includes('jszip') || id.includes('mammoth')) return 'vendor_large';
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
