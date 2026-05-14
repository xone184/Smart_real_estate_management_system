import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    base: '/smart-real-estate-management-system/dist/',
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Allow Codespaces *.app.github.dev domains
      allowedHosts: true,
      proxy: {
        '/smart-real-estate-management-system/api': {
          // In Codespaces, PHP runs on port 8080 at the root of the workspace
          target: process.env.CODESPACES ? 'http://localhost:8080' : 'http://localhost',
          changeOrigin: true,
          rewrite: (path) => process.env.CODESPACES ? path.replace(/^\/smart-real-estate-management-system/, '') : path,
        },
        '/smart-real-estate-management-system/uploads': {
          target: process.env.CODESPACES ? 'http://localhost:8080' : 'http://localhost',
          changeOrigin: true,
          rewrite: (path) => process.env.CODESPACES ? path.replace(/^\/smart-real-estate-management-system/, '') : path,
        },
      },
    },
  };
});
