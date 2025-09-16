# @arenaentertainment/headless-wallet

A headless wallet for testing and development that provides real cryptographic operations for both EVM and Solana chains.

## Features

- 🔐 **Real Cryptography**: Uses actual private keys and generates valid signatures
- 🚀 **Multi-Chain Support**: Both EVM (Ethereum, Polygon, etc.) and Solana
- 🧪 **Playwright Integration**: Perfect for automated testing
- 🎭 **Framework Support**: Vue and React plugins for development
- 📱 **Standards Compliant**: EIP-1193, EIP-6963, Solana Wallet Standard
- 🔧 **Works with Standard Tools**: wagmi, ethers, viem, Reown AppKit, etc.

## Packages

- `@arenaentertainment/headless-wallet` - Core wallet implementation
- `@arenaentertainment/headless-wallet-playwright` - Playwright testing integration
- `@arenaentertainment/headless-wallet-vue` - Vue.js development plugin
- `@arenaentertainment/headless-wallet-react` - React development provider

## Philosophy

This library acts as a **provider** that injects standard wallet interfaces (`window.ethereum`, `window.phantom.solana`) so that existing wallet tooling just works. You don't learn new APIs - you use the same tools you'd use in production.

## Quick Start

### Playwright Testing (Primary Use Case)

```typescript
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

test('wallet integration', async ({ page }) => {
  // Install headless wallet with real private key (MUST be before page.goto)
  const walletId = await installHeadlessWallet(page, {
    accounts: [
      { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
    ],
    autoConnect: false,
    debug: true
  });

  await page.goto('http://localhost:3000');

  // Your dApp sees a real wallet and can interact normally
  const accounts = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_requestAccounts' })
  );

  expect(accounts).toContain('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

  // Clean up after test
  await uninstallHeadlessWallet(page, walletId);
});
```

### Vue Development Plugin

```typescript
// main.ts
import { createApp } from 'vue';
import { HeadlessWalletPlugin } from '@arenaentertainment/headless-wallet-vue';

const app = createApp(App);

app.use(HeadlessWalletPlugin, {
  enabled: process.env.NODE_ENV === 'development',
  accounts: [
    { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
  ]
});
```

```vue
<!-- Component.vue -->
<script setup>
// Use standard wagmi-vue composables (or similar)
import { useAccount, useSignMessage } from 'wagmi-vue'

const { address } = useAccount()  // wagmi handles this
const { signMessage } = useSignMessage()  // wagmi handles this

// headless-wallet just provides window.ethereum, wagmi does the rest
</script>
```

### React Development Provider

```tsx
// App.tsx
import { HeadlessWalletProvider } from '@arenaentertainment/headless-wallet-react';

function App() {
  return (
    <HeadlessWalletProvider
      enabled={process.env.NODE_ENV === 'development'}
      accounts={[
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ]}
    >
      <YourApp />
    </HeadlessWalletProvider>
  );
}

function YourApp() {
  // Use standard wagmi hooks
  const { address } = useAccount();  // wagmi hook
  const { signMessage } = useSignMessage();  // wagmi hook

  // headless-wallet just provides window.ethereum, wagmi does the rest
  return <div>Connected: {address}</div>;
}
```

### Core Usage (Advanced)

```typescript
import { injectHeadlessWallet } from '@arenaentertainment/headless-wallet';

// Manually inject wallet providers
const wallet = injectHeadlessWallet({
  accounts: [
    { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
  ]
});

// Now window.ethereum is available for any wallet library to use
const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
const signature = await window.ethereum.request({
  method: 'personal_sign',
  params: ['Hello World', accounts[0]]
});
```

## Works With Standard Tools

Since this library provides standard wallet interfaces, it works seamlessly with:

- **wagmi** - React hooks for Ethereum
- **wagmi-vue** - Vue composables for Ethereum
- **ethers.js** - Ethereum library
- **viem** - TypeScript Ethereum library
- **Reown AppKit** (formerly WalletConnect) - Wallet connection UI
- **Any EIP-1193 compatible library**

## Real Cryptography

Unlike other mock libraries that return fake data, this library:

- ✅ Generates real signatures using actual private keys
- ✅ Derives real addresses from private keys
- ✅ Uses viem for EVM operations
- ✅ Uses @solana/web3.js for Solana operations
- ✅ Supports chain switching, transaction signing, etc.

