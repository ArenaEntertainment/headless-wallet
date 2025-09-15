import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Arena Headless Wallet + Reown AppKit Nuxt Demo',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Demo of Arena Headless Wallet with Reown AppKit using Nuxt 3' }
      ]
    }
  },

  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag.startsWith('appkit-') || tag.startsWith('w3m-')
    }
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [
      nodePolyfills({
        // Whether to polyfill specific globals.
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
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
  },

  nitro: {
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },

  devServer: {
    port: 5176
  },

  ssr: false, // Client-side only for wallet interactions
})