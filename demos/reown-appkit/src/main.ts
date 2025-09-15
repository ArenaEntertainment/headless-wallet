import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia, solanaDevnet, solanaTestnet } from '@reown/appkit/networks'
import { injectHeadlessWallet, type HeadlessWalletConfig } from '@arenaentertainment/headless-wallet'

// Test accounts for both EVM and Solana
const TEST_ACCOUNTS = {
  evm: [
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',  // Account 0
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',  // Account 1
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'   // Account 2
  ],
  solana: [
    // Valid Solana test keypairs (64 bytes each as JSON arrays)
    '[68,27,251,159,65,135,176,118,184,67,112,62,75,233,225,211,249,54,192,133,140,49,235,192,177,204,64,180,171,118,150,246,220,231,108,99,12,156,207,126,172,247,217,239,249,133,49,94,143,133,48,117,228,226,185,8,191,39,148,111,103,170,229,180]', // FsKNCd2rATjpA2bZYmkUBm38p611BkH4yumFKK1Nj54P
    '[109,52,131,38,179,64,7,72,38,102,205,174,220,176,191,180,42,194,186,211,183,72,15,139,255,246,24,122,70,205,74,83,141,138,45,207,187,224,51,48,86,242,17,12,46,36,22,87,84,7,216,112,72,221,111,31,55,217,7,112,237,83,26,18]', // AXWh7NXbbGEgiuHLiLaHQ3S3ahr83knQ7j1c5rChUkF3
    '[197,199,162,254,4,56,181,112,208,223,153,131,59,49,155,119,237,103,205,71,68,122,44,77,123,23,225,62,244,122,220,195,151,160,200,125,125,125,85,197,171,45,129,237,63,212,178,106,40,26,20,96,44,155,255,21,221,76,37,22,93,157,181,216]'  // BCtm4zf81yLB27CosEkySoFUkkG1LBugBC98U6RZKzrj
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
    ...TEST_ACCOUNTS.evm.map(privateKey => ({
      privateKey,
      type: 'evm' as const
    })),
    ...TEST_ACCOUNTS.solana.map(secretKey => ({
      privateKey: secretKey,
      type: 'solana' as const
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
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com'
  },
  solana: {
    cluster: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com'
  }
}

// Inject the wallet into the browser
const wallet = injectHeadlessWallet(walletConfig)
addLog('🎮 Arena Headless Wallet injected')

// Get the providers for direct access
const evmProvider = wallet.getEthereumProvider()
const solanaProvider = wallet.getSolanaProvider()

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
  networks: [sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia, solanaDevnet, solanaTestnet],
  projectId: '09f639e3602d49c15e37e0d3de9fb7a4', // Demo project ID
  metadata,
  features: {
    analytics: false
  }
})

// Make appKit globally available for debugging
;(window as any).appKit = appKit

// Helper functions for UI
async function updateUI() {
  // Check AppKit connection state - this is the source of truth
  const isConnected = appKit.getIsConnectedState() || false
  const caipAddress = appKit.getCaipAddress()
  const address = appKit.getAddress() || null

  // Get network info
  const caipNetwork = appKit.getCaipNetwork()
  const chainId = caipNetwork?.id || appKit.getCaipNetworkId()
  // Check chainNamespace or caipNetworkId for Solana detection
  const isSolanaChain = caipNetwork?.chainNamespace === 'solana' ||
                        caipNetwork?.caipNetworkId?.includes('solana') ||
                        false
  const isEVMChain = !isSolanaChain

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
    if (isConnected && address) {
      appKitStatus.innerHTML = `Connected: ${address.substring(0, 10)}... on ${chainId || 'unknown chain'}`
    } else {
      appKitStatus.innerHTML = 'Not connected'
    }
  }

  // Enable/disable EVM buttons based on connection state
  const evmButtons = ['sign-message', 'sign-typed-data', 'send-transaction', 'switch-to-polygon',
                      'switch-to-ethereum', 'get-capabilities', 'evm-disconnect']
  evmButtons.forEach(id => {
    const btn = document.getElementById(id) as HTMLButtonElement
    if (btn) btn.disabled = !(isConnected && isEVMChain)
  })

  // Enable/disable Solana buttons based on connection state
  const solanaButtons = ['solana-sign-message', 'solana-send-transaction', 'solana-disconnect']
  solanaButtons.forEach(id => {
    const btn = document.getElementById(id) as HTMLButtonElement
    if (btn) {
      btn.disabled = !(isConnected && isSolanaChain)
      // Debug log
      if (id === 'solana-sign-message' && isConnected && isSolanaChain) {
        console.log('Enabling Solana buttons - isConnected:', isConnected, 'isSolanaChain:', isSolanaChain, 'chainId:', chainId)
      }
    }
  })

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
      // For display, properly detect if it's a Solana address
      const displayIsSolana = chainId?.toString().includes('solana') || address.length > 42
      const shortAddress = `${address.substring(0, 10)}...${address.substring(address.length - 8)}`
      accountInfo.innerHTML = `
        <div class="wallet-info">
          <strong>Address:</strong> ${shortAddress}<br>
          <strong>Chain Type:</strong> ${displayIsSolana ? 'Solana' : 'EVM'}
        </div>
      `
    } else {
      accountInfo.innerHTML = '<p>Connect your wallet to see account details</p>'
    }
  }

  // Update network information display
  const networkInfo = document.getElementById('network-info')
  if (networkInfo) {
    if (isConnected) {
      const networkName = chainId || 'Unknown Network'
      networkInfo.innerHTML = `
        <div class="info-box">
          <strong>Current Network:</strong> ${networkName}
        </div>
      `
    } else {
      networkInfo.innerHTML = '<p>Connect to see network details</p>'
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

  // Solana direct wallet buttons
  document.getElementById('solana-connect')?.addEventListener('click', async () => {
    try {
      const result = await solanaProvider.connect()
      addLog(`✅ Solana connected: ${result.publicKey.toString()}`)
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

  // Sign typed data button
  document.getElementById('sign-typed-data')?.addEventListener('click', async () => {
    try {
      const accounts = await evmProvider.request({ method: 'eth_accounts' })
      if (accounts.length === 0) {
        throw new Error('No accounts connected')
      }

      const typedData = {
        domain: {
          name: 'Arena Headless Wallet',
          version: '1',
          chainId: 11155111, // Sepolia testnet
          verifyingContract: '0x0000000000000000000000000000000000000000'
        },
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' }
          ]
        },
        primaryType: 'Person',
        message: {
          name: 'Arena User',
          wallet: accounts[0]
        }
      }

      const signature = await evmProvider.request({
        method: 'eth_signTypedData_v4',
        params: [accounts[0], JSON.stringify(typedData)]
      })

      document.getElementById('signature-result')!.innerHTML = `
        <div class="info-box">
          <h4>Typed Data Signature</h4>
          <div class="code">Signature: ${signature}</div>
        </div>
      `
      addLog(`✅ Typed data signed: ${signature.substring(0, 20)}...`)
    } catch (error) {
      addLog(`❌ Typed data signing failed: ${error}`)
    }
  })

  // Send transaction button
  document.getElementById('send-transaction')?.addEventListener('click', async () => {
    try {
      const accounts = await evmProvider.request({ method: 'eth_accounts' })
      if (accounts.length === 0) {
        throw new Error('No accounts connected')
      }

      // Clear previous results
      const txResultElement = document.getElementById('transaction-result')
      if (txResultElement) {
        txResultElement.innerHTML = '<div class="info-box">📤 Sending transaction...</div>'
      }
      addLog('📤 Sending EVM transaction...')

      const txHash = await evmProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: accounts[0], // Send to self
          value: '0x0',
          data: '0x'
        }]
      })

      // Show success with the transaction hash
      if (txResultElement) {
        txResultElement.innerHTML = `
          <div class="info-box" style="background: #d4edda; border-color: #c3e6cb;">
            <h4 style="color: #155724;">✅ Transaction Sent Successfully</h4>
            <div class="code">Hash: ${txHash}</div>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #155724;">
              Transaction sent to the network. This was a 0-value transfer to self for testing.
            </p>
          </div>
        `
      }
      addLog(`✅ EVM transaction sent: ${txHash}`)
    } catch (error: any) {
      // Show error in the UI
      const txResultElement = document.getElementById('transaction-result')
      if (txResultElement) {
        txResultElement.innerHTML = `
          <div class="error">
            <h4>❌ Transaction Failed</h4>
            <div class="code">${error.message || error}</div>
          </div>
        `
      }
      addLog(`❌ EVM transaction failed: ${error.message || error}`)
    }
  })

  // Switch to Polygon button
  document.getElementById('switch-to-polygon')?.addEventListener('click', async () => {
    try {
      await evmProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }] // Polygon Amoy testnet
      })
      addLog('✅ Switched to Polygon Amoy testnet')
      updateUI()
    } catch (error) {
      addLog(`❌ Failed to switch to Polygon: ${error}`)
    }
  })

  // Switch to Ethereum button
  document.getElementById('switch-to-ethereum')?.addEventListener('click', async () => {
    try {
      await evmProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }] // Sepolia
      })
      addLog('✅ Switched to Sepolia testnet')
      updateUI()
    } catch (error) {
      addLog(`❌ Failed to switch to Ethereum: ${error}`)
    }
  })

  // AppKit disconnect button
  document.getElementById('appkit-disconnect')?.addEventListener('click', async () => {
    try {
      await appKit.disconnect()
      addLog('✅ AppKit disconnected')
      updateUI()
    } catch (error) {
      addLog(`❌ AppKit disconnect failed: ${error}`)
    }
  })

  // Get capabilities button
  document.getElementById('get-capabilities')?.addEventListener('click', async () => {
    try {
      const capabilities = await evmProvider.request({
        method: 'wallet_getCapabilities',
        params: []
      })
      document.getElementById('signature-result')!.innerHTML = `
        <div class="info-box">
          <h4>Wallet Capabilities</h4>
          <div class="code">${JSON.stringify(capabilities, null, 2)}</div>
        </div>
      `
      addLog('✅ Got wallet capabilities')
    } catch (error) {
      addLog(`❌ Failed to get capabilities: ${error}`)
    }
  })

  // EVM disconnect button (from wallet UI)
  document.getElementById('evm-disconnect')?.addEventListener('click', async () => {
    try {
      await evmProvider.disconnect()
      addLog('✅ EVM disconnected from wallet UI')
      updateUI()
    } catch (error) {
      addLog(`❌ EVM disconnect failed: ${error}`)
    }
  })

  // Solana disconnect button (from wallet UI)
  document.getElementById('solana-disconnect')?.addEventListener('click', async () => {
    try {
      await solanaProvider.disconnect()
      addLog('✅ Solana disconnected from wallet UI')
      updateUI()
    } catch (error) {
      addLog(`❌ Solana disconnect failed: ${error}`)
    }
  })

  document.getElementById('solana-sign-message')?.addEventListener('click', async () => {
    try {
      // Get the Solana provider from AppKit when connected through AppKit
      const isConnected = appKit.getIsConnectedState()
      const caipNetwork = appKit.getCaipNetwork()
      const isSolanaChain = caipNetwork?.chainNamespace === 'solana' ||
                            caipNetwork?.caipNetworkId?.includes('solana') ||
                            false

      if (!isConnected || !isSolanaChain) {
        addLog('❌ Not connected to Solana through AppKit')
        return
      }

      // For Solana, we'll use the direct provider since AppKit's getProvider() returns the current chain provider
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

  // Solana send transaction button
  document.getElementById('solana-send-transaction')?.addEventListener('click', async () => {
    try {
      // Get the Solana provider from AppKit when connected through AppKit
      const isConnected = appKit.getIsConnectedState()
      const caipNetwork = appKit.getCaipNetwork()
      const isSolanaChain = caipNetwork?.chainNamespace === 'solana' ||
                            caipNetwork?.caipNetworkId?.includes('solana') ||
                            false

      if (!isConnected || !isSolanaChain) {
        addLog('❌ Not connected to Solana through AppKit')
        return
      }

      // Show sending status
      const solanaResultElement = document.getElementById('solana-result')
      if (solanaResultElement) {
        solanaResultElement.innerHTML = '<div class="info-box">📤 Preparing Solana transaction...</div>'
      }
      addLog('🚀 Preparing Solana transaction...')

      // Import Solana Web3.js dynamically
      const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js')

      // Get the current address
      const address = appKit.getAddress()
      if (!address) {
        throw new Error('No Solana address found')
      }

      // Create connection (use devnet for testing)
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

      // Create a simple transfer transaction (send 0.000001 SOL to self)
      const fromPubkey = new PublicKey(address)
      const toPubkey = new PublicKey(address) // Send to self for testing

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: 1000 // 0.000001 SOL
        })
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = fromPubkey

      // Sign and send transaction
      const signedTx = await solanaProvider.signTransaction(transaction)
      const serialized = signedTx.serialize()

      if (solanaResultElement) {
        solanaResultElement.innerHTML = '<div class="info-box">📡 Broadcasting transaction...</div>'
      }

      const txId = await connection.sendRawTransaction(serialized)

      // Show success
      if (solanaResultElement) {
        solanaResultElement.innerHTML = `
          <div class="info-box" style="background: #d4edda; border-color: #c3e6cb;">
            <h4 style="color: #155724;">✅ Solana Transaction Sent</h4>
            <div class="code">TxID: ${txId}</div>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #155724;">
              Sent 0.000001 SOL to self on Solana Devnet
            </p>
          </div>
        `
      }
      addLog(`✅ Solana transaction sent: ${txId}`)
    } catch (error: any) {
      // Show error in UI
      const solanaResultElement = document.getElementById('solana-result')
      if (solanaResultElement) {
        solanaResultElement.innerHTML = `
          <div class="error">
            <h4>❌ Transaction Failed</h4>
            <div class="code">${error.message || error}</div>
          </div>
        `
      }
      addLog(`❌ Solana transaction failed: ${error.message || error}`)
    }
  })

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

  // Solana events
  solanaProvider.on('connect', (publicKey: any) => {
    addLog(`✅ Solana wallet connected: ${publicKey.toString()}`)
    updateUI()
  })

  solanaProvider.on('disconnect', () => {
    addLog('🔓 Solana wallet disconnected')
    updateUI()
  })

  // Listen for AppKit events
  appKit.subscribeState((state) => {
    if (state.open !== undefined) {
      addLog(`🔗 AppKit modal ${state.open ? 'opened' : 'closed'}`)
    }
    updateUI()
  })

  // Subscribe to connection state changes
  // Note: subscribeAccount doesn't exist, we'll rely on subscribeState for updates

  // Initial UI update
  updateUI()
  addLog('🎮 Arena Headless Wallet + Reown AppKit Demo ready')

  // Make updateUI globally available for debugging
  ;(window as any).updateUI = updateUI
})