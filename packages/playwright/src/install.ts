/**
 * @fileoverview Main wallet installation function for Playwright tests
 *
 * This module provides the primary function for installing mock wallets
 * in Playwright test environments with comprehensive security checks
 * and proper test isolation.
 */

import type { Page, BrowserContext } from '@playwright/test';
import { MessageBridge, validateEnvironment, generateSessionId, detectEnvironment } from './bridge/index.js';
import type {
  InstallMockWalletOptions,
  WalletInstallationResult,
  PlaywrightSecurityConfig,
  SecurityLevel,
  TestIsolationConfig,
  InstallationError,
  SecurityViolationError,
  ChainType
} from './types.js';
import type { AccountConfig, WalletConfig } from '@arenaentertainment/wallet-mock-shared';

/**
 * Default wallet configuration
 */
const DEFAULT_WALLET_CONFIG: Partial<WalletConfig> = {
  autoConnect: true,
  security: {
    enableProductionChecks: true,
    enableSecureMemory: true,
    autoCleanup: true,
  },
  debug: {
    enableLogging: true,
    logLevel: 'info',
  },
};

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: PlaywrightSecurityConfig = {
  level: SecurityLevel.TESTING,
  checkProduction: true,
  validateContext: true,
  secureCleanup: true,
  maxInstances: 10,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
};

/**
 * Default test isolation configuration
 */
const DEFAULT_ISOLATION_CONFIG: TestIsolationConfig = {
  isolatePerTest: true,
  isolatePerContext: true,
  cleanupAfterTest: true,
  cleanupOnFailure: true,
};

/**
 * Global state tracking for installed wallets
 */
const installedWallets = new Map<string, {
  bridge: MessageBridge;
  installationResult: WalletInstallationResult;
  page: Page;
  context: BrowserContext;
}>();

/**
 * Install a mock wallet in the Playwright page
 *
 * @param page - Playwright page instance
 * @param options - Installation options
 * @returns Promise resolving to wallet installation result
 *
 * @example
 * ```typescript
 * import { installMockWallet } from '@arenaentertainment/wallet-mock-playwright';
 *
 * test('dApp interaction', async ({ page }) => {
 *   const { wallet } = await installMockWallet(page, {
 *     accounts: [{
 *       type: 'evm_only',
 *       evm: { chainIds: ['1', '137'] }
 *     }],
 *     autoConnect: true
 *   });
 *
 *   await page.goto('https://your-dapp.local');
 *   // Wallet is now available as window.ethereum
 * });
 * ```
 */
export async function installMockWallet(
  page: Page,
  options: InstallMockWalletOptions = {}
): Promise<WalletInstallationResult> {
  try {
    // Validate environment before proceeding
    const env = detectEnvironment();
    if (env.isProduction && (options.security?.checkProduction !== false)) {
      throw new SecurityViolationError('Cannot install mock wallet in production environment');
    }

    // Merge configurations
    const security = { ...DEFAULT_SECURITY_CONFIG, ...options.security };
    const isolation = { ...DEFAULT_ISOLATION_CONFIG, ...options.isolation };
    const walletConfig: WalletConfig = {
      ...DEFAULT_WALLET_CONFIG,
      ...options.config,
      accounts: options.accounts || [createDefaultAccount()],
    };

    // Generate instance ID
    const instanceId = options.instanceId || generateInstanceId(page);

    // Validate security level
    validateSecurityConfiguration(security, instanceId);

    // Check for existing installation
    if (installedWallets.has(instanceId) && !options.config?.accounts) {
      throw new InstallationError(`Wallet already installed with instance ID: ${instanceId}`);
    }

    // Get browser context
    const context = page.context();

    // Validate context
    await validateBrowserContext(context, security);

    // Create message bridge
    const bridge = new MessageBridge(page, {
      security,
      sessionTimeout: security.sessionTimeout || 30 * 60 * 1000,
      maxMessageSize: 10 * 1024 * 1024,
      enableLogging: security.level !== SecurityLevel.STRICT,
      logLevel: env.isDevelopment ? 'debug' : 'info',
    });

    // Initialize bridge
    await bridge.initialize();

    // Determine supported chain types
    const chainTypes = determineSupportedChainTypes(walletConfig.accounts || []);

    // Install wallet via bridge
    const installationResult = await bridge.sendMessage('install_wallet', {
      config: walletConfig,
      instanceId,
      override: options.config?.accounts !== undefined,
      chainTypes,
    }, options.timeout || 10000);

    // Create wallet installation result
    const result: WalletInstallationResult = {
      wallet: createWalletProxy(bridge, instanceId),
      instanceId,
      installedAt: installationResult.installedAt,
      supportedChains: installationResult.supportedChains,
    };

    // Store installation for cleanup
    installedWallets.set(instanceId, {
      bridge,
      installationResult: result,
      page,
      context,
    });

    // Setup cleanup handlers
    await setupCleanupHandlers(page, context, instanceId, isolation);

    // Wait for wallet to be ready if requested
    if (options.waitForReady !== false) {
      await waitForWalletReady(page, chainTypes, options.timeout || 10000);
    }

    // Auto-connect if requested
    if (options.autoConnect !== false && walletConfig.autoConnect !== false) {
      await autoConnectWallet(result.wallet, chainTypes);
    }

    return result;

  } catch (error) {
    if (error instanceof SecurityViolationError || error instanceof InstallationError) {
      throw error;
    }

    throw new InstallationError('Failed to install mock wallet', {
      originalError: error,
      instanceId: options.instanceId,
      page: page.url(),
    });
  }
}

