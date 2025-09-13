import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MockWalletProvider } from '@arenaentertainment/wallet-mock-react'
import { AccountType } from '@arenaentertainment/wallet-mock-shared'
import App from './App.tsx'
import './index.css'

// Mock wallet configuration for the demo
const walletConfig = {
  // Create multiple accounts to showcase account management
  accounts: [
    { type: 'evm' as const, label: 'EVM Account 1' },
    { type: 'solana' as const, label: 'Solana Account 1' },
    { type: 'dual_chain' as const, label: 'Multi-Chain Account' },
    { type: 'evm' as const, label: 'EVM Account 2' },
  ],

  // Auto-connect for demo purposes (disable in production)
  autoConnect: true,

  // Production safety configuration
  production: {
    // Only allow on localhost and development domains
    allowedHosts: ['localhost', '127.0.0.1', 'dev.example.com'],
    throwInProduction: true,
    enableWarnings: true
  },

  // Default chain configurations
  chains: {
    evm: {
      chainId: '1', // Ethereum mainnet
      rpcUrl: 'https://mainnet.infura.io/v3/demo-key'
    },
    solana: {
      cluster: 'devnet' as const,
      rpcUrl: 'https://api.devnet.solana.com'
    }
  },

  // Enable performance monitoring
  performance: {
    enableMetrics: true,
    sampleRate: 0.1 // 10% sampling in demo
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MockWalletProvider {...walletConfig}>
        <App />
      </MockWalletProvider>
    </BrowserRouter>
  </React.StrictMode>,
)