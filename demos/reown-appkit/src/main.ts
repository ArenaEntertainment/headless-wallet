import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { mainnet, polygon, arbitrum, optimism, solana } from '@reown/appkit/networks'
import { SolflareWalletAdapter, PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { ethers } from 'ethers'
import { Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import * as nacl from 'tweetnacl'
import { registerWallet } from '@wallet-standard/wallet'
import type { Wallet, WalletAccount } from '@wallet-standard/base'
import { injectHeadlessWallet, type HeadlessWalletConfig } from '@arenaentertainment/headless-wallet'

// Test accounts - using hardhat test keys for EVM and multiple Solana keys for testing
const TEST_ACCOUNTS = {
  evm: [
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',  // Account 0
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',  // Account 1
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'   // Account 2
  ],
  solana: [
    // Account 0
    new Uint8Array([141,196,137,34,144,18,247,222,228,224,112,55,202,220,93,49,244,240,19,46,249,76,139,247,222,31,248,121,93,21,121,81,89,224,220,231,50,198,164,55,90,7,80,82,149,109,43,91,192,216,216,220,56,87,102,98,191,29,217,200,188,229,164,181]),
    // Account 1
    new Uint8Array([158,208,18,143,85,204,67,4,69,201,127,1,200,138,155,142,8,183,204,226,198,130,94,174,197,141,97,16,87,87,80,162,109,188,240,101,70,25,226,101,166,167,125,111,203,180,234,15,16,145,224,107,177,81,33,109,211,247,159,172,118,26,91,56]),
    // Account 2
    new Uint8Array([245,247,23,4,51,207,216,20,133,135,226,36,96,227,135,77,118,29,98,219,235,37,52,114,147,47,132,107,181,127,159,33,175,204,71,219,133,44,117,114,95,35,93,99,59,84,200,116,201,207,244,34,41,71,80,67,188,99,198,9,9,201,128,25])
  ]
}

// Helper function to derive addresses from private keys
function getEVMAddresses() {
  return TEST_ACCOUNTS.evm.map(privateKey => new ethers.Wallet(privateKey).address)
}

// Unified wallet configuration
const WALLET_NAME = 'Arena Headless Wallet'
const WALLET_ICON = 'data:image/svg+xml,<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1080" rx="320" fill="black"/><path d="M203 830.128L470.486 230H607.658L876.001 830.128H730.255L510.78 300.301H565.649L345.316 830.128H203ZM336.743 701.529L373.608 596.078H682.245L719.968 701.529H336.743Z" fill="url(%23paint0_linear_436_3860)"/><defs><linearGradient id="paint0_linear_436_3860" x1="539.5" y1="830.128" x2="539.5" y2="230" gradientUnits="userSpaceOnUse"><stop stop-color="%2307D102"/><stop offset="1" stop-color="%23046B01"/></linearGradient></defs></svg>'
const WALLET_RDNS = 'com.arena.mock-wallet'

interface HeadlessWallet {
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
class ArenaHeadlessWallet implements HeadlessWallet {
  private listeners: Map<string, Set<Function>> = new Map()
  private accounts: string[] = []
  private currentChain: string = '0x1' // Ethereum mainnet
  private isDisconnected: boolean = true

  // MetaMask compatibility
  public readonly isMetaMask = true

  constructor() {
    addLog('🎮 Arena Headless Wallet created')
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
    this.emit('disconnect', { code: 4900, message: 'User disconnected' })

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
          this.accounts = getEVMAddresses()
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
        const privateKey = TEST_ACCOUNTS.evm.find(pk =>
          new ethers.Wallet(pk).address.toLowerCase() === address.toLowerCase()
        )
        if (!privateKey) throw new Error('Account not found')

        const wallet = new ethers.Wallet(privateKey)
        const signature = await wallet.signMessage(message)

        addLog(`✍️ personal_sign: ${message} → ${signature.substring(0, 20)}...`)
        return signature
      }

      case 'eth_signTypedData_v4': {
        const [address, typedDataJson] = params
        const privateKey = TEST_ACCOUNTS.evm.find(pk =>
          new ethers.Wallet(pk).address.toLowerCase() === address.toLowerCase()
        )
        if (!privateKey) throw new Error('Account not found')

        const typedData = JSON.parse(typedDataJson)
        const wallet = new ethers.Wallet(privateKey)

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
            this.accounts = getEVMAddresses()
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

// Solana Wallet Standard Implementation
class ArenaMockSolanaWallet implements Wallet {
  readonly #version = '1.0.0' as const
  readonly #name = WALLET_NAME
  readonly #icon = WALLET_ICON
  readonly #chains = ['solana:mainnet', 'solana:devnet', 'solana:testnet'] as const

  private keypair: Keypair
  private isConnected = false
  private listeners: Map<string, Set<Function>> = new Map()

  constructor(secretKey: Uint8Array) {
    this.keypair = Keypair.fromSecretKey(secretKey)
    addLog(`🟣 Solana wallet created: ${this.keypair.publicKey.toBase58()}`)
  }

  // Wallet Standard required getters
  get version() { return this.#version }
  get name() { return this.#name }
  get icon() { return this.#icon }
  get chains() { return this.#chains.slice() }

  get accounts(): readonly WalletAccount[] {
    if (!this.isConnected) return []

    return [{
      address: this.keypair.publicKey.toBase58(),
      publicKey: this.keypair.publicKey.toBytes(),
      chains: this.#chains.slice(),
      features: ['solana:signTransaction', 'solana:signMessage']
    }]
  }

  get features() {
    return {
      'standard:connect': {
        version: '1.0.0',
        connect: this.#connect.bind(this)
      },
      'standard:disconnect': {
        version: '1.0.0',
        disconnect: this.#disconnect.bind(this)
      },
      'standard:events': {
        version: '1.0.0',
        on: this.#on.bind(this)
      },
      'solana:signTransaction': {
        version: '1.0.0',
        signTransaction: this.#signTransaction.bind(this)
      },
      'solana:signMessage': {
        version: '1.0.0',
        signMessage: this.#signMessage.bind(this)
      }
    }
  }

  // Standard methods
  async #connect() {
    this.isConnected = true
    addLog(`🟣 Solana connected: ${this.keypair.publicKey.toBase58()}`)
    this.emit('connect', this.keypair.publicKey)
    return { accounts: this.accounts }
  }

  async #disconnect() {
    this.isConnected = false
    addLog('🟣 Solana disconnected')
    this.emit('disconnect')
  }

  #on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener)
    }
  }

  async #signTransaction(input: { transaction: Transaction | VersionedTransaction }) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected')
    }

    const { transaction } = input

    if (transaction instanceof Transaction) {
      transaction.sign(this.keypair)
      addLog(`🟣 Solana transaction signed (legacy)`)
      return { signedTransaction: transaction }
    } else {
      const signature = nacl.sign.detached(transaction.message.serialize(), this.keypair.secretKey)
      transaction.addSignature(this.keypair.publicKey, signature)
      addLog(`🟣 Solana transaction signed (versioned)`)
      return { signedTransaction: transaction }
    }
  }

  async #signMessage(input: { message: Uint8Array }) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected')
    }

    const signature = nacl.sign.detached(input.message, this.keypair.secretKey)
    addLog(`🟣 Solana message signed`)

    return { signature, publicKey: this.keypair.publicKey.toBytes() }
  }

  // Legacy compatibility methods (for direct access)
  get publicKey() {
    return this.isConnected ? this.keypair.publicKey : null
  }

  get connected() {
    return this.isConnected
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    const result = await this.#connect()
    return { publicKey: this.keypair.publicKey }
  }

  async disconnect(): Promise<void> {
    return this.#disconnect()
  }

  on(event: string, handler: Function): void {
    this.#on(event, handler)
  }

  removeListener(event: string, handler: Function): void {
    this.listeners.get(event)?.delete(handler)
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(...args)
      } catch (error) {
        console.error(`Error in Solana ${event} handler:`, error)
      }
    })
  }

  async signTransaction(transaction: Transaction | VersionedTransaction) {
    const result = await this.#signTransaction({ transaction })
    return result.signedTransaction
  }

  async signMessage(message: Uint8Array) {
    const result = await this.#signMessage({ message })
    return { signature: result.signature, publicKey: this.keypair.publicKey }
  }

  async signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected')
    }

    // Sign the transaction
    transaction.sign(this.keypair)

    // Simulate sending
    const fakeSignature = Array.from(crypto.getRandomValues(new Uint8Array(64)))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    addLog(`🟣 Solana transaction sent: ${fakeSignature.substring(0, 20)}...`)
    return { signature: fakeSignature }
  }
}

