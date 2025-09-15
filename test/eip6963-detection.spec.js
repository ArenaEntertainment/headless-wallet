import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '../packages/playwright/dist/index.js';

test.describe('EIP-6963 Wallet Detection Test', () => {
  test('should announce wallets via EIP-6963 for AppKit to discover', async ({ page }) => {
    // Navigate to the external AppKit demo
    await page.goto('http://localhost:5176');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    console.log('=== BEFORE WALLET INJECTION ===');

    // Check what providers exist before injection
    const beforeProviders = await page.evaluate(() => {
      return new Promise((resolve) => {
        const providers = [];

        const listener = (event) => {
          providers.push({
            name: event.detail.info.name,
            uuid: event.detail.info.uuid,
            icon: event.detail.info.icon,
            rdns: event.detail.info.rdns
          });
        };

        window.addEventListener('eip6963:announceProvider', listener);
        window.dispatchEvent(new Event('eip6963:requestProvider'));

        setTimeout(() => {
          window.removeEventListener('eip6963:announceProvider', listener);
          resolve({
            providers,
            hasEthereum: !!window.ethereum,
            hasSolana: !!window.phantom?.solana
          });
        }, 1000);
      });
    });

    console.log('Before injection:', beforeProviders);

    // Now inject wallets
    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ],
      debug: true
    });

    await page.waitForTimeout(2000);

    console.log('=== AFTER WALLET INJECTION ===');

    // Check what providers exist after injection
    const afterProviders = await page.evaluate(() => {
      return new Promise((resolve) => {
        const providers = [];

        const listener = (event) => {
          console.log('EIP-6963 announcement received:', event.detail);
          providers.push({
            name: event.detail.info.name,
            uuid: event.detail.info.uuid,
            icon: event.detail.info.icon,
            rdns: event.detail.info.rdns
          });
        };

        window.addEventListener('eip6963:announceProvider', listener);

        // Clear any existing providers and request fresh ones
        window.dispatchEvent(new Event('eip6963:requestProvider'));

        setTimeout(() => {
          window.removeEventListener('eip6963:announceProvider', listener);
          resolve({
            providers,
            hasEthereum: !!window.ethereum,
            hasSolana: !!window.phantom?.solana,
            ethereumDetails: window.ethereum ? {
              isMetaMask: window.ethereum.isMetaMask,
              chainId: window.ethereum.chainId,
              selectedAddress: window.ethereum.selectedAddress,
              isConnected: window.ethereum.isConnected?.(),
            } : null
          });
        }, 2000);
      });
    });

    console.log('After injection:', afterProviders);

    // Test assertions
    expect(afterProviders.hasEthereum, 'window.ethereum should exist').toBe(true);
    expect(afterProviders.providers.length, 'Should have at least one EIP-6963 provider').toBeGreaterThan(0);

    // Check if our wallet is announced
    const hasHeadlessWallet = afterProviders.providers.some(p =>
      p.name.toLowerCase().includes('headless') ||
      p.name.toLowerCase().includes('arena') ||
      p.rdns === 'com.arenaentertainment.headless-wallet'
    );

    if (!hasHeadlessWallet) {
      console.log('Available provider names:', afterProviders.providers.map(p => p.name));
      console.log('Available provider RDNS:', afterProviders.providers.map(p => p.rdns));
    }

    expect(hasHeadlessWallet, 'Should have the headless wallet provider').toBe(true);

    console.log('✅ EIP-6963 wallet detection successful!');

    await uninstallHeadlessWallet(page, walletId);
  });
});