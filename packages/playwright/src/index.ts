import type { Page, BrowserContext } from '@playwright/test';
import type { HeadlessWalletConfig } from '@arenaentertainment/headless-wallet';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the bundle content at module initialization time
const bundlePath = join(__dirname, '..', 'dist', 'bundle.js');

let bundleContent: string;
try {
  bundleContent = readFileSync(bundlePath, 'utf-8');
} catch (error) {
  throw new Error(`Failed to load bundled wallet. Please run 'npm run build:bundle' first. Error: ${error}`);
}

/**
 * Installs a headless wallet by injecting a pre-bundled version with all dependencies
 */
export async function installHeadlessWallet(
  target: Page | BrowserContext,
  config: HeadlessWalletConfig & { autoConnect?: boolean; debug?: boolean }
): Promise<string> {
  const walletId = `wallet-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const configData = JSON.stringify({
    accounts: config.accounts,
    branding: config.branding,
    autoConnect: config.autoConnect || false,
    debug: config.debug || false
  });

  // Create the complete injection script with bundle + initialization
  const injectionScript = `
    ${bundleContent}

    // Initialize the wallet using the bundled function
    (function() {
      const config = ${configData};

      if (config.debug) {
        console.log('[Playwright Bundled Wallet] Initializing with bundled injection');
      }

      try {
        if (typeof window.__injectHeadlessWallet !== 'function') {
          throw new Error('Bundled wallet function not found');
        }

        // Call the bundled function
        const wallet = window.__injectHeadlessWallet(config);

        console.log('✅ Playwright successfully used bundled injectHeadlessWallet');

        // Store reference for cleanup
        if (!window.__playwrightHeadlessWallets) window.__playwrightHeadlessWallets = new Map();
        window.__playwrightHeadlessWallets.set('${walletId}', wallet);

      } catch (error) {
        console.error('❌ Failed to inject bundled headless wallet:', error);
        throw error;
      }
    })();
  `;

  await target.addInitScript(injectionScript);
  return walletId;
}

/**
 * Uninstalls a headless wallet
 */
export async function uninstallHeadlessWallet(
  target: Page | BrowserContext,
  walletId: string
): Promise<void> {
  // Clean up browser side
  const cleanupScript = `
    if (window.__playwrightHeadlessWallets?.has('${walletId}')) {
      window.__playwrightHeadlessWallets.delete('${walletId}');

      // Clean up providers if this was the last wallet
      if (window.__playwrightHeadlessWallets.size === 0) {
        delete window.ethereum;
        if (window.phantom) {
          delete window.phantom.solana;
          if (Object.keys(window.phantom).length === 0) {
            delete window.phantom;
          }
        }
      }
    }
  `;

  // Clean up browser side - only works with Page objects
  if ('evaluate' in target) {
    await target.evaluate(cleanupScript);
  }
}

// Re-export types from core
export type { HeadlessWalletConfig } from '@arenaentertainment/headless-wallet';