<template>
  <client-only>
    <div class="container">
      <div class="framework-badge">Vue 3 / Nuxt 3</div>
      <h1>🎮 Arena Headless Wallet + Reown AppKit</h1>
      <p class="subtitle">
        Demonstrating seamless integration between Arena's mock wallet and Reown's AppKit for Web3 development
      </p>

      <!-- Info Box -->
      <div class="info-box">
        <h3>🎯 What This Demo Shows</h3>
        <ul>
          <li>EIP-6963 wallet discovery - AppKit automatically detects our mock wallet</li>
          <li>Real cryptographic operations using viem with actual private keys</li>
          <li>Multi-chain support with EVM (Ethereum, Polygon, Arbitrum, Optimism) and SVM (Solana)</li>
          <li>Standard wallet operations (connect, sign, send transactions)</li>
          <li>Chain switching functionality</li>
        </ul>
      </div>

      <!-- Connection Status -->
      <div class="section">
        <h2>🔗 Connection Status</h2>
        <div class="connection-status">
          <span :class="['status', { connected: evmConnected, disconnected: !evmConnected }]">
            EVM {{ evmConnected ? 'Connected' : 'Disconnected' }}
          </span>
          <span :class="['status', { connected: solanaConnected, disconnected: !solanaConnected }]">
            Solana {{ solanaConnected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>
        <div class="demo-actions">
          <appkit-button />
          <appkit-network-button />
          <button v-if="isConnected" @click="handleDisconnect" style="background: #dc3545;">
            Disconnect AppKit
          </button>
        </div>
      </div>

      <!-- Account Information -->
      <div class="section">
        <h2>👤 Account Information</h2>
        <div v-if="isConnected" class="wallet-info">
          <h4>{{ activeChain === 'solana' ? 'Solana Account' : 'EVM Account' }}</h4>
          <div class="code">{{ formatAddress(address) }}</div>
        </div>
        <p v-else>Connect your wallet to see account details</p>
      </div>

      <!-- Network Information -->
      <div class="section">
        <h2>🌐 Network Information</h2>
        <div v-if="isConnected" class="info-box">
          <h4>Active Chain</h4>
          <div class="code">{{ networkName }}</div>
        </div>
        <p v-else>Connect to see network details</p>
        <div class="demo-actions">
          <button @click="switchToPolygon" :disabled="!isConnected || activeChain !== 'eip155'">
            Switch to Polygon Amoy
          </button>
          <button @click="switchToEthereum" :disabled="!isConnected || activeChain !== 'eip155'">
            Switch to Sepolia
          </button>
          <button @click="getCapabilities" :disabled="!isConnected">
            Get Wallet Capabilities
          </button>
        </div>
      </div>

      <!-- Signing Demo -->
      <div class="section">
        <h2>✍️ Signing Demo</h2>
        <div class="demo-actions">
          <button @click="signMessage" :disabled="!isConnected">
            Sign Message
          </button>
          <button @click="signTypedData" :disabled="!isConnected || activeChain === 'solana'">
            Sign Typed Data
          </button>
        </div>
        <div v-if="signature" class="signature-result">
          <h4>Signature Result:</h4>
          <div class="code">{{ signature }}</div>
        </div>
      </div>

      <!-- EVM Transaction Demo -->
      <div class="section">
        <h2>💸 EVM Transaction Demo</h2>
        <div class="demo-actions">
          <button @click="sendTransaction" :disabled="!isConnected || activeChain !== 'eip155'">
            Send Test Transaction
          </button>
          <button @click="manualDisconnect">Manual Disconnect Test</button>
        </div>
        <div v-if="txHash && activeChain === 'eip155'" class="transaction-result">
          <h4>Transaction Hash:</h4>
          <div class="code">{{ txHash }}</div>
        </div>
      </div>

      <!-- Solana Demo -->
      <div class="section">
        <h2>🟣 Solana Demo</h2>
        <div class="demo-actions">
          <button @click="connectSolana" :disabled="solanaConnected">Connect Solana</button>
          <button @click="disconnectSolana" :disabled="!solanaConnected">Disconnect Solana</button>
          <button @click="signSolanaMessage" :disabled="!solanaConnected">Sign Solana Message</button>
          <button @click="sendSolanaTransaction" :disabled="!solanaConnected">Send Solana Transaction</button>
        </div>
        <div v-if="solanaConnected" class="info-box">
          <h4>Solana Connected</h4>
          <div class="code">{{ formatAddress(address) }}</div>
        </div>
        <div v-else>
          <h4>Solana Disconnected</h4>
        </div>
        <div v-if="solanaResult" class="solana-result">
          <div class="code">{{ solanaResult }}</div>
        </div>
      </div>

      <!-- Feature Grid -->
      <div class="feature-grid">
        <div class="feature-card">
          <div class="icon">🔍</div>
          <h3>EIP-6963 Discovery</h3>
          <p>Automatic wallet detection through standard protocol</p>
        </div>
        <div class="feature-card">
          <div class="icon">🔐</div>
          <h3>Real Cryptography</h3>
          <p>Actual private key operations, not fake signatures</p>
        </div>
        <div class="feature-card">
          <div class="icon">🌍</div>
          <h3>Multi-Chain Support</h3>
          <p>Switch between networks seamlessly</p>
        </div>
        <div class="feature-card">
          <div class="icon">⚡</div>
          <h3>Standards Compliant</h3>
          <p>Follows EIP-1193, EIP-6963, and other standards</p>
        </div>
      </div>

      <!-- Event Logs -->
      <div class="section">
        <h2>📊 Event Logs</h2>
        <button @click="clearLogs" class="clear-btn">Clear Logs</button>
        <div class="logs">
          <div v-for="(log, index) in logs" :key="index" class="log-entry">{{ log }}</div>
        </div>
      </div>
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitState,
  useWalletInfo,
  useAppKit,
  useDisconnect
} from '@reown/appkit/vue'
import { BrowserProvider } from 'ethers'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'

// AppKit composables - these are already reactive refs
const account = useAppKitAccount()
const network = useAppKitNetwork()
const state = useAppKitState()
const evmProvider = useAppKitProvider('eip155')
const solanaProvider = useAppKitProvider('solana')
const walletInfo = useWalletInfo()
const { disconnect } = useDisconnect()

// Reactive state for our own data
const logs = ref<string[]>(['🎮 Arena Headless Wallet + Reown AppKit Nuxt Demo Initialized', '📡 Waiting for wallet connection...'])
const signature = ref('')
const txHash = ref('')
const solanaResult = ref('')
const capabilities = ref<any>(null)

// Just use the reactive values directly from the composables!
const address = computed(() => account.value?.address || '')
const isConnected = computed(() => account.value?.isConnected || false)
const caipAddress = computed(() => account.value?.caipAddress || '')
const caipNetwork = computed(() => network.value?.caipNetwork)
const selectedNetworkId = computed(() => state.value?.selectedNetworkId || '')
const walletProvider = computed(() => evmProvider.value?.walletProvider)
const solanaWalletProvider = computed(() => solanaProvider.value?.walletProvider)

// Connection states
const evmConnected = computed(() => isConnected.value && activeChain.value === 'eip155')
const solanaConnected = computed(() => isConnected.value && activeChain.value === 'solana')

// Watch for connection changes and log them
watch(isConnected, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    addLog(`✅ Wallet connected: ${formatAddress(address.value)}`)
  } else if (!newVal && oldVal) {
    addLog('🔌 Wallet disconnected')
  }
})

