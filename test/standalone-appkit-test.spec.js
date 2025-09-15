import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

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
    window.addEventListener('load', async () => {
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
    });
  </script>
</body>
</html>`;

    // CRITICAL: Navigate to page BEFORE installing wallet (timing fix)
    await page.goto(dataUrl);
    await page.waitForLoadState('domcontentloaded');

    // NOW install the headless wallet
    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: 'a'.repeat(64), type: 'evm' },
        { privateKey: 'b'.repeat(64), type: 'solana' }
      ]
    });

    // Wait a moment for injection to complete
    await page.waitForTimeout(500);

    // Check that providers are properly detected
    await expect(page.locator('text=✅ window.ethereum detected')).toBeVisible();
    await expect(page.locator('text=✅ window.phantom.solana detected')).toBeVisible();

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