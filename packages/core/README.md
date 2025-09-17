# @arenaentertainment/headless-wallet

Core headless wallet implementation for both EVM and Solana chains with real cryptographic operations.

## Installation

```bash
npm install @arenaentertainment/headless-wallet
```

## Overview

This library provides a headless wallet implementation that:
- Uses real private keys and generates valid signatures
- Supports both EVM (Ethereum, Polygon, etc.) and Solana chains
- Works as a standard provider (`window.ethereum`, `window.phantom.solana`)
- Integrates seamlessly with existing Web3 libraries

## Basic Usage

```typescript
import { injectHeadlessWallet } from '@arenaentertainment/headless-wallet';

// Inject wallet into window
const wallet = injectHeadlessWallet({
  accounts: [
    {
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      type: 'evm'
    }
  ]
});

// Now use with any Web3 library
const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
```

## Configuration

### Accounts

```typescript
{
  accounts: [
    // EVM account
    {
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      type: 'evm'
    },
    // Solana account (supports multiple formats)
    {
      privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8',
      type: 'solana'
    }
  ]
}
```

### RPC Configuration

```typescript
import { mainnet, sepolia, polygon, arbitrum } from 'viem/chains';
import { http } from 'viem';

{
  accounts: [...],

  // EVM RPC Configuration - Multiple Options:
  evm: {
    // Option 1: Simple RPC URL (single chain)
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',

    // Option 2: Auto-extract RPCs from viem chains ⭐ NEW!
    chains: [mainnet, sepolia, polygon, arbitrum],
    defaultChain: sepolia, // Recommended for testing
    // Automatically uses each chain's default RPC

    // Option 3: Explicit viem transports (full control)
    transports: {
      1: http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'),
      137: http('https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY')
    },
    defaultChain: mainnet,

    // Option 4: Mix auto-extracted + custom RPCs
    chains: [mainnet, sepolia, polygon],
    transports: {
      1: http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY') // Override mainnet
    }
  },

  // Solana RPC Configuration
  solana: {
    // Option 1: Custom RPC URL
    rpcUrl: 'https://api.mainnet-beta.solana.com',

    // Option 2: Use predefined cluster (defaults to 'devnet')
    cluster: 'mainnet-beta' // 'devnet' | 'testnet' | 'mainnet-beta'
    // If neither rpcUrl nor cluster specified, defaults to devnet
  }
}
```

#### Automatic RPC Extraction

When you specify a `chains` array, the wallet automatically extracts default RPC endpoints from each viem chain object:

- **mainnet** → `https://eth.merkle.io`
- **sepolia** → `https://sepolia.drpc.org`
- **polygon** → `https://polygon-rpc.com`
- **arbitrum** → `https://arb1.arbitrum.io/rpc`

This eliminates the need to manually configure RPC URLs for each chain while still allowing custom overrides via the `transports` option.

#### Solana RPC Configuration

Unlike EVM chains, Solana uses a cluster-based approach:

- **Cluster-based**: Uses named environments (`devnet`, `testnet`, `mainnet-beta`) instead of chain IDs
- **Single endpoint**: One RPC connection per wallet (no multi-chain switching)
- **Built-in clusters**: Automatically resolves to official Solana RPC endpoints via `@solana/web3.js`
- **Priority**: `rpcUrl` (if provided) > `cluster` setting > `devnet` (default for testing)

**Default cluster URLs:**
- **devnet** → `https://api.devnet.solana.com` (default for testing)
- **testnet** → `https://api.testnet.solana.com`
- **mainnet-beta** → `https://api.mainnet-beta.solana.com`

#### Testnet-First Defaults

For safety, this testing library defaults to testnets:

**EVM Auto-Configuration:**
- **Default chains**: When no `chains` array is provided, automatically includes **ALL available testnets** from viem (200+ chains):
  - All Sepolia-based testnets (Ethereum, Arbitrum, Base, Optimism, Scroll, Linea, Blast, Zora, etc.)
  - All Goerli-based testnets (legacy support)
  - Polygon Mumbai testnet
  - All other protocol testnets and devnets
- **Default chain**: Sepolia (not mainnet)
- **Zero configuration**: Just create a wallet and test on any supported testnet immediately

**Solana:**
- **Default cluster**: devnet (not mainnet-beta)

This prevents accidental real transactions and transaction fees during development and testing. The wallet automatically supports chain switching across **all available testnets** without any manual RPC setup - just switch and go! Always explicitly configure mainnet chains for production use.

### Wallet Branding

Customize how your wallet appears in connection UIs:

```typescript
{
  accounts: [...],
  branding: {
    name: 'My Test Wallet',
    icon: 'data:image/svg+xml;base64,...',
    rdns: 'com.mycompany.wallet',
    isMetaMask: false,  // For EVM
    isPhantom: false    // For Solana
  }
}
```

## API Reference

### `injectHeadlessWallet(config: HeadlessWalletConfig)`

Injects wallet providers into the window object.

Returns: `HeadlessWallet` instance

### `HeadlessWallet` Class

#### Methods

- `getEthereumProvider()` - Returns EIP-1193 compatible provider
- `getSolanaProvider()` - Returns Solana wallet adapter
- `getEVMWalletStandard()` - Returns EVM wallet standard implementation
- `getSolanaWalletStandard()` - Returns Solana wallet standard implementation

## EVM Methods Support

- `eth_requestAccounts`
- `eth_accounts`
- `eth_chainId`
- `eth_sendTransaction`
- `personal_sign`
- `eth_signTypedData_v4`
- `wallet_switchEthereumChain`
- `wallet_addEthereumChain`
- And more...

## Solana Methods Support

- `connect()`
- `disconnect()`
- `signTransaction()`
- `signAllTransactions()`
- `signMessage()`
- `signAndSendTransaction()`

## License

MIT