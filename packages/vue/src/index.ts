/**
 * @arenaentertainment/wallet-mock-vue
 *
 * Vue plugin and composables for wallet-mock integration
 *
 * This package provides a comprehensive Vue.js integration for the wallet-mock library,
 * including reactive composables, Vue components, and DevTools integration.
 *
 * Features:
 * - Reactive wallet state management with Vue composables
 * - Ready-to-use Vue components for wallet interaction
 * - Vue DevTools integration for debugging
 * - TypeScript support with full Vue 3 typing
 * - Production environment safeguards
 * - SSR compatibility
 */

// Core plugin
export {
  MockWalletPlugin,
  createMockWalletPlugin,
  WALLET_INJECTION_KEY,
  getGlobalWalletInstance,
  setGlobalWalletInstance,
  isWalletAvailable
} from './plugin.js';

// Composables
export {
  useWallet,
  useWalletEvents,
  useAccount,
  useAccountOperations,
  useChain,
  useChainOperations
} from './composables/index.js';

// Vue Components (commented out for now to avoid build issues)
// export {
//   WalletConnectButton,
//   AccountSelector,
//   ChainSelector
// } from './components/index.js';

// DevTools integration
export {
  setupDevTools,
  updateDevToolsWallet,
  isDevToolsAvailable
} from './devtools.js';

// Types
export type {
  // Plugin types
  MockWalletPluginOptions,
  MockWalletPlugin as MockWalletPluginInterface,

  // Composable types
  ReactiveWalletState,
  ReactiveAccountState,
  ReactiveChainState,
  WalletComposableOptions,
  WalletEventHandler,
  WalletEventListeners,
  ComposableEventOptions,

  // Component types (commented out)
  // WalletConnectButtonProps,
  // AccountSelectorProps,
  // ChainSelectorProps,

  // DevTools types
  DevToolsState,

  // Utility types
  ProductionSafetyCheck
} from './types.js';

// Re-export core wallet types for convenience
export type {
  // Core interfaces
  MockWallet,
  WalletFactory,
  EventEmitter,

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
  EVMAccountData,
  SolanaAccountData,

  // Chains
  SupportedChain,
  EVMChain,
  SolanaCluster,
  Chain,
  ChainType,

  // Events
  WalletEvents,
  AccountEvents,
  ChainEvents,

  // Transactions and signatures
  TransactionRequest,
  SignatureRequest
} from '@arenaentertainment/wallet-mock';

// Re-export constants for convenience
export {
  CHAIN_PRESETS
} from '@arenaentertainment/wallet-mock';

// Re-export standards types for convenience
export type {
  // EIP-1193 Ethereum Provider
  EthereumProvider,
  ProviderRequest,
  ProviderRpcError,
  ProviderEvents,
  TransactionObject,
  AddEthereumChainParameter,
  SwitchEthereumChainParameter,
  WatchAssetParameter,
  PermissionObject,

  // Solana Wallet Standard
  SolanaWallet,
  WalletAccount,
  WalletProperties,
  SolanaConnect,
  SolanaDisconnect,
  SolanaEvents,
  SolanaSignTransaction,
  SolanaSignMessage,
  SolanaSignAndSendTransaction,
  SolanaWalletEvents,
  SolanaTransaction,
  SolanaChain
} from '@arenaentertainment/wallet-mock-standards';

/**
 * Default export: the main plugin instance
 *
 * @example
 * ```typescript
 * import { createApp } from 'vue';
 * import WalletMockVue from '@arenaentertainment/wallet-mock-vue';
 *
 * const app = createApp();
 * app.use(WalletMockVue, {
 *   accounts: [{ type: 'dual_chain' }],
 *   autoConnect: true
 * });
 * ```
 */
export { MockWalletPlugin as default } from './plugin.js';

/**
 * Version information
 */
export const version = '0.1.0';

/**
 * Package metadata
 */
export const meta = {
  name: '@arenaentertainment/wallet-mock-vue',
  version: '0.1.0',
  description: 'Vue plugin and composables for wallet-mock',
  homepage: 'https://github.com/arenaentertainment/wallet-mock',
  repository: 'https://github.com/arenaentertainment/wallet-mock/tree/main/packages/vue',
  license: 'MIT'
} as const;