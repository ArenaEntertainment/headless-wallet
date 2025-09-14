import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { mainnet, polygon, arbitrum, optimism, solana } from '@reown/appkit/networks'
import { SolflareWalletAdapter, PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { injectHeadlessWallet, type HeadlessWalletConfig } from '@arenaentertainment/headless-wallet'

// Test accounts - using hardhat test keys for EVM and multiple Solana keys for testing
const TEST_ACCOUNTS = {
  evm: [
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',  // Account 0
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',  // Account 1
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'   // Account 2
  ],
  solana: [
    // Account 0 - Public Key: 5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm
    new Uint8Array([150, 18, 232, 71, 19, 88, 173, 212, 93, 227, 95, 201, 208, 119, 27, 27, 245, 79, 54, 171, 84, 233, 119, 172, 239, 210, 13, 114, 170, 228, 78, 156, 62, 76, 36, 99, 206, 146, 119, 196, 167, 136, 71, 9, 222, 59, 121, 131, 46, 18, 184, 70, 143, 146, 22, 124, 117, 219, 17, 3, 13, 161, 209, 234]),
    // Account 1 - Public Key: Drmn7qpWsU8k2eAo1ry78UxnwXV6bBqDR3s9AXsRH7Xn
    new Uint8Array([168, 95, 144, 39, 235, 52, 70, 110, 242, 42, 254, 183, 60, 142, 186, 107, 7, 134, 190, 9, 29, 173, 106, 105, 5, 11, 86, 143, 230, 150, 192, 109, 191, 12, 85, 82, 112, 143, 161, 174, 223, 172, 113, 239, 42, 104, 20, 102, 238, 68, 227, 150, 166, 209, 11, 139, 132, 116, 43, 149, 161, 182, 73, 17]),
    // Account 2 - Public Key: 4QQwvCJRoNQN8DG4ZPxV5kuxmiC3jGMCQrNRwXBTCJDP
    new Uint8Array([180, 96, 20, 214, 229, 221, 30, 217, 229, 193, 146, 207, 154, 198, 19, 246, 90, 158, 250, 208, 191, 135, 251, 181, 193, 223, 90, 188, 77, 44, 49, 122, 50, 146, 127, 5, 75, 31, 200, 207, 222, 105, 138, 24, 203, 190, 46, 125, 143, 221, 72, 25, 142, 124, 141, 148, 237, 213, 54, 214, 94, 252, 198, 74])
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

// Configure and inject the HeadlessWallet
const walletConfig: HeadlessWalletConfig = {
  accounts: [
    // EVM accounts
    { privateKey: TEST_ACCOUNTS.evm[0], type: 'evm' },
    { privateKey: TEST_ACCOUNTS.evm[1], type: 'evm' },
    { privateKey: TEST_ACCOUNTS.evm[2], type: 'evm' },
    // Solana accounts - now with valid keypairs
    { privateKey: TEST_ACCOUNTS.solana[0], type: 'solana' },
    { privateKey: TEST_ACCOUNTS.solana[1], type: 'solana' },
    { privateKey: TEST_ACCOUNTS.solana[2], type: 'solana' }
  ],
  branding: {
    name: 'Arena Headless Wallet',
    rdns: 'com.arenaentertainment.headless-wallet'
  }
}

// Inject the wallet
const headlessWallet = injectHeadlessWallet(walletConfig)
addLog('🎮 Arena Headless Wallet injected with multiple accounts')

// Set up event listeners to log account changes
if (typeof window.ethereum !== 'undefined') {
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    addLog(`🔄 EVM Accounts changed: ${accounts.length} accounts, first: ${accounts[0] || 'none'}`)
    updateAccountInfo()
  })

  window.ethereum.on('chainChanged', (chainId: string) => {
    addLog(`🔗 Chain changed to: ${chainId}`)
  })

  window.ethereum.on('connect', (info: any) => {
    addLog(`✅ EVM Connected: ${JSON.stringify(info)}`)
  })

  window.ethereum.on('disconnect', (error: any) => {
    addLog(`❌ EVM Disconnected: ${JSON.stringify(error)}`)
  })
}

if (typeof window.phantom !== 'undefined' && window.phantom.solana) {
  window.phantom.solana.on('accountChanged', (publicKey: any) => {
    addLog(`🟣 Solana account changed: ${publicKey ? publicKey.toString() : 'none'}`)
    updateAccountInfo()
  })

  window.phantom.solana.on('connect', (publicKey: any) => {
    addLog(`✅ Solana Connected: ${publicKey.toString()}`)
  })

  window.phantom.solana.on('disconnect', () => {
    addLog(`❌ Solana Disconnected`)
  })
}

// Function to update account info display
function updateAccountInfo() {
  const evmInfo = headlessWallet.getEVMAccountInfo()
  const solanaInfo = headlessWallet.getSolanaAccountInfo()

  const evmInfoEl = document.getElementById('evm-info')
  const solanaInfoEl = document.getElementById('solana-info')

  if (evmInfoEl && evmInfo) {
    evmInfoEl.innerHTML = `
      <strong>EVM Accounts:</strong><br>
      Current Index: ${evmInfo.currentIndex}<br>
      Active Account: ${evmInfo.accounts[evmInfo.currentIndex]}<br>
      All Accounts: ${evmInfo.accounts.length} total
    `
  }

  if (solanaInfoEl && solanaInfo) {
    solanaInfoEl.innerHTML = `
      <strong>Solana Accounts:</strong><br>
      Current Index: ${solanaInfo.currentIndex}<br>
      Active Account: ${solanaInfo.accounts[solanaInfo.currentIndex]}<br>
      All Accounts: ${solanaInfo.accounts.length} total
    `
  }
}

// Create the AppKit instance
const projectId = 'f221f6d2b2c5b3c8f9f4b8f8c2b5f8f7'

const ethersAdapter = new EthersAdapter()
const solanaAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
})