/**
 * Remove a mock wallet instance
 *
 * @param instanceId - Instance ID to remove (defaults to page-based ID)
 * @param page - Playwright page (optional, for generating default ID)
 */
export async function removeMockWallet(
  instanceId?: string,
  page?: Page
): Promise<void> {
  const id = instanceId || (page ? generateInstanceId(page) : '');
  const installation = installedWallets.get(id);

  if (!installation) {
    throw new InstallationError(`Wallet instance not found: ${id}`);
  }

  try {
    // Remove wallet via bridge
    await installation.bridge.sendMessage('remove_wallet', { instanceId: id });

    // Cleanup bridge
    await installation.bridge.cleanup();

    // Remove from tracking
    installedWallets.delete(id);
  } catch (error) {
    throw new InstallationError('Failed to remove mock wallet', {
      originalError: error,
      instanceId: id,
    });
  }
}

/**
 * Get installed wallet by instance ID
 *
 * @param instanceId - Instance ID (defaults to first installed wallet)
 */
export function getInstalledWallet(instanceId?: string): WalletInstallationResult | null {
  if (instanceId) {
    const installation = installedWallets.get(instanceId);
    return installation?.installationResult || null;
  }

  // Return first installed wallet if no ID specified
  const first = installedWallets.values().next();
  return first.value?.installationResult || null;
}

/**
 * Cleanup all installed wallet instances
 */
export async function cleanupAllWallets(): Promise<void> {
  const cleanupPromises = Array.from(installedWallets.entries()).map(
    async ([instanceId, installation]) => {
      try {
        await installation.bridge.sendMessage('remove_wallet', { instanceId });
        await installation.bridge.cleanup();
      } catch (error) {
        console.warn(`Failed to cleanup wallet instance ${instanceId}:`, error);
      }
    }
  );

  await Promise.allSettled(cleanupPromises);
  installedWallets.clear();
}

/**
 * Create default account configuration
 */
function createDefaultAccount(): AccountConfig {
  return {
    type: 'evm_only' as const,
    name: 'Test Account',
    evm: {
      chainIds: ['1'], // Ethereum mainnet
    },
  };
}

/**
 * Generate instance ID based on page
 */
function generateInstanceId(page: Page): string {
  const url = page.url();
  const timestamp = Date.now();
  return `wallet-${Buffer.from(url).toString('base64').slice(0, 8)}-${timestamp}`;
}

/**
 * Validate security configuration
 */
function validateSecurityConfiguration(
  security: PlaywrightSecurityConfig,
  instanceId: string
): void {
  // Check maximum instances
  if (security.maxInstances && installedWallets.size >= security.maxInstances) {
    throw new SecurityViolationError(
      `Maximum wallet instances exceeded: ${security.maxInstances}`,
      { currentInstances: installedWallets.size, instanceId }
    );
  }

  // Validate environment for security level
  validateEnvironment(security);
}

