# @arenaentertainment/headless-wallet-vue

Vue plugin for headless wallet - inject a test wallet into your Vue app during development.

## Installation

```bash
npm install @arenaentertainment/headless-wallet-vue
```

## Quick Start

```typescript
// main.ts
import { createApp } from 'vue';
import { HeadlessWalletPlugin } from '@arenaentertainment/headless-wallet-vue';
import App from './App.vue';

const app = createApp(App);

app.use(HeadlessWalletPlugin, {
  enabled: process.env.NODE_ENV === 'development',
  accounts: [
    {
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      type: 'evm'
    }
  ]
});

app.mount('#app');
```

## Usage with wagmi-vue

The plugin injects `window.ethereum`, so wagmi-vue composables work automatically:

```vue
<template>
  <div>
    <div v-if="!isConnected">
      <button @click="connect">Connect Wallet</button>
    </div>
    <div v-else>
      <p>Connected: {{ address }}</p>
      <button @click="signMessage({ message: 'Hello' })">
        Sign Message
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAccount, useSignMessage } from 'wagmi-vue';

const { address, isConnected } = useAccount();
const { signMessage } = useSignMessage();
</script>
```

## API Reference

### `HeadlessWalletPlugin`

Vue plugin that injects the headless wallet on app initialization.

**Installation Options:**

```typescript
interface HeadlessWalletPluginOptions {
  // Enable/disable the wallet injection
  enabled?: boolean;

  // Account configuration
  accounts: Array<{
    privateKey: string | Uint8Array;
    type: 'evm' | 'solana';
  }>;

  // Auto-approve connection requests
  autoConnect?: boolean;

  // Show debug logs in console
  debug?: boolean;

  // Wallet branding
  branding?: {
    name?: string;
    icon?: string;
    rdns?: string;
  };

  // EVM configuration
  evm?: {
    defaultChain?: Chain;
    transports?: Record<number, Transport>;
    rpcUrl?: string;
  };

  // Solana configuration
  solana?: {
    cluster?: 'devnet' | 'testnet' | 'mainnet-beta';
    rpcUrl?: string;
  };
}
```

## Configuration Examples

### Basic Development Setup

```typescript
app.use(HeadlessWalletPlugin, {
  enabled: process.env.NODE_ENV === 'development',
  accounts: [
    { privateKey: '0xac0974...', type: 'evm' }
  ],
  autoConnect: true,  // Auto-approve connections
  debug: true         // Show activity in console
});
```

### Multi-Chain Configuration

```typescript
import { mainnet, polygon } from 'viem/chains';
import { http } from 'viem';

app.use(HeadlessWalletPlugin, {
  enabled: true,
  accounts: [
    { privateKey: '0xac0974...', type: 'evm' },
    { privateKey: 'base58_key', type: 'solana' }
  ],
  evm: {
    defaultChain: mainnet,
    transports: {
      [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/KEY'),
      [polygon.id]: http('https://polygon.g.alchemy.com/v2/KEY')
    }
  },
  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com'
  }
});
```

### Custom Branding

```typescript
app.use(HeadlessWalletPlugin, {
  enabled: true,
  accounts: [...],
  branding: {
    name: 'Dev Wallet',
    icon: 'data:image/svg+xml;base64,...',
    rdns: 'dev.wallet'
  }
});
```

## Composition API Usage

You can also use the wallet directly in components:

```vue
<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(async () => {
  // Wallet is available after plugin installation
  if (window.ethereum) {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    console.log('Connected accounts:', accounts);
  }
});
</script>
```

## Integration with Popular Libraries

### wagmi-vue

```typescript
// main.ts
import { createApp } from 'vue';
import { VueDapp } from 'vue-dapp';
import { HeadlessWalletPlugin } from '@arenaentertainment/headless-wallet-vue';

const app = createApp(App);

// Install headless wallet first
app.use(HeadlessWalletPlugin, {
  enabled: process.env.NODE_ENV === 'development',
  accounts: [...]
});

// Then install Vue dApp
app.use(VueDapp);

app.mount('#app');
```

### Nuxt 3

Create a plugin file:

```typescript
// plugins/headless-wallet.client.ts
import { HeadlessWalletPlugin } from '@arenaentertainment/headless-wallet-vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(HeadlessWalletPlugin, {
    enabled: process.env.NODE_ENV === 'development',
    accounts: [
      {
        privateKey: '0xac0974...',
        type: 'evm'
      }
    ]
  });
});
```

## Development Tips

1. **Conditional Enabling**: Only enable in development to avoid conflicts with real wallets
2. **Auto-Connect**: Set `autoConnect: true` for faster development
3. **Debug Mode**: Enable `debug: true` to see all wallet interactions
4. **Hot Reload**: The wallet persists across hot module replacement

## TypeScript

Full TypeScript support is included. Import types as needed:

```typescript
import type { HeadlessWalletPluginOptions } from '@arenaentertainment/headless-wallet-vue';
```

For better IDE support, you can augment the window type:

```typescript
// env.d.ts
declare global {
  interface Window {
    ethereum?: any;
    phantom?: {
      solana?: any;
    };
  }
}
```

## License

MIT