// Create both wallet instances
const headlessWallet = new ArenaHeadlessWallet()
const mockSolanaWallet = new ArenaMockSolanaWallet(TEST_ACCOUNTS.solana[0])

// EIP-6963 wallet discovery for EVM
function announceEVMWallet() {
  const info = {
    uuid: crypto.randomUUID(),
    name: WALLET_NAME,
    icon: WALLET_ICON,
    rdns: WALLET_RDNS
  }

  const detail = { info, provider: headlessWallet }
  const announceEvent = new CustomEvent('eip6963:announceProvider', {
    detail: Object.freeze(detail)
  })

  window.dispatchEvent(announceEvent)
  addLog('📡 EIP-6963 EVM wallet announcement dispatched')
}

// Solana Wallet Standard registration
function registerSolanaWallet() {
  try {
    registerWallet(mockSolanaWallet)
    addLog('🟣 Solana wallet registered with Wallet Standard')
  } catch (error) {
    addLog(`❌ Failed to register Solana wallet: ${error}`)
    console.error('Solana wallet registration error:', error)
  }
}

// Inject both providers into window
;(window as any).ethereum = headlessWallet

// Inject Solana provider - following Phantom's approach
if (!(window as any).phantom) {
  ;(window as any).phantom = {}
}
;(window as any).phantom.solana = mockSolanaWallet

