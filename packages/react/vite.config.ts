import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['**/*.test.*', '**/*.spec.*', 'node_modules/**']
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WalletMockReact',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@arenaentertainment/wallet-mock',
        '@arenaentertainment/wallet-mock-shared',
        '@arenaentertainment/wallet-mock-standards'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@arenaentertainment/wallet-mock': 'WalletMock',
          '@arenaentertainment/wallet-mock-shared': 'WalletMockShared',
          '@arenaentertainment/wallet-mock-standards': 'WalletMockStandards'
        }
      }
    },
    target: 'es2020',
    minify: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});