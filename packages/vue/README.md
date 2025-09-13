# @arenaentertainment/wallet-mock-vue

Vue plugin and composables for the @arenaentertainment/wallet-mock library.

## Installation

```bash
npm install @arenaentertainment/wallet-mock-vue
```

## Quick Start

### 1. Install the Plugin

```typescript
import { createApp } from 'vue'
import { MockWalletPlugin } from '@arenaentertainment/wallet-mock-vue'

const app = createApp(App)

app.use(MockWalletPlugin, {
  accounts: [{ type: 'dual_chain' }],
  autoConnect: true,
  devtools: true
})

app.mount('#app')
```

### 2. Use in Components

```vue
<template>
  <div>
    <!-- Using composables -->
    <div v-if="isConnected">
      <p>Connected with {{ accounts.length }} accounts</p>
      <p>Current account: {{ formatAddress(currentAccount?.address) }}</p>
      <p>Current chain: {{ currentChain?.name }}</p>
    </div>

    <!-- Using components -->
    <WalletConnectButton
      :show-account="true"
      :show-chain="true"
      @connect="onConnect"
      @disconnect="onDisconnect"
    />

    <AccountSelector
      v-if="isConnected"
      :show-balances="true"
      :show-chains="true"
      @account-changed="onAccountChanged"
    />

    <ChainSelector
      v-if="isConnected"
      :show-status="true"
      filter-by-type="all"
      @chain-changed="onChainChanged"
    />
  </div>
</template>

<script setup lang="ts">
import {
  useWallet,
  useAccount,
  useChain,
  WalletConnectButton,
  AccountSelector,
  ChainSelector
} from '@arenaentertainment/wallet-mock-vue'

// Composables
const { isConnected, accounts } = useWallet()
const { currentAccount, formatAddress } = useAccount()
const { currentChain } = useChain()

// Event handlers
const onConnect = () => {
  console.log('Wallet connected!')
}

const onDisconnect = () => {
  console.log('Wallet disconnected!')
}

const onAccountChanged = (account) => {
  console.log('Account changed to:', account.address)
}

const onChainChanged = (chain) => {
  console.log('Chain changed to:', chain.name)
}
</script>
```

## Features

### 🔄 Reactive Composables

- **useWallet()** - Core wallet state and connection management
- **useAccount()** - Account switching and management
- **useChain()** - Chain switching and information
- **useWalletEvents()** - Event listener management
- **useAccountOperations()** - Account-specific operations
- **useChainOperations()** - Chain-specific operations

### 🎨 Ready-to-Use Components

- **WalletConnectButton** - Connect/disconnect button with account display
- **AccountSelector** - Dropdown for account switching
- **ChainSelector** - Dropdown for chain switching

### 🛠 Vue DevTools Integration

Automatic integration with Vue DevTools for debugging wallet state, events, and connection history.

### 🔒 Production Safety

Built-in production environment checks to prevent accidental usage in production.

### 📱 TypeScript Support

Full TypeScript support with comprehensive type definitions.

## API Reference

### Plugin Options

```typescript
interface MockWalletPluginOptions {
  // Wallet configuration
  accounts?: AccountConfig[]
  chains?: string[]
  autoConnect?: boolean

  // Plugin options
  devtools?: boolean
  injectKey?: string | symbol
  productionChecks?: boolean
}
```

### useWallet()

```typescript
const {
  wallet,           // Wallet instance
  isConnected,      // Connection state
  accounts,         // Available accounts
  state,           // Complete wallet state
  isConnecting,    // Loading state
  connectionError, // Last error
  connect,         // Connect function
  disconnect,      // Disconnect function
  refresh          // Refresh state
} = useWallet()
```

### useAccount()

```typescript
const {
  currentAccount,      // Active account
  accounts,           // All accounts
  currentAccountIndex, // Account index
  switchAccount,      // Switch account
  getAccount,         // Get account by address
  isSwitching,        // Loading state
  switchError         // Last error
} = useAccount()
```

