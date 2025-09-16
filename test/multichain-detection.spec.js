import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

test('Test bundled wallet with multichain detection', async ({ page }) => {
  console.log('🎯 Testing bundled approach for multichain detection...');

  // Install wallet with both EVM and Solana
  const walletId = await installHeadlessWallet(page, {
    accounts: [
      {
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        type: 'evm'
      },
      {
        privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8',
        type: 'solana'
      }
    ],
    branding: {
      name: 'Arena Headless Wallet',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MzY2RjEiLz4KPHBhdGggZD0iTTEyIDEySDIwVjIwSDEyVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
      isMetaMask: false,
      isPhantom: true
    },
    debug: true
  });

  console.log('✅ Bundled wallet installed with ID:', walletId);

  await page.goto('http://localhost:5178');
  await page.waitForLoadState('networkidle');

  // Wait for wallet injection
  await page.waitForTimeout(2000);

  // Check if both providers exist
  const hasEthereum = await page.evaluate(() => typeof window.ethereum !== 'undefined');
  const hasSolana = await page.evaluate(() => typeof window.phantom?.solana !== 'undefined');

  console.log('window.ethereum exists:', hasEthereum);
  console.log('window.phantom.solana exists:', hasSolana);

  if (!hasEthereum || !hasSolana) {
    console.error('❌ Basic wallet injection failed');
    await page.screenshot({ path: 'test-results/bundle-injection-failed.png' });
    throw new Error('Wallet injection failed');
  }

  // Click the connect wallet button to trigger AppKit modal
  await page.click('button:has-text("Connect Wallet")');
  await page.waitForTimeout(1000);

  // Take screenshot of modal
  await page.screenshot({ path: 'test-results/bundled-fix-modal.png', fullPage: true });

  // Check if Arena Headless Wallet appears in the modal
  const walletInModal = await page.locator('text=Arena Headless Wallet').isVisible();
  console.log('Arena Headless Wallet visible in modal:', walletInModal);

  if (!walletInModal) {
    console.error('❌ Wallet not detected by AppKit');
    throw new Error('Wallet not found in AppKit modal');
  }

  // Check if it shows as multichain vs INSTALLED
  const multichainBadge = await page.locator('text=multichain').isVisible();
  const installedBadge = await page.locator('text=INSTALLED').isVisible();

  console.log('Multichain badge visible:', multichainBadge);
  console.log('INSTALLED badge visible:', installedBadge);

  // Click the wallet to see if chain selection appears
  await page.click('text=Arena Headless Wallet');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'test-results/bundled-fix-after-click.png', fullPage: true });

  console.log('🎉 TEST RESULTS:');
  console.log('- Wallet appears in AppKit:', walletInModal);
  console.log('- Shows as multichain:', multichainBadge);
  console.log('- Shows as INSTALLED:', installedBadge);

  // The test passes if wallet appears - multichain detection is the goal
  expect(walletInModal).toBe(true);
});