// Watch for network changes
watch(caipNetwork, (newNetwork, oldNetwork) => {
  if (newNetwork && oldNetwork && newNetwork.name !== oldNetwork.name && isConnected.value) {
    addLog(`🌐 Network changed to: ${newNetwork.name}`)
  }
})

// Computed properties
const activeChain = computed(() => {
  const networkId = selectedNetworkId.value
  if (!networkId) return 'eip155'
  return networkId.includes('solana') ? 'solana' : 'eip155'
})

const connectionStatus = computed(() => {
  if (!isConnected.value) return 'Disconnected'
  return activeChain.value === 'solana' ? 'Solana Connected' : 'EVM Connected'
})

const networkName = computed(() => {
  return caipNetwork.value?.name || 'Unknown'
})

// Helper functions
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push(`[${timestamp}] ${message}`)
}

const clearLogs = () => {
  logs.value = ['✨ Logs cleared']
}

const formatAddress = (addr: string) => {
  if (!addr) return ''
  if (addr.length > 20) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  return addr
}

// Network switching
const switchToEthereum = async () => {
  try {
    await network.switchNetwork({ id: 'eip155:11155111' }) // Sepolia
    addLog('🔄 Switched to Sepolia testnet')
  } catch (error) {
    addLog(`❌ Failed to switch network: ${error}`)
  }
}

