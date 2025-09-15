import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '../packages/playwright/dist/index.js';

test.describe('Duplicate Wallet Handling', () => {
  test('should allow multiple wallets with different rdns values', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install first wallet
    const wallet1Id = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ],
      branding: {
        name: 'Wallet Alpha',
        rdns: 'com.example.wallet.alpha'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    // Install second wallet with different rdns
    const wallet2Id = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', type: 'evm' }
      ],
      branding: {
        name: 'Wallet Beta',
        rdns: 'com.example.wallet.beta'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    // Install third wallet with different rdns
    const wallet3Id = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', type: 'evm' }
      ],
      branding: {
        name: 'Wallet Gamma',
        rdns: 'com.example.wallet.gamma'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    // Verify all three wallets are unique
    expect(wallet1Id).not.toBe(wallet2Id);
    expect(wallet2Id).not.toBe(wallet3Id);
    expect(wallet1Id).not.toBe(wallet3Id);

    // Verify all wallets are discoverable via EIP-6963
    const wallets = await page.evaluate(() => {
      return new Promise((resolve) => {
        const providers = [];
        const timeout = setTimeout(() => resolve(providers), 200);

        window.addEventListener('eip6963:announceProvider', (event) => {
          providers.push({
            name: event.detail.info.name,
            rdns: event.detail.info.rdns,
            uuid: event.detail.info.uuid
          });
          if (providers.length === 3) {
            clearTimeout(timeout);
            resolve(providers);
          }
        });

        window.dispatchEvent(new Event('eip6963:requestProvider'));
      });
    });

    expect(wallets).toHaveLength(3);

    // Check that each wallet has unique rdns
    const rdnsValues = wallets.map(w => w.rdns);
    expect(new Set(rdnsValues).size).toBe(3);
    expect(rdnsValues).toContain('com.example.wallet.alpha');
    expect(rdnsValues).toContain('com.example.wallet.beta');
    expect(rdnsValues).toContain('com.example.wallet.gamma');

    // Check that each wallet has unique UUID
    const uuids = wallets.map(w => w.uuid);
    expect(new Set(uuids).size).toBe(3);
  });

  test('should allow wallets with same name but different rdns', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install two wallets with same name but different rdns
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ],
      branding: {
        name: 'My Wallet',
        rdns: 'com.company1.wallet'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', type: 'evm' }
      ],
      branding: {
        name: 'My Wallet',
        rdns: 'com.company2.wallet'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    // Verify both are discoverable
    const wallets = await page.evaluate(() => {
      return new Promise((resolve) => {
        const providers = [];
        const timeout = setTimeout(() => resolve(providers), 200);

        window.addEventListener('eip6963:announceProvider', (event) => {
          providers.push({
            name: event.detail.info.name,
            rdns: event.detail.info.rdns
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
    expect(wallets.every(w => w.name === 'My Wallet')).toBe(true);
    expect(wallets.map(w => w.rdns)).toContain('com.company1.wallet');
    expect(wallets.map(w => w.rdns)).toContain('com.company2.wallet');
  });

  test('should handle wallets with same rdns (edge case)', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Install two wallets with same rdns (not recommended but should work)
    const wallet1Id = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ],
      branding: {
        name: 'Wallet Instance 1',
        rdns: 'com.duplicate.wallet'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    const wallet2Id = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', type: 'evm' }
      ],
      branding: {
        name: 'Wallet Instance 2',
        rdns: 'com.duplicate.wallet'
      },
      ethereumWindowMode: 'none',
      autoConnect: false
    });

    // They should still have different UUIDs
    expect(wallet1Id).not.toBe(wallet2Id);

    // Both should be discoverable
    const wallets = await page.evaluate(() => {
      return new Promise((resolve) => {
        const providers = [];
        const timeout = setTimeout(() => resolve(providers), 200);

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

    // Both have same rdns
    expect(wallets.every(w => w.rdns === 'com.duplicate.wallet')).toBe(true);

    // But different UUIDs
    const uuids = wallets.map(w => w.uuid);
    expect(new Set(uuids).size).toBe(2);

    // And different names
    expect(wallets.map(w => w.name)).toContain('Wallet Instance 1');
    expect(wallets.map(w => w.name)).toContain('Wallet Instance 2');
  });
});