import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia, solanaDevnet, solanaTestnet } from '@reown/appkit/networks'

// Simple logger
function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString()
  const logs = document.getElementById('logs')
  if (logs) {
    logs.innerHTML += `<div>[${timestamp}] ${message}</div>`
    logs.scrollTop = logs.scrollHeight
  }
}

// Simple UI update function
function updateUI() {
  const evmProvider = (window as any).ethereum
  const solanaProvider = (window as any).phantom?.solana

  const providerStatus = document.getElementById('provider-status')
  if (providerStatus) {
    providerStatus.innerHTML = `
      <div>EVM Provider: ${evmProvider ? '✅ Detected' : '❌ None'}</div>
      <div>Solana Provider: ${solanaProvider ? '✅ Detected' : '❌ None'}</div>
    `
  }
}

// Check for headless wallet integration via query parameter
const urlParams = new URLSearchParams(window.location.search)
const enableHeadlessWallet = urlParams.has('headless') || urlParams.get('wallet') === 'headless'

if (enableHeadlessWallet) {
  // Import and inject the headless wallet
  import('@arenaentertainment/headless-wallet').then(({ injectHeadlessWallet }) => {
    const wallet = injectHeadlessWallet({
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' },
        { privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8', type: 'solana' }
      ],
      branding: {
        name: 'Arena Headless Wallet',
        isMetaMask: true,
        isPhantom: true
      }
    })
    addLog('🎮 Headless wallet injected - integrated mode enabled')
    updateUI()
  }).catch(error => {
    addLog(`❌ Failed to inject headless wallet: ${error.message}`)
  })
} else {
  addLog('🎮 External AppKit Demo - No built-in wallet integration (add ?headless to URL to enable)')
}

// Initialize Reown AppKit
const metadata = {
  name: 'Arena Headless Wallet Demo',
  description: 'Headless wallet testing with Reown AppKit',
  url: window.location.origin,
  icons: []
}

const appKit = createAppKit({
  adapters: [
    new EthersAdapter(),
    new SolanaAdapter()
  ],
  networks: [sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia, solanaDevnet, solanaTestnet],
  projectId: '09f639e3602d49c15e37e0d3de9fb7a4', // Demo project ID
  metadata,
  features: {
    analytics: false
  }
})

// Make appKit and modal globally available for debugging and testing
;(window as any).appKit = appKit
;(window as any).modal = appKit  // For compatibility with some test expectations

// Enhanced UI update function for AppKit integration
async function updateAppKitUI() {
  const isConnected = appKit.getIsConnectedState() || false
  const address = appKit.getAddress() || null

  // Update connection status display
  const connectionStatus = document.getElementById('connection-status')
  if (connectionStatus) {
    if (isConnected) {
      connectionStatus.innerHTML = `<span class="status connected">Connected</span>`
    } else {
      connectionStatus.innerHTML = `<span class="status disconnected">Disconnected</span>`
    }
  }

  // Update account information display
  const accountInfo = document.getElementById('account-info')
  if (accountInfo) {
    if (isConnected && address) {
      const shortAddress = `${address.substring(0, 10)}...${address.substring(address.length - 8)}`
      accountInfo.innerHTML = `
        <div class="wallet-info">
          <strong>Connected Address:</strong> ${shortAddress}<br>
          <strong>Network:</strong> ${appKit.getCaipNetworkId() || 'Unknown'}
        </div>
      `
    } else {
      accountInfo.innerHTML = '<p>Connect your wallet to see account details</p>'
    }
  }

  // Also update basic provider status
  updateUI()
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
  // AppKit connect button
  document.getElementById('appkit-connect')?.addEventListener('click', () => {
    addLog('🔗 Opening AppKit modal...')
    appKit.open()
  })

  // AppKit disconnect button
  document.getElementById('appkit-disconnect')?.addEventListener('click', async () => {
    try {
      await appKit.disconnect()
      addLog('✅ AppKit disconnected')
      updateAppKitUI()
    } catch (error) {
      addLog(`❌ AppKit disconnect failed: ${error}`)
    }
  })

  // Listen for AppKit state changes
  appKit.subscribeState((state) => {
    if (state.open !== undefined) {
      addLog(`🔗 AppKit modal ${state.open ? 'opened' : 'closed'}`)
    }
    updateAppKitUI()
  })

  // Initial UI update
  updateUI()
  addLog('🎮 External AppKit Demo ready - waiting for wallet injection')

  // Check for providers periodically
  let checkCount = 0
  const checkProviders = setInterval(() => {
    checkCount++
    const evmProvider = (window as any).ethereum
    const solanaProvider = (window as any).phantom?.solana

    if (evmProvider || solanaProvider) {
      addLog(`✅ Providers detected: EVM=${!!evmProvider}, Solana=${!!solanaProvider}`)
      updateUI()
      clearInterval(checkProviders)
    } else if (checkCount >= 10) {
      addLog('⚠️ No providers detected after 5 seconds')
      clearInterval(checkProviders)
    }
  }, 500)

  // Make UI functions globally available for debugging
  ;(window as any).updateUI = updateUI
  ;(window as any).updateAppKitUI = updateAppKitUI
})