import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '../packages/playwright/dist/index.js';

test.describe('Standalone AppKit Integration Test', () => {
  test('should inject wallets detectable by external applications without built-in headless wallet integration', async ({ page }) => {
    // Create a completely external test page with no headless wallet integration
    const dataUrl = `data:text/html,<!DOCTYPE html>
<html>
<head>
  <title>External App Test</title>
</head>
<body>
  <h1>External Application</h1>
  <div id="status"></div>
  <script>
    function checkProviders() {
      const status = document.getElementById('status');

      // Test EVM provider
      if (window.ethereum) {
        status.innerHTML += '<p>✅ window.ethereum detected</p>';
      } else {
        status.innerHTML += '<p>❌ window.ethereum NOT detected</p>';
      }

      // Test Solana provider
      if (window.phantom?.solana) {
        status.innerHTML += '<p>✅ window.phantom.solana detected</p>';
      } else {
        status.innerHTML += '<p>❌ window.phantom.solana NOT detected</p>';
      }
    }

    // Check immediately and also after load
    window.addEventListener('load', checkProviders);
    // Check after a short delay to catch injected providers
    setTimeout(checkProviders, 100);
    setTimeout(checkProviders, 500);
    setTimeout(checkProviders, 1000);
  </script>
</body>
</html>`;

    // CRITICAL: Navigate to page BEFORE installing wallet (timing fix)
    await page.goto(dataUrl);
    await page.waitForLoadState('domcontentloaded');

    // NOW install the headless wallet
    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' },
        { privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8', type: 'solana' }
      ]
    });

    // Wait a moment for injection to complete
    await page.waitForTimeout(1000);

    // Debug what's actually on the page
    const pageContent = await page.evaluate(() => {
      return {
        hasEthereum: !!window.ethereum,
        hasPhantom: !!window.phantom,
        hasSolana: !!window.phantom?.solana,
        statusContent: document.getElementById('status')?.innerHTML || 'NO STATUS ELEMENT'
      };
    });

    console.log('DEBUG - Page state:', pageContent);

    // Verify that BOTH providers are injected (this confirms our fix works!)
    expect(pageContent.hasEthereum).toBe(true);
    expect(pageContent.hasPhantom).toBe(true);
    expect(pageContent.hasSolana).toBe(true);

    // Test EVM connection
    const evmAddress = await page.evaluate(async () => {
      if (!window.ethereum) return null;
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    });

    expect(evmAddress).toBeTruthy();
    expect(typeof evmAddress).toBe('string');
    expect(evmAddress.startsWith('0x')).toBe(true);

    // Test Solana connection
    const solanaAddress = await page.evaluate(async () => {
      if (!window.phantom?.solana) return null;
      const { publicKey } = await window.phantom.solana.connect();
      return publicKey.toBase58();
    });

    expect(solanaAddress).toBeTruthy();
    expect(typeof solanaAddress).toBe('string');

    // Different private keys should produce different addresses
    expect(evmAddress).not.toBe(solanaAddress);

    await uninstallHeadlessWallet(page, walletId);
  });
});