// Also inject at window.solana for backward compatibility
;(window as any).solana = mockSolanaWallet

// Add global disconnect method that AppKit can call
;(window as any).ethereum.disconnect = () => {
  addLog('🔓 Global EVM disconnect method called')
  return headlessWallet.performDisconnect('Global method')
}

// Make performDisconnect public so it can be called externally
headlessWallet.performDisconnect = headlessWallet['performDisconnect']

// Listen for EIP-6963 requests (EVM)
window.addEventListener('eip6963:requestProvider', () => {
  addLog('📡 EIP-6963 provider requested')
  announceEVMWallet()
})

// Announce both wallets immediately and on DOM ready
function announceAllWallets() {
  announceEVMWallet()
  registerSolanaWallet()
}

announceAllWallets()
document.addEventListener('DOMContentLoaded', announceAllWallets)

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
    name: 'Arena Headless Wallet + Reown AppKit Demo',
    description: 'Demo of Arena Headless Wallet with Reown AppKit using ethers',
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

      const walletConnected = !headlessWallet['isDisconnected'] && headlessWallet['accounts'].length > 0

      if (appKitDisconnected && walletConnected && lastConnectedState) {
        addLog('🚨 AppKit disconnect detected! Triggering wallet disconnect...')
        setTimeout(() => {
          headlessWallet.performDisconnect('AppKit state change')
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
    const walletConnected = !headlessWallet['isDisconnected'] && headlessWallet['accounts'].length > 0

    if (buttonText.includes('Connect') && walletConnected) {
      addLog('🚨 AppKit button shows "Connect" but wallet is connected - triggering disconnect')
      headlessWallet.performDisconnect('Button state mismatch')
    }
  }
}, 1000)

