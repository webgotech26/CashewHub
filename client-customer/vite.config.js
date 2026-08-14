import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * base path strategy:
 *
 *   Web (Vercel) → base: '/'
 *     Assets are served from the root: /assets/index-abc.js
 *     Required for SPA deep-link routing to work correctly.
 *
 *   Capacitor (iOS / Android) → base: './'
 *     Capacitor loads the app from the filesystem (file:// protocol).
 *     Absolute paths (/assets/...) don't resolve on file://, so relative
 *     paths (./) are needed.
 *
 * To build for Capacitor: VITE_CAPACITOR=true npm run build
 * To build for Vercel:    npm run build   (default)
 */
const isCapacitor = process.env.VITE_CAPACITOR === 'true';

export default defineConfig({
  plugins: [react()],
  server:  { port: 3000 },
  build:   { outDir: 'dist' },
  base:    isCapacitor ? './' : '/',
  resolve: {
    alias: {
      '@shared': '../shared',
    },
  },
});
