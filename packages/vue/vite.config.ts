import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WalletMockVue',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'vue',
        '@vue/devtools-api',
        '@arenaentertainment/wallet-mock',
        '@arenaentertainment/wallet-mock-shared',
        '@arenaentertainment/wallet-mock-standards'
      ]
    },
    sourcemap: true,
    minify: false
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});