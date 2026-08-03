import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server:  { port: 3000 },
  build:   { outDir: 'dist' },
  base:    './',   // Required for Capacitor — loads assets from relative paths
  // Resolve shared utilities from the monorepo root
  resolve: {
    alias: {
      '@shared': '../shared',
    },
  },
});
