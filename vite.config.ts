
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to resolve TS error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    base: '/MultiTools/', // Configuration for GitHub Pages deployment at https://<user>.github.io/MultiTools/
    define: {
      // Ensure API_KEY is a string (empty if missing) to prevent "undefined" crashes
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
  };
});
