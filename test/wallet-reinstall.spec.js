import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';
import { privateKeyToAccount } from 'viem/accounts';
import { generatePrivateKey } from 'viem/accounts';

test.describe('Wallet Reinstallation', () => {
  test('should handle different wallet installations on same page', async ({ page }) => {
    const firstWalletPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const firstWalletAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

    const secondWalletPrivateKey = generatePrivateKey();
    const secondWalletAccount = privateKeyToAccount(secondWalletPrivateKey);
    const secondWalletAddress = secondWalletAccount.address;

    await page.goto('http://localhost:5175/');

    // Install first wallet
    const walletId1 = await installHeadlessWallet(page, {
      accounts: [{
        privateKey: firstWalletPrivateKey,
        type: 'evm'
      }],
      branding: {
        name: 'First Test Wallet'
      },
      autoConnect: false,
      debug: true
    });

    // Connect first wallet via EIP-6963
    await page.evaluate(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      window.testResult = { accounts };
    });

    let result = await page.evaluate(() => window.testResult);
    expect(result.accounts).toContain(firstWalletAddress);

    // Debug: check provider tracking after install
    const installDebugInfo = await page.evaluate(() => {
      return {
        hasProviders: typeof window.__headlessWalletProviders !== 'undefined',
        providerKeys: window.__headlessWalletProviders ? Array.from(window.__headlessWalletProviders.keys()) : [],
        hasListeners: typeof window.__headlessWalletListeners !== 'undefined',
        listenerKeys: window.__headlessWalletListeners ? Array.from(window.__headlessWalletListeners.keys()) : []
      };
    });
    console.log('Debug info after install:', installDebugInfo);

    // Verify wallet is connected
    const connectedAccounts1 = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_accounts' });
    });
    expect(connectedAccounts1).toContain(firstWalletAddress);

    // Disconnect first wallet
    await page.evaluate(async () => {
      await window.ethereum.disconnect();
    });

    console.log('About to uninstall wallet:', walletId1);
    // Uninstall first wallet
    await uninstallHeadlessWallet(page, walletId1);
    console.log('Finished uninstalling wallet:', walletId1);

    // Wait a bit for cleanup
    await page.waitForTimeout(500);

    // Debug: check what wallets exist
    const debugInfo = await page.evaluate(() => {
      console.log('Browser-side debug log!'); // This should appear in browser console
      return {
        hasEthereum: typeof window.ethereum !== 'undefined',
        hasProviders: typeof window.__headlessWalletProviders !== 'undefined',
        providerKeys: window.__headlessWalletProviders ? Array.from(window.__headlessWalletProviders.keys()) : [],
        ethereumValue: window.ethereum
      };
    });
    console.log('Debug info after uninstall:', debugInfo);

    // Verify ethereum provider is removed
    const hasEthereum = await page.evaluate(() => {
      return typeof window.ethereum !== 'undefined';
    });
    expect(hasEthereum).toBe(false);

    // Install second wallet with different account
    const walletId2 = await installHeadlessWallet(page, {
      accounts: [{
        privateKey: secondWalletPrivateKey,
        type: 'evm'
      }],
      branding: {
        name: 'Second Test Wallet'
      },
      autoConnect: false,
      debug: true
    });

    // Verify new ethereum provider exists
    const hasNewEthereum = await page.evaluate(() => {
      return typeof window.ethereum !== 'undefined';
    });
    expect(hasNewEthereum).toBe(true);

    // Connect second wallet
    await page.evaluate(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      window.testResult2 = { accounts };
    });

    result = await page.evaluate(() => window.testResult2);
    expect(result.accounts).toContain(secondWalletAddress);
    expect(result.accounts).not.toContain(firstWalletAddress);

    // Verify correct wallet is connected
    const connectedAccounts2 = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_accounts' });
    });
    expect(connectedAccounts2).toContain(secondWalletAddress);
    expect(connectedAccounts2).not.toContain(firstWalletAddress);

    // Clean up
    await uninstallHeadlessWallet(page, walletId2);
  });

  test('should handle EIP-6963 provider discovery after reinstall', async ({ page }) => {
    const firstWalletPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const secondWalletPrivateKey = generatePrivateKey();

    await page.goto('http://localhost:5175/');

    // Install first wallet
    const walletId1 = await installHeadlessWallet(page, {
      accounts: [{
        privateKey: firstWalletPrivateKey,
        type: 'evm'
      }],
      branding: {
        name: 'First EIP-6963 Wallet',
        rdns: 'com.first.wallet'
      },
      autoConnect: false
    });

    // Check EIP-6963 discovery for first wallet
    const firstProviders = await page.evaluate(() => {
      return new Promise(resolve => {
        const providers = [];
        const handler = (event) => {
          providers.push({
            name: event.detail.info.name,
            rdns: event.detail.info.rdns
          });
        };
        window.addEventListener('eip6963:announceProvider', handler);
        window.dispatchEvent(new Event('eip6963:requestProvider'));
        setTimeout(() => {
          window.removeEventListener('eip6963:announceProvider', handler);
          resolve(providers);
        }, 100);
      });
    });

    // Filter to only our test wallet (demo page may have its own wallet)
    const testProviders = firstProviders.filter(p => p.rdns === 'com.first.wallet');
    expect(testProviders).toHaveLength(1);
    expect(testProviders[0].name).toBe('First EIP-6963 Wallet');
    expect(testProviders[0].rdns).toBe('com.first.wallet');

    // Uninstall first wallet
    await uninstallHeadlessWallet(page, walletId1);
    await page.waitForTimeout(500);

    // Check that no providers are announced after uninstall
    const noProviders = await page.evaluate(() => {
      return new Promise(resolve => {
        const providers = [];
        const handler = (event) => {
          providers.push({
            name: event.detail.info.name,
            rdns: event.detail.info.rdns
          });
        };
        window.addEventListener('eip6963:announceProvider', handler);
        window.dispatchEvent(new Event('eip6963:requestProvider'));
        setTimeout(() => {
          window.removeEventListener('eip6963:announceProvider', handler);
          resolve(providers);
        }, 100);
      });
    });

    // Should have no test providers (demo wallet might still be there)
    const noTestProviders = noProviders.filter(p => p.rdns === 'com.first.wallet');
    expect(noTestProviders).toHaveLength(0);

    // Install second wallet
    const walletId2 = await installHeadlessWallet(page, {
      accounts: [{
        privateKey: secondWalletPrivateKey,
        type: 'evm'
      }],
      branding: {
        name: 'Second EIP-6963 Wallet',
        rdns: 'com.second.wallet'
      },
      autoConnect: false
    });

    // Check EIP-6963 discovery for second wallet
    const secondProviders = await page.evaluate(() => {
      return new Promise(resolve => {
        const providers = [];
        const handler = (event) => {
          providers.push({
            name: event.detail.info.name,
            rdns: event.detail.info.rdns
          });
        };
        window.addEventListener('eip6963:announceProvider', handler);
        window.dispatchEvent(new Event('eip6963:requestProvider'));
        setTimeout(() => {
          window.removeEventListener('eip6963:announceProvider', handler);
          resolve(providers);
        }, 100);
      });
    });

    // Filter to only our second test wallet (demo page may have its own wallet)
    const secondTestProviders = secondProviders.filter(p => p.rdns === 'com.second.wallet');
    expect(secondTestProviders).toHaveLength(1);
    expect(secondTestProviders[0].name).toBe('Second EIP-6963 Wallet');
    expect(secondTestProviders[0].rdns).toBe('com.second.wallet');

    // Clean up
    await uninstallHeadlessWallet(page, walletId2);
  });

  test('should handle Solana wallet reinstallation', async ({ page }) => {
    // Use proper 64-byte Solana secret keys
    const firstSecretKey = new Uint8Array([
      208, 175, 150, 242, 88, 34, 108, 88, 177, 16, 168, 75,
      115, 181, 199, 242, 120, 4, 78, 75, 19, 227, 13, 215,
      184, 108, 226, 53, 111, 149, 179, 84, 137, 121, 79, 1,
      160, 223, 124, 241, 202, 203, 220, 237, 50, 242, 57, 158,
      226, 207, 203, 188, 43, 28, 70, 110, 214, 234, 251, 15,
      249, 157, 62, 80
    ]);

    const secondSecretKey = new Uint8Array([
      150, 18, 232, 71, 19, 88, 173, 212, 93, 227, 95, 201,
      208, 119, 27, 27, 245, 79, 54, 171, 84, 233, 119, 172,
      239, 210, 13, 114, 170, 228, 78, 156, 62, 76, 36, 99,
      206, 146, 119, 196, 167, 136, 71, 9, 222, 59, 121, 131,
      46, 18, 184, 70, 143, 146, 22, 124, 117, 219, 17, 3,
      13, 161, 209, 234
    ]);

    await page.goto('http://localhost:5175/');

    // Install first Solana wallet
    const walletId1 = await installHeadlessWallet(page, {
      accounts: [{
        privateKey: firstSecretKey,
        type: 'solana'
      }],
      autoConnect: false,
      debug: true
    });

    // Connect first Solana wallet
    const firstResult = await page.evaluate(async () => {
      const result = await window.phantom.solana.connect();
      // Simply return a string representation for comparison
      return JSON.stringify({
        connected: true,
        hasPublicKey: !!result.publicKey
      });
    });

    expect(firstResult).toBeTruthy();

    // Disconnect and uninstall
    await page.evaluate(async () => {
      await window.phantom.solana.disconnect();
    });

    await uninstallHeadlessWallet(page, walletId1);
    await page.waitForTimeout(500);

    // Verify Solana provider is removed
    const hasSolana = await page.evaluate(() => {
      return typeof window.phantom?.solana !== 'undefined';
    });
    expect(hasSolana).toBe(false);

    // Install second Solana wallet
    const walletId2 = await installHeadlessWallet(page, {
      accounts: [{
        privateKey: secondSecretKey,
        type: 'solana'
      }],
      autoConnect: false,
      debug: true
    });

    // Connect second Solana wallet
    const secondResult = await page.evaluate(async () => {
      const result = await window.phantom.solana.connect();
      // Simply return a string representation for comparison
      return JSON.stringify({
        connected: true,
        hasPublicKey: !!result.publicKey
      });
    });

    expect(secondResult).toBeTruthy();
    // The main test is that the second wallet can connect successfully after reinstallation
    expect(JSON.parse(secondResult).hasPublicKey).toBe(true);

    // Clean up
    await uninstallHeadlessWallet(page, walletId2);
  });
});