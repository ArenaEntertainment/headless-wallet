# @arenaentertainment/wallet-mock-react

React provider and hooks for the wallet-mock library, providing comprehensive React integration for mock wallet functionality with support for both EVM and Solana chains.

## Features

- **React 18+ Compatibility**: Full support for React 18 concurrent features and Suspense
- **SSR Safe**: Server-side rendering compatible with proper hydration
- **TypeScript Support**: Complete type safety with comprehensive TypeScript definitions
- **Multi-chain Support**: Works with both EVM (Ethereum, Polygon, BSC) and Solana chains
- **Production Guards**: Built-in safeguards to prevent accidental production usage
- **Custom Hooks**: Comprehensive collection of hooks for all wallet operations
- **Ready-to-use Components**: Pre-built components for common wallet interactions
- **Event System**: Full event subscription and handling capabilities

## Installation

```bash
npm install @arenaentertainment/wallet-mock-react
```

## Quick Start

```tsx
import React from 'react';
import {
  MockWalletProvider,
  useWallet,
  WalletConnectionButton
} from '@arenaentertainment/wallet-mock-react';

function App() {
  return (
    <MockWalletProvider
      accounts={[{ type: 'dual_chain' }]}
      autoConnect
    >
      <WalletApp />
    </MockWalletProvider>
  );
}

function WalletApp() {
  const { isConnected, accounts } = useWallet();

  return (
    <div>
      <WalletConnectionButton />
      {isConnected && (
        <p>Connected with {accounts.length} accounts</p>
      )}
    </div>
  );
}
```

## API Reference

### Provider

#### MockWalletProvider

The main provider component that wraps your app and provides wallet context.

```tsx
import { MockWalletProvider } from '@arenaentertainment/wallet-mock-react';

<MockWalletProvider
  accounts={[{ type: 'evm' }, { type: 'solana' }]}
  autoConnect={true}
  initialChain="1" // Ethereum mainnet
  production={{
    allowedHosts: ['localhost', 'dev.example.com'],
    throwInProduction: true
  }}
>
  <App />
</MockWalletProvider>
```

### Hooks

#### useWallet

Main hook for wallet state and operations.

```tsx
import { useWallet } from '@arenaentertainment/wallet-mock-react';

function Component() {
  const {
    wallet,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    isConnecting,
    error,
    connect,
    disconnect,
    refresh,
    subscribe,
    once
  } = useWallet({
    autoConnect: true,
    onConnect: (accounts) => console.log('Connected:', accounts),
    onError: (error) => console.error('Error:', error)
  });

  return (
    <button onClick={isConnected ? disconnect : connect}>
      {isConnected ? 'Disconnect' : 'Connect'}
    </button>
  );
}
```

#### useAccount

Hook for account management operations.

```tsx
import { useAccount } from '@arenaentertainment/wallet-mock-react';

function AccountManager() {
  const {
    account,
    accounts,
    switchAccount,
    addAccount,
    removeAccount,
    isSwitching,
    error
  } = useAccount({
    autoSelect: true
  });

  return (
    <div>
      <h3>Current: {account?.address}</h3>
      <button onClick={() => addAccount({ type: 'evm' })}>
        Add EVM Account
      </button>
      <button onClick={() => addAccount({ type: 'solana' })}>
        Add Solana Account
      </button>
    </div>
  );
}
```

#### useChain

Hook for blockchain network management.

```tsx
import { useChain } from '@arenaentertainment/wallet-mock-react';

function ChainManager() {
  const {
    chain,
    chains,
    switchChain,
    isSwitching,
    isSupported
  } = useChain();

  return (
    <select
      value={chain?.id || ''}
      onChange={(e) => switchChain(e.target.value)}
    >
      {chains.map(c => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
```

### Components

#### WalletConnectionButton

Ready-to-use connection button with loading states.

```tsx
import { WalletConnectionButton } from '@arenaentertainment/wallet-mock-react';

<WalletConnectionButton
  connectText="Connect Wallet"
  disconnectText="Disconnect"
  connectingText="Connecting..."
  showStatus={true}
  onConnect={() => console.log('Connected!')}
/>
```

#### AccountSelector

Dropdown for selecting between available accounts.

```tsx
import { AccountSelector } from '@arenaentertainment/wallet-mock-react';

<AccountSelector
  placeholder="Choose an account..."
  showAddAccount={true}
  onChange={(account) => console.log('Selected:', account)}
/>
```

#### ChainSelector

Dropdown for selecting blockchain networks.

