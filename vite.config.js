import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Esbuild options for minification and console removal
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
  
  build: {
    // Use default esbuild for minification (built-in, no extra dependency)
    minify: 'esbuild',
    
    // Enable source maps for debugging (optional, remove for smaller builds)
    sourcemap: false,
    
    // Code splitting configuration
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching
        manualChunks(id) {
          // React ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          // TensorFlow and AI models
          if (id.includes('@tensorflow') || id.includes('@mediapipe')) {
            return 'tensorflow';
          }
          // Firebase
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase';
          }
          // UI Libraries
          if (id.includes('lucide-react') || id.includes('react-select') || id.includes('react-markdown') || id.includes('remark-gfm')) {
            return 'ui-vendor';
          }
          // Media/Real-time communication
          if (id.includes('peerjs') || id.includes('socket.io-client')) {
            return 'media';
          }
          // Monaco editor
          if (id.includes('monaco-editor')) {
            return 'editor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          if (ext === 'css') {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
    
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500,
    
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },
  
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
    ],
  },
  
  // Enable compression preview
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  
  // Define environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})