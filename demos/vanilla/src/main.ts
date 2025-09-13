import {
  injectHeadlessWallet,
  type HeadlessWallet,
  type Account
} from '@arenaentertainment/wallet-mock'
import { WalletUI } from './utils/ui'
import { Logger } from './utils/logger'

/**
 * Main application class for the Vanilla JavaScript demo
 */
class WalletDemo {
  private wallet: HeadlessWallet | null = null
  private ui: WalletUI
  private logger: Logger

  constructor() {
    this.ui = new WalletUI()
    this.logger = new Logger('log-content')
    this.init()
  }

  /**
   * Initialize the demo application
   */
  private async init(): Promise<void> {
    this.logger.log('🚀 Initializing Wallet Mock Demo...')

    // Setup event listeners
    this.setupEventListeners()

    // Setup theme handling
    this.setupTheme()

    this.logger.log('✅ Demo initialized successfully')
  }

  /**
   * Setup event listeners for UI interactions
   */
  private setupEventListeners(): void {
    // Connect/Disconnect button
    const connectBtn = document.getElementById('connect-btn')
    const disconnectBtn = document.getElementById('disconnect-btn')

    connectBtn?.addEventListener('click', () => this.handleConnect())
    disconnectBtn?.addEventListener('click', () => this.handleDisconnect())

    // Demo action buttons
    const createAccountBtn = document.getElementById('create-account-btn')
    const signMessageBtn = document.getElementById('sign-message-btn')
    const clearLogsBtn = document.getElementById('clear-logs-btn')

    createAccountBtn?.addEventListener('click', () => this.handleCreateAccount())
    signMessageBtn?.addEventListener('click', () => this.handleSignMessage())
    clearLogsBtn?.addEventListener('click', () => this.logger.clear())

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle')
    themeToggle?.addEventListener('click', () => this.toggleTheme())
  }

  /**
   * Setup theme handling
   */
  private setupTheme(): void {
    // Initialize theme from localStorage or system preference
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark')
      this.updateThemeIcons(true)
    } else {
      this.updateThemeIcons(false)
    }
  }

  /**
   * Toggle between light and dark themes
   */
  private toggleTheme(): void {
    const isDark = document.documentElement.classList.contains('dark')

    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      this.updateThemeIcons(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      this.updateThemeIcons(true)
    }
  }

  /**
   * Update theme toggle icons
   */
  private updateThemeIcons(isDark: boolean): void {
    const sunIcon = document.getElementById('sun-icon')
    const moonIcon = document.getElementById('moon-icon')

    if (isDark) {
      sunIcon?.classList.remove('hidden')
      moonIcon?.classList.add('hidden')
    } else {
      sunIcon?.classList.add('hidden')
      moonIcon?.classList.remove('hidden')
    }
  }

  /**
   * Handle wallet connection
   */
  private async handleConnect(): Promise<void> {
    try {
      this.logger.log('🔌 Connecting to wallet...')
      this.ui.updateConnectionStatus('connecting', 'Connecting...')

      // Create wallet instance
      this.wallet = await createWallet({
        accounts: [
          { type: 'evm', label: 'EVM Account 1' },
          { type: 'solana', label: 'Solana Account 1' },
          { type: 'dual_chain', label: 'Multi-Chain Account' }
        ],
        production: {
          allowedHosts: ['localhost', '127.0.0.1'],
          throwInProduction: true,
          enableWarnings: true
        }
      })

      // Setup wallet event listeners
      this.setupWalletEvents()

      // Connect to wallet
      await this.wallet.connect()

      this.logger.log('✅ Wallet connected successfully!')
      this.updateUI()

    } catch (error) {
      this.logger.error('❌ Failed to connect wallet:', error)
      this.ui.updateConnectionStatus('disconnected', 'Connection Failed')
    }
  }

  /**
   * Setup wallet event listeners
   */
  private setupWalletEvents(): void {
    if (!this.wallet) return

    this.wallet.on('connect', () => {
      this.logger.log('📡 Wallet connected event')
      this.updateUI()
    })

    this.wallet.on('disconnect', () => {
      this.logger.log('📴 Wallet disconnected event')
      this.ui.updateConnectionStatus('disconnected', 'Disconnected')
      this.ui.hideWalletInfo()
      this.ui.hideDemoActions()
    })

    this.wallet.on('accountsChanged', (accounts: Account[]) => {
      this.logger.log(`👤 Accounts changed: ${accounts.length} accounts`)
      this.updateAccountInfo()
    })

    this.wallet.on('chainChanged', (chainId: string) => {
      this.logger.log(`🔗 Chain changed to: ${chainId}`)
      this.updateChainInfo()
    })
  }

  /**
   * Handle wallet disconnection
   */
  private async handleDisconnect(): Promise<void> {
    if (!this.wallet) return

    try {
      this.logger.log('🔌 Disconnecting wallet...')
      await this.wallet.disconnect()
      this.wallet = null

      this.logger.log('✅ Wallet disconnected successfully!')

    } catch (error) {
      this.logger.error('❌ Failed to disconnect wallet:', error)
    }
  }

  /**
   * Handle account creation
   */
  private async handleCreateAccount(): Promise<void> {
    if (!this.wallet) return

    try {
      this.logger.log('👤 Creating new account...')

      // Create a new EVM account
      const account = await this.wallet.createAccount({
        type: 'evm',
        label: `EVM Account ${Date.now()}`
      })

      this.logger.log(`✅ Account created: ${account.address.slice(0, 10)}...`)
      this.updateUI()

    } catch (error) {
      this.logger.error('❌ Failed to create account:', error)
    }
  }

  /**
   * Handle message signing
   */
  private async handleSignMessage(): Promise<void> {
    if (!this.wallet) return

    try {
      const message = `Hello from Wallet Mock Demo! Timestamp: ${Date.now()}`
      this.logger.log(`✍️ Signing message: "${message}"`)

      // Sign the message
      const signature = await this.wallet.signMessage(message)

      this.logger.log(`✅ Message signed successfully!`)
      this.logger.log(`📝 Signature: ${signature.slice(0, 20)}...`)

    } catch (error) {
      this.logger.error('❌ Failed to sign message:', error)
    }
  }

  /**
   * Update the entire UI after wallet state changes
   */
  private updateUI(): void {
    if (!this.wallet || !this.wallet.isConnected) return

    this.ui.updateConnectionStatus('connected', 'Connected')
    this.ui.showWalletInfo()
    this.ui.showDemoActions()
    this.ui.showDemoLogs()

    this.updateAccountInfo()
    this.updateChainInfo()
    this.updateStats()
  }

  /**
   * Update account information display
   */
  private updateAccountInfo(): void {
    if (!this.wallet) return

    const currentAccount = this.wallet.getCurrentAccount()

    if (currentAccount) {
      this.ui.updateAccountInfo({
        type: currentAccount.type,
        id: currentAccount.id,
        address: currentAccount.address
      })
    }
  }

  /**
   * Update chain information display
   */
  private updateChainInfo(): void {
    if (!this.wallet) return

    const currentChain = this.wallet.getCurrentChain()

    if (currentChain) {
      const chainName = currentChain.name || 'Unknown'
      this.ui.updateElement('active-chain', chainName)
    }
  }

  /**
   * Update statistics display
   */
  private updateStats(): void {
    if (!this.wallet) return

    const accounts = this.wallet.getAccounts()
    this.ui.updateElement('total-accounts', accounts.length.toString())
    this.ui.updateElement('wallet-status', 'Connected')
  }
}

// Initialize the demo when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WalletDemo()
})