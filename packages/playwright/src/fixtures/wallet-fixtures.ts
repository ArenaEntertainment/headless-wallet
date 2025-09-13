/**
 * @fileoverview Playwright fixtures for wallet mock integration
 *
 * This module provides Playwright fixtures that automatically handle wallet
 * setup, cleanup, and management for tests with proper isolation.
 */

import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import { installMockWallet, cleanupAllWallets, getInstalledWallet } from '../install.js';
import {
  TestIsolationManager,
  setupTestIsolation,
  cleanupFailedTest,
  getTestId,
  WalletHelpers,
  createIsolatedEnvironment
} from '../utils/index.js';
import type {
  PlaywrightWalletContext,
  InstallMockWalletOptions,
  PlaywrightFixtureOptions,
  WalletInstallationResult,
  TestIsolationConfig,
  PlaywrightSecurityConfig,
  SecurityLevel
} from '../types.js';
import type { WalletConfig, WalletState } from '@arenaentertainment/wallet-mock-shared';

/**
 * Default fixture configuration
 */
const DEFAULT_FIXTURE_CONFIG: PlaywrightFixtureOptions = {
  defaultConfig: {
    autoConnect: true,
    security: {
      enableProductionChecks: true,
      enableSecureMemory: true,
      autoCleanup: true,
    },
    debug: {
      enableLogging: false,
      logLevel: 'info',
    },
  },
  defaultSecurity: {
    level: SecurityLevel.TESTING,
    checkProduction: true,
    validateContext: true,
    secureCleanup: true,
    maxInstances: 10,
    sessionTimeout: 30 * 60 * 1000,
  },
  defaultIsolation: {
    isolatePerTest: true,
    isolatePerContext: false,
    cleanupAfterTest: true,
    cleanupOnFailure: true,
  },
  autoInstall: false,
  autoCleanup: true,
};

/**
 * Extended test context with wallet support
 */
interface WalletTestContext extends PlaywrightWalletContext {
  walletHelpers: WalletHelpers;
  fixtureConfig: PlaywrightFixtureOptions;
}

/**
 * Wallet fixture options that can be passed to test configuration
 */
export interface WalletFixtureConfig extends Partial<PlaywrightFixtureOptions> {
  // Additional fixture-specific options
}

/**
 * Create Playwright fixtures with wallet support
 */
export const test = base.extend<WalletTestContext>({
  /**
   * Wallet manager fixture - handles wallet lifecycle
   */
  walletManager: async ({ page, context }, use, testInfo) => {
    const isolationManager = TestIsolationManager.getInstance();
    const testId = getTestId(testInfo);

    // Create a wallet manager instance for this test
    const walletManager = {
      async initialize(
        pageInstance: Page,
        contextInstance: BrowserContext,
        options: PlaywrightFixtureOptions = {}
      ) {
        const config = { ...DEFAULT_FIXTURE_CONFIG, ...options };

        // Setup test isolation
        await setupTestIsolation(
          testInfo,
          pageInstance,
          contextInstance,
          config.defaultIsolation!
        );

        // Create isolated environment if needed
        await createIsolatedEnvironment(pageInstance, {
          clearStorage: true,
          clearCookies: true,
        });
      },

      async installWallet(options: InstallMockWalletOptions = {}) {
        const result = await installMockWallet(page, options);

        // Register with isolation manager
        isolationManager.registerWalletForTest(
          testId,
          result.instanceId,
          (context as any)._guid
        );

        return result;
      },

      async getWallet(instanceId?: string) {
        const installation = getInstalledWallet(instanceId);
        return installation?.wallet || null;
      },

      async removeWallet(instanceId?: string) {
        const { removeMockWallet } = await import('../install.js');
        await removeMockWallet(instanceId, page);

        if (instanceId) {
          isolationManager.unregisterWallet(instanceId);
        }
      },

      async getAllWallets() {
        // This would need to be implemented in the install module
        return [];
      },

      async cleanup() {
        await isolationManager.cleanupTest(testId);
      },

      getState() {
        return {
          instances: new Map(),
          session: { id: testId, startedAt: Date.now(), lastActivity: Date.now() },
          security: {
            level: SecurityLevel.TESTING,
            validatedOrigins: new Set(),
            tokenCache: new Map(),
          }
        };
      },

      async securityCheck() {
        return true;
      },

      async dispose() {
        await this.cleanup();
      }
    };

    await walletManager.initialize(page, context);

    await use(walletManager);

    // Cleanup after test
    await walletManager.cleanup();
  },

  /**
   * Install wallet helper function
   */
  installWallet: async ({ walletManager }, use) => {
    const installFunction = async (options: InstallMockWalletOptions = {}) => {
      return await walletManager.installWallet(options);
    };

    await use(installFunction);
  },

  /**
   * Get wallet helper function
   */
  getWallet: async ({ walletManager }, use) => {
    const getFunction = async (instanceId?: string) => {
      return await walletManager.getWallet(instanceId);
    };

    await use(getFunction);
  },

  /**
   * Remove wallet helper function
   */
  removeWallet: async ({ walletManager }, use) => {
    const removeFunction = async (instanceId?: string) => {
      await walletManager.removeWallet(instanceId);
    };

    await use(removeFunction);
  },

  /**
   * Cleanup wallets helper function
   */
  cleanupWallets: async ({ walletManager }, use) => {
    const cleanupFunction = async () => {
      await walletManager.cleanup();
    };

    await use(cleanupFunction);
  },

  /**
   * Get wallet state helper function
   */
  getWalletState: async ({ walletManager }, use) => {
    const getStateFunction = async (instanceId?: string): Promise<WalletState | null> => {
      const wallet = await walletManager.getWallet(instanceId);
      if (!wallet || typeof wallet.getState !== 'function') {
        return null;
      }
      return await wallet.getState();
    };

    await use(getStateFunction);
  },

  /**
   * Wallet helpers utility
   */
  walletHelpers: async ({ page }, use) => {
    const helpers = new WalletHelpers(page);
    await use(helpers);
  },

  /**
   * Fixture configuration
   */
  fixtureConfig: async ({}, use) => {
    await use(DEFAULT_FIXTURE_CONFIG);
  },
});

