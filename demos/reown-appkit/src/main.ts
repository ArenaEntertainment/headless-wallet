import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { mainnet, polygon, arbitrum, optimism, solana } from '@reown/appkit/networks'
import { SolflareWalletAdapter, PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { ethers } from 'ethers'

// Test accounts - using hardhat test keys for consistency
const TEST_ACCOUNTS = [
  {
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  },
  {
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  }
]

interface MockWallet {
  request(args: { method: string; params?: any[] }): Promise<any>
  on(event: string, handler: (...args: any[]) => void): void
  removeListener(event: string, handler: (...args: any[]) => void): void
  isMetaMask: boolean
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

// Create our mock wallet following the original pattern
class ArenaMockWallet implements MockWallet {
  private listeners: Map<string, Set<Function>> = new Map()
  private accounts: string[] = []
  private currentChain: string = '0x1' // Ethereum mainnet
  private isDisconnected: boolean = true

  // MetaMask compatibility
  public readonly isMetaMask = true

  constructor() {
    addLog('🎮 Arena Mock Wallet created')
  }

  // Add direct disconnect method that AppKit might call
  disconnect() {
    addLog('🔓 Direct disconnect() method called by AppKit')
    return this.performDisconnect('Direct method')
  }

  // Centralised disconnect logic
  private performDisconnect(source: string) {
    this.isDisconnected = true
    this.accounts = []

    addLog(`✅ Disconnecting wallet (${source})`)

    // Critical: emit accountsChanged with empty array first - this is what AppKit listens for
    this.emit('accountsChanged', [])

    // Then emit disconnect event for good measure
    this.emit('disconnect', { code: 1013, message: 'User disconnected' })

    // Force UI update
    setTimeout(() => updateUI(), 50)
  }

  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }

  removeListener(event: string, handler: Function): void {
    this.listeners.get(event)?.delete(handler)
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(...args)
      } catch (error) {
        console.error(`Error in ${event} handler:`, error)
      }
    })
  }

  async request({ method, params = [] }: { method: string; params?: any[] }): Promise<any> {
    addLog(`📞 ${method}${params.length ? ` ${JSON.stringify(params).substring(0, 50)}...` : ''}`)

    switch (method) {
      case 'eth_requestAccounts': {
        if (this.isDisconnected) {
          this.isDisconnected = false
          this.accounts = TEST_ACCOUNTS.map(acc => acc.address)
          addLog(`✅ Connected! Found ${this.accounts.length} accounts`)

          this.emit('connect', { chainId: this.currentChain })
          this.emit('accountsChanged', this.accounts)
          updateUI()
        }
        return this.accounts
      }

      case 'eth_accounts': {
        return this.isDisconnected ? [] : this.accounts
      }

      case 'eth_chainId': {
        return this.currentChain
      }

      case 'wallet_switchEthereumChain': {
        const { chainId } = params[0]
        const oldChain = this.currentChain
        this.currentChain = chainId
        addLog(`🔄 Chain switched: ${oldChain} → ${chainId}`)

        this.emit('chainChanged', chainId)
        updateUI()
        return null
      }

      case 'wallet_getCapabilities': {
        return {
          '0x1': {   // Ethereum
            accounts: { supported: true },
            chainSwitching: { supported: true },
            methods: {
              supported: ['personal_sign', 'eth_signTypedData_v4', 'wallet_switchEthereumChain']
            }
          },
          '0x89': {  // Polygon
            accounts: { supported: true },
            chainSwitching: { supported: true },
            methods: {
              supported: ['personal_sign', 'eth_signTypedData_v4', 'wallet_switchEthereumChain']
            }
          },
          '0xa4b1': { // Arbitrum
            accounts: { supported: true },
            chainSwitching: { supported: true },
            methods: {
              supported: ['personal_sign', 'eth_signTypedData_v4', 'wallet_switchEthereumChain']
            }
          },
          '0xa': {   // Optimism
            accounts: { supported: true },
            chainSwitching: { supported: true },
            methods: {
              supported: ['personal_sign', 'eth_signTypedData_v4', 'wallet_switchEthereumChain']
            }
          }
        }
      }

      case 'personal_sign': {
        const [message, address] = params
        const account = TEST_ACCOUNTS.find(acc =>
          acc.address.toLowerCase() === address.toLowerCase()
        )
        if (!account) throw new Error('Account not found')

        const wallet = new ethers.Wallet(account.privateKey)
        const signature = await wallet.signMessage(message)

        addLog(`✍️ personal_sign: ${message} → ${signature.substring(0, 20)}...`)
        return signature
      }

      case 'eth_signTypedData_v4': {
        const [address, typedDataJson] = params
        const account = TEST_ACCOUNTS.find(acc =>
          acc.address.toLowerCase() === address.toLowerCase()
        )
        if (!account) throw new Error('Account not found')

        const typedData = JSON.parse(typedDataJson)
        const wallet = new ethers.Wallet(account.privateKey)

        // Remove EIP712Domain from types for ethers
        const { EIP712Domain, ...types } = typedData.types
        const signature = await wallet.signTypedData(
          typedData.domain,
          types,
          typedData.message
        )

        addLog(`✍️ eth_signTypedData_v4 signed → ${signature.substring(0, 20)}...`)
        return signature
      }

      case 'eth_sendTransaction': {
        const [txParams] = params
        addLog(`💸 Transaction: ${JSON.stringify(txParams)}`)

        // Simulate transaction hash
        const fakeHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0')).join('')

        addLog(`✅ Transaction sent: ${fakeHash}`)
        return fakeHash
      }

      case 'wallet_requestPermissions': {
        const [{ eth_accounts }] = params || [{}]
        if (eth_accounts) {
          // Grant eth_accounts permission (same as eth_requestAccounts)
          if (this.isDisconnected) {
            this.isDisconnected = false
            this.accounts = TEST_ACCOUNTS.map(acc => acc.address)
            addLog(`✅ Permission granted for eth_accounts`)

            this.emit('connect', { chainId: this.currentChain })
            this.emit('accountsChanged', this.accounts)
            updateUI()
          }
        }
        return [{ parentCapability: 'eth_accounts' }]
      }

      case 'wallet_getPermissions': {
        if (this.isDisconnected) {
          return []
        }
        return [{ parentCapability: 'eth_accounts' }]
      }

      case 'wallet_revokePermissions': {
        addLog(`🔓 wallet_revokePermissions called`)
        this.performDisconnect('wallet_revokePermissions')
        return null
      }

      case 'wallet_disconnect': {
        addLog(`🔓 wallet_disconnect called`)
        this.performDisconnect('wallet_disconnect')
        return null
      }

      case 'eth_disconnect': {
        addLog(`🔓 eth_disconnect called`)
        this.performDisconnect('eth_disconnect')
        return null
      }

      default:
        // Log any unhandled methods that might be disconnect-related
        if (method.toLowerCase().includes('disconnect') || method.toLowerCase().includes('revoke')) {
          addLog(`🔍 Potential disconnect method: ${method}`)
          this.performDisconnect(`unhandled-${method}`)
          return null
        }

        addLog(`❌ Unsupported method: ${method}`)
        throw new Error(`Unsupported method: ${method}`)
    }
  }
}

