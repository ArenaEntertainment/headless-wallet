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
 * Validates account configurations before installation
 */
function validateAccounts(accounts: any[]): void {
  for (const account of accounts) {
    if (account.type === 'solana') {
      // Validate Solana keys
      const key = account.privateKey;

      // Check for invalid characters, but allow valid formats
      if (typeof key === 'string') {
        // Check if it's a JSON array string format like "[1,2,3,...]" - this is valid
        if (key.trim().startsWith('[') && key.trim().endsWith(']')) {
          // This is valid JSON array format, skip character validation
        }
        // Check if it's base64 format (contains +, /, = which are invalid in base58 but valid in base64)
        else if (/^[A-Za-z0-9+/]+=*$/.test(key.trim())) {
          // This is likely base64 format, which is valid
        }
        // Check for clearly invalid characters (excluding base64 chars)
        else if (/[!@#$%^&*()\\:";'<>?,]/.test(key)) {
          throw new Error('Invalid characters in Solana private key');
        }
      }

      // Check Uint8Array length
      if (key instanceof Uint8Array && key.length !== 64) {
        throw new Error(`Invalid Solana secret key: expected 64 bytes, got ${key.length}`);
      }
    }
  }
}

/**
 * Installs a headless wallet by injecting a pre-bundled version with all dependencies
 */
export async function installHeadlessWallet(
  target: Page | BrowserContext,
  config: HeadlessWalletConfig & { autoConnect?: boolean; debug?: boolean }
): Promise<string> {
  // Validate accounts before injection
  validateAccounts(config.accounts);

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

        // Store reference for cleanup with wallet type info
        if (!window.__playwrightHeadlessWallets) window.__playwrightHeadlessWallets = new Map();
        window.__playwrightHeadlessWallets.set('${walletId}', {
          wallet: wallet,
          hasEvm: config.accounts.some(acc => acc.type === 'evm'),
          hasSolana: config.accounts.some(acc => acc.type === 'solana'),
          announceProvider: wallet.__cleanup?.announceProvider
        });

      } catch (error) {
        console.error('❌ Failed to inject bundled headless wallet:', error);
        throw error;
      }
    })();
  `;

  // Fix for Issue #22: Page injection fails due to addInitScript() timing
  if ('evaluate' in target) {
    // For Page objects, we need to determine if page has been navigated
    const url = target.url();

    if (!url || url === 'about:blank') {
      // Page hasn't been navigated yet, use addInitScript for next navigation
      await target.addInitScript(injectionScript);
    } else {
      // Page has already been navigated, use evaluate for immediate injection
      await target.evaluate(injectionScript);
    }
  } else {
    // For BrowserContext objects, use addInitScript before page load
    await target.addInitScript(injectionScript);
  }

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
      const walletInfo = window.__playwrightHeadlessWallets.get('${walletId}');
      window.__playwrightHeadlessWallets.delete('${walletId}');

      // Check remaining wallets for provider cleanup decisions
      const remainingWallets = Array.from(window.__playwrightHeadlessWallets.values());
      const hasOtherEvmWallet = remainingWallets.some(info => info.hasEvm);
      const hasOtherSolanaWallet = remainingWallets.some(info => info.hasSolana);

      // Clean up EVM provider if this wallet had EVM and no other EVM wallets remain
      if (walletInfo.hasEvm && !hasOtherEvmWallet) {
        delete window.ethereum;

        // Clean up EIP-6963 provider announcement
        if (walletInfo.announceProvider) {
          window.removeEventListener('eip6963:requestProvider', walletInfo.announceProvider);
        }
      }

      // Clean up Solana provider if this wallet had Solana and no other Solana wallets remain
      if (walletInfo.hasSolana && !hasOtherSolanaWallet) {
        if (window.phantom?.solana) {
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