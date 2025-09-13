/**
 * @arenaentertainment/wallet-mock
 *
 * Universal mock wallet library supporting both EVM and Solana chains
 *
 * This package provides a comprehensive implementation of a mock wallet
 * that can be used for development, testing, and demonstration purposes.
 *
 * Features:
 * - Multi-chain support (EVM and Solana)
 * - Comprehensive account management
 * - Production environment safeguards
 * - EIP-1193 Ethereum Provider implementation
 * - Solana Wallet Standard implementation
 * - Factory pattern for easy instantiation
 * - TypeScript support with full type safety
 */

// Core wallet implementation
export { UnifiedWallet } from './wallet/unified-wallet.js';

// Factory pattern and convenience functions
export {
  MockWalletFactory,
  WalletConfigBuilder,
  walletFactory,
  createWallet,
  createEVMWallet,
  createSolanaWallet,
  createMultiChainWallet,
  createDevWallet,
  createWalletFromPreset,
  WALLET_PRESETS
} from './factory/wallet-factory.js';

// Account management
export { AccountManager } from './accounts/account-manager.js';
export type {
  AccountManagerConfig,
  AccountCreationResult
} from './accounts/account-manager.js';

// State management
export { StateManager } from './state/state-manager.js';
export type {
  StateManagerConfig,
  StateChangeHandler
} from './state/state-manager.js';

// Security - Enhanced comprehensive security framework
export {
  // Enhanced Production Guard
  EnhancedProductionGuard,
  createProductionGuard,
  createStrictProductionGuard,

  // Security Manager
  SecurityManager,
  createSecurityManager,
  createStrictSecurityManager,
  createPermissiveSecurityManager,
  initializeDefaultSecurity,
  SecurityLevel,
  SecurityPresets,

  // Security Configuration Presets
  DEVELOPMENT_SECURITY_CONFIG,
  TESTING_SECURITY_CONFIG,
  PRODUCTION_ADJACENT_SECURITY_CONFIG,

  // Security Utilities
  SECURITY_SEVERITY,
  COMMON_THREAT_PATTERNS,
  validateSecurityConfig,
  getSecurityRecommendations,
  generateSecurityReport,
  isSecurityError,
  sanitizeForLogging,
  defaultSecurity,

  // Note: createProductionCheck is available as legacy alias for createProductionGuard
} from './security/index.js';

export type {
  // Security Types
  ProductionCheckResult,
  DetectionMethod,
  EnvironmentInfo,
  EnhancedProductionGuardConfig,
  OverrideConfig,
  SecurityEvent,
  SecurityManagerConfig,
  SecurityPolicy,
  ValidationRule,
  EnvironmentRestriction,
  OperationLimit,
  ThreatPattern,
  ThreatEvent,
  SecurityViolation,
  SecurityHealthCheck,
  ComponentHealth,
  SecurityMetrics,
  SecurityReport,
  ProductionGuardResult
} from './security/index.js';

// Re-export types from shared package for convenience
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
} from '@arenaentertainment/wallet-mock-shared';

// Re-export constants from shared package
export {
  CHAIN_PRESETS
} from '@arenaentertainment/wallet-mock-shared';

// Re-export standards for convenience
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

export {
  // EIP-1193
  MockEthereumProvider,
  EthereumMethod,
  ProviderErrorCode,

  // Solana Wallet Standard
  MockSolanaWallet,
  MockSolanaTransaction,
  SolanaChains,
  FeatureNames
} from '@arenaentertainment/wallet-mock-standards';


/**
 * Default factory instance for quick access
 *
 * @example
 * ```typescript
 * import { walletFactory } from '@arenaentertainment/wallet-mock';
 *
 * const wallet = await walletFactory.createEVMWallet({
 *   chainIds: ['1', '137'],
 *   autoConnect: true
 * });
 * ```
 */
export { walletFactory as default } from './factory/wallet-factory.js';