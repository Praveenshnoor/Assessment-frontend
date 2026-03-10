import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // Only compress files larger than 10kb
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression (better compression ratio)
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  build: {
    // Output directory
    outDir: 'dist',
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
      mangle: {
        safari10: true,
      },
    },
    // Source maps for debugging (disable in production for smaller size)
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize chunking strategy
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks - split large libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-select'],
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'dompurify'],
          
          // Heavy AI/ML libraries - keep separate for lazy loading
          'ai-detection': ['@mediapipe/tasks-vision'],
          'tensorflow': ['@tensorflow/tfjs', '@tensorflow-models/blazeface', '@tensorflow-models/coco-ssd'],
          
          // Code editor - lazy loaded only on test page
          'monaco-editor': ['@monaco-editor/react'],
          

          // Real-time communication
          'realtime': ['socket.io-client', 'peerjs'],
          
          // Utils
          'utils': ['axios', 'p-limit'],
        },
        // Naming pattern for chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Organize assets by type
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    // Report compressed size
    reportCompressedSize: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react',
    ],
    exclude: [
      '@mediapipe/tasks-vision',
      '@tensorflow/tfjs',
      '@monaco-editor/react',
    ],
  },
  // Build-specific optimizations
  esbuild: {
    // Drop console statements in production
    drop: ['console', 'debugger'],
    // Optimize for modern browsers
    legalComments: 'none',
  },
  server: {
    // HMR optimization
    hmr: {
      overlay: false,
    },
  },
})