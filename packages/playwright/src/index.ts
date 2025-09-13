/**
 * @arenaentertainment/wallet-mock-playwright
 *
 * Playwright integration package for the wallet-mock library
 *
 * This package provides comprehensive Playwright testing support for wallet
 * mock functionality, including secure installation, test isolation, fixtures,
 * and helper utilities.
 *
 * Features:
 * - Secure bridge communication between Node.js test environment and browser
 * - Multiple wallet instance support with proper isolation
 * - Production environment protection with security checks
 * - EVM and Solana chain support
 * - Comprehensive fixtures for easy test setup
 * - Helper utilities for common wallet operations
 * - Automatic cleanup and resource management
 * - TypeScript support with full type safety
 *
 * @example Basic Usage
 * ```typescript
 * import { installMockWallet } from '@arenaentertainment/wallet-mock-playwright';
 *
 * test('dApp wallet interaction', async ({ page }) => {
 *   await installMockWallet(page, {
 *     accounts: [{
 *       type: 'evm_only',
 *       evm: { chainIds: ['1', '137'] }
 *     }],
 *     autoConnect: true
 *   });
 *
 *   await page.goto('https://your-dapp.local');
 *   // window.ethereum is now available
 * });
 * ```
 *
 * @example With Fixtures
 * ```typescript
 * import { testWithEVMWallet } from '@arenaentertainment/wallet-mock-playwright';
 *
 * testWithEVMWallet('dApp interaction with auto-setup', async ({
 *   page,
 *   evmWallet,
 *   walletHelpers
 * }) => {
 *   await page.goto('https://your-dapp.local');
 *
 *   // Wallet is already installed and connected
 *   await walletHelpers.waitForWallet();
 *   const account = await walletHelpers.getCurrentAccount();
 *
 *   // Interact with dApp...
 * });
 * ```
 */

// Core installation and management functions
export {
  installMockWallet,
  removeMockWallet,
  getInstalledWallet,
  cleanupAllWallets
} from './install.js';

// Bridge communication (advanced usage)
export {
  MessageBridge,
  detectEnvironment,
  validateEnvironment,
  generateSecureToken,
  generateSessionId,
  validateSecurityToken,
  sanitiseSensitiveData,
  validateOrigin,
  securityRateLimiter,
  validateSecurityLevel,
  createSecureCleanup,
  DEFAULT_SECURITY_CONFIG
} from './bridge/index.js';

// Test utilities and helpers
export {
  TestIsolationManager,
  setupTestIsolation,
  cleanupFailedTest,
  getTestId,
  getContextId,
  createIsolatedEnvironment,
  validateTestIsolation,
  waitForIsolatedEnvironment,
  WalletHelpers,
  walletInteractions,
  accountHelpers
} from './utils/index.js';

// Playwright fixtures and testing utilities
export {
  test,
  testWithEVMWallet,
  testWithSolanaWallet,
  testWithMultiChainWallet,
  testWithErrorHandling,
  expect,
  expectWallet
} from './fixtures/index.js';

// Type definitions
export type {
  // Core types
  InstallMockWalletOptions,
  WalletInstallationResult,
  PlaywrightWalletManager,
  PlaywrightWalletContext,

  // Security types
  SecurityLevel,
  PlaywrightSecurityConfig,
  EnvironmentInfo,

  // Bridge types
  BridgeMessage,
  BridgeResponse,
  BridgeMessageType,
  BridgeSetupConfig,
  InstallWalletPayload,

  // Test isolation types
  TestIsolationConfig,
  WalletCleanupResult,
  PlaywrightWalletManagerState,

  // Fixture types
  PlaywrightFixtureOptions,
  WalletFixtureConfig,

  // Error types
  PlaywrightWalletError,
  SecurityViolationError,
  InstallationError,
  BridgeError
} from './types.js';

// Enum exports
export {
  SecurityLevel,
  BridgeMessageType
} from './types.js';

// Error classes
export {
  PlaywrightWalletError,
  SecurityViolationError,
  InstallationError,
  BridgeError,
  isPlaywrightWalletError,
  isSecurityViolationError,
  isInstallationError,
  isBridgeError
} from './types.js';