### useChain()

```typescript
const {
  currentChain,     // Active chain
  supportedChains,  // All chains
  switchChain,      // Switch chain
  isSwitching,      // Loading state
  switchError,      // Last error
  isEVM,           // Is EVM chain
  isSolana         // Is Solana chain
} = useChain()
```

## Component Props

### WalletConnectButton

```typescript
interface WalletConnectButtonProps {
  connectText?: string      // "Connect Wallet"
  disconnectText?: string   // "Disconnect"
  showAccount?: boolean     // true
  showChain?: boolean       // false
  class?: string           // Custom CSS classes
  disabled?: boolean       // false
  loading?: boolean        // false
}
```

### AccountSelector

```typescript
interface AccountSelectorProps {
  showBalances?: boolean    // false
  showChains?: boolean     // true
  class?: string          // Custom CSS classes
  itemRenderer?: (account: Account) => string
}
```

### ChainSelector

```typescript
interface ChainSelectorProps {
  showLogos?: boolean      // true
  showStatus?: boolean     // true
  filterByType?: 'evm' | 'solana' | 'all'  // 'all'
  class?: string          // Custom CSS classes
}
```

## Advanced Usage

### Custom Event Handling

```typescript
import { useWalletEvents } from '@arenaentertainment/wallet-mock-vue'

const { on, off, once } = useWalletEvents()

// Listen to events
const unsubscribe = on('accountsChanged', (data) => {
  console.log('Accounts changed:', data.accounts)
})

// Listen once
once('chainChanged', (data) => {
  console.log('Chain changed to:', data.chainId)
})

// Manual cleanup
unsubscribe()
```

### Account Operations

```typescript
import { useAccountOperations } from '@arenaentertainment/wallet-mock-vue'

const { signMessage, getPublicKey, canSignTransactions } = useAccountOperations()

// Sign a message
const signature = await signMessage('Hello, World!')

// Check capabilities
if (canSignTransactions()) {
  // Proceed with transaction
}
```

### Chain Operations

```typescript
import { useChainOperations } from '@arenaentertainment/wallet-mock-vue'

const { getBlockNumber, getGasPrice, getNetworkId } = useChainOperations()

// Get chain information
const blockNumber = await getBlockNumber()  // EVM only
const gasPrice = await getGasPrice()        // EVM only
const networkId = await getNetworkId()      // Both EVM and Solana
```

### Global Access

```typescript
// Access wallet from anywhere in the app
import { getCurrentInstance } from 'vue'

const instance = getCurrentInstance()
const wallet = instance?.appContext.config.globalProperties.$wallet
const utils = instance?.appContext.config.globalProperties.$walletUtils

// Or use injection
import { inject } from 'vue'
import { WALLET_INJECTION_KEY } from '@arenaentertainment/wallet-mock-vue'

const wallet = inject(WALLET_INJECTION_KEY)
```

## Styling

Components support both Tailwind CSS and custom CSS:

```vue
<template>
  <!-- With Tailwind -->
  <WalletConnectButton class="bg-purple-600 hover:bg-purple-700" />

  <!-- With custom CSS -->
  <WalletConnectButton class="my-custom-button" />
</template>

<style>
.my-custom-button {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 12px 24px;
}
</style>
```

## Development

The package includes Vue DevTools integration that provides:

- Real-time wallet state inspection
- Event timeline with wallet activities
- Account and chain information
- Connection history

Enable in development:

```typescript
app.use(MockWalletPlugin, {
  devtools: true  // Enabled by default in development
})
```

## TypeScript

The package provides full TypeScript support. Import types as needed:

```typescript
import type {
  ReactiveWalletState,
  ReactiveAccountState,
  ReactiveChainState,
  WalletComposableOptions,
  MockWalletPluginOptions
} from '@arenaentertainment/wallet-mock-vue'
```

## License

MIT