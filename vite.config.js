import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false,
    },
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  build: {
    modulePreload: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('@tensorflow') || id.includes('@mediapipe')) return 'vendor-ml';
          if (id.includes('monaco-editor') || id.includes('@monaco-editor')) return 'vendor-editor';
          if (id.includes('react-dom') || id.includes('react-router-dom') || id.match(/[/\\]react[/\\]/)) return 'vendor-react';

          return 'vendor';
        },
      }
    },
    target: 'es2019',
    minify: 'esbuild',
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'simple-peer', 'buffer'],
    force: false
  },
  esbuild: {
    target: 'es2019'
  }
})