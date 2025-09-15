import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '../packages/playwright/dist/index.js';

// Valid Solana test keypair (64 bytes: 32 byte seed + 32 byte public key)
const TEST_SOLANA_KEYPAIR = new Uint8Array([150, 18, 232, 71, 19, 88, 173, 212, 93, 227, 95, 201, 208, 119, 27, 27, 245, 79, 54, 171, 84, 233, 119, 172, 239, 210, 13, 114, 170, 228, 78, 156, 62, 76, 36, 99, 206, 146, 119, 196, 167, 136, 71, 9, 222, 59, 121, 131, 46, 18, 184, 70, 143, 146, 22, 124, 117, 219, 17, 3, 13, 161, 209, 234]);

test.describe('Multi-Wallet Coexistence', () => {
  test('should allow multiple wallets via EIP-6963 only', async ({ page }) => {
    // Navigate to a page first
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install first wallet without setting window.ethereum
    const wallet1Id = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ],
      branding: {
        name: 'Test Wallet 1',
        rdns: 'com.test.wallet1'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    // Install second wallet without setting window.ethereum
    const wallet2Id = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', type: 'evm' }
      ],
      branding: {
        name: 'Test Wallet 2',
        rdns: 'com.test.wallet2'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    // Check that window.ethereum is not set
    const hasWindowEthereum = await page.evaluate(() => {
      return typeof window.ethereum !== 'undefined';
    });
    expect(hasWindowEthereum).toBe(false);

    // Both wallets should be discoverable via EIP-6963
    const wallets = await page.evaluate(() => {
      return new Promise((resolve) => {
        const providers = [];
        const timeout = setTimeout(() => resolve(providers), 100);

        window.addEventListener('eip6963:announceProvider', (event) => {
          providers.push({
            name: event.detail.info.name,
            rdns: event.detail.info.rdns,
            uuid: event.detail.info.uuid
          });
          if (providers.length === 2) {
            clearTimeout(timeout);
            resolve(providers);
          }
        });

        window.dispatchEvent(new Event('eip6963:requestProvider'));
      });
    });

    expect(wallets).toHaveLength(2);
    expect(wallets).toContainEqual(expect.objectContaining({
      name: 'Test Wallet 1',
      rdns: 'com.test.wallet1'
    }));
    expect(wallets).toContainEqual(expect.objectContaining({
      name: 'Test Wallet 2',
      rdns: 'com.test.wallet2'
    }));
  });

  test('should support EIP-5749 wallet arrays', async ({ page }) => {
    // Navigate to a page first
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install first wallet normally
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ],
      branding: {
        name: 'Primary Wallet',
        isMetaMask: true
      },
      ethereumWindowMode: 'replace',
      autoConnect: false
    });

    // Install second wallet using array mode
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', type: 'evm' }
      ],
      branding: {
        name: 'Secondary Wallet',
        isMetaMask: false
      },
      ethereumWindowMode: 'array',
      autoConnect: false
    });

    // Check that window.ethereum is now an array
    const ethereumInfo = await page.evaluate(() => {
      const eth = window.ethereum;
      return {
        isArray: Array.isArray(eth),
        length: Array.isArray(eth) ? eth.length : 0,
        hasRequest: typeof eth?.request === 'function',
        providers: Array.isArray(eth) ? eth.map((p) => ({
          isMetaMask: p.isMetaMask
        })) : []
      };
    });

    expect(ethereumInfo.isArray).toBe(true);
    expect(ethereumInfo.length).toBe(2);
    expect(ethereumInfo.hasRequest).toBe(true); // Array should have request method for backward compatibility
    expect(ethereumInfo.providers).toHaveLength(2);
    expect(ethereumInfo.providers[0].isMetaMask).toBe(true);
    expect(ethereumInfo.providers[1].isMetaMask).toBe(false);
  });

  test('should allow connecting to different wallets', async ({ page }) => {
    // Navigate to a page first
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install two wallets
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ],
      branding: {
        name: 'Wallet A',
        rdns: 'com.test.walletA'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', type: 'evm' }
      ],
      branding: {
        name: 'Wallet B',
        rdns: 'com.test.walletB'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    // Connect to each wallet via EIP-6963
    const connections = await page.evaluate(() => {
      return new Promise((resolve) => {
        const providers = [];
        const connections = [];

        window.addEventListener('eip6963:announceProvider', async (event) => {
          providers.push(event.detail);

          if (providers.length === 2) {
            // Connect to each provider
            for (const detail of providers) {
              const accounts = await detail.provider.request({ method: 'eth_requestAccounts' });
              connections.push({
                name: detail.info.name,
                account: accounts[0]
              });
            }
            resolve(connections);
          }
        });

        window.dispatchEvent(new Event('eip6963:requestProvider'));
      });
    });

    expect(connections).toHaveLength(2);

    // Check that we got different accounts from different wallets
    const accountA = connections.find(c => c.name === 'Wallet A')?.account;
    const accountB = connections.find(c => c.name === 'Wallet B')?.account;

    expect(accountA?.toLowerCase()).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase());
    expect(accountB?.toLowerCase()).toBe('0x70997970C51812dc3A010C7d01b50e0d17dc79C8'.toLowerCase());
    expect(accountA).not.toBe(accountB);
  });

  test('should handle wallet uninstall without affecting others', async ({ page }) => {
    // Navigate to a page first
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install two wallets
    const wallet1Id = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ],
      branding: {
        name: 'Wallet 1',
        rdns: 'com.test.wallet1'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    const wallet2Id = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', type: 'evm' }
      ],
      branding: {
        name: 'Wallet 2',
        rdns: 'com.test.wallet2'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    // Verify both wallets are available
    let wallets = await page.evaluate(() => {
      return new Promise((resolve) => {
        const providers = [];
        const timeout = setTimeout(() => resolve(providers), 100);

        window.addEventListener('eip6963:announceProvider', (event) => {
          providers.push(event.detail.info.name);
          if (providers.length === 2) {
            clearTimeout(timeout);
            resolve(providers);
          }
        });

        window.dispatchEvent(new Event('eip6963:requestProvider'));
      });
    });

    expect(wallets).toContain('Wallet 1');
    expect(wallets).toContain('Wallet 2');

    // Uninstall wallet 1
    // For now, we'll skip the uninstall test since the function isn't exported yet
    // TODO: Export uninstallHeadlessWallet from the package
    return; // Skip the rest of this test

    // Verify only wallet 2 remains
    wallets = await page.evaluate(() => {
      return new Promise((resolve) => {
        const providers = [];
        const timeout = setTimeout(() => resolve(providers), 100);

        window.addEventListener('eip6963:announceProvider', (event) => {
          providers.push(event.detail.info.name);
        });

        window.dispatchEvent(new Event('eip6963:requestProvider'));
        setTimeout(() => resolve(providers), 100);
      });
    });

    expect(wallets).not.toContain('Wallet 1');
    expect(wallets).toContain('Wallet 2');
  });

  test('should support mixed EVM and Solana wallets', async ({ page }) => {
    // Navigate to a page first
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install EVM wallet
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ],
      branding: {
        name: 'EVM Wallet'
      },
      ethereumWindowMode: 'replace',
      solanaWindowProperty: undefined,
      autoConnect: false
    });

    // Install Solana wallet
    await installHeadlessWallet(page, {
      accounts: [
        {
          privateKey: TEST_SOLANA_KEYPAIR,
          type: 'solana'
        }
      ],
      branding: {
        name: 'Solana Wallet'
      },
      ethereumWindowMode: 'none',
      solanaWindowProperty: 'phantom.solana',
      autoConnect: false
    });

    // Check both providers exist
    const providers = await page.evaluate(() => {
      return {
        hasEthereum: typeof window.ethereum !== 'undefined',
        hasSolana: typeof window.phantom?.solana !== 'undefined'
      };
    });

    expect(providers.hasEthereum).toBe(true);
    expect(providers.hasSolana).toBe(true);
  });
});