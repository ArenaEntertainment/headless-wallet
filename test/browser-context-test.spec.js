import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

test.describe('BrowserContext vs Page Injection Test', () => {
  test('BrowserContext injection should persist across multiple pages', async ({ browser }) => {
    const evmPrivateKey = 'a'.repeat(64);
    const solanaPrivateKey = 'b'.repeat(64);

    // Test BrowserContext injection
    const context = await browser.newContext();

    const walletId = await installHeadlessWallet(context, {
      accounts: [
        { privateKey: evmPrivateKey, type: 'evm' },
        { privateKey: solanaPrivateKey, type: 'solana' }
      ],
      debug: true
    });

    // Create first page
    const page1 = await context.newPage();
    const dataUrl1 = `data:text/html,<!DOCTYPE html>
<html>
<head><title>Page 1</title></head>
<body>
  <h1>Page 1</h1>
  <div id="status"></div>
  <script>
    window.addEventListener('load', () => {
      const status = document.getElementById('status');
      status.innerHTML = 'EVM: ' + (window.ethereum ? '✅' : '❌') +
                        ', Solana: ' + (window.phantom?.solana ? '✅' : '❌');
    });
  </script>
</body>
</html>`;

    await page1.goto(dataUrl1);
    await expect(page1.locator('#status:has-text("EVM: ✅, Solana: ✅")')).toBeVisible();

    // Test EVM connection on page 1
    const evmAddress1 = await page1.evaluate(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    });

    // Create second page
    const page2 = await context.newPage();
    const dataUrl2 = `data:text/html,<!DOCTYPE html>
<html>
<head><title>Page 2</title></head>
<body>
  <h1>Page 2</h1>
  <div id="status"></div>
  <script>
    window.addEventListener('load', () => {
      const status = document.getElementById('status');
      status.innerHTML = 'EVM: ' + (window.ethereum ? '✅' : '❌') +
                        ', Solana: ' + (window.phantom?.solana ? '✅' : '❌');
    });
  </script>
</body>
</html>`;

    await page2.goto(dataUrl2);
    await expect(page2.locator('#status:has-text("EVM: ✅, Solana: ✅")')).toBeVisible();

    // Test that the same wallet is available on page 2
    const evmAddress2 = await page2.evaluate(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    });

    // Same private key should give same address on both pages
    expect(evmAddress1).toBe(evmAddress2);
    expect(evmAddress1).toBeTruthy();

    // Test Solana on both pages
    const solanaAddress1 = await page1.evaluate(async () => {
      const { publicKey } = await window.phantom.solana.connect();
      return publicKey.toBase58();
    });

    const solanaAddress2 = await page2.evaluate(async () => {
      const { publicKey } = await window.phantom.solana.connect();
      return publicKey.toBase58();
    });

    // Same Solana private key should give same address on both pages
    expect(solanaAddress1).toBe(solanaAddress2);
    expect(solanaAddress1).toBeTruthy();

    await uninstallHeadlessWallet(context, walletId);
    await context.close();
  });

  test('Page injection should be isolated to specific page', async ({ browser }) => {
    const context = await browser.newContext();

    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Only inject wallet into page1
    const walletId = await installHeadlessWallet(page1, {
      accounts: [
        { privateKey: 'c'.repeat(64), type: 'evm' },
        { privateKey: 'd'.repeat(64), type: 'solana' }
      ]
    });

    const dataUrl = `data:text/html,<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
  <h1>Test Page</h1>
  <div id="status"></div>
  <script>
    window.addEventListener('load', () => {
      const status = document.getElementById('status');
      status.innerHTML = 'EVM: ' + (window.ethereum ? '✅' : '❌') +
                        ', Solana: ' + (window.phantom?.solana ? '✅' : '❌');
    });
  </script>
</body>
</html>`;

    await page1.goto(dataUrl);
    await page2.goto(dataUrl);

    // Page1 should have wallet
    await expect(page1.locator('#status:has-text("EVM: ✅, Solana: ✅")')).toBeVisible();

    // Page2 should NOT have wallet
    await expect(page2.locator('#status:has-text("EVM: ❌, Solana: ❌")')).toBeVisible();

    await uninstallHeadlessWallet(page1, walletId);
    await context.close();
  });

  test('Multiple wallet instances should coexist', async ({ browser }) => {
    const context = await browser.newContext();

    const page = await context.newPage();

    // Install first wallet
    const wallet1Id = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: 'e'.repeat(64), type: 'evm' },
      ]
    });

    // Install second wallet (should replace first)
    const wallet2Id = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: 'f'.repeat(64), type: 'evm' },
      ]
    });

    const dataUrl = `data:text/html,<!DOCTYPE html>
<html>
<head><title>Multi Wallet Test</title></head>
<body>
  <h1>Multi Wallet Test</h1>
</body>
</html>`;

    await page.goto(dataUrl);

    // Should have the second wallet (most recent installation)
    const finalAddress = await page.evaluate(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    });

    expect(finalAddress).toBeTruthy();

    // Clean up both wallets
    await uninstallHeadlessWallet(page, wallet1Id);
    await uninstallHeadlessWallet(page, wallet2Id);
    await context.close();
  });
});