const modal = createAppKit({
  adapters: [ethersAdapter, solanaAdapter],
  networks: [mainnet, arbitrum, polygon, optimism, solana],
  metadata: {
    name: 'Arena Wallet Test',
    description: 'Testing Arena Headless Wallet account switching',
    url: 'https://arena.com',
    icons: ['https://arena.com/icon.png']
  },
  projectId,
  features: {
    analytics: true,
    allWallets: true,
    socials: [],
    email: false,
    onramp: false,
    swaps: false
  }
})

// Add testing controls to the page
document.addEventListener('DOMContentLoaded', () => {
  // Add account switching controls
  const controlsHtml = `
    <div style="margin: 20px 0; padding: 20px; border: 2px solid #333; border-radius: 8px; background: #f5f5f5;">
      <h3>Account Switching Test Controls</h3>

      <div style="margin-bottom: 15px;">
        <h4>EVM Account Switching:</h4>
        <button id="evm-account-0" style="margin-right: 10px;">Switch to EVM Account 0</button>
        <button id="evm-account-1" style="margin-right: 10px;">Switch to EVM Account 1</button>
        <button id="evm-account-2" style="margin-right: 10px;">Switch to EVM Account 2</button>
      </div>

      <div style="margin-bottom: 15px;">
        <h4>Solana Account Switching:</h4>
        <button id="solana-account-0" style="margin-right: 10px;">Switch to Solana Account 0</button>
        <button id="solana-account-1" style="margin-right: 10px;">Switch to Solana Account 1</button>
        <button id="solana-account-2" style="margin-right: 10px;">Switch to Solana Account 2</button>
      </div>

      <div style="margin-bottom: 15px;">
        <h4>Account Info:</h4>
        <div id="evm-info" style="background: #e3f2fd; padding: 10px; margin: 5px 0; border-radius: 4px;"></div>
        <div id="solana-info" style="background: #f3e5f5; padding: 10px; margin: 5px 0; border-radius: 4px;"></div>
      </div>
    </div>
  `

  // Insert controls at the beginning of the body
  document.body.insertAdjacentHTML('afterbegin', controlsHtml)

  // Add event listeners for account switching
  document.getElementById('evm-account-0')?.addEventListener('click', () => {
    headlessWallet.switchEVMAccount(0)
    addLog('🔄 Switched to EVM Account 0')
  })

  document.getElementById('evm-account-1')?.addEventListener('click', () => {
    headlessWallet.switchEVMAccount(1)
    addLog('🔄 Switched to EVM Account 1')
  })

  document.getElementById('evm-account-2')?.addEventListener('click', () => {
    headlessWallet.switchEVMAccount(2)
    addLog('🔄 Switched to EVM Account 2')
  })

  document.getElementById('solana-account-0')?.addEventListener('click', () => {
    headlessWallet.switchSolanaAccount(0)
    addLog('🔄 Switched to Solana Account 0')
  })

  document.getElementById('solana-account-1')?.addEventListener('click', () => {
    headlessWallet.switchSolanaAccount(1)
    addLog('🔄 Switched to Solana Account 1')
  })

  document.getElementById('solana-account-2')?.addEventListener('click', () => {
    headlessWallet.switchSolanaAccount(2)
    addLog('🔄 Switched to Solana Account 2')
  })

  // Initial account info update
  setTimeout(() => {
    updateAccountInfo()
    addLog('🚀 Ready for testing! Use the buttons above to switch accounts and watch Reown respond.')
  }, 500)
})

addLog('✅ Setup complete - AppKit initialized with HeadlessWallet')