```tsx
import { ChainSelector } from '@arenaentertainment/wallet-mock-react';

<ChainSelector
  placeholder="Choose a network..."
  onChange={(chain) => console.log('Selected:', chain)}
  filterChains={(chains) => chains.filter(c => c.type === 'evm')}
/>
```

#### WalletStatus

Comprehensive status display component.

```tsx
import { WalletStatus } from '@arenaentertainment/wallet-mock-react';

<WalletStatus
  showConnection={true}
  showAccount={true}
  showChain={true}
  showBalance={true}
/>
```

#### WalletConnectionGuard

Conditional rendering based on connection status.

```tsx
import { WalletConnectionGuard } from '@arenaentertainment/wallet-mock-react';

<WalletConnectionGuard
  fallback={<div>Please connect your wallet</div>}
  loading={<div>Connecting...</div>}
>
  <ProtectedContent />
</WalletConnectionGuard>
```

## Advanced Usage

### Custom Event Handling

```tsx
function EventExample() {
  const { subscribe, once } = useWallet();

  useEffect(() => {
    const unsubscribe = subscribe('accountsChanged', (data) => {
      console.log('Accounts changed:', data.accounts);
    });

    const unsubscribeOnce = once('chainChanged', (data) => {
      console.log('Chain changed once:', data.chainId);
    });

    return () => {
      unsubscribe();
      unsubscribeOnce();
    };
  }, [subscribe, once]);

  return <div>Listening to wallet events...</div>;
}
```

### Production Configuration

```tsx
function ProductionApp() {
  return (
    <MockWalletProvider
      accounts={[{ type: 'evm' }]}
      production={{
        allowedHosts: ['localhost', 'dev.example.com'],
        allowedProtocols: ['http:', 'https:'],
        throwInProduction: true,
        warningMessage: 'Custom warning for mock wallet usage'
      }}
    >
      <App />
    </MockWalletProvider>
  );
}
```

### Multi-Account Management

```tsx
function MultiAccountExample() {
  const { accounts, evmAccounts, solanaAccounts } = useAccounts();
  const { account, switchAccount } = useAccount();

  return (
    <div>
      <h3>EVM Accounts ({evmAccounts.length})</h3>
      {evmAccounts.map(acc => (
        <button
          key={acc.id}
          onClick={() => switchAccount(acc.id)}
          disabled={account?.id === acc.id}
        >
          {acc.address}
        </button>
      ))}

      <h3>Solana Accounts ({solanaAccounts.length})</h3>
      {solanaAccounts.map(acc => (
        <button
          key={acc.id}
          onClick={() => switchAccount(acc.id)}
          disabled={account?.id === acc.id}
        >
          {acc.address}
        </button>
      ))}
    </div>
  );
}
```

## TypeScript Support

The package includes comprehensive TypeScript definitions:

```tsx
import type {
  MockWalletProviderProps,
  UseWalletReturn,
  UseAccountReturn,
  UseChainReturn,
  WalletHookOptions,
  Account,
  Chain
} from '@arenaentertainment/wallet-mock-react';

// Custom hook with proper typing
function useCustomWallet(): UseWalletReturn {
  return useWallet({
    autoConnect: true,
    throwOnError: false
  });
}
```

## Error Handling

```tsx
function ErrorHandlingExample() {
  const { error, clearError } = useWallet({
    throwOnError: false, // Handle errors in state instead of throwing
    onError: (error) => {
      console.error('Wallet error:', error);
      // Custom error handling logic
    }
  });

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={clearError}>Clear Error</button>
      </div>
    );
  }

  return <div>No errors</div>;
}
```

## Testing

The package includes testing utilities and is fully compatible with React Testing Library:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MockWalletProvider, useWallet } from '@arenaentertainment/wallet-mock-react';

function TestComponent() {
  const { isConnected, connect } = useWallet();
  return (
    <button onClick={connect}>
      {isConnected ? 'Connected' : 'Connect'}
    </button>
  );
}

test('wallet connection', async () => {
  render(
    <MockWalletProvider accounts={[{ type: 'evm' }]}>
      <TestComponent />
    </MockWalletProvider>
  );

  const button = screen.getByText('Connect');
  fireEvent.click(button);

  expect(await screen.findByText('Connected')).toBeInTheDocument();
});
```

## Performance Considerations

- Uses `useSyncExternalStore` for React 18 compatibility
- Implements proper memoization for expensive operations
- Minimal re-renders through optimized context structure
- SSR-safe with proper hydration handling

## Security Notes

⚠️ **Important**: This is a mock wallet implementation for development and testing purposes only. It should never be used in production environments with real user funds.

The package includes production environment checks that will warn or throw errors if used inappropriately.

## License

MIT

## Contributing

See the main repository for contribution guidelines.