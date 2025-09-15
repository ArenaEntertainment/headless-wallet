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
          <li>Real cryptographic operations using ethers.js with actual private keys</li>
          <li>Multi-chain support with EVM (Sepolia, Polygon Amoy) and Solana (Devnet)</li>
          <li>Standard wallet operations (connect, sign, send transactions)</li>
          <li>Chain switching functionality</li>
        </ul>
      </div>

      <!-- Connection Status -->
      <div class="section">
        <h2>🔗 Connection Status</h2>
        <div class="connection-status">
          <span :class="['status', isConnected ? 'connected' : 'disconnected']">
            {{ isConnected ? (activeChain === 'solana' ? 'Solana Connected' : 'EVM Connected') : 'Disconnected' }}
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
      <div v-if="isConnected" class="section">
        <h2>👤 Account Information</h2>
        <div class="wallet-info">
          <h4>{{ activeChain === 'solana' ? 'Solana Accounts' : 'EVM Accounts' }}</h4>
          <div class="code">Current: {{ formatAddress(address) }}</div>

          <!-- Multiple Accounts Display -->
          <div v-if="wallet" style="margin-top: 1rem;">
            <strong>All Accounts (click to switch):</strong>

            <!-- EVM Accounts -->
            <div v-if="activeChain === 'eip155' && evmAccountInfo">
              <div
                v-for="(acc, index) in evmAccountInfo.accounts"
                :key="index"
                @click="switchToEVMAccount(index)"
                :class="['account-item', { active: index === evmAccountInfo.currentIndex }]"
              >
                {{ index === evmAccountInfo.currentIndex ? '▶ ' : '  ' }}{{ formatAddress(acc) }}
              </div>
            </div>

            <!-- Solana Accounts -->
            <div v-if="activeChain === 'solana' && solanaAccountInfo">
              <div
                v-for="(acc, index) in solanaAccountInfo.accounts"
                :key="index"
                @click="switchToSolanaAccount(index)"
                :class="['account-item', { active: index === solanaAccountInfo.currentIndex }]"
              >
                {{ index === solanaAccountInfo.currentIndex ? '▶ ' : '  ' }}{{ formatAddress(acc) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Network Information -->
      <div v-if="isConnected" class="section">
        <h2>🌐 Network Information</h2>
        <div class="info-box">
          <h4>Active Chain</h4>
          <div class="code">{{ networkName }}</div>
        </div>
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
      <div v-if="isConnected" class="section">
        <h2>✍️ Signing Demo</h2>
        <div class="demo-actions">
          <button @click="signMessage" :disabled="!isConnected">
            {{ activeChain === 'solana' ? 'Sign Solana Message' : 'Sign EVM Message' }}
          </button>
          <button @click="signTypedData" :disabled="!isConnected || activeChain === 'solana'">
            Sign Typed Data (EVM)
          </button>
        </div>
        <div v-if="signature" class="signature-result">
          <h4>Signature Result:</h4>
          <div class="code">{{ signature }}</div>
        </div>
        <div v-if="capabilities" class="info-box">
          <h4>Wallet Capabilities:</h4>
          <div class="code">{{ JSON.stringify(capabilities, null, 2) }}</div>
        </div>
      </div>

      <!-- EVM Transaction Demo -->
      <div v-if="isConnected && activeChain === 'eip155'" class="section">
        <h2>💸 EVM Transaction Demo</h2>
        <div class="demo-actions">
          <button @click="sendTransaction" :disabled="!isConnected">
            Send Test Transaction
          </button>
          <button @click="disconnectEVM" :disabled="!isConnected">
            Disconnect EVM (from wallet UI)
          </button>
        </div>
        <div v-if="txHash" class="tx-result">
          <h4>✅ Transaction Sent Successfully</h4>
          <div class="code">{{ txHash }}</div>
          <p>Sent 0 ETH to self (test transaction)</p>
        </div>
      </div>

      <!-- Solana Transaction Demo -->
      <div v-if="isConnected && activeChain === 'solana'" class="section">
        <h2>🟣 Solana Transaction Demo</h2>
        <div class="demo-actions">
          <button @click="signSolanaMessage" :disabled="!isConnected">
            Sign Solana Message
          </button>
          <button @click="sendSolanaTransaction" :disabled="!isConnected">
            Send Solana Transaction
          </button>
          <button @click="disconnectSolana" :disabled="!isConnected">
            Disconnect Solana (from wallet UI)
          </button>
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
import { ref, computed, watch, onMounted } from 'vue'
import {
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitState,
  useWalletInfo,
  useDisconnect
} from '@reown/appkit/vue'
import { BrowserProvider } from 'ethers'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'

// AppKit composables
const account = useAppKitAccount()
const network = useAppKitNetwork()
const state = useAppKitState()
const evmProvider = useAppKitProvider('eip155')
const solanaProvider = useAppKitProvider('solana')
const walletInfo = useWalletInfo()
const { disconnect } = useDisconnect()

// Reactive state
const logs = ref<string[]>(['🎮 Arena Headless Wallet + Reown AppKit Nuxt Demo Initialized', '📡 Waiting for wallet connection...'])
const signature = ref('')
const txHash = ref('')
const solanaResult = ref('')
const capabilities = ref<any>(null)
const wallet = ref<any>(null)
const evmAccountInfo = ref<any>(null)
const solanaAccountInfo = ref<any>(null)

// Computed properties
const address = computed(() => account.value?.address || '')
const isConnected = computed(() => account.value?.isConnected || false)
const caipNetwork = computed(() => network.value?.caipNetwork)
const selectedNetworkId = computed(() => state.value?.selectedNetworkId || '')
const walletProvider = computed(() => evmProvider.value?.walletProvider)
const solanaWalletProvider = computed(() => solanaProvider.value?.walletProvider)

const activeChain = computed(() => {
  const networkId = selectedNetworkId.value
  if (!networkId) return 'eip155'
  return networkId.includes('solana') ? 'solana' : 'eip155'
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

// Update account info
const updateAccountInfo = () => {
  if (wallet.value) {
    evmAccountInfo.value = wallet.value.getEVMAccountInfo()
    solanaAccountInfo.value = wallet.value.getSolanaAccountInfo()
  }
}

// Account switching
const switchToEVMAccount = (index: number) => {
  if (wallet.value) {
    wallet.value.switchEVMAccount(index)
    addLog(`🔄 Switched to EVM account ${index}`)
    updateAccountInfo()
  }
}

const switchToSolanaAccount = (index: number) => {
  if (wallet.value) {
    wallet.value.switchSolanaAccount(index)
    addLog(`🔄 Switched to Solana account ${index}`)
    updateAccountInfo()
  }
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

// Signing functions
const signMessage = async () => {
  try {
    signature.value = ''

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
    addLog('📤 Preparing EVM transaction...')

    if (walletProvider.value) {
      const provider = new BrowserProvider(walletProvider.value)
      const signer = await provider.getSigner()

      const tx = await signer.sendTransaction({
        to: address.value,
        value: '0x0'
      })

      txHash.value = tx.hash
      addLog(`✅ EVM transaction sent: ${tx.hash}`)
    }
  } catch (error: any) {
    txHash.value = ''
    addLog(`❌ Transaction failed: ${error.message || error}`)
  }
}

// Solana functions
const signSolanaMessage = async () => {
  try {
    if (solanaWalletProvider.value) {
      const message = new TextEncoder().encode('Hello from Nuxt + AppKit on Solana!')
      const result = await solanaWalletProvider.value.signMessage(message)
      solanaResult.value = `Signed: ${Buffer.from(result.signature).toString('hex').substring(0, 20)}...`
      addLog('✅ Solana message signed')
    }
  } catch (error) {
    addLog(`❌ Solana signing failed: ${error}`)
  }
}

const sendSolanaTransaction = async () => {
  try {
    solanaResult.value = ''
    addLog('📤 Preparing Solana transaction...')

    if (solanaWalletProvider.value && address.value) {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const fromPubkey = new PublicKey(address.value)
      const toPubkey = new PublicKey(address.value)

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
      addLog(`✅ Solana transaction sent: ${txId}`)
    }
  } catch (error: any) {
    solanaResult.value = ''
    addLog(`❌ Solana transaction failed: ${error.message || error}`)
  }
}

// Disconnect handlers
const disconnectEVM = async () => {
  try {
    if (walletProvider.value && walletProvider.value.disconnect) {
      await walletProvider.value.disconnect()
      addLog('✅ EVM disconnected from wallet UI')
    }
  } catch (error) {
    addLog(`❌ EVM disconnect failed: ${error}`)
  }
}

const disconnectSolana = async () => {
  try {
    if (solanaWalletProvider.value && solanaWalletProvider.value.disconnect) {
      await solanaWalletProvider.value.disconnect()
      addLog('✅ Solana disconnected from wallet UI')
    }
  } catch (error) {
    addLog(`❌ Solana disconnect failed: ${error}`)
  }
}

// Watch for connection changes
watch(isConnected, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    addLog(`✅ Wallet connected: ${formatAddress(address.value)}`)
    updateAccountInfo()
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

// Get wallet instance on mount
onMounted(() => {
  if (typeof window !== 'undefined') {
    wallet.value = (window as any).__headlessWallet
    updateAccountInfo()
  }
})
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
  margin-bottom: 1rem;
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
  list-style: disc;
  padding-left: 1.5rem;
  color: #495057;
}

.info-box li {
  margin: 0.5rem 0;
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

.demo-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1rem 0;
  align-items: center;
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

.account-item {
  cursor: pointer;
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
  background: #f5f5f5;
  font-family: monospace;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.account-item:hover {
  background: #e0e0e0;
}

.account-item.active {
  background: #e3f2fd;
  font-weight: bold;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
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
.tx-result,
.solana-result {
  margin-top: 1rem;
}

.tx-result {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  padding: 1rem;
}

.tx-result h4 {
  color: #155724;
  margin-bottom: 0.5rem;
}

.tx-result p {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #155724;
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
  .container {
    padding: 1rem;
  }

  h1 {
    font-size: 2rem;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>