// UI Functions
function updateUI() {
  const isConnected = !headlessWallet['isDisconnected'] && headlessWallet['accounts'].length > 0

  // Update connection status
  const statusEl = document.getElementById('connection-status')
  if (statusEl) {
    statusEl.innerHTML = `<span class="status ${isConnected ? 'connected' : 'disconnected'}">${isConnected ? 'Connected' : 'Disconnected'}</span>`
  }

  // Update account info
  const accountEl = document.getElementById('account-info')
  if (accountEl) {
    if (isConnected) {
      const evmAddresses = getEVMAddresses()
      const solanaPublicKey = Keypair.fromSecretKey(TEST_ACCOUNTS.solana[0]).publicKey.toBase58()

      accountEl.innerHTML = `
        <div class="wallet-info">
          <h4>EVM Accounts</h4>
          ${evmAddresses.map((address, i) => `
            <div class="code">Account ${i + 1}: ${address}</div>
          `).join('')}
          <h4>Solana Account</h4>
          <div class="code">Public Key: ${solanaPublicKey}</div>
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

    const chainId = headlessWallet['currentChain']
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

  // Enable/disable Solana buttons (they work independently)
  const solanaButtons = ['solana-connect', 'solana-disconnect', 'solana-sign-message', 'solana-send-transaction']
  solanaButtons.forEach(id => {
    const btn = document.getElementById(id) as HTMLButtonElement
    if (btn) {
      if (id === 'solana-connect') {
        btn.disabled = false // Connect always available
      } else {
        btn.disabled = !mockSolanaWallet.connected
      }
    }
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
      await headlessWallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }]
      })
    } catch (error) {
      addLog(`❌ Chain switch failed: ${error}`)
    }
  })

  document.getElementById('switch-to-ethereum')?.addEventListener('click', async () => {
    try {
      await headlessWallet.request({
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
      const capabilities = await headlessWallet.request({ method: 'wallet_getCapabilities' })
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
      const accounts = await headlessWallet.request({ method: 'eth_accounts' })
      const message = 'Hello from Arena Headless Wallet!'
      const signature = await headlessWallet.request({
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
      const accounts = await headlessWallet.request({ method: 'eth_accounts' })
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
          name: 'Arena Headless Wallet Test',
          version: '1',
          chainId: 1
        },
        message: {
          content: 'This is a test typed data message',
          timestamp: Date.now()
        }
      }

      const signature = await headlessWallet.request({
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
      const accounts = await headlessWallet.request({ method: 'eth_accounts' })
      const txHash = await headlessWallet.request({
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

  // Solana button handlers
  document.getElementById('solana-connect')?.addEventListener('click', async () => {
    try {
      const result = await mockSolanaWallet.connect()
      addLog(`🟣 Solana connected: ${result.publicKey.toBase58()}`)
      document.getElementById('solana-result')!.innerHTML = `
        <div class="info-box">
          <h4>Solana Connected</h4>
          <div class="code">Public Key: ${result.publicKey.toBase58()}</div>
        </div>
      `
      updateUI()
    } catch (error) {
      addLog(`❌ Solana connect failed: ${error}`)
    }
  })

  document.getElementById('solana-disconnect')?.addEventListener('click', async () => {
    try {
      await mockSolanaWallet.disconnect()
      addLog('🟣 Solana disconnected')
      document.getElementById('solana-result')!.innerHTML = `
        <div class="info-box">
          <h4>Solana Disconnected</h4>
        </div>
      `
      updateUI()
    } catch (error) {
      addLog(`❌ Solana disconnect failed: ${error}`)
    }
  })

  document.getElementById('solana-sign-message')?.addEventListener('click', async () => {
    try {
      const message = new TextEncoder().encode('Hello from Arena Headless Wallet on Solana!')
      const result = await mockSolanaWallet.signMessage(message)

      document.getElementById('solana-result')!.innerHTML = `
        <div class="info-box">
          <h4>Solana Message Signed</h4>
          <div class="code">Message: Hello from Arena Headless Wallet on Solana!</div>
          <div class="code">Signature: ${Array.from(result.signature, b => b.toString(16).padStart(2, '0')).join('').substring(0, 40)}...</div>
          <div class="code">Public Key: ${result.publicKey.toBase58()}</div>
        </div>
      `
    } catch (error) {
      addLog(`❌ Solana sign message failed: ${error}`)
    }
  })

  document.getElementById('solana-send-transaction')?.addEventListener('click', async () => {
    try {
      // Create a fake transaction for demo purposes
      const { Transaction, SystemProgram, PublicKey } = await import('@solana/web3.js')
      const fromPubkey = Keypair.fromSecretKey(TEST_ACCOUNTS.solana[0]).publicKey
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPubkey,
          toPubkey: new PublicKey('11111111111111111111111111111112'), // System program
          lamports: 1000000 // 0.001 SOL
        })
      )

      const result = await mockSolanaWallet.signAndSendTransaction(transaction)

      document.getElementById('solana-result')!.innerHTML = `
        <div class="info-box">
          <h4>Solana Transaction Sent</h4>
          <div class="code">Signature: ${result.signature}</div>
        </div>
      `
    } catch (error) {
      addLog(`❌ Solana transaction failed: ${error}`)
    }
  })

  // Add manual disconnect test button for debugging
  const manualDisconnectBtn = document.createElement('button')
  manualDisconnectBtn.textContent = 'Manual Disconnect Test'
  manualDisconnectBtn.addEventListener('click', () => {
    addLog('🧪 Manual disconnect test triggered')
    headlessWallet.performDisconnect('Manual test')
  })
  document.getElementById('transaction-result')?.appendChild(manualDisconnectBtn)

  // Initial UI update
  updateUI()
})

// Listen for wallet events to update UI
headlessWallet.on('accountsChanged', (accounts: string[]) => {
  addLog(`🔄 Account changed: ${accounts.join(', ') || 'disconnected'}`)
  updateUI()
})

headlessWallet.on('chainChanged', (chainId: string) => {
  addLog(`🔄 Chain changed: ${chainId}`)
  updateUI()
})

// Listen for Solana wallet events
mockSolanaWallet.on('connect', (publicKey: PublicKey) => {
  addLog(`🟣 Solana account connected: ${publicKey.toBase58()}`)
  updateUI()
})

mockSolanaWallet.on('disconnect', () => {
  addLog('🟣 Solana account disconnected')
  updateUI()
})

addLog('🎮 Arena Headless Wallet + Reown AppKit Demo Initialised')
addLog('📱 Using ethers adapter for EVM and solana adapter for Solana')
addLog('🔧 Multi-chain wallet with SAME NAME for both adapters')