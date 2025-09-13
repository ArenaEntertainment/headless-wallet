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
  // Install headless wallet with real private key
  await installHeadlessWallet(page, {
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

    // Solana account with private key (base58)
    {
      privateKey: '5J2X...[base58 key]',
      type: 'solana'
    }
  ]
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

## License

MIT