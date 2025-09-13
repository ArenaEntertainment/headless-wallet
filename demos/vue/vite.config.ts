import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3001,
    host: true
  },
  preview: {
    port: 3001,
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
          vendor: ['vue', 'vue-router'],
          wallet: ['@arenaentertainment/wallet-mock', '@arenaentertainment/wallet-mock-vue']
        }
      }
    }
  }
})