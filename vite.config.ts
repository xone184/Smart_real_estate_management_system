import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');

  // Detect GitHub Codespaces via system env (set by GitHub) or .env file
  const isCodespaces =
    process.env.CODESPACES === 'true' ||
    env.VITE_CODESPACES === 'true';

  // In Codespaces: PHP runs on :8080, path prefix must be stripped
  // Locally (XAMPP): PHP runs on :80, path is passed as-is
  const phpTarget = isCodespaces ? 'http://localhost:8080' : 'http://localhost';
  const rewritePath = (p: string) =>
    isCodespaces ? p.replace(/^\/smart-real-estate-management-system/, '') : p;

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
      // Allow Codespaces *.app.github.dev domains and all local hosts
      allowedHosts: true,
      watch: {
        ignored: ['**/ai_service/data/**']
      },
      proxy: {
        '/smart-real-estate-management-system/api': {
          target: phpTarget,
          changeOrigin: true,
          secure: false,
          rewrite: rewritePath,
        },
        '/smart-real-estate-management-system/uploads': {
          target: phpTarget,
          changeOrigin: true,
          secure: false,
          rewrite: rewritePath,
        },
      },
    },
  };
});
