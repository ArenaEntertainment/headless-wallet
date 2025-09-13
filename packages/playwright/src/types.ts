/**
 * @fileoverview TypeScript type definitions for Playwright integration
 *
 * This file defines all the types specific to the Playwright integration
 * of the wallet-mock library, including browser bridge communication,
 * test isolation, and security configuration.
 */

import type { Page, BrowserContext } from '@playwright/test';
import type {
  WalletConfig,
  AccountConfig,
  MockWallet,
  WalletState,
  ChainType
} from '@arenaentertainment/wallet-mock-shared';

/**
 * Security level for the Playwright integration
 */
export enum SecurityLevel {
  /** Development environment - minimal checks */
  DEVELOPMENT = 'development',
  /** Testing environment - moderate security */
  TESTING = 'testing',
  /** Strict mode - maximum security (recommended for CI) */
  STRICT = 'strict'
}

/**
 * Environment detection result
 */
export interface EnvironmentInfo {
  /** Whether we're running in a test environment */
  isTest: boolean;
  /** Whether we're running in CI */
  isCI: boolean;
  /** Whether we're running in development */
  isDevelopment: boolean;
  /** Whether we're running in production (should be false) */
  isProduction: boolean;
  /** Node.js version */
  nodeVersion: string;
  /** Playwright version */
  playwrightVersion?: string;
}

/**
 * Security configuration for Playwright integration
 */
export interface PlaywrightSecurityConfig {
  /** Security level to apply */
  level: SecurityLevel;
  /** Whether to perform production environment checks */
  checkProduction: boolean;
  /** Whether to validate browser context */
  validateContext: boolean;
  /** Whether to enable secure cleanup on test failure */
  secureCleanup: boolean;
  /** Allowed origins for wallet installation */
  allowedOrigins?: string[];
  /** Maximum number of wallet instances per test */
  maxInstances?: number;
  /** Session timeout in milliseconds */
  sessionTimeout?: number;
}

/**
 * Bridge message types for secure communication
 */
export enum BridgeMessageType {
  /** Install wallet instance */
  INSTALL_WALLET = 'install_wallet',
  /** Remove wallet instance */
  REMOVE_WALLET = 'remove_wallet',
  /** Update wallet configuration */
  UPDATE_CONFIG = 'update_config',
  /** Request wallet state */
  GET_STATE = 'get_state',
  /** Cleanup all instances */
  CLEANUP_ALL = 'cleanup_all',
  /** Security check */
  SECURITY_CHECK = 'security_check',
  /** Heartbeat for session management */
  HEARTBEAT = 'heartbeat'
}

/**
 * Bridge message structure for Node.js to browser communication
 */
export interface BridgeMessage<TPayload = any> {
  /** Unique message ID */
  id: string;
  /** Message type */
  type: BridgeMessageType;
  /** Message payload */
  payload: TPayload;
  /** Timestamp when message was created */
  timestamp: number;
  /** Session ID for tracking */
  sessionId: string;
  /** Security token */
  securityToken?: string;
}

/**
 * Bridge response structure for browser to Node.js communication
 */
export interface BridgeResponse<TData = any> {
  /** Message ID this response is for */
  messageId: string;
  /** Whether the operation was successful */
  success: boolean;
  /** Response data (on success) */
  data?: TData;
  /** Error information (on failure) */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  /** Response timestamp */
  timestamp: number;
}

/**
 * Wallet installation request payload
 */
export interface InstallWalletPayload {
  /** Wallet configuration */
  config: WalletConfig;
  /** Unique instance ID */
  instanceId: string;
  /** Whether to override existing instance */
  override?: boolean;
  /** Target chain types */
  chainTypes?: ChainType[];
}

/**
 * Wallet installation result
 */
export interface WalletInstallationResult {
  /** Installed wallet instance */
  wallet: MockWallet;
  /** Instance ID */
  instanceId: string;
  /** Installation timestamp */
  installedAt: number;
  /** Supported chain types */
  supportedChains: ChainType[];
}

/**
 * Test isolation configuration
 */
export interface TestIsolationConfig {
  /** Whether to isolate wallet instances per test */
  isolatePerTest: boolean;
  /** Whether to isolate per browser context */
  isolatePerContext: boolean;
  /** Whether to clean up after each test */
  cleanupAfterTest: boolean;
  /** Whether to clean up on test failure */
  cleanupOnFailure: boolean;
  /** Custom cleanup handler */
  customCleanup?: () => Promise<void>;
}

/**
 * Playwright wallet manager state
 */
export interface PlaywrightWalletManagerState {
  /** Active wallet instances */
  instances: Map<string, WalletInstallationResult>;
  /** Session information */
  session: {
    id: string;
    startedAt: number;
    lastActivity: number;
  };
  /** Security state */
  security: {
    level: SecurityLevel;
    validatedOrigins: Set<string>;
    tokenCache: Map<string, { token: string; expiresAt: number }>;
  };
}

