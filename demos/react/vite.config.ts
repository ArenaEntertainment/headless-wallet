import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  define: {
    // Ensure process.env is available for environment checks
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          wallet: ['@arenaentertainment/wallet-mock', '@arenaentertainment/wallet-mock-react']
        }
      }
    }
  }
})