/**
 * Pre-configured test with auto-installed EVM wallet
 */
export const testWithEVMWallet = test.extend({
  /**
   * Auto-install EVM wallet before test
   */
  evmWallet: async ({ installWallet }, use) => {
    const wallet = await installWallet({
      accounts: [{
        type: 'evm_only',
        name: 'Test Account',
        evm: { chainIds: ['1', '137'] } // Ethereum + Polygon
      }],
      autoConnect: true,
      waitForReady: true
    });

    await use(wallet);
  },
});

/**
 * Pre-configured test with auto-installed Solana wallet
 */
export const testWithSolanaWallet = test.extend({
  /**
   * Auto-install Solana wallet before test
   */
  solanaWallet: async ({ installWallet }, use) => {
    const wallet = await installWallet({
      accounts: [{
        type: 'solana_only',
        name: 'Test Account',
        solana: { clusters: ['mainnet-beta', 'devnet'] }
      }],
      autoConnect: true,
      waitForReady: true
    });

    await use(wallet);
  },
});

/**
 * Pre-configured test with auto-installed multi-chain wallet
 */
export const testWithMultiChainWallet = test.extend({
  /**
   * Auto-install multi-chain wallet before test
   */
  multiChainWallet: async ({ installWallet }, use) => {
    const wallet = await installWallet({
      accounts: [{
        type: 'dual_chain',
        name: 'Multi-chain Test Account',
        evm: { chainIds: ['1', '137'] },
        solana: { clusters: ['mainnet-beta'] }
      }],
      autoConnect: true,
      waitForReady: true
    });

    await use(wallet);
  },
});

/**
 * Test configuration with enhanced error handling
 */
export const testWithErrorHandling = test.extend({
  page: async ({ page, context }, use, testInfo) => {
    // Setup error monitoring
    page.on('pageerror', (error) => {
      console.error('Page error in test:', error);
      testInfo.attach('page-error', {
        body: error.stack || error.message,
        contentType: 'text/plain'
      });
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
        testInfo.attach('console-error', {
          body: msg.text(),
          contentType: 'text/plain'
        });
      }
    });

    // Setup uncaught exception handling
    page.on('requestfailed', (request) => {
      console.warn('Request failed:', request.url(), request.failure()?.errorText);
    });

    await use(page);

    // Cleanup on test failure
    if (testInfo.status === 'failed') {
      try {
        await cleanupFailedTest(testInfo);

        // Take screenshot on failure
        const screenshot = await page.screenshot();
        testInfo.attach('failure-screenshot', {
          body: screenshot,
          contentType: 'image/png'
        });

        // Collect wallet state on failure
        const walletState = await page.evaluate(() => {
          const state: any = {};
          if (window.ethereum) {
            state.ethereum = {
              isConnected: !!(window.ethereum as any).selectedAddress,
              chainId: (window.ethereum as any).chainId,
              selectedAddress: (window.ethereum as any).selectedAddress
            };
          }
          if (window.solana) {
            state.solana = {
              isConnected: !!(window.solana as any).isConnected,
              publicKey: (window.solana as any).publicKey?.toString()
            };
          }
          return state;
        });

        testInfo.attach('wallet-state-on-failure', {
          body: JSON.stringify(walletState, null, 2),
          contentType: 'application/json'
        });

      } catch (cleanupError) {
        console.warn('Failed to cleanup after test failure:', cleanupError);
      }
    }
  },
});

/**
 * Custom expect extensions for wallet testing
 */
export const expectWallet = expect.extend({
  /**
   * Check if wallet is connected
   */
  async toBeConnected(page: Page, chainType: 'evm' | 'solana' = 'evm') {
    const isConnected = await page.evaluate((type) => {
      if (type === 'evm') {
        return !!(window.ethereum && (window.ethereum as any).selectedAddress);
      } else {
        return !!(window.solana && (window.solana as any).isConnected);
      }
    }, chainType);

    return {
      message: () => `expected wallet to be ${isConnected ? 'disconnected' : 'connected'}`,
      pass: isConnected,
    };
  },

  /**
   * Check if wallet has specific account
   */
  async toHaveAccount(page: Page, expectedAddress: string, chainType: 'evm' | 'solana' = 'evm') {
    const currentAddress = await page.evaluate((type) => {
      if (type === 'evm') {
        return (window.ethereum as any)?.selectedAddress || null;
      } else {
        return (window.solana as any)?.publicKey?.toString() || null;
      }
    }, chainType);

    const matches = currentAddress === expectedAddress;

    return {
      message: () =>
        `expected wallet to have account ${expectedAddress}, but got ${currentAddress}`,
      pass: matches,
    };
  },

  /**
   * Check if wallet is on specific chain
   */
  async toBeOnChain(page: Page, expectedChainId: string) {
    const currentChainId = await page.evaluate(() => {
      return (window.ethereum as any)?.chainId || null;
    });

    const matches = currentChainId === expectedChainId;

    return {
      message: () =>
        `expected wallet to be on chain ${expectedChainId}, but got ${currentChainId}`,
      pass: matches,
    };
  },
});

// Re-export expect with wallet extensions
export { expectWallet as expect };