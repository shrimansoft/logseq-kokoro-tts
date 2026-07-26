import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/main.ts',
      formats: ['iife'],
      name: 'LogseqKokoroTts',
      fileName: () => 'index.js',
    },
  },
  server: {
    port: 8080,
  },
});
