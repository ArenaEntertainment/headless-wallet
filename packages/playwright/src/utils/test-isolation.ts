/**
 * @fileoverview Test isolation utilities for Playwright wallet tests
 *
 * This module provides utilities for proper test isolation, cleanup,
 * and resource management in Playwright test environments.
 */

import type { Page, BrowserContext, TestInfo } from '@playwright/test';
import type {
  TestIsolationConfig,
  WalletCleanupResult,
  PlaywrightWalletManagerState
} from '../types.js';
import { cleanupAllWallets } from '../install.js';

/**
 * Test isolation manager for wallet instances
 */
export class TestIsolationManager {
  private static instance: TestIsolationManager;
  private testWallets = new Map<string, Set<string>>(); // testId -> instanceIds
  private contextWallets = new Map<string, Set<string>>(); // contextId -> instanceIds
  private cleanupHandlers = new Map<string, (() => Promise<void>)[]>();

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): TestIsolationManager {
    if (!TestIsolationManager.instance) {
      TestIsolationManager.instance = new TestIsolationManager();
    }
    return TestIsolationManager.instance;
  }

  /**
   * Register a wallet instance for a test
   */
  registerWalletForTest(testId: string, instanceId: string, contextId?: string): void {
    // Register for test cleanup
    if (!this.testWallets.has(testId)) {
      this.testWallets.set(testId, new Set());
    }
    this.testWallets.get(testId)!.add(instanceId);

    // Register for context cleanup
    if (contextId) {
      if (!this.contextWallets.has(contextId)) {
        this.contextWallets.set(contextId, new Set());
      }
      this.contextWallets.get(contextId)!.add(instanceId);
    }
  }

  /**
   * Unregister a wallet instance
   */
  unregisterWallet(instanceId: string): void {
    // Remove from all test mappings
    for (const [testId, instances] of this.testWallets.entries()) {
      instances.delete(instanceId);
      if (instances.size === 0) {
        this.testWallets.delete(testId);
      }
    }

    // Remove from all context mappings
    for (const [contextId, instances] of this.contextWallets.entries()) {
      instances.delete(instanceId);
      if (instances.size === 0) {
        this.contextWallets.delete(contextId);
      }
    }
  }

  /**
   * Cleanup wallets for a specific test
   */
  async cleanupTest(testId: string): Promise<WalletCleanupResult> {
    const instanceIds = this.testWallets.get(testId);
    if (!instanceIds || instanceIds.size === 0) {
      return { cleanedUpInstances: 0, errors: [], duration: 0 };
    }

    const startTime = Date.now();
    const errors: Array<{ instanceId: string; error: Error }> = [];
    let cleanedUpInstances = 0;

    // Cleanup each instance
    for (const instanceId of instanceIds) {
      try {
        const { removeMockWallet } = await import('../install.js');
        await removeMockWallet(instanceId);
        cleanedUpInstances++;
      } catch (error) {
        errors.push({
          instanceId,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }

    // Remove test from tracking
    this.testWallets.delete(testId);

    // Run custom cleanup handlers
    const handlers = this.cleanupHandlers.get(testId) || [];
    for (const handler of handlers) {
      try {
        await handler();
      } catch (error) {
        console.warn('Custom cleanup handler failed:', error);
      }
    }
    this.cleanupHandlers.delete(testId);

    return {
      cleanedUpInstances,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Cleanup wallets for a browser context
   */
  async cleanupContext(contextId: string): Promise<WalletCleanupResult> {
    const instanceIds = this.contextWallets.get(contextId);
    if (!instanceIds || instanceIds.size === 0) {
      return { cleanedUpInstances: 0, errors: [], duration: 0 };
    }

    const startTime = Date.now();
    const errors: Array<{ instanceId: string; error: Error }> = [];
    let cleanedUpInstances = 0;

    for (const instanceId of instanceIds) {
      try {
        const { removeMockWallet } = await import('../install.js');
        await removeMockWallet(instanceId);
        cleanedUpInstances++;
      } catch (error) {
        errors.push({
          instanceId,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }

    // Remove context from tracking
    this.contextWallets.delete(contextId);

    return {
      cleanedUpInstances,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Add custom cleanup handler for a test
   */
  addCleanupHandler(testId: string, handler: () => Promise<void>): void {
    if (!this.cleanupHandlers.has(testId)) {
      this.cleanupHandlers.set(testId, []);
    }
    this.cleanupHandlers.get(testId)!.push(handler);
  }

  /**
   * Get all wallet instances for a test
   */
  getTestWallets(testId: string): string[] {
    return Array.from(this.testWallets.get(testId) || []);
  }

  /**
   * Get all wallet instances for a context
   */
  getContextWallets(contextId: string): string[] {
    return Array.from(this.contextWallets.get(contextId) || []);
  }

  /**
   * Get isolation manager state
   */
  getState() {
    return {
      testWallets: Object.fromEntries(
        Array.from(this.testWallets.entries()).map(
          ([testId, instances]) => [testId, Array.from(instances)]
        )
      ),
      contextWallets: Object.fromEntries(
        Array.from(this.contextWallets.entries()).map(
          ([contextId, instances]) => [contextId, Array.from(instances)]
        )
      ),
      cleanupHandlers: Array.from(this.cleanupHandlers.keys()),
    };
  }

  /**
   * Clear all tracking (for testing purposes)
   */
  clear(): void {
    this.testWallets.clear();
    this.contextWallets.clear();
    this.cleanupHandlers.clear();
  }
}

/**
 * Setup automatic test isolation for a Playwright test
 *
 * @param testInfo - Playwright test info
 * @param page - Page instance
 * @param context - Browser context
 * @param config - Isolation configuration
 */
export async function setupTestIsolation(
  testInfo: TestInfo,
  page: Page,
  context: BrowserContext,
  config: TestIsolationConfig
): Promise<void> {
  const isolationManager = TestIsolationManager.getInstance();
  const testId = getTestId(testInfo);
  const contextId = getContextId(context);

  // Setup cleanup handlers based on configuration
  if (config.cleanupAfterTest) {
    // Add afterEach cleanup - this would typically be done in fixtures
    isolationManager.addCleanupHandler(testId, async () => {
      await isolationManager.cleanupTest(testId);
    });
  }

  if (config.cleanupOnFailure) {
    // Monitor test failure and cleanup
    testInfo.attach('wallet-cleanup-on-failure', {
      body: JSON.stringify({
        testId,
        contextId,
        timestamp: Date.now(),
      }),
      contentType: 'application/json',
    });
  }

  // Setup page close handler
  page.on('close', async () => {
    if (config.isolatePerTest) {
      await isolationManager.cleanupTest(testId);
    }
  });

  // Setup context close handler
  context.on('close', async () => {
    if (config.isolatePerContext) {
      await isolationManager.cleanupContext(contextId);
    }
  });

  // Custom cleanup handler
  if (config.customCleanup) {
    isolationManager.addCleanupHandler(testId, config.customCleanup);
  }
}

/**
 * Cleanup resources for failed tests
 */
export async function cleanupFailedTest(testInfo: TestInfo): Promise<WalletCleanupResult> {
  const isolationManager = TestIsolationManager.getInstance();
  const testId = getTestId(testInfo);

  return await isolationManager.cleanupTest(testId);
}

/**
 * Get unique test identifier
 */
export function getTestId(testInfo: TestInfo): string {
  const titlePath = testInfo.titlePath.join(' > ');
  const projectName = testInfo.project?.name || 'default';
  return `${projectName}:${Buffer.from(titlePath).toString('base64')}`;
}

/**
 * Get unique context identifier
 */
export function getContextId(context: BrowserContext): string {
  // Use a property that's unique to the context
  return (context as any)._guid || `context-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create isolated environment for wallet tests
 */
export async function createIsolatedEnvironment(
  page: Page,
  options: {
    clearStorage?: boolean;
    clearCookies?: boolean;
    clearCache?: boolean;
    blockNetworks?: string[];
  } = {}
): Promise<void> {
  const context = page.context();

  // Clear storage if requested
  if (options.clearStorage) {
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  // Clear cookies if requested
  if (options.clearCookies) {
    await context.clearCookies();
  }

  // Setup network blocking
  if (options.blockNetworks && options.blockNetworks.length > 0) {
    await page.route(url => {
      return options.blockNetworks!.some(pattern => url.includes(pattern));
    }, route => route.abort());
  }

  // Inject test markers
  await page.addInitScript(() => {
    // Mark as test environment
    (window as any).__WALLET_MOCK_TEST__ = true;
    (window as any).__WALLET_MOCK_ISOLATED__ = true;
  });
}

/**
 * Validate test environment isolation
 */
export async function validateTestIsolation(page: Page): Promise<{
  isIsolated: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  // Check for test markers
  const hasTestMarkers = await page.evaluate(() => {
    return !!(window as any).__WALLET_MOCK_TEST__ && !!(window as any).__WALLET_MOCK_ISOLATED__;
  });

  if (!hasTestMarkers) {
    issues.push('Test environment markers not found');
  }

  // Check for existing wallet instances that might interfere
  const hasExistingWallets = await page.evaluate(() => {
    return !!(window.ethereum && !(window.ethereum as any).__WALLET_MOCK__) ||
           !!(window.solana && !(window.solana as any).__WALLET_MOCK__);
  });

  if (hasExistingWallets) {
    issues.push('Non-mock wallet instances detected');
  }

  // Check for storage contamination
  const hasStorageData = await page.evaluate(() => {
    return localStorage.length > 0 || sessionStorage.length > 0;
  });

  if (hasStorageData) {
    issues.push('Storage contains data that might affect tests');
  }

  return {
    isIsolated: issues.length === 0,
    issues,
  };
}

/**
 * Wait for isolated environment to be ready
 */
export async function waitForIsolatedEnvironment(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  await page.waitForFunction(() => {
    return (window as any).__WALLET_MOCK_TEST__ === true;
  }, { timeout });
}