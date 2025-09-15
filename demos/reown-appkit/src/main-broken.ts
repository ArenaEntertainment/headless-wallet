import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { mainnet, polygon, arbitrum, optimism, solana } from '@reown/appkit/networks'
import { injectHeadlessWallet, type HeadlessWalletConfig } from '@arenaentertainment/headless-wallet'

// Test accounts - using hardhat test keys for EVM and JSON arrays for Solana
const TEST_ACCOUNTS = {
  evm: [
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',  // Account 0
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',  // Account 1
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'   // Account 2
  ],
  solana: [
    // Using JSON array format for Solana secret keys (64 bytes each)
    // These are deterministic test keys generated for demo purposes
    '[87,230,206,122,152,39,48,183,62,48,242,55,154,137,206,115,151,42,93,140,119,53,222,239,50,180,110,26,67,103,238,115,236,113,141,104,20,224,164,87,149,247,4,100,29,60,189,125,152,156,167,201,115,157,70,34,50,87,183,243,133,208,187,174]',  // Account 0
    '[206,152,192,126,54,19,76,108,167,172,112,51,204,148,99,159,253,235,124,237,63,191,247,43,83,247,224,198,55,108,134,54,156,128,68,234,185,70,30,105,9,230,52,249,181,97,252,80,38,120,91,112,0,255,151,36,220,206,233,26,110,224,208,95]',  // Account 1
    '[101,180,177,215,44,117,31,223,15,200,57,19,27,69,188,238,12,121,144,18,62,231,3,91,209,155,122,60,167,78,37,196,197,75,84,196,76,247,191,72,158,113,238,35,55,103,146,73,122,235,134,195,56,107,191,73,182,22,18,235,250,89,182,63]'   // Account 2
  ]
}

// Simple logger
function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString()
  const logs = document.getElementById('logs')
  if (logs) {
    logs.innerHTML += `<div>[${timestamp}] ${message}</div>`
    logs.scrollTop = logs.scrollHeight
  }
}

// Configure and inject the headless wallet
const walletConfig: HeadlessWalletConfig = {
  accounts: [
    // EVM accounts only for now
    ...TEST_ACCOUNTS.evm.map(privateKey => ({
      privateKey,
      type: 'evm' as const
    }))
  ],
  branding: {
    name: 'Arena Headless Wallet',
    icon: 'data:image/svg+xml,<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1080" rx="320" fill="black"/><path d="M203 830.128L470.486 230H607.658L876.001 830.128H730.255L510.78 300.301H565.649L345.316 830.128H203ZM336.743 701.529L373.608 596.078H682.245L719.968 701.529H336.743Z" fill="url(%23paint0_linear_436_3860)"/><defs><linearGradient id="paint0_linear_436_3860" x1="539.5" y1="830.128" x2="539.5" y2="230" gradientUnits="userSpaceOnUse"><stop stop-color="%2307D102"/><stop offset="1" stop-color="%23046B01"/></linearGradient></defs></svg>',
    rdns: 'com.arenaentertainment.headless-wallet',
    isMetaMask: true,
    isPhantom: true
  },
  evm: {
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo'
  },
  solana: {
    cluster: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com'
  }
}

// Inject the wallet into the browser
const wallet = injectHeadlessWallet(walletConfig)
addLog('🎮 Arena Headless Wallet injected')

// Get the providers for direct access
const evmProvider = wallet.getEthereumProvider()
// const solanaProvider = wallet.getSolanaProvider() // Not configured yet

// Initialize Reown AppKit
const metadata = {
  name: 'Arena Headless Wallet Demo',
  description: 'Headless wallet testing with Reown AppKit',
  url: window.location.origin,
  icons: [walletConfig.branding!.icon!]
}

const appKit = createAppKit({
  adapters: [
    new EthersAdapter(),
    new SolanaAdapter()
  ],
  networks: [mainnet, polygon, arbitrum, optimism, solana],
  projectId: '09f639e3602d49c15e37e0d3de9fb7a4', // Demo project ID
  metadata,
  features: {
    analytics: false
  }
})

