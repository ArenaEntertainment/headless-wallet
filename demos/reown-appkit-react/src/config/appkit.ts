import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia, solanaDevnet, solanaTestnet } from '@reown/appkit/networks'

export const projectId = '5f0684182dbf5c228f863711c8f499ac'

export const networks = [sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia, solanaDevnet, solanaTestnet]

const ethersAdapter = new EthersAdapter()

// SolanaAdapter auto-detects wallet-standard wallets
const solanaAdapter = new SolanaAdapter()

// Create AppKit instance
export const appKit = createAppKit({
  adapters: [ethersAdapter, solanaAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Arena Headless Wallet + Reown AppKit React Demo',
    description: 'Demo of Arena Headless Wallet with Reown AppKit using React',
    url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  features: {
    analytics: false
  }
})