const switchToPolygon = async () => {
  try {
    await network.switchNetwork({ id: 'eip155:80002' }) // Polygon Amoy
    addLog('🔄 Switched to Polygon Amoy testnet')
  } catch (error) {
    addLog(`❌ Failed to switch network: ${error}`)
  }
}

// Get capabilities
const getCapabilities = async () => {
  try {
    if (walletProvider.value) {
      const caps = await walletProvider.value.request({ method: 'wallet_getCapabilities' })
      capabilities.value = caps
      addLog(`📋 Wallet capabilities: ${JSON.stringify(caps)}`)
    }
  } catch (error) {
    addLog(`❌ Failed to get capabilities: ${error}`)
  }
}

// AppKit disconnect handler
const handleDisconnect = async () => {
  try {
    await disconnect()
    addLog('✅ AppKit disconnected')
    signature.value = ''
    txHash.value = ''
    solanaResult.value = ''
  } catch (error) {
    addLog(`❌ Disconnect failed: ${error}`)
  }
}

// Manual disconnect
const manualDisconnect = async () => {
  try {
    // This would disconnect the wallet
    addLog('🔌 Manual disconnect triggered')
  } catch (error) {
    addLog(`❌ Failed to disconnect: ${error}`)
  }
}

// Signing functions
const signMessage = async () => {
  try {
    signature.value = ''
    console.log('Signing message - walletProvider:', walletProvider.value)
    console.log('activeChain:', activeChain.value)

    if (activeChain.value === 'solana' && solanaWalletProvider.value) {
      // Solana signing
      const message = new TextEncoder().encode('Hello from Nuxt + AppKit!')
      const result = await solanaWalletProvider.value.signMessage(message)
      signature.value = Buffer.from(result.signature).toString('hex')
      addLog('✅ Solana message signed')
    } else if (walletProvider.value) {
      // EVM signing
      const provider = new BrowserProvider(walletProvider.value)
      const signer = await provider.getSigner()
      const result = await signer.signMessage('Hello from Nuxt + AppKit!')
      signature.value = result
      addLog('✅ EVM message signed')
    } else {
      addLog('⚠️ No wallet provider available')
    }
  } catch (error) {
    addLog(`❌ Signing failed: ${error}`)
  }
}

const signTypedData = async () => {
  if (activeChain.value === 'solana' || !walletProvider.value) return

  try {
    signature.value = ''
    const provider = new BrowserProvider(walletProvider.value)
    const signer = await provider.getSigner()

    const domain = {
      name: 'Arena Headless Wallet',
      version: '1',
      chainId: 11155111, // Sepolia
      verifyingContract: '0x0000000000000000000000000000000000000000'
    }

    const types = {
      Message: [
        { name: 'content', type: 'string' },
        { name: 'timestamp', type: 'uint256' }
      ]
    }

    const value = {
      content: 'Hello from Nuxt + AppKit typed data!',
      timestamp: Math.floor(Date.now() / 1000)
    }

    const result = await signer.signTypedData(domain, types, value)
    signature.value = result
    addLog('✅ Typed data signed')
  } catch (error) {
    addLog(`❌ Typed data signing failed: ${error}`)
  }
}

// Transaction function
const sendTransaction = async () => {
  try {
    txHash.value = ''
    addLog('📤 Preparing transaction...')

    if (activeChain.value === 'solana' && solanaWalletProvider.value) {
      // Solana transaction
      try {
        // Use devnet for testing
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
        const fromPubkey = new PublicKey(address.value!)
        const toPubkey = new PublicKey(address.value!) // Send to self for demo

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: 1000 // 0.000001 SOL
          })
        )

        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = fromPubkey

        addLog('📡 Signing and sending Solana transaction...')
        const signedTx = await solanaWalletProvider.value.signTransaction(transaction)
        const serialized = signedTx.serialize()
        const txId = await connection.sendRawTransaction(serialized)

        txHash.value = txId
        addLog(`✅ Solana transaction sent: ${txId}`)
      } catch (solanaError: any) {
        throw solanaError
      }
    } else if (walletProvider.value) {
      // EVM transaction
      addLog('📤 Sending EVM transaction...')
      const provider = new BrowserProvider(walletProvider.value)
      const signer = await provider.getSigner()

      const tx = await signer.sendTransaction({
        to: address.value,
        value: '0x0'
      })

      txHash.value = tx.hash
      addLog(`✅ EVM transaction sent: ${tx.hash}`)
    } else {
      throw new Error('No wallet provider available')
    }
  } catch (error: any) {
    txHash.value = ''
    addLog(`❌ Transaction failed: ${error.message || error}`)
  }
}