## Configuration

### Basic Account Configuration

```typescript
{
  accounts: [
    // EVM account with private key
    {
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      type: 'evm'
    },

    // Solana account - supports multiple key formats:
    // Uint8Array (64 bytes)
    {
      privateKey: new Uint8Array([/* 64 bytes */]),
      type: 'solana'
    },

    // Hex string (with or without 0x prefix)
    {
      privateKey: '0x0001020304...', // 128 hex chars for 64 bytes
      type: 'solana'
    },

    // Base64 string
    {
      privateKey: 'AAECAwQFBg...', // base64 encoded 64 bytes
      type: 'solana'
    },

    // JSON array string
    {
      privateKey: '[0,1,2,3,4,5,...]', // JSON array of 64 numbers
      type: 'solana'
    }
  ]
}
```

### RPC Configuration

Configure custom RPC endpoints for both EVM and Solana chains:

```typescript
{
  accounts: [...],

  // EVM RPC Configuration
  evm: {
    // Option 1: Simple RPC URL
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',

    // Option 2: Advanced with viem transports (for multiple chains)
    transports: {
      1: http('https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY'),
      137: http('https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY')
    },
    defaultChain: mainnet
  },

  // Solana RPC Configuration
  solana: {
    // Custom RPC endpoint
    rpcUrl: 'https://api.mainnet-beta.solana.com',

    // Or use a predefined cluster
    cluster: 'mainnet-beta' // 'devnet' | 'testnet' | 'mainnet-beta'
  }
}
```

### Custom Wallet Branding

Customize how your wallet appears in connection UIs:

```typescript
{
  accounts: [...],
  branding: {
    name: 'My Custom Wallet',
    icon: 'data:image/svg+xml;base64,...', // or raw SVG string
    rdns: 'com.mycompany.wallet',
    isMetaMask: false, // Don't identify as MetaMask for EVM
    isPhantom: false   // Don't identify as Phantom for Solana
  }
}
```

**Branding Options:**
- `name`: Display name in wallet connection UIs
- `icon`: SVG string, base64 data URL, or data URL
- `rdns`: Reverse domain name for EIP-6963 compliance
- `isMetaMask`: Whether EVM provider identifies as MetaMask (default: true)
- `isPhantom`: Whether Solana provider identifies as Phantom (default: true)

## Supported Methods

### EVM Methods (20+)

The wallet supports all standard Ethereum JSON-RPC methods:

#### Account & Connection
- `eth_requestAccounts` - Request wallet connection
- `eth_accounts` - Get connected accounts
- `eth_chainId` - Get current chain ID
- `wallet_switchEthereumChain` - Switch to different chain
- `wallet_addEthereumChain` - Add new chain
- `wallet_requestPermissions` - Request permissions
- `wallet_getPermissions` - Get current permissions
- `wallet_getCapabilities` - Get wallet capabilities

#### Signing & Transactions
- `personal_sign` - Sign personal message
- `eth_sign` - Sign message (legacy)
- `eth_signTypedData_v4` - Sign typed structured data
- `eth_sendTransaction` - Send transaction

#### Blockchain Data
- `eth_getBalance` - Get account balance
- `eth_blockNumber` - Get latest block number
- `eth_getTransactionReceipt` - Get transaction receipt
- `eth_estimateGas` - Estimate gas for transaction
- `eth_gasPrice` - Get current gas price
- `eth_getCode` - Get contract code at address
- `eth_getLogs` - Query event logs

#### Token Management
- `wallet_watchAsset` - Add ERC20 token to wallet

### Solana Methods (20+)

The wallet provides comprehensive Solana functionality:

#### Connection & Accounts
- `connect` - Connect wallet
- `disconnect` - Disconnect wallet
- `getPublicKey` - Get current public key
- `switchAccount` - Switch between accounts

#### Signing & Transactions
- `signTransaction` - Sign transaction
- `signAllTransactions` - Sign multiple transactions
- `signMessage` - Sign arbitrary message
- `signAndSendTransaction` - Sign and submit transaction
- `sendTransaction` - Send pre-signed transaction
- `simulateTransaction` - Test transaction without sending

