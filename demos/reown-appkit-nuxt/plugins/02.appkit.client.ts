import { createAppKit } from '@reown/appkit/vue'
import { ethersAdapter, solanaAdapter, networks, projectId } from '~/config/appkit'

export default defineNuxtPlugin(() => {
  // Create AppKit instance
  const appKit = createAppKit({
    adapters: [ethersAdapter, solanaAdapter],
    networks,
    projectId,
    metadata: {
      name: 'Arena Headless Wallet + Reown AppKit Nuxt Demo',
      description: 'Demo of Arena Headless Wallet with Reown AppKit using Nuxt 3',
      url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      icons: ['https://avatars.githubusercontent.com/u/37784886']
    },
    features: {
      analytics: false
    }
  })

  return {
    provide: {
      appKit
    }
  }
})