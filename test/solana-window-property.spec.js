import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '../packages/playwright/dist/index.js';

// Test Solana keypair - this is a valid ed25519 keypair where the public key matches the private key
// Using the same valid keypair from other test files
const TEST_SOLANA_KEYPAIR = new Uint8Array([150, 18, 232, 71, 19, 88, 173, 212, 93, 227, 95, 201, 208, 119, 27, 27, 245, 79, 54, 171, 84, 233, 119, 172, 239, 210, 13, 114, 170, 228, 78, 156, 62, 76, 36, 99, 206, 146, 119, 196, 167, 136, 71, 9, 222, 59, 121, 131, 46, 18, 184, 70, 143, 146, 22, 124, 117, 219, 17, 3, 13, 161, 209, 234]);

test.describe('Solana Window Property Configuration', () => {
  test('should not inject Solana provider when solanaWindowProperty is undefined', async ({ page }) => {
    // Navigate to a page first
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install Solana wallet without window injection
    await installHeadlessWallet(page, {
      accounts: [
        {
          privateKey: TEST_SOLANA_KEYPAIR,
          type: 'solana'
        }
      ],
      branding: {
        name: 'Solana Wallet Standard Only'
      },
      solanaWindowProperty: undefined, // Don't inject into window
      autoConnect: false
    });

    // Check that Solana is NOT in window.phantom.solana or window.solana
    const windowState = await page.evaluate(() => {
      return {
        hasPhantomSolana: typeof window.phantom?.solana !== 'undefined',
        hasSolana: typeof window.solana !== 'undefined'
      };
    });

    expect(windowState.hasPhantomSolana).toBe(false);
    expect(windowState.hasSolana).toBe(false);

    // But wallet should still be discoverable via Wallet Standard
    // This would require checking wallet-standard:register-wallet event
  });

  test('should inject Solana provider at custom path', async ({ page }) => {
    // Navigate to a page first
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install Solana wallet with custom window path
    await installHeadlessWallet(page, {
      accounts: [
        {
          privateKey: TEST_SOLANA_KEYPAIR,
          type: 'solana'
        }
      ],
      branding: {
        name: 'Custom Path Solana'
      },
      solanaWindowProperty: 'app.wallets.solana', // Custom nested path
      autoConnect: false
    });

    // Check that Solana is at the custom path
    const hasCustomPath = await page.evaluate(() => {
      return typeof window.app?.wallets?.solana !== 'undefined';
    });

    expect(hasCustomPath).toBe(true);

    // Verify the provider has expected methods
    const providerInfo = await page.evaluate(() => {
      const provider = window.app?.wallets?.solana;
      return {
        hasConnect: typeof provider?.connect === 'function',
        hasDisconnect: typeof provider?.disconnect === 'function',
        hasSignMessage: typeof provider?.signMessage === 'function',
        isPhantom: provider?.isPhantom
      };
    });

    expect(providerInfo.hasConnect).toBe(true);
    expect(providerInfo.hasDisconnect).toBe(true);
    expect(providerInfo.hasSignMessage).toBe(true);
  });

  test('should inject at window.solana when specified', async ({ page }) => {
    // Navigate to a page first
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install Solana wallet at window.solana
    await installHeadlessWallet(page, {
      accounts: [
        {
          privateKey: TEST_SOLANA_KEYPAIR,
          type: 'solana'
        }
      ],
      branding: {
        name: 'Direct Solana',
        isPhantom: false
      },
      solanaWindowProperty: 'solana', // Direct window.solana
      autoConnect: false
    });

    // Check that Solana is at window.solana
    const windowState = await page.evaluate(() => {
      return {
        hasSolana: typeof window.solana !== 'undefined',
        hasPhantomSolana: typeof window.phantom?.solana !== 'undefined',
        isPhantom: window.solana?.isPhantom
      };
    });

    expect(windowState.hasSolana).toBe(true);
    expect(windowState.hasPhantomSolana).toBe(false);
    expect(windowState.isPhantom).toBe(false);
  });

  test('should use phantom.solana as default in core package', async ({ page }) => {
    // Navigate to a page first
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install Solana wallet without specifying solanaWindowProperty
    // In the core package, this defaults to 'phantom.solana'
    await installHeadlessWallet(page, {
      accounts: [
        {
          privateKey: TEST_SOLANA_KEYPAIR,
          type: 'solana'
        }
      ],
      branding: {
        name: 'Default Path Solana'
      },
      // solanaWindowProperty not specified - should use default
      autoConnect: false
    });

    // In playwright, the default is undefined (no injection)
    // But if using core's injectHeadlessWallet, it defaults to phantom.solana
    const windowState = await page.evaluate(() => {
      return {
        hasPhantomSolana: typeof window.phantom?.solana !== 'undefined',
        hasSolana: typeof window.solana !== 'undefined'
      };
    });

    // For playwright package, default is undefined (no injection)
    expect(windowState.hasPhantomSolana).toBe(false);
    expect(windowState.hasSolana).toBe(false);
  });
});