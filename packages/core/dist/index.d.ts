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
export { UnifiedWallet } from './wallet/unified-wallet.js';
export { MockWalletFactory, WalletConfigBuilder, walletFactory, createWallet, createEVMWallet, createSolanaWallet, createMultiChainWallet, createDevWallet, createWalletFromPreset, WALLET_PRESETS } from './factory/wallet-factory.js';
export { AccountManager } from './accounts/account-manager.js';
export type { AccountManagerConfig, AccountCreationResult } from './accounts/account-manager.js';
export { StateManager } from './state/state-manager.js';
export type { StateManagerConfig, StateChangeHandler } from './state/state-manager.js';
export { EnhancedProductionGuard, createProductionGuard, createStrictProductionGuard, SecurityManager, createSecurityManager, createStrictSecurityManager, createPermissiveSecurityManager, initializeDefaultSecurity, SecurityLevel, SecurityPresets, DEVELOPMENT_SECURITY_CONFIG, TESTING_SECURITY_CONFIG, PRODUCTION_ADJACENT_SECURITY_CONFIG, SECURITY_SEVERITY, COMMON_THREAT_PATTERNS, validateSecurityConfig, getSecurityRecommendations, generateSecurityReport, isSecurityError, sanitizeForLogging, defaultSecurity, } from './security/index.js';
export type { ProductionCheckResult, DetectionMethod, EnvironmentInfo, EnhancedProductionGuardConfig, OverrideConfig, SecurityEvent, SecurityManagerConfig, SecurityPolicy, ValidationRule, EnvironmentRestriction, OperationLimit, ThreatPattern, ThreatEvent, SecurityViolation, SecurityHealthCheck, ComponentHealth, SecurityMetrics, SecurityReport, ProductionGuardResult } from './security/index.js';
export type { MockWallet, WalletFactory, EventEmitter, WalletConfig, WalletState, Account, AccountConfig, AccountType, EVMAccount, SolanaAccount, DualChainAccount, EVMAccountData, SolanaAccountData, SupportedChain, EVMChain, SolanaCluster, Chain, ChainType, WalletEvents, AccountEvents, ChainEvents, TransactionRequest, SignatureRequest } from '../../shared/src/index.ts';
export { CHAIN_PRESETS } from '../../shared/src/index.ts';
export type { EthereumProvider, ProviderRequest, ProviderRpcError, ProviderEvents, TransactionObject, AddEthereumChainParameter, SwitchEthereumChainParameter, WatchAssetParameter, PermissionObject, SolanaWallet, WalletAccount, WalletProperties, SolanaConnect, SolanaDisconnect, SolanaEvents, SolanaSignTransaction, SolanaSignMessage, SolanaSignAndSendTransaction, SolanaWalletEvents, SolanaTransaction, SolanaChain } from '../../standards/src/index.ts';
export { MockEthereumProvider, EthereumMethod, ProviderErrorCode, MockSolanaWallet, MockSolanaTransaction, SolanaChains, FeatureNames } from '../../standards/src/index.ts';
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
//# sourceMappingURL=index.d.ts.map