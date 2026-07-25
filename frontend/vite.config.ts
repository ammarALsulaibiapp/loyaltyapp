import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // DISABLE PWA COMPLETELY - NO MORE CACHE ISSUES
    // VitePWA removed
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true, // Expose to network
    // OR use: host: '0.0.0.0' 
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
