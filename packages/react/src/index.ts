/**
 * @arenaentertainment/wallet-mock-react
 *
 * React provider and hooks for wallet-mock
 *
 * This package provides a comprehensive React integration for the wallet-mock
 * library, including context providers, custom hooks, and ready-to-use components.
 *
 * Features:
 * - React 18+ compatibility with concurrent features
 * - SSR-safe implementation
 * - TypeScript support with full type safety
 * - Production environment safeguards
 * - Comprehensive hook collection for wallet operations
 * - Pre-built components for common wallet interactions
 * - Event subscription utilities
 * - Multi-chain support (EVM and Solana)
 */

// =============================================================================
// Provider and Context
// =============================================================================

export { MockWalletProvider } from './provider.js';
export { WalletContext } from './context.js';

// =============================================================================
// Custom Hooks
// =============================================================================

export {
  // Main wallet hooks
  useWallet,
  useWalletConnection,
  useWalletState,

  // Account management hooks
  useAccount,
  useAccountInfo,
  useAccounts,

  // Chain management hooks
  useChain,
  useChainInfo,
  useChains
} from './hooks/index.js';

// =============================================================================
// React Components
// =============================================================================

export {
  // Wallet connection components
  WalletConnectionButton,
  WalletConnectionStatus,
  WalletConnectionGuard,

  // Account management components
  AccountSelector,
  AccountList,
  AccountInfo,

  // Chain management components
  ChainSelector,
  ChainList,
  ChainInfo,

  // Status display components
  WalletStatus,
  WalletStatusBadge,
  WalletConnectionIndicator
} from './components/index.js';

// =============================================================================
// TypeScript Types
// =============================================================================

export type {
  // Provider types
  MockWalletProviderProps,
  MockWalletProviderConfig,

  // Context types
  WalletContext as WalletContextType,
  WalletContextState,
  WalletContextActions,

  // Hook return types
  UseWalletReturn,
  UseAccountReturn,
  UseChainReturn,

  // Hook options
  WalletHookOptions,
  UseAccountOptions,
  UseChainOptions,

  // Component props
  WalletConnectionProps,
  AccountSelectorProps,
  ChainSelectorProps,
  WalletStatusProps,

  // Event types
  WalletEventHandler,
  EventCleanup
} from './types.js';

// =============================================================================
// Re-export wallet types for convenience
// =============================================================================

export type {
  // Core interfaces
  MockWallet,

  // Configuration
  WalletConfig,
  WalletState,

  // Accounts
  Account,
  AccountConfig,
  AccountType,
  EVMAccount,
  SolanaAccount,
  DualChainAccount,

  // Chains
  SupportedChain,
  EVMChain,
  SolanaCluster,
  Chain,
  ChainType,

  // Production guard
  ProductionGuardConfig
} from '@arenaentertainment/wallet-mock';

/**
 * @example Basic Usage
 * ```tsx
 * import React from 'react';
 * import { MockWalletProvider, useWallet, WalletConnectionButton } from '@arenaentertainment/wallet-mock-react';
 *
 * function App() {
 *   return (
 *     <MockWalletProvider
 *       accounts={[{ type: 'dual_chain' }]}
 *       autoConnect
 *     >
 *       <WalletApp />
 *     </MockWalletProvider>
 *   );
 * }
 *
 * function WalletApp() {
 *   const { isConnected, accounts } = useWallet();
 *
 *   return (
 *     <div>
 *       <WalletConnectionButton />
 *       {isConnected && (
 *         <p>Connected with {accounts.length} accounts</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * @example Advanced Usage with Account Management
 * ```tsx
 * import React from 'react';
 * import {
 *   MockWalletProvider,
 *   useWallet,
 *   useAccount,
 *   AccountSelector,
 *   ChainSelector
 * } from '@arenaentertainment/wallet-mock-react';
 *
 * function AdvancedApp() {
 *   return (
 *     <MockWalletProvider
 *       accounts={[
 *         { type: 'evm' },
 *         { type: 'solana' },
 *         { type: 'dual_chain' }
 *       ]}
 *     >
 *       <WalletManager />
 *     </MockWalletProvider>
 *   );
 * }
 *
 * function WalletManager() {
 *   const { isConnected } = useWallet();
 *   const { account, switchAccount } = useAccount();
 *
 *   if (!isConnected) {
 *     return <div>Please connect your wallet</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <AccountSelector
 *         onChange={(acc) => console.log('Selected:', acc)}
 *       />
 *       <ChainSelector />
 *       {account && (
 *         <p>Current account: {account.address}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * @example Production Configuration
 * ```tsx
 * import React from 'react';
 * import { MockWalletProvider } from '@arenaentertainment/wallet-mock-react';
 *
 * function ProductionSafeApp() {
 *   return (
 *     <MockWalletProvider
 *       accounts={[{ type: 'evm' }]}
 *       production={{
 *         allowedHosts: ['localhost', 'dev.example.com'],
 *         throwInProduction: true
 *       }}
 *     >
 *       <App />
 *     </MockWalletProvider>
 *   );
 * }
 * ```
 */