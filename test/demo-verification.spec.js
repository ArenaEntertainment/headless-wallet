import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

test.describe('Demo Applications Verification', () => {
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  test('Reown AppKit demo works with headless wallet', async ({ page }) => {
    // Navigate to the demo first
    await page.goto('http://localhost:5174/');

    // Install headless wallet after navigation
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

    // Check if window.ethereum is available
    const hasEthereum = await page.evaluate(() => {
      return typeof window.ethereum !== 'undefined';
    });
    expect(hasEthereum).toBe(true);

    // Test EIP-6963 provider discovery
    const providers = await page.evaluate(() => {
      return new Promise((resolve) => {
        const foundProviders = [];
        const handler = (event) => {
          foundProviders.push({
            name: event.detail.info.name,
            rdns: event.detail.info.rdns
          });
        };
        window.addEventListener('eip6963:announceProvider', handler);
        window.dispatchEvent(new Event('eip6963:requestProvider'));
        setTimeout(() => {
          window.removeEventListener('eip6963:announceProvider', handler);
          resolve(foundProviders);
        }, 100);
      });
    });

    // The demo may register its own wallet as well
    expect(providers.length).toBeGreaterThanOrEqual(1);
    // The demo page may have its own wallet, so filter to our test wallet
    const testWallet = providers.find(p => p.rdns === 'com.test.headless');
    expect(testWallet).toBeDefined();
    expect(testWallet.name).toBe('Test Headless Wallet');

    // Test wallet connection
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

    // Test message signing (important for ethers v6 compatibility)
    const signingResult = await page.evaluate(async () => {
      try {
        const message = 'Test message for demo';
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, accounts[0]]
        });
        return { success: true, signature };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(signingResult.success).toBe(true);
    expect(signingResult.signature).toBeTruthy();

    // Test hex message signing (ethers v6 compatibility)
    const hexSigningResult = await page.evaluate(async () => {
      try {
        // Simulate ethers v6 behavior
        const plainMessage = 'Test message';
        const encoder = new TextEncoder();
        const bytes = encoder.encode(plainMessage);
        const hexMessage = '0x' + Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [hexMessage, accounts[0]]
        });
        return { success: true, signature, hexMessage };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(hexSigningResult.success).toBe(true);
    expect(hexSigningResult.signature).toBeTruthy();
  });

  test('Vanilla demo works with headless wallet', async ({ page }) => {
    // First check if vanilla demo is running
    try {
      const response = await page.goto('http://localhost:5178/', { waitUntil: 'domcontentloaded', timeout: 5000 });
      if (!response || !response.ok()) {
        test.skip();
        return;
      }
    } catch {
      test.skip();
      return;
    }

    // Install headless wallet after navigation
    await installHeadlessWallet(page, {
      accounts: [{
        privateKey,
        type: 'evm'
      }],
      autoConnect: false
    });

    // Basic connectivity test
    const hasEthereum = await page.evaluate(() => {
      return typeof window.ethereum !== 'undefined';
    });
    expect(hasEthereum).toBe(true);

    // Test connection
    const accounts = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_requestAccounts' });
    });
    expect(accounts).toContain(address);
  });

  test('React demo works with headless wallet', async ({ page }) => {
    // First check if React demo is running
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

    // Install headless wallet after navigation
    await installHeadlessWallet(page, {
      accounts: [{
        privateKey,
        type: 'evm'
      }],
      autoConnect: false
    });

    // Basic connectivity test
    const hasEthereum = await page.evaluate(() => {
      return typeof window.ethereum !== 'undefined';
    });
    expect(hasEthereum).toBe(true);

    // Test connection
    const accounts = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_requestAccounts' });
    });
    expect(accounts).toContain(address);
  });
});