#### Blockchain Data
- `getBalance` - Get SOL balance
- `getBalanceLamports` - Get balance in lamports
- `getLatestBlockhash` - Get recent blockhash
- `getAccountInfo` - Get account details
- `getSignatureStatuses` - Check transaction status
- `requestAirdrop` - Request test SOL (devnet/testnet)

#### Authentication
- `signIn` - Sign In with Solana (SIWS)

#### SPL Token Operations
- `getTokenBalance` - Get SPL token balance
- `getTokenAccounts` - List all token accounts
- `transferToken` - Transfer SPL tokens
- `createTokenAccount` - Create associated token account
- `getMintInfo` - Get token mint information

## Testing Examples

### Test with wagmi

```typescript
test('wagmi integration', async ({ page }) => {
  await installHeadlessWallet(page, {
    accounts: [{ privateKey: '0xac0974...', type: 'evm' }]
  });

  await page.goto('/app');

  // App uses wagmi, which detects our headless wallet
  await page.click('[data-testid="connect-wallet"]');
  await page.waitForSelector('[data-testid="wallet-connected"]');

  const address = await page.textContent('[data-testid="wallet-address"]');
  expect(address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
});
```

### Test signing

```typescript
test('message signing', async ({ page }) => {
  await installHeadlessWallet(page, {
    accounts: [{ privateKey: '0xac0974...', type: 'evm' }],
    debug: true  // See wallet requests in console
  });

  await page.goto('/app');

  // Sign a message through your dApp's UI
  await page.click('[data-testid="sign-message"]');

  // Verify signature was generated (would be visible in debug output)
  await page.waitForSelector('[data-testid="signature-result"]');
});
```

### Test Solana balance and operations

```typescript
test('Solana balance check', async ({ page }) => {
  await installHeadlessWallet(page, {
    accounts: [{ privateKey: solanaKey, type: 'solana' }],
    solana: { cluster: 'devnet' }
  });

  await page.goto('/app');

  const balance = await page.evaluate(async () => {
    const wallet = window.phantom?.solana;
    await wallet.connect();
    return await wallet.request({ method: 'getBalance' });
  });

  expect(balance).toBeGreaterThanOrEqual(0);
});
```

### Test EVM gas estimation

```typescript
test('gas estimation', async ({ page }) => {
  await installHeadlessWallet(page, {
    accounts: [{ privateKey: '0xac0974...', type: 'evm' }]
  });

  await page.goto('/app');

  const gasEstimate = await page.evaluate(async () => {
    return await window.ethereum.request({
      method: 'eth_estimateGas',
      params: [{
        from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: '0x1000000000000000'
      }]
    });
  });

  expect(gasEstimate).toMatch(/^0x[0-9a-f]+$/i);
});
```

### Test SPL token operations

```typescript
test('SPL token balance', async ({ page }) => {
  await installHeadlessWallet(page, {
    accounts: [{ privateKey: solanaKey, type: 'solana' }],
    solana: { cluster: 'devnet' }
  });

  await page.goto('/app');

  const tokenAccounts = await page.evaluate(async () => {
    const wallet = window.phantom?.solana;
    await wallet.connect();
    return await wallet.request({ method: 'getTokenAccounts' });
  });

  expect(Array.isArray(tokenAccounts)).toBe(true);
});
```

## Custom Branding

You can customize the wallet's appearance in wallet selection UIs:

```typescript
{
  branding: {
    name: 'My Test Wallet',           // Custom wallet name
    icon: '<svg>...</svg>',           // Custom SVG icon
    rdns: 'com.example.wallet',       // Reverse domain notation
    isMetaMask: true,                 // Pretend to be MetaMask (for compatibility)
    isPhantom: true                   // Pretend to be Phantom (for compatibility)
  }
}
```

Example with custom branding:

```typescript
await installHeadlessWallet(page, {
  accounts: [{ privateKey: '0xac0974...', type: 'evm' }],
  branding: {
    name: 'E2E Test Wallet',
    icon: `<svg width="32" height="32">
      <circle cx="16" cy="16" r="16" fill="#6366f1"/>
      <text x="16" y="20" text-anchor="middle" fill="white">TW</text>
    </svg>`,
    isMetaMask: true  // For apps that check for MetaMask
  }
});
```

## License

MIT