/**
 * Validate browser context
 */
async function validateBrowserContext(
  context: BrowserContext,
  security: PlaywrightSecurityConfig
): Promise<void> {
  if (!security.validateContext) return;

  // Check for incognito mode (recommended for testing)
  const pages = context.pages();
  if (pages.length === 0) {
    throw new SecurityViolationError('Browser context has no pages');
  }

  // Validate origins if specified
  if (security.allowedOrigins && security.allowedOrigins.length > 0) {
    const page = pages[0];
    const url = page.url();
    const origin = new URL(url).origin;

    const isAllowed = security.allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      return origin.includes(allowed);
    });

    if (!isAllowed) {
      throw new SecurityViolationError(
        `Origin not allowed: ${origin}`,
        { origin, allowedOrigins: security.allowedOrigins }
      );
    }
  }
}

/**
 * Determine supported chain types from account configuration
 */
function determineSupportedChainTypes(accounts: AccountConfig[]): ChainType[] {
  const chainTypes = new Set<ChainType>();

  for (const account of accounts) {
    switch (account.type) {
      case 'evm_only':
        chainTypes.add('evm');
        break;
      case 'solana_only':
        chainTypes.add('solana');
        break;
      case 'dual_chain':
        chainTypes.add('evm');
        chainTypes.add('solana');
        break;
    }
  }

  return Array.from(chainTypes);
}

/**
 * Setup cleanup handlers for test isolation
 */
async function setupCleanupHandlers(
  page: Page,
  context: BrowserContext,
  instanceId: string,
  isolation: TestIsolationConfig
): Promise<void> {
  if (!isolation.cleanupAfterTest && !isolation.cleanupOnFailure) return;

  // Setup page close handler
  page.on('close', async () => {
    try {
      await removeMockWallet(instanceId);
    } catch (error) {
      console.warn(`Failed to cleanup wallet on page close: ${instanceId}`, error);
    }
  });

  // Setup context close handler
  context.on('close', async () => {
    try {
      await removeMockWallet(instanceId);
    } catch (error) {
      console.warn(`Failed to cleanup wallet on context close: ${instanceId}`, error);
    }
  });

  // Custom cleanup handler
  if (isolation.customCleanup) {
    const originalCleanup = isolation.customCleanup;
    isolation.customCleanup = async () => {
      try {
        await removeMockWallet(instanceId);
      } catch (error) {
        console.warn(`Failed to cleanup wallet: ${instanceId}`, error);
      }
      await originalCleanup();
    };
  }
}

/**
 * Wait for wallet to be ready in the browser
 */
async function waitForWalletReady(
  page: Page,
  chainTypes: ChainType[],
  timeout: number
): Promise<void> {
  const checkWalletReady = async () => {
    return await page.evaluate((types) => {
      const checks = [];

      if (types.includes('evm') && window.ethereum) {
        checks.push(!!window.ethereum.request);
      }

      if (types.includes('solana') && window.solana) {
        checks.push(!!window.solana.connect);
      }

      return checks.length > 0 && checks.every(check => check);
    }, chainTypes);
  };

  await page.waitForFunction(checkWalletReady, { timeout });
}

/**
 * Auto-connect wallet
 */
async function autoConnectWallet(wallet: any, chainTypes: ChainType[]): Promise<void> {
  try {
    if (typeof wallet.connect === 'function') {
      await wallet.connect();
    }
  } catch (error) {
    console.warn('Failed to auto-connect wallet:', error);
  }
}

/**
 * Create wallet proxy for bridge communication
 */
function createWalletProxy(bridge: MessageBridge, instanceId: string): any {
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'getState') {
        return async () => {
          return await bridge.sendMessage('get_state', { instanceId });
        };
      }

      if (prop === 'connect') {
        return async () => {
          // Connection happens in browser context
          return true;
        };
      }

      if (prop === 'disconnect') {
        return async () => {
          // Disconnection happens in browser context
          return true;
        };
      }

      if (prop === 'destroy') {
        return async () => {
          await removeMockWallet(instanceId);
        };
      }

      // For other methods, we would need to implement bridge communication
      return async (...args: any[]) => {
        throw new Error(`Method ${String(prop)} not implemented in wallet proxy`);
      };
    }
  });
}