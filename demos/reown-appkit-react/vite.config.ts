import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  server: {
    port: 5176,
    open: true
  },
  preview: {
    port: 5176
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js',
      'ethers',
      '@reown/appkit',
      '@reown/appkit-adapter-ethers',
      '@reown/appkit-adapter-solana'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
})
