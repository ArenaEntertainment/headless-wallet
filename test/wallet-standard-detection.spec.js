import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '../packages/playwright/dist/index.js';

test.describe('Wallet Standard Detection Test', () => {
  test('should detect both EIP-6963 EVM and Wallet Standard Solana wallets', async ({ page }) => {
    // Navigate to the external AppKit demo
    await page.goto('http://localhost:5176');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    console.log('=== BEFORE WALLET INJECTION ===');

    // Check what's available before injection
    const beforeInjection = await page.evaluate(() => {
      return new Promise((resolve) => {
        const eip6963Providers = [];
        const walletStandardWallets = [];

        // Listen for EIP-6963 EVM wallets
        const eip6963Listener = (event) => {
          eip6963Providers.push({
            name: event.detail.info.name,
            rdns: event.detail.info.rdns
          });
        };
        window.addEventListener('eip6963:announceProvider', eip6963Listener);
        window.dispatchEvent(new Event('eip6963:requestProvider'));

        // Listen for Wallet Standard Solana wallets
        const walletStandardListener = (event) => {
          walletStandardWallets.push({
            name: event.detail().name,
            chains: event.detail().chains
          });
        };
        window.addEventListener('wallet-standard:register-wallet', walletStandardListener);

        setTimeout(() => {
          window.removeEventListener('eip6963:announceProvider', eip6963Listener);
          window.removeEventListener('wallet-standard:register-wallet', walletStandardListener);
          resolve({
            eip6963Providers,
            walletStandardWallets,
            hasEthereum: !!window.ethereum,
            hasSolana: !!window.phantom?.solana
          });
        }, 1000);
      });
    });

    console.log('Before injection:', beforeInjection);

    // Now inject wallets with BOTH EVM and Solana
    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' },
        { privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8', type: 'solana' }
      ],
      debug: true
    });

    await page.waitForTimeout(2000);

    console.log('=== AFTER WALLET INJECTION ===');

    // Check what's available after injection
    const afterInjection = await page.evaluate(() => {
      return new Promise((resolve) => {
        const eip6963Providers = [];
        const walletStandardWallets = [];

        // Listen for EIP-6963 EVM wallets
        const eip6963Listener = (event) => {
          console.log('EIP-6963 announcement:', event.detail);
          eip6963Providers.push({
            name: event.detail.info.name,
            rdns: event.detail.info.rdns
          });
        };
        window.addEventListener('eip6963:announceProvider', eip6963Listener);
        window.dispatchEvent(new Event('eip6963:requestProvider'));

        // Listen for Wallet Standard Solana wallets
        const walletStandardListener = (event) => {
          console.log('Wallet Standard registration:', event.detail);
          try {
            const wallet = event.detail();
            walletStandardWallets.push({
              name: wallet.name,
              chains: wallet.chains || []
            });
          } catch (e) {
            console.error('Error processing wallet standard wallet:', e);
          }
        };
        window.addEventListener('wallet-standard:register-wallet', walletStandardListener);

        setTimeout(() => {
          window.removeEventListener('eip6963:announceProvider', eip6963Listener);
          window.removeEventListener('wallet-standard:register-wallet', walletStandardListener);
          resolve({
            eip6963Providers,
            walletStandardWallets,
            hasEthereum: !!window.ethereum,
            hasSolana: !!window.phantom?.solana
          });
        }, 2000);
      });
    });

    console.log('After injection:', afterInjection);

    // Verify both wallet discovery methods work
    expect(afterInjection.hasEthereum, 'EVM provider should exist').toBe(true);
    expect(afterInjection.hasSolana, 'Solana provider should exist').toBe(true);
    expect(afterInjection.eip6963Providers.length, 'Should have EIP-6963 EVM wallet').toBeGreaterThan(0);
    expect(afterInjection.walletStandardWallets.length, 'Should have Wallet Standard Solana wallet').toBeGreaterThan(0);

    console.log('✅ Both EVM and Solana wallet discovery protocols working!');

    // Now test AppKit to see if it shows choice
    console.log('=== TESTING APPKIT WALLET CHOICE ===');

    await page.evaluate(() => {
      window.appKit.open();
    });

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/appkit-with-both-wallets.png', fullPage: true });

    // Check what wallets AppKit detected
    const appKitWallets = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // Look for wallet names in the UI
      const hasHeadlessEVM = bodyText.includes('Arena Headless Wallet');
      const hasMultipleWallets = (bodyText.match(/Arena Headless Wallet/g) || []).length > 1;
      const hasSolanaText = bodyText.toLowerCase().includes('solana');
      const hasEthereumText = bodyText.toLowerCase().includes('ethereum');

      return {
        bodyText: bodyText.substring(0, 1000),
        hasHeadlessEVM,
        hasMultipleWallets,
        hasSolanaText,
        hasEthereumText,
        appKitState: window.appKit.getState()
      };
    });

    console.log('AppKit wallet detection:', {
      hasHeadlessEVM: appKitWallets.hasHeadlessEVM,
      hasMultipleWallets: appKitWallets.hasMultipleWallets,
      hasSolanaText: appKitWallets.hasSolanaText,
      hasEthereumText: appKitWallets.hasEthereumText
    });

    // At minimum, AppKit should detect the EVM wallet
    expect(appKitWallets.hasHeadlessEVM, 'AppKit should show the headless wallet').toBe(true);

    console.log('✅ AppKit wallet detection test completed!');

    await uninstallHeadlessWallet(page, walletId);
  });
});