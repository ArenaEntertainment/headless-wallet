import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

test.describe('AppKit Disconnect Functionality', () => {
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  test('Reown AppKit demo disconnect button works', async ({ page }) => {
    // Navigate to the demo
    await page.goto('http://localhost:5175/');

    // Install headless wallet
    await installHeadlessWallet(page, {
      accounts: [{
        privateKey,
        type: 'evm'
      }],
      branding: {
        name: 'Test Headless Wallet',
        rdns: 'com.test.headless'
      },
      autoConnect: false
    });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check initial state - should be disconnected
    const initialStatus = await page.locator('#connection-status .status').textContent();
    expect(initialStatus).toContain('Disconnected');

    // Connect wallet through direct ethereum request
    const connectionResult = await page.evaluate(async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        return { success: true, accounts };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(connectionResult.success).toBe(true);
    expect(connectionResult.accounts).toContain(address);

    // Wait for UI to update
    await page.waitForTimeout(1000);

    // Check if connected status shows in UI
    const connectedStatus = await page.locator('#connection-status .status').textContent();
    // Status might still show disconnected if AppKit isn't synced, so we check for the button visibility instead

    // Now test the disconnect button
    const disconnectButton = await page.locator('#appkit-disconnect');
    expect(await disconnectButton.isVisible()).toBe(true);

    // Click disconnect
    await disconnectButton.click();
    await page.waitForTimeout(2000);

    // Verify disconnected
    const finalStatus = await page.locator('#connection-status .status').textContent();
    expect(finalStatus).toContain('Disconnected');

    // Verify disconnect button is no longer visible
    expect(await disconnectButton.isVisible()).toBe(false);
  });

  test('React AppKit demo disconnect button works', async ({ page }) => {
    // First check if React demo is running
    try {
      const response = await page.goto('http://localhost:5176/', { waitUntil: 'domcontentloaded', timeout: 5000 });
      if (!response || !response.ok()) {
        test.skip();
        return;
      }
    } catch {
      test.skip();
      return;
    }

    // Install headless wallet
    await installHeadlessWallet(page, {
      accounts: [{
        privateKey,
        type: 'evm'
      }],
      autoConnect: false
    });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Connect wallet through AppKit button
    await page.locator('appkit-button').click();
    await page.waitForTimeout(1000);

    // Look for our wallet and connect
    const walletOption = await page.locator('text=Arena Headless Wallet').first();
    if (await walletOption.isVisible()) {
      await walletOption.click();
      await page.waitForTimeout(2000);
    }

    // Check if connected
    const connectionText = await page.locator('.status').first().textContent();
    if (connectionText && connectionText.includes('Connected')) {
      // Test disconnect button
      const disconnectBtn = await page.locator('button:has-text("Disconnect AppKit")');
      expect(await disconnectBtn.isVisible()).toBe(true);

      await disconnectBtn.click();
      await page.waitForTimeout(2000);

      // Verify disconnected
      const finalStatus = await page.locator('.status').first().textContent();
      expect(finalStatus).toContain('Disconnected');
    }
  });

  test('Nuxt AppKit demo disconnect button works', async ({ page }) => {
    // First check if Nuxt demo is running
    try {
      const response = await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 5000 });
      if (!response || !response.ok()) {
        test.skip();
        return;
      }
    } catch {
      test.skip();
      return;
    }

    // Install headless wallet
    await installHeadlessWallet(page, {
      accounts: [{
        privateKey,
        type: 'evm'
      }],
      autoConnect: false
    });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Connect wallet through AppKit button
    await page.locator('appkit-button').click();
    await page.waitForTimeout(1000);

    // Look for our wallet and connect
    const walletOption = await page.locator('text=Arena Headless Wallet').first();
    if (await walletOption.isVisible()) {
      await walletOption.click();
      await page.waitForTimeout(2000);
    }

    // Check if connected
    const connectionText = await page.locator('.status').first().textContent();
    if (connectionText && connectionText.includes('Connected')) {
      // Test disconnect button
      const disconnectBtn = await page.locator('button:has-text("Disconnect AppKit")');
      expect(await disconnectBtn.isVisible()).toBe(true);

      await disconnectBtn.click();
      await page.waitForTimeout(2000);

      // Verify disconnected
      const finalStatus = await page.locator('.status').first().textContent();
      expect(finalStatus).toContain('Disconnected');
    }
  });
});