// Create the mock wallet instance
const mockWallet = new ArenaMockWallet()

// EIP-6963 wallet discovery (following original library pattern exactly)
function announceWallet() {
  const info = {
    uuid: crypto.randomUUID(),
    name: 'Arena Mock Wallet',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/></svg>',
    rdns: 'com.arena.mock-wallet'
  }

  const detail = { info, provider: mockWallet }
  const announceEvent = new CustomEvent('eip6963:announceProvider', {
    detail: Object.freeze(detail)
  })

  window.dispatchEvent(announceEvent)
  addLog('📡 EIP-6963 wallet announcement dispatched')
}

// Set up window.ethereum and EIP-6963 (following original library exactly)
;(window as any).ethereum = mockWallet

// Add global disconnect method that AppKit can call
;(window as any).ethereum.disconnect = () => {
  addLog('🔓 Global disconnect method called')
  return mockWallet.performDisconnect('Global method')
}

// Make performDisconnect public so it can be called externally
mockWallet.performDisconnect = mockWallet['performDisconnect']

// Listen for EIP-6963 requests
window.addEventListener('eip6963:requestProvider', () => {
  addLog('📡 EIP-6963 provider requested')
  announceWallet()
})

// Announce wallet immediately and on DOM ready
announceWallet()
document.addEventListener('DOMContentLoaded', announceWallet)

// Create adapters
const ethersAdapter = new EthersAdapter()
const solanaAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
})

