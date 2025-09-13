import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '../packages/playwright/dist/index.js';

test('detailed debug of wallet injection', async ({ page }) => {
  console.log('🔍 Starting detailed debug test...');

  // Add debugging to see what's happening
  await page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  console.log('🔍 Installing mock wallet...');
  await installHeadlessWallet(page, {
    accounts: [
      { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
    ],
    debug: true
  });
  console.log('✅ installHeadlessWallet completed');

  // Use goto with data URL instead of setContent
  await page.goto(`data:text/html,<!DOCTYPE html>
    <html>
    <body>
      <h1>Detailed Debug Test</h1>
      <script>
        console.log('=== SCRIPT RUNNING ===');
        console.log('window.ethereum:', window.ethereum);
        console.log('typeof window.ethereum:', typeof window.ethereum);
        console.log('__headlessWalletRequest:', typeof __headlessWalletRequest);

        if (window.ethereum) {
          console.log('window.ethereum.isMetaMask:', window.ethereum.isMetaMask);
          console.log('window.ethereum.request:', typeof window.ethereum.request);
        } else {
          console.log('window.ethereum is falsy');
        }

        // Try to call the request function directly
        if (typeof __headlessWalletRequest === 'function') {
          console.log('Calling __headlessWalletRequest directly...');
          __headlessWalletRequest({
            walletId: 'test-id', // This will fail but should show the error
            method: 'eth_accounts',
            provider: 'evm'
          }).catch(error => {
            console.log('Direct call error (expected):', error.message);
          });
        }
      </script>
    </body>
    </html>`);

  // Wait a moment for logs
  await page.waitForTimeout(2000);

  const hasEthereum = await page.evaluate(() => {
    console.log('In evaluate: checking window.ethereum...');
    return !!window.ethereum;
  });

  console.log('🔍 Final check - window.ethereum exists:', hasEthereum);

  const hasFunction = await page.evaluate(() => {
    return typeof window.__headlessWalletRequest;
  });

  console.log('🔍 Final check - __headlessWalletRequest type:', hasFunction);

  // Let's also check if the init script parameters are being passed correctly
  const initScriptDebug = await page.evaluate(() => {
    return {
      ethereum: !!window.ethereum,
      mockRequest: typeof window.__headlessWalletRequest,
      // Check if there are any errors in the console
      errors: window.__initScriptErrors || 'no errors recorded'
    };
  });

  console.log('🔍 Init script debug:', initScriptDebug);
});