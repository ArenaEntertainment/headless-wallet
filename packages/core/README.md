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
    // Solana account (base58 or Uint8Array)
    {
      privateKey: '5J2X...[base58 key]',
      type: 'solana'
    }
  ]
}
```

### RPC Configuration

```typescript
{
  accounts: [...],

  // EVM RPC
  evm: {
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
    // Or use viem transports for multiple chains
    transports: {
      1: http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'),
      137: http('https://polygon.g.alchemy.com/v2/YOUR_KEY')
    },
    defaultChain: mainnet
  },

  // Solana RPC
  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    // Or use predefined cluster
    cluster: 'mainnet-beta' // 'devnet' | 'testnet' | 'mainnet-beta'
  }
}
```

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
- `getEip6963Provider()` - Returns EIP-6963 provider info
- `getSolanaStandardWallet()` - Returns Solana standard wallet

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