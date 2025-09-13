/**
 * React hooks for wallet-mock
 */

// Main hooks
export { useWallet, useWalletConnection, useWalletState } from './useWallet.js';
export { useAccount, useAccountInfo, useAccounts } from './useAccount.js';
export { useChain, useChainInfo, useChains } from './useChain.js';

// Re-export types for convenience
export type {
  UseWalletReturn,
  UseAccountReturn,
  UseChainReturn,
  WalletHookOptions,
  UseAccountOptions,
  UseChainOptions
} from '../types.js';