// Solana specific functions
const connectSolana = async () => {
  try {
    // For Solana, we need to use the modal to connect
    // The network object doesn't have a switchNetwork method directly
    addLog('🟣 Connecting to Solana...')
    // Just open the modal and let the user select Solana
    const { open } = useAppKit()
    await open({ view: 'Networks' })
  } catch (error) {
    addLog(`❌ Failed to connect Solana: ${error}`)
  }
}

const disconnectSolana = async () => {
  try {
    // Switch back to EVM by opening network selector
    const { open } = useAppKit()
    await open({ view: 'Networks' })
    addLog('🟣 Opening network selector...')
  } catch (error) {
    addLog(`❌ Failed to disconnect Solana: ${error}`)
  }
}

const signSolanaMessage = async () => {
  try {
    if (solanaWalletProvider.value) {
      const message = new TextEncoder().encode('Hello from Solana!')
      const result = await solanaWalletProvider.value.signMessage(message)
      solanaResult.value = `Signed: ${Buffer.from(result.signature).toString('hex').slice(0, 20)}...`
      addLog('🟣 Solana message signed')
    }
  } catch (error) {
    addLog(`❌ Solana signing failed: ${error}`)
  }
}

const sendSolanaTransaction = async () => {
  try {
    if (solanaWalletProvider.value && address.value) {
      // Use devnet for testing
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const fromPubkey = new PublicKey(address.value)
      const toPubkey = new PublicKey(address.value) // Send to self for demo

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: 1000 // 0.000001 SOL
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = fromPubkey

      addLog('📡 Signing and sending Solana transaction...')
      const signedTx = await solanaWalletProvider.value.signTransaction(transaction)
      const serialized = signedTx.serialize()
      const txId = await connection.sendRawTransaction(serialized)

      solanaResult.value = `Transaction sent: ${txId.substring(0, 20)}...`
      addLog(`🟣 Solana transaction sent: ${txId}`)
    }
  } catch (error) {
    addLog(`❌ Solana transaction failed: ${error}`)
  }
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  position: relative;
}

.framework-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #42b883;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
}

h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.subtitle {
  text-align: center;
  color: #7f8c8d;
  font-size: 1.2rem;
  margin-bottom: 3rem;
}

.section {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  background: #f8f9fa;
}

.section h2 {
  color: #495057;
  margin-top: 0;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-box {
  background: #e7f3ff;
  border: 1px solid #bee5eb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.info-box h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.info-box h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.info-box ul {
  list-style: none;
  padding-left: 0;
  color: #495057;
}

.info-box li {
  color: #495057;
  margin: 0.5rem 0;
  padding-left: 1rem;
}

.info-box li:before {
  content: "• ";
  margin-left: -1rem;
  color: #495057;
}

.wallet-info {
  background: #f0f8f0;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.wallet-info h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.connection-status {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status.connected {
  background: #d4edda;
  color: #155724;
}

.status.disconnected {
  background: #f8d7da;
  color: #721c24;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
}

.demo-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1rem 0;
}

.code {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.5rem;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  word-break: break-all;
  color: #495057;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  margin: 0.5rem 0.5rem 0.5rem 0;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.clear-btn {
  background: #007bff;
}

.clear-btn:hover {
  background: #0056b3;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.feature-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.feature-card .icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #495057;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #6c757d;
  font-size: 0.9rem;
}

.signature-result,
.transaction-result,
.solana-result {
  margin-top: 1rem;
}

.signature-result h4,
.transaction-result h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.logs {
  background: #1a1a1a;
  color: #00ff00;
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  max-height: 300px;
  overflow-y: auto;
  margin: 1rem 0;
}

.log-entry {
  margin-bottom: 0.25rem;
}

/* Custom scrollbar for logs */
.logs::-webkit-scrollbar {
  width: 8px;
}

.logs::-webkit-scrollbar-track {
  background: #374151;
  border-radius: 4px;
}

.logs::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

.logs::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

@media (max-width: 768px) {
  .demo-container {
    padding: 1rem;
  }
}
</style>