import {
  injectHeadlessWallet,
  type HeadlessWalletConfig
} from '@arenaentertainment/headless-wallet'
import { WalletUI } from './utils/ui'
import { Logger } from './utils/logger'

/**
 * Main application class for the Vanilla JavaScript demo
 */
class WalletDemo {
  private wallet: ReturnType<typeof injectHeadlessWallet> | null = null
  private evmProvider: any
  private solanaProvider: any
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

      // Configure and inject the headless wallet if not already done
      if (!this.wallet) {
        const walletConfig: HeadlessWalletConfig = {
          accounts: [
            // EVM test accounts (Hardhat keys)
            {
              privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
              type: 'evm' as const
            },
            {
              privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
              type: 'evm' as const
            },
            // Solana test accounts
            {
              privateKey: '[68,27,251,159,65,135,176,118,184,67,112,62,75,233,225,211,249,54,192,133,140,49,235,192,177,204,64,180,171,118,150,246,220,231,108,99,12,156,207,126,172,247,217,239,249,133,49,94,143,133,48,117,228,226,185,8,191,39,148,111,103,170,229,180]',
              type: 'solana' as const
            },
            {
              privateKey: '[109,52,131,38,179,64,7,72,38,102,205,174,220,176,191,180,42,194,186,211,183,72,15,139,255,246,24,122,70,205,74,83,141,138,45,207,187,224,51,48,86,242,17,12,46,36,22,87,84,7,216,112,72,221,111,31,55,217,7,112,237,83,26,18]',
              type: 'solana' as const
            }
          ],
          branding: {
            name: 'Arena Headless Wallet',
            icon: 'data:image/svg+xml,<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1080" rx="320" fill="black"/><path d="M203 830.128L470.486 230H607.658L876.001 830.128H730.255L510.78 300.301H565.649L345.316 830.128H203ZM336.743 701.529L373.608 596.078H682.245L719.968 701.529H336.743Z" fill="url(%23paint0_linear_436_3860)"/><defs><linearGradient id="paint0_linear_436_3860" x1="539.5" y1="830.128" x2="539.5" y2="230" gradientUnits="userSpaceOnUse"><stop stop-color="%2307D102"/><stop offset="1" stop-color="%23046B01"/></linearGradient></defs></svg>',
            rdns: 'com.arenaentertainment.headless-wallet'
          },
          evm: {
            rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo'
          },
          solana: {
            cluster: 'devnet',
            rpcUrl: 'https://api.devnet.solana.com'
          }
        }

        // Inject the wallet
        this.wallet = injectHeadlessWallet(walletConfig)
        this.evmProvider = this.wallet.getEthereumProvider()
        this.solanaProvider = this.wallet.getSolanaProvider()

        // Setup wallet event listeners
        this.setupWalletEvents()
      }

      // Connect to EVM wallet
      const accounts = await this.evmProvider.request({ method: 'eth_requestAccounts' })

      this.logger.log(`✅ Wallet connected successfully! Accounts: ${accounts.join(', ')}`)
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
    if (!this.evmProvider) return

    this.evmProvider.on('connect', (info: { chainId: string }) => {
      this.logger.log(`📡 Wallet connected event with chain: ${info.chainId}`)
      this.updateUI()
    })

    this.evmProvider.on('disconnect', (error?: any) => {
      this.logger.log(`📴 Wallet disconnected event${error ? `: ${error.message}` : ''}`)
      this.ui.updateConnectionStatus('disconnected', 'Disconnected')
      this.ui.hideWalletInfo()
      this.ui.hideDemoActions()
    })

    this.evmProvider.on('accountsChanged', (accounts: string[]) => {
      this.logger.log(`👤 Accounts changed: ${accounts.join(', ') || 'disconnected'}`)
      this.updateAccountInfo()
    })

    this.evmProvider.on('chainChanged', (chainId: string) => {
      this.logger.log(`🔗 Chain changed to: ${chainId}`)
      this.updateChainInfo()
    })