// Create AppKit instance with ethers adapter (no wagmi!)
const appKit = createAppKit({
  adapters: [ethersAdapter, solanaAdapter],
  networks: [mainnet, polygon, arbitrum, optimism, solana],
  metadata: {
    name: 'Arena Wallet Mock + Reown AppKit Demo',
    description: 'Demo of Arena mock wallet with Reown AppKit using ethers',
    url: window.location.origin,
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  projectId: '5f0684182dbf5c228f863711c8f499ac',
  features: {
    analytics: false
  }
})

// Try to hook into AppKit's disconnect mechanism
let lastConnectedState = false
try {
  // Listen for AppKit state changes that might indicate disconnect attempts
  const originalSubscribe = appKit.subscribeState || appKit.subscribe;
  if (originalSubscribe) {
    addLog('🔧 Setting up AppKit state listener for disconnect detection')
    const stateHandler = (state: any) => {
      const stateStr = JSON.stringify(state)
      addLog(`🔍 AppKit state change: ${stateStr.substring(0, 100)}...`)

      // Monitor for disconnect attempts by checking if AppKit thinks we're disconnected
      // while our wallet still thinks it's connected
      const appKitDisconnected = state && (
        state.address === undefined ||
        state.address === null ||
        state.address === '' ||
        state.isConnected === false ||
        stateStr.includes('"address":""') ||
        stateStr.includes('"address":null')
      )

      const walletConnected = !mockWallet['isDisconnected'] && mockWallet['accounts'].length > 0

      if (appKitDisconnected && walletConnected && lastConnectedState) {
        addLog('🚨 AppKit disconnect detected! Triggering wallet disconnect...')
        setTimeout(() => {
          mockWallet.performDisconnect('AppKit state change')
        }, 100)
      }

      lastConnectedState = !appKitDisconnected
    }

    if (typeof originalSubscribe === 'function') {
      originalSubscribe.call(appKit, stateHandler)
    }
  }
} catch (e) {
  addLog(`⚠️ Could not set up AppKit state listener: ${e}`)
}

// Additional monitoring: Watch for changes in the AppKit button state
setInterval(() => {
  // Check if AppKit shows disconnected while wallet is connected
  const connectButton = document.querySelector('w3m-button')
  if (connectButton) {
    const buttonText = connectButton.textContent || ''
    const walletConnected = !mockWallet['isDisconnected'] && mockWallet['accounts'].length > 0

    if (buttonText.includes('Connect') && walletConnected) {
      addLog('🚨 AppKit button shows "Connect" but wallet is connected - triggering disconnect')
      mockWallet.performDisconnect('Button state mismatch')
    }
  }
}, 1000)

// UI Functions
function updateUI() {
  const isConnected = !mockWallet['isDisconnected'] && mockWallet['accounts'].length > 0

  // Update connection status
  const statusEl = document.getElementById('connection-status')
  if (statusEl) {
    statusEl.innerHTML = `<span class="status ${isConnected ? 'connected' : 'disconnected'}">${isConnected ? 'Connected' : 'Disconnected'}</span>`
  }

  // Update account info
  const accountEl = document.getElementById('account-info')
  if (accountEl) {
    if (isConnected) {
      accountEl.innerHTML = `
        <div class="wallet-info">
          <h4>Connected Accounts</h4>
          ${TEST_ACCOUNTS.map((acc, i) => `
            <div class="code">Account ${i + 1}: ${acc.address}</div>
          `).join('')}
        </div>
      `
    } else {
      accountEl.innerHTML = '<p>Connect your wallet to see account details</p>'
    }
  }

  // Update network info
  const networkEl = document.getElementById('network-info')
  if (networkEl && isConnected) {
    const chainNames: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x89': 'Polygon',
      '0xa4b1': 'Arbitrum One',
      '0xa': 'Optimism'
    }

    const chainId = mockWallet['currentChain']
    networkEl.innerHTML = `
      <div class="info-box">
        <h4>Current Network</h4>
        <div class="code">Chain ID: ${chainId}</div>
        <div class="code">Network: ${chainNames[chainId] || 'Unknown'}</div>
      </div>
    `
  } else if (networkEl) {
    networkEl.innerHTML = '<p>Connect to see network details</p>'
  }

  // Enable/disable buttons
  const buttons = ['sign-message', 'sign-typed-data', 'send-transaction', 'switch-to-polygon', 'switch-to-ethereum', 'get-capabilities']
  buttons.forEach(id => {
    const btn = document.getElementById(id) as HTMLButtonElement
    if (btn) btn.disabled = !isConnected
  })
}

