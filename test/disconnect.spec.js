import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

test.describe('Wallet Disconnect Functionality', () => {
  test('EVM disconnect should clear wallet state and emit events', async ({ page }) => {
    // Install wallet with EVM account
    await installHeadlessWallet(page, {
      accounts: [{
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        type: 'evm'
      }],
      autoConnect: false,
      debug: true
    });

    await page.goto('http://localhost:5175/');

    // Set up event listeners
    await page.evaluate(() => {
      window.events = [];

      window.ethereum.on('connect', (info) => {
        window.events.push({ type: 'connect', data: info });
      });

      window.ethereum.on('disconnect', (error) => {
        window.events.push({ type: 'disconnect', data: error });
      });

      window.ethereum.on('accountsChanged', (accounts) => {
        window.events.push({ type: 'accountsChanged', data: accounts });
      });
    });

    // Connect wallet
    const connectResult = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    expect(connectResult).toContain('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

    // Verify accounts are available
    const accountsBeforeDisconnect = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_accounts' });
    });

    expect(accountsBeforeDisconnect).toContain('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

    // Disconnect wallet
    await page.evaluate(async () => {
      await window.ethereum.disconnect();
    });

    // Check accounts after disconnect
    const accountsAfterDisconnect = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_accounts' });
    });

    expect(accountsAfterDisconnect).toEqual([]);

    // Verify events were emitted
    const capturedEvents = await page.evaluate(() => window.events);

    const disconnectEvent = capturedEvents.find(e => e.type === 'disconnect');
    expect(disconnectEvent).toBeDefined();
    expect(disconnectEvent.data.code).toBe(4900);
    expect(disconnectEvent.data.message).toBe('User disconnected');

    const accountsChangedEvent = capturedEvents.find(e => e.type === 'accountsChanged' && e.data.length === 0);
    expect(accountsChangedEvent).toBeDefined();
    expect(accountsChangedEvent.data).toEqual([]);
  });

  test('EVM reconnection should work after disconnect', async ({ page }) => {
    // Install wallet
    await installHeadlessWallet(page, {
      accounts: [{
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        type: 'evm'
      }],
      autoConnect: false
    });

    await page.goto('http://localhost:5175/');

    // Initial connection
    await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Disconnect
    await page.evaluate(async () => {
      await window.ethereum.disconnect();
    });

    // Verify disconnected
    const accountsAfterDisconnect = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_accounts' });
    });
    expect(accountsAfterDisconnect).toEqual([]);

    // Reconnect
    const reconnectResult = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    expect(reconnectResult).toContain('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

    // Verify reconnected
    const accountsAfterReconnect = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_accounts' });
    });

    expect(accountsAfterReconnect).toContain('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  });

  test('Solana disconnect should clear wallet state', async ({ page }) => {
    // Generate Solana test key
    const secretKey = new Uint8Array([
      208, 175, 150, 242, 88, 34, 108, 88, 177, 16, 168, 75,
      115, 181, 199, 242, 120, 4, 78, 75, 19, 227, 13, 215,
      184, 108, 226, 53, 111, 149, 179, 84, 137, 121, 79, 1,
      160, 223, 124, 241, 202, 203, 220, 237, 50, 242, 57, 158,
      226, 207, 203, 188, 43, 28, 70, 110, 214, 234, 251, 15,
      249, 157, 62, 80
    ]);

    // Install wallet with Solana account
    await installHeadlessWallet(page, {
      accounts: [{
        privateKey: secretKey,
        type: 'solana'
      }],
      autoConnect: false,
      debug: true
    });

    await page.goto('http://localhost:5175/');

    // Set up event listener
    await page.evaluate(() => {
      window.events = [];

      window.phantom.solana.on('connect', (publicKey) => {
        window.events.push({ type: 'connect', data: publicKey });
      });

      window.phantom.solana.on('disconnect', () => {
        window.events.push({ type: 'disconnect' });
      });
    });

    // Connect wallet
    const connectResult = await page.evaluate(async () => {
      return await window.phantom.solana.connect();
    });

    expect(connectResult).toHaveProperty('publicKey');

    // Verify connected
    const isConnectedBefore = await page.evaluate(() => {
      return window.phantom.solana.isConnected;
    });
    expect(isConnectedBefore).toBe(true);

    const publicKeyBefore = await page.evaluate(() => {
      return window.phantom.solana.publicKey;
    });
    expect(publicKeyBefore).toBeDefined();

    // Disconnect wallet
    await page.evaluate(async () => {
      await window.phantom.solana.disconnect();
    });

    // Verify disconnected
    const isConnectedAfter = await page.evaluate(() => {
      return window.phantom.solana.isConnected;
    });
    expect(isConnectedAfter).toBe(false);

    const publicKeyAfter = await page.evaluate(() => {
      return window.phantom.solana.publicKey;
    });
    expect(publicKeyAfter).toBeNull();

    // Verify disconnect event was emitted
    const capturedEvents = await page.evaluate(() => window.events);
    const disconnectEvent = capturedEvents.find(e => e.type === 'disconnect');
    expect(disconnectEvent).toBeDefined();
  });

  test('Solana reconnection should work after disconnect', async ({ page }) => {
    // Generate Solana test key
    const secretKey = new Uint8Array([
      208, 175, 150, 242, 88, 34, 108, 88, 177, 16, 168, 75,
      115, 181, 199, 242, 120, 4, 78, 75, 19, 227, 13, 215,
      184, 108, 226, 53, 111, 149, 179, 84, 137, 121, 79, 1,
      160, 223, 124, 241, 202, 203, 220, 237, 50, 242, 57, 158,
      226, 207, 203, 188, 43, 28, 70, 110, 214, 234, 251, 15,
      249, 157, 62, 80
    ]);

    // Install wallet
    await installHeadlessWallet(page, {
      accounts: [{
        privateKey: secretKey,
        type: 'solana'
      }],
      autoConnect: false
    });

    await page.goto('http://localhost:5175/');

    // Initial connection
    const firstConnect = await page.evaluate(async () => {
      return await window.phantom.solana.connect();
    });
    expect(firstConnect).toHaveProperty('publicKey');

    // Disconnect
    await page.evaluate(async () => {
      await window.phantom.solana.disconnect();
    });

    // Verify disconnected
    const isDisconnected = await page.evaluate(() => {
      return window.phantom.solana.isConnected;
    });
    expect(isDisconnected).toBe(false);

    // Reconnect
    const reconnectResult = await page.evaluate(async () => {
      return await window.phantom.solana.connect();
    });
    expect(reconnectResult).toHaveProperty('publicKey');

    // Verify reconnected
    const isReconnected = await page.evaluate(() => {
      return window.phantom.solana.isConnected;
    });
    expect(isReconnected).toBe(true);

    const publicKeyAfterReconnect = await page.evaluate(() => {
      return window.phantom.solana.publicKey;
    });
    expect(publicKeyAfterReconnect).toBeDefined();
  });

  test('Multiple disconnects should be idempotent', async ({ page }) => {
    // Install wallet
    await installHeadlessWallet(page, {
      accounts: [{
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        type: 'evm'
      }],
      autoConnect: false
    });

    await page.goto('http://localhost:5175/');

    // Connect
    await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // First disconnect
    await page.evaluate(async () => {
      await window.ethereum.disconnect();
    });

    const accountsAfterFirst = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_accounts' });
    });
    expect(accountsAfterFirst).toEqual([]);

    // Second disconnect (should not error)
    await expect(page.evaluate(async () => {
      await window.ethereum.disconnect();
    })).resolves.not.toThrow();

    // Accounts should still be empty
    const accountsAfterSecond = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_accounts' });
    });
    expect(accountsAfterSecond).toEqual([]);
  });
});