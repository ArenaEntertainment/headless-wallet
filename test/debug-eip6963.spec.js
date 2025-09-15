import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

test('Debug EIP-6963', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // Navigate to a page first
  await page.goto('data:text/html,<html><body>Test</body></html>');

  // Install wallet with ethereumWindowMode: 'none'
  const walletId = await installHeadlessWallet(page, {
    accounts: [
      { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
    ],
    branding: {
      name: 'Debug Wallet',
      rdns: 'com.debug.wallet'
    },
    ethereumWindowMode: 'none',
    autoConnect: false,
    debug: true
  });

  console.log('Wallet installed with ID:', walletId);

  // Check if wallet was injected
  const injectionStatus = await page.evaluate(() => {
    return {
      hasWindowEthereum: typeof window.ethereum !== 'undefined',
      hasProviders: typeof window.__headlessWalletProviders !== 'undefined',
      providersCount: window.__headlessWalletProviders ? window.__headlessWalletProviders.size : 0,
      hasListeners: typeof window.__headlessWalletListeners !== 'undefined',
      listenersCount: window.__headlessWalletListeners ? window.__headlessWalletListeners.size : 0
    };
  });

  console.log('Injection status:', injectionStatus);

  // Try to get wallet via EIP-6963
  const wallet = await page.evaluate(() => {
    return new Promise((resolve) => {
      let foundWallet = null;
      const timeout = setTimeout(() => {
        console.log('Timeout reached, no wallet found');
        resolve(foundWallet);
      }, 500);

      window.addEventListener('eip6963:announceProvider', (event) => {
        console.log('Received EIP-6963 announcement:', event.detail);
        foundWallet = {
          name: event.detail.info.name,
          rdns: event.detail.info.rdns,
          uuid: event.detail.info.uuid
        };
        clearTimeout(timeout);
        resolve(foundWallet);
      });

      console.log('Dispatching eip6963:requestProvider event');
      window.dispatchEvent(new Event('eip6963:requestProvider'));
    });
  });

  console.log('Found wallet:', wallet);

  expect(wallet).not.toBeNull();
  expect(wallet?.name).toBe('Debug Wallet');
  expect(wallet?.rdns).toBe('com.debug.wallet');
});