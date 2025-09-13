import { test, expect } from '@playwright/test';
import { installMockWallet } from '../packages/playwright/dist/index.js';

test('debug wallet injection', async ({ page }) => {
  console.log('🔍 Starting debug test...');

  // Add debugging to see what's happening
  await page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await installMockWallet(page, {
    accounts: [
      { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
    ],
    debug: true
  });

  await page.setContent(`
    <html>
    <body>
      <h1>Debug Test</h1>
      <script>
        console.log('Script running...');
        console.log('window.ethereum exists:', !!window.ethereum);
        console.log('__mockWalletRequest exists:', typeof __mockWalletRequest);

        if (window.ethereum) {
          console.log('window.ethereum.isMetaMask:', window.ethereum.isMetaMask);
        }
      </script>
    </body>
    </html>
  `);

  // Wait a moment for logs
  await page.waitForTimeout(1000);

  const hasEthereum = await page.evaluate(() => {
    console.log('Checking window.ethereum...');
    return !!window.ethereum;
  });

  console.log('🔍 window.ethereum exists:', hasEthereum);

  const hasFunction = await page.evaluate(() => {
    return typeof window.__mockWalletRequest;
  });

  console.log('🔍 __mockWalletRequest type:', hasFunction);
});