// Re-export shared types for convenience
export type {
  // Account and chain types from shared package
  Account,
  AccountConfig,
  AccountType,
  EVMAccount,
  SolanaAccount,
  DualChainAccount,
  EVMAccountData,
  SolanaAccountData,
  ChainType,
  SupportedChain,
  EVMChain,
  SolanaCluster,

  // Wallet types from shared package
  WalletConfig,
  WalletState,
  MockWallet,
  TransactionRequest,
  SignatureRequest,
  WalletEvents,
  AccountEvents,
  ChainEvents,
  EventEmitter
} from '@arenaentertainment/wallet-mock-shared';

// Re-export enums from shared package
export { AccountType, CHAIN_PRESETS } from '@arenaentertainment/wallet-mock-shared';

// Re-export standards types for convenience (these might be used in tests)
export type {
  // EIP-1193 Ethereum Provider
  EthereumProvider,
  ProviderRequest,
  ProviderRpcError,
  ProviderEvents,

  // Solana Wallet Standard
  SolanaWallet,
  WalletAccount,
  SolanaConnect,
  SolanaDisconnect,
  SolanaEvents,
  SolanaSignTransaction,
  SolanaSignMessage,
  SolanaWalletEvents
} from '@arenaentertainment/wallet-mock-standards';

/**
 * Package version and metadata
 */
export const VERSION = '0.1.0';
export const PACKAGE_NAME = '@arenaentertainment/wallet-mock-playwright';

/**
 * Default configuration exports for easy access
 */
export const DEFAULT_INSTALL_OPTIONS: Partial<InstallMockWalletOptions> = {
  autoConnect: true,
  waitForReady: true,
  timeout: 10000,
  security: {
    level: SecurityLevel.TESTING,
    checkProduction: true,
    validateContext: true,
    secureCleanup: true,
  },
  isolation: {
    isolatePerTest: true,
    isolatePerContext: false,
    cleanupAfterTest: true,
    cleanupOnFailure: true,
  }
};

/**
 * Quick setup functions for common scenarios
 */
export const quickSetup = {
  /**
   * Quick EVM wallet setup for tests
   */
  async evmWallet(page: any, chainIds: string[] = ['1']) {
    return await installMockWallet(page, {
      accounts: [{
        type: 'evm_only' as const,
        name: 'Test EVM Account',
        evm: { chainIds }
      }],
      ...DEFAULT_INSTALL_OPTIONS
    });
  },

  /**
   * Quick Solana wallet setup for tests
   */
  async solanaWallet(page: any, clusters: string[] = ['mainnet-beta']) {
    return await installMockWallet(page, {
      accounts: [{
        type: 'solana_only' as const,
        name: 'Test Solana Account',
        solana: { clusters }
      }],
      ...DEFAULT_INSTALL_OPTIONS
    });
  },

  /**
   * Quick multi-chain wallet setup for tests
   */
  async multiChainWallet(
    page: any,
    chainIds: string[] = ['1'],
    clusters: string[] = ['mainnet-beta']
  ) {
    return await installMockWallet(page, {
      accounts: [{
        type: 'dual_chain' as const,
        name: 'Test Multi-chain Account',
        evm: { chainIds },
        solana: { clusters }
      }],
      ...DEFAULT_INSTALL_OPTIONS
    });
  }
};

/**
 * Environment validation function for safety checks
 */
export function validateTestEnvironment(): void {
  const env = detectEnvironment();

  if (env.isProduction) {
    throw new SecurityViolationError(
      'Wallet mock cannot be used in production environment. ' +
      'This is a safety measure to prevent accidental usage in production.'
    );
  }

  if (!env.isTest && !env.isDevelopment) {
    console.warn(
      'Warning: Using wallet mock in unrecognised environment. ' +
      'Ensure this is intended for testing purposes only.'
    );
  }
}

// Validate environment on import (with error handling)
try {
  validateTestEnvironment();
} catch (error) {
  // In production, this will throw, which is the intended behaviour
  throw error;
}