/**
 * Options for wallet installation in Playwright tests
 */
export interface InstallMockWalletOptions {
  /** Wallet configuration */
  config?: Partial<WalletConfig>;
  /** Accounts to create */
  accounts?: AccountConfig[];
  /** Security configuration */
  security?: Partial<PlaywrightSecurityConfig>;
  /** Test isolation configuration */
  isolation?: Partial<TestIsolationConfig>;
  /** Custom instance ID */
  instanceId?: string;
  /** Whether to auto-connect after installation */
  autoConnect?: boolean;
  /** Whether to wait for wallet to be ready */
  waitForReady?: boolean;
  /** Timeout for installation (ms) */
  timeout?: number;
}

/**
 * Playwright fixture options
 */
export interface PlaywrightFixtureOptions {
  /** Default wallet configuration */
  defaultConfig?: WalletConfig;
  /** Default security settings */
  defaultSecurity?: PlaywrightSecurityConfig;
  /** Default isolation settings */
  defaultIsolation?: TestIsolationConfig;
  /** Whether to auto-install wallet */
  autoInstall?: boolean;
  /** Whether to auto-cleanup */
  autoCleanup?: boolean;
}

/**
 * Extended Playwright test context with wallet support
 */
export interface PlaywrightWalletContext {
  /** The Playwright page */
  page: Page;
  /** The browser context */
  context: BrowserContext;
  /** Wallet manager instance */
  walletManager: PlaywrightWalletManager;
  /** Install a mock wallet */
  installWallet: (options?: InstallMockWalletOptions) => Promise<WalletInstallationResult>;
  /** Get installed wallet by instance ID */
  getWallet: (instanceId?: string) => Promise<MockWallet | null>;
  /** Remove wallet instance */
  removeWallet: (instanceId?: string) => Promise<void>;
  /** Clean up all wallet instances */
  cleanupWallets: () => Promise<void>;
  /** Get current wallet state */
  getWalletState: (instanceId?: string) => Promise<WalletState | null>;
}

/**
 * Playwright wallet manager interface
 */
export interface PlaywrightWalletManager {
  /** Initialize the manager */
  initialize(page: Page, context: BrowserContext, options?: PlaywrightFixtureOptions): Promise<void>;

  /** Install a wallet instance */
  installWallet(options: InstallMockWalletOptions): Promise<WalletInstallationResult>;

  /** Get wallet by instance ID */
  getWallet(instanceId: string): Promise<MockWallet | null>;

  /** Remove wallet instance */
  removeWallet(instanceId: string): Promise<void>;

  /** Get all wallet instances */
  getAllWallets(): Promise<WalletInstallationResult[]>;

  /** Clean up all instances */
  cleanup(): Promise<void>;

  /** Get manager state */
  getState(): PlaywrightWalletManagerState;

  /** Perform security check */
  securityCheck(): Promise<boolean>;

  /** Dispose resources */
  dispose(): Promise<void>;
}

/**
 * Wallet cleanup result
 */
export interface WalletCleanupResult {
  /** Number of instances cleaned up */
  cleanedUpInstances: number;
  /** Any errors that occurred during cleanup */
  errors: Array<{ instanceId: string; error: Error }>;
  /** Cleanup duration in milliseconds */
  duration: number;
}

/**
 * Bridge setup configuration
 */
export interface BridgeSetupConfig {
  /** Security configuration */
  security: PlaywrightSecurityConfig;
  /** Session timeout */
  sessionTimeout: number;
  /** Maximum message size */
  maxMessageSize: number;
  /** Whether to enable logging */
  enableLogging: boolean;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Custom error types for Playwright integration
 */
export class PlaywrightWalletError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'PlaywrightWalletError';
  }
}

export class SecurityViolationError extends PlaywrightWalletError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'SECURITY_VIOLATION', context);
    this.name = 'SecurityViolationError';
  }
}

export class InstallationError extends PlaywrightWalletError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'INSTALLATION_ERROR', context);
    this.name = 'InstallationError';
  }
}

export class BridgeError extends PlaywrightWalletError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'BRIDGE_ERROR', context);
    this.name = 'BridgeError';
  }
}

/**
 * Type guard utilities
 */
export const isPlaywrightWalletError = (error: any): error is PlaywrightWalletError => {
  return error instanceof Error && 'code' in error;
};

export const isSecurityViolationError = (error: any): error is SecurityViolationError => {
  return error instanceof SecurityViolationError;
};

export const isInstallationError = (error: any): error is InstallationError => {
  return error instanceof InstallationError;
};

export const isBridgeError = (error: any): error is BridgeError => {
  return error instanceof BridgeError;
};