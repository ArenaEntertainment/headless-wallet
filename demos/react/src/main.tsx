import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HeadlessWalletProvider } from '@arenaentertainment/headless-wallet-react'
import App from './App.tsx'
import './index.css'

// Test accounts for both EVM and Solana
const TEST_ACCOUNTS = {
  wallet1: {
    evm: ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'], // Account 0
    solana: ['[68,27,251,159,65,135,176,118,184,67,112,62,75,233,225,211,249,54,192,133,140,49,235,192,177,204,64,180,171,118,150,246,220,231,108,99,12,156,207,126,172,247,217,239,249,133,49,94,143,133,48,117,228,226,185,8,191,39,148,111,103,170,229,180]'] // FsKNCd2rATjpA2bZYmkUBm38p611BkH4yumFKK1Nj54P
  },
  wallet2: {
    evm: ['0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'], // Account 1
    solana: ['[109,52,131,38,179,64,7,72,38,102,205,174,220,176,191,180,42,194,186,211,183,72,15,139,255,246,24,122,70,205,74,83,141,138,45,207,187,224,51,48,86,242,17,12,46,36,22,87,84,7,216,112,72,221,111,31,55,217,7,112,237,83,26,18]'] // AXWh7NXbbGEgiuHLiLaHQ3S3ahr83knQ7j1c5rChUkF3
  },
  wallet3: {
    evm: ['0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'], // Account 2
    solana: ['[197,199,162,254,4,56,181,112,208,223,153,131,59,49,155,119,237,103,205,71,68,122,44,77,123,23,225,62,244,122,220,195,151,160,200,125,125,125,85,197,171,45,129,237,63,212,178,106,40,26,20,96,44,155,255,21,221,76,37,22,93,157,181,216]'] // BCtm4zf81yLB27CosEkySoFUkkG1LBugBC98U6RZKzrj
  }
}

// Configuration for multiple wallets to demonstrate multi-wallet support
const wallet1Config = {
  accounts: [
    ...TEST_ACCOUNTS.wallet1.evm.map(privateKey => ({
      privateKey,
      type: 'evm' as const
    })),
    ...TEST_ACCOUNTS.wallet1.solana.map(secretKey => ({
      privateKey: secretKey,
      type: 'solana' as const
    }))
  ],
  branding: {
    name: 'Arena Wallet',
    rdns: 'com.arena.wallet',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%234A90E2"/><text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="16">A</text></svg>'
  },
  evm: {
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo'
  },
  solana: {
    cluster: 'devnet' as const,
    rpcUrl: 'https://api.devnet.solana.com'
  },
  enabled: true,
  solanaWindowProperty: 'phantom.solana'
}

const wallet2Config = {
  accounts: [
    ...TEST_ACCOUNTS.wallet2.evm.map(privateKey => ({
      privateKey,
      type: 'evm' as const
    })),
    ...TEST_ACCOUNTS.wallet2.solana.map(secretKey => ({
      privateKey: secretKey,
      type: 'solana' as const
    }))
  ],
  branding: {
    name: 'Test Wallet',
    rdns: 'com.test.wallet',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%2342E24A"/><text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="16">T</text></svg>'
  },
  evm: {
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo'
  },
  solana: {
    cluster: 'devnet' as const,
    rpcUrl: 'https://api.devnet.solana.com'
  },
  enabled: true,
  solanaWindowProperty: 'solana'
}

const wallet3Config = {
  accounts: [
    ...TEST_ACCOUNTS.wallet3.evm.map(privateKey => ({
      privateKey,
      type: 'evm' as const
    })),
    ...TEST_ACCOUNTS.wallet3.solana.map(secretKey => ({
      privateKey: secretKey,
      type: 'solana' as const
    }))
  ],
  branding: {
    name: 'Dev Wallet',
    rdns: 'com.dev.wallet',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23E24A42"/><text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="16">D</text></svg>'
  },
  evm: {
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo'
  },
  solana: {
    cluster: 'devnet' as const,
    rpcUrl: 'https://api.devnet.solana.com'
  },
  enabled: true,
  solanaWindowProperty: undefined // No window injection, EIP-6963 only
}

// Note: React provider currently only supports one wallet config at a time
// For multi-wallet demo, we'll use the first wallet as primary
// Additional wallets would need to be injected directly using injectHeadlessWallet from core
const primaryWalletConfig = wallet1Config

// To demonstrate multiple wallets in React, we need to inject the additional wallets directly
import { injectHeadlessWallet } from '@arenaentertainment/headless-wallet'

// Inject additional wallets when the app loads
if (typeof window !== 'undefined') {
  // Inject Test Wallet
  injectHeadlessWallet({
    ...wallet2Config,
    solanaWindowProperty: 'solana'
  })

  // Inject Dev Wallet
  injectHeadlessWallet({
    ...wallet3Config,
    solanaWindowProperty: undefined
  })

  console.log('🎮 Multiple wallets injected: Arena Wallet (via React provider), Test Wallet, Dev Wallet')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <HeadlessWalletProvider {...primaryWalletConfig}>
        <App />
      </HeadlessWalletProvider>
    </BrowserRouter>
  </React.StrictMode>,
)