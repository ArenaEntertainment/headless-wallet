import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      buffer: 'buffer',
      util: 'util'
    }
  },
  optimizeDeps: {
    include: ['buffer', 'crypto-browserify', 'util']
  },
  server: {
    port: 5174,
    open: true
  }
});