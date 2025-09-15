import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '../packages/playwright/dist/index.js';

test.describe('Reown AppKit External Integration Test', () => {
  test('should inject wallets detectable by external Reown AppKit demo', async ({ page }) => {
    // CRITICAL: Navigate to the modified demo FIRST (no built-in headless wallet)
    await page.goto('http://localhost:5176');
    await page.waitForLoadState('domcontentloaded');

    // Wait for AppKit to initialize
    await page.waitForTimeout(3000);

    // NOW inject wallets via Playwright (the real test!)
    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' },
        { privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8', type: 'solana' }
      ],
      debug: true
    });

    // Wait for injection to complete
    await page.waitForTimeout(2000);

    // Verify providers are injected
    const providersDetected = await page.evaluate(() => {
      return {
        hasEthereum: !!window.ethereum,
        hasSolana: !!window.phantom?.solana,
        appKitExists: !!window.modal
      };
    });

    console.log('Providers detected:', providersDetected);

    expect(providersDetected.hasEthereum).toBe(true);
    expect(providersDetected.hasSolana).toBe(true);
    expect(providersDetected.appKitExists).toBe(true);

    // Test that AppKit can see the providers by triggering the connection UI
    await page.locator('w3m-connect-button').click().catch(() => {
      // Fallback for different button types
      return page.locator('button:has-text("Connect")').first().click();
    });

    // Wait for AppKit modal to appear
    await page.waitForSelector('w3m-modal', { timeout: 10000 }).catch(() => {
      // Fallback for different AppKit versions
      return page.waitForSelector('[data-testid="w3m-modal"]', { timeout: 5000 });
    }).catch(() => {
      // Another fallback
      return page.waitForSelector('.w3m-modal', { timeout: 5000 });
    });

    // Look for our injected wallet in the AppKit modal
    const walletVisible = await page.locator('text=/Arena Headless Wallet|Headless Wallet/i').isVisible().catch(() => false);

    if (walletVisible) {
      console.log('✅ Headless wallet detected in AppKit modal!');

      // Try to connect to the headless wallet
      await page.locator('text=/Arena Headless Wallet|Headless Wallet/i').click();

      // Wait for connection
      await page.waitForTimeout(2000);

      // Verify connection status
      const connectionStatus = await page.evaluate(() => {
        return {
          isConnected: window.modal?.getIsConnected?.() || false,
          address: window.modal?.getAddress?.() || null
        };
      });

      console.log('Connection status:', connectionStatus);
      expect(connectionStatus.isConnected).toBe(true);
      expect(connectionStatus.address).toBeTruthy();

    } else {
      console.log('⚠️  Headless wallet not visible in AppKit modal, checking DOM...');

      // Debug: Check what wallets AppKit detected
      const modalContent = await page.evaluate(() => {
        const modal = document.querySelector('w3m-modal') ||
                     document.querySelector('[data-testid="w3m-modal"]') ||
                     document.querySelector('.w3m-modal');
        return modal ? modal.innerHTML : 'No modal found';
      });

      console.log('AppKit modal content sample:', modalContent.substring(0, 500));
    }

    // The key test: AppKit should detect our injected wallet
    expect(walletVisible).toBe(true);

    await uninstallHeadlessWallet(page, walletId);
  });

  test('should work with Solana connections in AppKit', async ({ page }) => {
    // Navigate to the modified demo
    await page.goto('http://localhost:5176');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Inject wallets
    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8', type: 'solana' }
      ]
    });

    await page.waitForTimeout(2000);

    // Switch to Solana network if available
    const hasSolanaNetwork = await page.evaluate(() => {
      // Check if AppKit has Solana network support
      return window.modal?.getState?.()?.selectedNetworkId?.includes?.('solana') || false;
    });

    if (hasSolanaNetwork) {
      // Try to connect to Solana
      await page.locator('w3m-connect-button').click();
      await page.waitForSelector('w3m-modal', { timeout: 5000 });

      const solanaWalletVisible = await page.locator('text=/Phantom|Solana/i').isVisible().catch(() => false);

      if (solanaWalletVisible) {
        console.log('✅ Solana wallet detected in AppKit!');
      }
    }

    await uninstallHeadlessWallet(page, walletId);
  });
});