    // Solana events
    if (this.solanaProvider) {
      this.solanaProvider.on('connect', (publicKey: any) => {
        this.logger.log(`📡 Solana wallet connected: ${publicKey.toString()}`)
      })

      this.solanaProvider.on('disconnect', () => {
        this.logger.log('📴 Solana wallet disconnected')
      })
    }
  }

  /**
   * Handle wallet disconnection
   */
  private async handleDisconnect(): Promise<void> {
    if (!this.evmProvider) return

    try {
      this.logger.log('🔌 Disconnecting wallet...')
      await this.evmProvider.disconnect()

      this.logger.log('✅ Wallet disconnected successfully!')

    } catch (error) {
      this.logger.error('❌ Failed to disconnect wallet:', error)
    }
  }

  /**
   * Handle account switching
   */
  private async handleCreateAccount(): Promise<void> {
    if (!this.wallet) return

    try {
      this.logger.log('🔄 Switching account...')

      // Switch between available accounts
      const accountInfo = this.wallet.getEVMAccountInfo()
      if (accountInfo) {
        const nextIndex = (accountInfo.currentIndex + 1) % accountInfo.accounts.length
        this.wallet.switchEVMAccount(nextIndex)
        this.logger.log(`✅ Switched to account ${nextIndex}: ${accountInfo.accounts[nextIndex]}`)
        this.updateUI()
      }

    } catch (error) {
      this.logger.error('❌ Failed to switch account:', error)
    }
  }

  /**
   * Handle message signing
   */
  private async handleSignMessage(): Promise<void> {
    if (!this.evmProvider) return

    try {
      const message = `Hello from Arena Headless Wallet! Timestamp: ${Date.now()}`
      this.logger.log(`✍️ Signing message: "${message}"`)

      const accounts = await this.evmProvider.request({ method: 'eth_accounts' })
      if (accounts.length === 0) {
        throw new Error('No accounts connected')
      }

      // Sign the message
      const signature = await this.evmProvider.request({
        method: 'personal_sign',
        params: [message, accounts[0]]
      })

      this.logger.log(`✅ Message signed successfully!`)
      this.logger.log(`📝 Signature: ${signature.slice(0, 20)}...`)

    } catch (error) {
      this.logger.error('❌ Failed to sign message:', error)
    }
  }

  /**
   * Update the entire UI after wallet state changes
   */
  private async updateUI(): Promise<void> {
    if (!this.evmProvider) return

    try {
      const accounts = await this.evmProvider.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        this.ui.updateConnectionStatus('connected', 'Connected')
        this.ui.showWalletInfo()
        this.ui.showDemoActions()
        this.ui.showDemoLogs()

        this.updateAccountInfo()
        this.updateChainInfo()
        this.updateStats()
      }
    } catch (error) {
      this.logger.error('Failed to update UI:', error)
    }
  }

  /**
   * Update account information display
   */
  private async updateAccountInfo(): Promise<void> {
    if (!this.wallet) return

    const accountInfo = this.wallet.getEVMAccountInfo()
    if (accountInfo && accountInfo.accounts.length > 0) {
      const currentAddress = accountInfo.accounts[accountInfo.currentIndex]
      this.ui.updateAccountInfo({
        type: 'evm',
        id: `Account ${accountInfo.currentIndex}`,
        address: currentAddress
      })
    }
  }

  /**
   * Update chain information display
   */
  private async updateChainInfo(): Promise<void> {
    if (!this.evmProvider) return

    try {
      const chainId = await this.evmProvider.request({ method: 'eth_chainId' })
      const chainName = this.getChainName(chainId)
      this.ui.updateElement('active-chain', chainName)
    } catch (error) {
      this.logger.error('Failed to get chain info:', error)
    }
  }

  /**
   * Get chain name from chain ID
   */
  private getChainName(chainId: string): string {
    const chains: Record<string, string> = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x89': 'Polygon',
      '0xa4b1': 'Arbitrum',
      '0xa': 'Optimism'
    }
    return chains[chainId] || `Chain ${chainId}`
  }

  /**
   * Update statistics display
   */
  private updateStats(): void {
    if (!this.wallet) return

    const evmInfo = this.wallet.getEVMAccountInfo()
    const solanaInfo = this.wallet.getSolanaAccountInfo()
    const totalAccounts = (evmInfo?.accounts.length || 0) + (solanaInfo?.accounts.length || 0)

    this.ui.updateElement('total-accounts', totalAccounts.toString())
    this.ui.updateElement('wallet-status', 'Connected')
  }
}

// Initialize the demo when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WalletDemo()
})