// Event handlers
document.addEventListener('DOMContentLoaded', () => {
  // Clear logs button
  document.getElementById('clear-logs')?.addEventListener('click', () => {
    const logs = document.getElementById('logs')
    if (logs) {
      logs.innerHTML = '<div>✨ Logs cleared</div>'
    }
  })

  // Chain switching buttons
  document.getElementById('switch-to-polygon')?.addEventListener('click', async () => {
    try {
      await mockWallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }]
      })
    } catch (error) {
      addLog(`❌ Chain switch failed: ${error}`)
    }
  })

  document.getElementById('switch-to-ethereum')?.addEventListener('click', async () => {
    try {
      await mockWallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }]
      })
    } catch (error) {
      addLog(`❌ Chain switch failed: ${error}`)
    }
  })

  // Get capabilities button
  document.getElementById('get-capabilities')?.addEventListener('click', async () => {
    try {
      const capabilities = await mockWallet.request({ method: 'wallet_getCapabilities' })
      document.getElementById('network-info')!.innerHTML += `
        <div class="info-box">
          <h4>Wallet Capabilities</h4>
          <div class="code">${JSON.stringify(capabilities, null, 2)}</div>
        </div>
      `
    } catch (error) {
      addLog(`❌ Get capabilities failed: ${error}`)
    }
  })

  // Signing buttons
  document.getElementById('sign-message')?.addEventListener('click', async () => {
    try {
      const accounts = await mockWallet.request({ method: 'eth_accounts' })
      const message = 'Hello from Arena Mock Wallet!'
      const signature = await mockWallet.request({
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
    } catch (error) {
      addLog(`❌ Signing failed: ${error}`)
    }
  })

  document.getElementById('sign-typed-data')?.addEventListener('click', async () => {
    try {
      const accounts = await mockWallet.request({ method: 'eth_accounts' })
      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' }
          ],
          TestMessage: [
            { name: 'content', type: 'string' },
            { name: 'timestamp', type: 'uint256' }
          ]
        },
        primaryType: 'TestMessage',
        domain: {
          name: 'Arena Mock Wallet Test',
          version: '1',
          chainId: 1
        },
        message: {
          content: 'This is a test typed data message',
          timestamp: Date.now()
        }
      }

      const signature = await mockWallet.request({
        method: 'eth_signTypedData_v4',
        params: [accounts[0], JSON.stringify(typedData)]
      })

      document.getElementById('signature-result')!.innerHTML = `
        <div class="info-box">
          <h4>Typed Data Signature</h4>
          <div class="code">Message: ${typedData.message.content}</div>
          <div class="code">Signature: ${signature}</div>
        </div>
      `
    } catch (error) {
      addLog(`❌ Typed data signing failed: ${error}`)
    }
  })

  // Send transaction button
  document.getElementById('send-transaction')?.addEventListener('click', async () => {
    try {
      const accounts = await mockWallet.request({ method: 'eth_accounts' })
      const txHash = await mockWallet.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: '0x742d35Cc9000C312C4a83dFB8EBf34B0f4FD3fF5',
          value: '0x2386f26fc10000', // 0.01 ETH
          gas: '0x5208'
        }]
      })

      document.getElementById('transaction-result')!.innerHTML = `
        <div class="info-box">
          <h4>Transaction Sent</h4>
          <div class="code">Hash: ${txHash}</div>
        </div>
      `
    } catch (error) {
      addLog(`❌ Transaction failed: ${error}`)
    }
  })

  // Add manual disconnect test button for debugging
  const manualDisconnectBtn = document.createElement('button')
  manualDisconnectBtn.textContent = 'Manual Disconnect Test'
  manualDisconnectBtn.addEventListener('click', () => {
    addLog('🧪 Manual disconnect test triggered')
    mockWallet.performDisconnect('Manual test')
  })
  document.getElementById('transaction-result')?.appendChild(manualDisconnectBtn)

  // Initial UI update
  updateUI()
})

// Listen for wallet events to update UI
mockWallet.on('accountsChanged', (accounts: string[]) => {
  addLog(`🔄 Account changed: ${accounts.join(', ') || 'disconnected'}`)
  updateUI()
})

mockWallet.on('chainChanged', (chainId: string) => {
  addLog(`🔄 Chain changed: ${chainId}`)
  updateUI()
})

addLog('🎮 Arena Wallet Mock + Reown AppKit Demo Initialised')
addLog('📱 Using ethers adapter - should auto-detect via EIP-6963')