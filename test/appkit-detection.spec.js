import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '../packages/playwright/dist/index.js';

test.describe('AppKit Wallet Detection Test', () => {
  test('should detect injected wallets in AppKit modal', async ({ page }) => {
    // Navigate to the external AppKit demo
    await page.goto('http://localhost:5176');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Inject wallets AFTER AppKit has initialized
    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' },
        { privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8', type: 'solana' }
      ],
      debug: true
    });

    await page.waitForTimeout(2000);

    // Verify providers are injected
    const providerCheck = await page.evaluate(() => {
      return {
        hasEthereum: !!window.ethereum,
        hasSolana: !!window.phantom?.solana,
        appKitExists: !!window.appKit,
        ethereumInfo: window.ethereum ? {
          isMetaMask: window.ethereum.isMetaMask,
          selectedAddress: window.ethereum.selectedAddress,
          chainId: window.ethereum.chainId
        } : null
      };
    });

    console.log('Provider check:', providerCheck);
    expect(providerCheck.hasEthereum).toBe(true);
    expect(providerCheck.hasSolana).toBe(true);
    expect(providerCheck.appKitExists).toBe(true);

    // Open AppKit modal
    await page.evaluate(() => {
      window.appKit.open();
    });

    await page.waitForTimeout(3000);

    // Take a screenshot to see the modal
    await page.screenshot({ path: 'test-results/appkit-modal-debug.png', fullPage: true });

    // Check modal state and content
    const modalCheck = await page.evaluate(() => {
      const state = window.appKit.getState();
      const bodyText = document.body.innerText;

      return {
        modalOpen: state.open,
        bodyText: bodyText.substring(0, 1000), // First 1000 chars
        hasMetaMaskText: bodyText.toLowerCase().includes('metamask'),
        hasWalletText: bodyText.toLowerCase().includes('wallet'),
        hasConnectText: bodyText.toLowerCase().includes('connect'),
        modalElements: document.querySelectorAll('[data-testid*="wallet"], [class*="wallet"], w3m-*').length
      };
    });

    console.log('Modal check:', modalCheck);

    // Check if AppKit can detect the wallet via EIP-6963
    const eip6963Check = await page.evaluate(() => {
      return new Promise((resolve) => {
        const providers = [];

        // Listen for EIP-6963 announcements
        window.addEventListener('eip6963:announceProvider', (event) => {
          providers.push({
            name: event.detail.info.name,
            uuid: event.detail.info.uuid,
            icon: event.detail.info.icon,
            rdns: event.detail.info.rdns
          });
        });

        // Request providers
        window.dispatchEvent(new Event('eip6963:requestProvider'));

        // Give it time to respond
        setTimeout(() => {
          resolve(providers);
        }, 1000);
      });
    });

    console.log('EIP-6963 providers:', eip6963Check);

    // The crucial test: AppKit should have detected at least one wallet
    expect(eip6963Check.length).toBeGreaterThan(0);

    // Check if it's our injected wallet
    const hasHeadlessWallet = eip6963Check.some(p =>
      p.name.toLowerCase().includes('headless') ||
      p.name.toLowerCase().includes('arena') ||
      p.name.toLowerCase().includes('metamask') // Our injected provider might appear as MetaMask
    );

    expect(hasHeadlessWallet).toBe(true);

    await uninstallHeadlessWallet(page, walletId);
  });
});