# @arenaentertainment/headless-wallet-react

React provider for headless wallet - inject a test wallet into your React app during development.

## Installation

```bash
npm install @arenaentertainment/headless-wallet-react
```

## Quick Start

```tsx
// App.tsx
import { HeadlessWalletProvider } from '@arenaentertainment/headless-wallet-react';

function App() {
  return (
    <HeadlessWalletProvider
      enabled={process.env.NODE_ENV === 'development'}
      accounts={[
        {
          privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
          type: 'evm'
        }
      ]}
    >
      <YourApp />
    </HeadlessWalletProvider>
  );
}
```

## Usage with wagmi

The provider injects `window.ethereum`, so wagmi hooks work automatically:

```tsx
import { useAccount, useSignMessage } from 'wagmi';

function WalletComponent() {
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();

  if (!isConnected) {
    return <button onClick={() => connect()}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Connected: {address}</p>
      <button onClick={() => signMessage({ message: 'Hello' })}>
        Sign Message
      </button>
    </div>
  );
}
```

## API Reference

### `<HeadlessWalletProvider>`

React provider component that injects the headless wallet.

**Props:**

```typescript
interface HeadlessWalletProviderProps {
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

  // Child components
  children: React.ReactNode;
}
```

## Configuration Examples

### Basic Development Setup

```tsx
<HeadlessWalletProvider
  enabled={process.env.NODE_ENV === 'development'}
  accounts={[
    { privateKey: '0xac0974...', type: 'evm' }
  ]}
  autoConnect={true}  // Auto-approve connections
  debug={true}         // Show activity in console
>
  <App />
</HeadlessWalletProvider>
```

### Multi-Chain Configuration

```tsx
import { mainnet, polygon } from 'viem/chains';
import { http } from 'viem';

<HeadlessWalletProvider
  enabled={true}
  accounts={[
    { privateKey: '0xac0974...', type: 'evm' },
    { privateKey: 'base58_key', type: 'solana' }
  ]}
  evm={{
    defaultChain: mainnet,
    transports: {
      [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/KEY'),
      [polygon.id]: http('https://polygon.g.alchemy.com/v2/KEY')
    }
  }}
  solana={{
    rpcUrl: 'https://api.mainnet-beta.solana.com'
  }}
>
  <App />
</HeadlessWalletProvider>
```

### Custom Branding

```tsx
<HeadlessWalletProvider
  enabled={true}
  accounts={[...]}
  branding={{
    name: 'Dev Wallet',
    icon: 'data:image/svg+xml;base64,...',
    rdns: 'dev.wallet'
  }}
>
  <App />
</HeadlessWalletProvider>
```

## Integration with Popular Libraries

### wagmi v2

```tsx
import { WagmiProvider, createConfig } from 'wagmi';
import { HeadlessWalletProvider } from '@arenaentertainment/headless-wallet-react';

const config = createConfig({
  // Your wagmi config
});

function App() {
  return (
    <HeadlessWalletProvider
      enabled={process.env.NODE_ENV === 'development'}
      accounts={[...]}
    >
      <WagmiProvider config={config}>
        <YourApp />
      </WagmiProvider>
    </HeadlessWalletProvider>
  );
}
```

### RainbowKit

```tsx
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { HeadlessWalletProvider } from '@arenaentertainment/headless-wallet-react';

function App() {
  return (
    <HeadlessWalletProvider
      enabled={process.env.NODE_ENV === 'development'}
      accounts={[...]}
    >
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <YourApp />
        </RainbowKitProvider>
      </WagmiProvider>
    </HeadlessWalletProvider>
  );
}
```

## Development Tips

1. **Conditional Enabling**: Only enable in development to avoid conflicts with real wallets
2. **Auto-Connect**: Set `autoConnect: true` for faster development
3. **Debug Mode**: Enable `debug: true` to see all wallet interactions
4. **Hot Reload**: The wallet persists across hot reloads

## TypeScript

Full TypeScript support is included. Import types as needed:

```typescript
import type { HeadlessWalletProviderProps } from '@arenaentertainment/headless-wallet-react';
```

## License

MIT