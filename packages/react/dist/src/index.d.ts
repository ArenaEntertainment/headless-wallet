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
export { MockWalletProvider } from './provider.js';
export { WalletContext } from './context.js';
export { useWallet, useWalletConnection, useWalletState, useAccount, useAccountInfo, useAccounts, useChain, useChainInfo, useChains } from './hooks/index.js';
export { WalletConnectionButton, WalletConnectionStatus, WalletConnectionGuard, AccountSelector, AccountList, AccountInfo, ChainSelector, ChainList, ChainInfo, WalletStatus, WalletStatusBadge, WalletConnectionIndicator } from './components/index.js';
export type { MockWalletProviderProps, MockWalletProviderConfig, WalletContext as WalletContextType, WalletContextState, WalletContextActions, UseWalletReturn, UseAccountReturn, UseChainReturn, WalletHookOptions, UseAccountOptions, UseChainOptions, WalletConnectionProps, AccountSelectorProps, ChainSelectorProps, WalletStatusProps, WalletEventHandler, EventCleanup } from './types.js';
export type { MockWallet, WalletConfig, WalletState, Account, AccountConfig, AccountType, EVMAccount, SolanaAccount, DualChainAccount, SupportedChain, EVMChain, SolanaCluster, Chain, ChainType, ProductionGuardConfig } from '@arenaentertainment/wallet-mock';
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
//# sourceMappingURL=index.d.ts.map