// Helper functions for UI
function updateUI() {
  // Update EVM status
  const evmStatus = document.getElementById('evm-status')
  if (evmStatus) {
    if (wallet.hasEVM()) {
      const accountInfo = wallet.getEVMAccountInfo()
      if (accountInfo && accountInfo.accounts.length > 0) {
        evmStatus.innerHTML = `Connected: ${accountInfo.accounts[accountInfo.currentIndex].substring(0, 10)}... (${accountInfo.accounts.length} accounts)`
      } else {
        evmStatus.innerHTML = 'Not connected'
      }
    } else {
      evmStatus.innerHTML = 'No EVM wallet'
    }
  }

  // Update Solana status
  const solanaStatus = document.getElementById('solana-status')
  if (solanaStatus) {
    if (wallet.hasSolana()) {
      const accountInfo = wallet.getSolanaAccountInfo()
      if (accountInfo && accountInfo.accounts.length > 0) {
        solanaStatus.innerHTML = `Connected: ${accountInfo.accounts[accountInfo.currentIndex].substring(0, 10)}... (${accountInfo.accounts.length} accounts)`
      } else {
        solanaStatus.innerHTML = 'Not connected'
      }
    } else {
      solanaStatus.innerHTML = 'No Solana wallet'
    }
  }

  // Update AppKit connection status
  const appKitStatus = document.getElementById('appkit-status')
  if (appKitStatus) {
    const isConnected = appKit.getIsConnected()
    const address = appKit.getAddress()
    const chainId = appKit.getCaipNetwork()

    if (isConnected && address) {
      appKitStatus.innerHTML = `Connected: ${address.substring(0, 10)}... on ${chainId || 'unknown chain'}`
    } else {
      appKitStatus.innerHTML = 'Not connected'
    }
  }
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
  // EVM direct wallet buttons
  document.getElementById('evm-connect')?.addEventListener('click', async () => {
    try {
      const accounts = await evmProvider.request({ method: 'eth_requestAccounts' })
      addLog(`✅ EVM connected: ${accounts.join(', ')}`)
      updateUI()
    } catch (error) {
      addLog(`❌ EVM connect failed: ${error}`)
    }
  })

  document.getElementById('evm-disconnect')?.addEventListener('click', async () => {
    try {
      await evmProvider.disconnect()
      addLog('✅ EVM disconnected')
      updateUI()
    } catch (error) {
      addLog(`❌ EVM disconnect failed: ${error}`)
    }
  })

  // Solana direct wallet buttons (disabled for now)
  /*
  document.getElementById('solana-connect')?.addEventListener('click', async () => {
    try {
      const result = await solanaProvider.connect()
      addLog(`✅ Solana connected: ${JSON.stringify(result)}`)
      updateUI()
    } catch (error) {
      addLog(`❌ Solana connect failed: ${error}`)
    }
  })

  document.getElementById('solana-disconnect')?.addEventListener('click', async () => {
    try {
      await solanaProvider.disconnect()
      addLog('✅ Solana disconnected')
      updateUI()
    } catch (error) {
      addLog(`❌ Solana disconnect failed: ${error}`)
    }
  })
  */

  // AppKit buttons
  document.getElementById('appkit-connect')?.addEventListener('click', () => {
    addLog('🔗 Opening AppKit modal...')
    appKit.open()
  })

  document.getElementById('appkit-disconnect')?.addEventListener('click', async () => {
    try {
      await appKit.disconnect()
      addLog('✅ AppKit disconnected')
      updateUI()
    } catch (error) {
      addLog(`❌ AppKit disconnect failed: ${error}`)
    }
  })

  // Switch account buttons
  document.getElementById('switch-evm-account')?.addEventListener('click', () => {
    const accountInfo = wallet.getEVMAccountInfo()
    if (accountInfo) {
      const nextIndex = (accountInfo.currentIndex + 1) % accountInfo.accounts.length
      wallet.switchEVMAccount(nextIndex)
      addLog(`🔄 Switched to EVM account ${nextIndex}: ${accountInfo.accounts[nextIndex]}`)
      updateUI()
    }
  })

  document.getElementById('switch-solana-account')?.addEventListener('click', () => {
    const accountInfo = wallet.getSolanaAccountInfo()
    if (accountInfo) {
      const nextIndex = (accountInfo.currentIndex + 1) % accountInfo.accounts.length
      wallet.switchSolanaAccount(nextIndex)
      addLog(`🔄 Switched to Solana account ${nextIndex}: ${accountInfo.accounts[nextIndex]}`)
      updateUI()
    }
  })

  // Test signing buttons
  document.getElementById('sign-message')?.addEventListener('click', async () => {
    try {
      const accounts = await evmProvider.request({ method: 'eth_accounts' })
      if (accounts.length === 0) {
        throw new Error('No accounts connected')
      }

      const message = 'Hello from Arena Headless Wallet!'
      const signature = await evmProvider.request({
        method: 'personal_sign',
        params: [message, accounts[0]]
      })

      document.getElementById('signature-result')!.innerHTML = `
        <div class="info-box">
          <h4>Message Signature</h4>
          <div class="code">Message: ${message}</div>
          <div class="code">Signature: ${signature}</div>
        </div>
      `
      addLog(`✅ Message signed: ${signature.substring(0, 20)}...`)
    } catch (error) {
      addLog(`❌ Signing failed: ${error}`)
    }
  })

  // Solana sign message (disabled for now)
  /*
  document.getElementById('solana-sign-message')?.addEventListener('click', async () => {
    try {
      const message = new TextEncoder().encode('Hello from Arena Headless Wallet on Solana!')
      const result = await solanaProvider.signMessage(message)

      document.getElementById('solana-result')!.innerHTML = `
        <div class="info-box">
          <h4>Solana Message Signed</h4>
          <div class="code">Message: Hello from Arena Headless Wallet on Solana!</div>
          <div class="code">Signature: ${Array.from(result.signature, (b: number) => b.toString(16).padStart(2, '0')).join('').substring(0, 40)}...</div>
        </div>
      `
      addLog(`✅ Solana message signed`)
    } catch (error) {
      addLog(`❌ Solana sign message failed: ${error}`)
    }
  })
  */

  // Listen for wallet events
  evmProvider.on('accountsChanged', (accounts: string[]) => {
    addLog(`🔄 EVM accounts changed: ${accounts.join(', ') || 'disconnected'}`)
    updateUI()
  })

  evmProvider.on('chainChanged', (chainId: string) => {
    addLog(`🔄 EVM chain changed: ${chainId}`)
    updateUI()
  })

  evmProvider.on('connect', (info: { chainId: string }) => {
    addLog(`✅ EVM wallet connected with chain: ${info.chainId}`)
    updateUI()
  })

  evmProvider.on('disconnect', (error?: any) => {
    addLog(`🔓 EVM wallet disconnected${error ? `: ${error.message}` : ''}`)
    updateUI()
  })

  // Solana events (disabled for now)
  /*
  solanaProvider.on('connect', (publicKey: any) => {
    addLog(`✅ Solana wallet connected: ${publicKey}`)
    updateUI()
  })

  solanaProvider.on('disconnect', () => {
    addLog('🔓 Solana wallet disconnected')
    updateUI()
  })
  */

  // Listen for AppKit events
  appKit.subscribeState((state) => {
    if (state.open !== undefined) {
      addLog(`🔗 AppKit modal ${state.open ? 'opened' : 'closed'}`)
    }
    updateUI()
  })

  // Initial UI update
  updateUI()
  addLog('🎮 Arena Headless Wallet + Reown AppKit Demo ready')
})