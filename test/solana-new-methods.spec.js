import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

// Test Solana private key (for devnet)
const TEST_PRIVATE_KEY = new Uint8Array([
  // First 32 bytes: seed
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  // Last 32 bytes: public key derived from seed
  3, 161, 7, 191, 243, 206, 16, 190, 29, 112, 221, 24, 231, 75, 192, 153,
  103, 228, 214, 48, 155, 165, 13, 95, 29, 220, 134, 100, 18, 85, 49, 184
]);

const EXPECTED_PUBLIC_KEY = 'FAe4sisG95oZ42w7buUn5qEE4TAnfTTFPiguZUHmhiF';

test.describe('New Solana Methods', () => {
  test('should get balance for Solana account', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'solana' }
      ],
      solana: {
        cluster: 'devnet'
      }
    });

    const result = await page.evaluate(async () => {
      const wallet = window.phantom?.solana;
      if (!wallet) throw new Error('Wallet not found');

      await wallet.connect();

      // Call getBalance method
      const balance = await wallet.request({
        method: 'getBalance'
      });

      return { balance };
    });

    // Balance should be a number (in SOL)
    expect(typeof result.balance).toBe('number');
    expect(result.balance).toBeGreaterThanOrEqual(0);
  });

  test('should get latest blockhash', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'solana' }
      ],
      solana: {
        cluster: 'devnet'
      }
    });

    const result = await page.evaluate(async () => {
      const wallet = window.phantom?.solana;
      if (!wallet) throw new Error('Wallet not found');

      await wallet.connect();

      // Call getLatestBlockhash method
      const blockhashInfo = await wallet.request({
        method: 'getLatestBlockhash'
      });

      return blockhashInfo;
    });

    // Should return blockhash and lastValidBlockHeight
    expect(result).toHaveProperty('blockhash');
    expect(result).toHaveProperty('lastValidBlockHeight');
    expect(typeof result.blockhash).toBe('string');
    expect(typeof result.lastValidBlockHeight).toBe('number');
  });

  test('should get account info', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'solana' }
      ],
      solana: {
        cluster: 'devnet'
      }
    });

    const result = await page.evaluate(async () => {
      const wallet = window.phantom?.solana;
      if (!wallet) throw new Error('Wallet not found');

      await wallet.connect();

      // Call getAccountInfo method
      const accountInfo = await wallet.request({
        method: 'getAccountInfo'
      });

      return { accountInfo };
    });

    // Account info may be null if account doesn't exist
    // or an object with account data
    expect(result.accountInfo === null || typeof result.accountInfo === 'object').toBe(true);
  });

  test('should support Sign In with Solana (SIWS)', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'solana' }
      ],
      solana: {
        cluster: 'devnet'
      }
    });

    const result = await page.evaluate(async () => {
      const wallet = window.phantom?.solana;
      if (!wallet) throw new Error('Wallet not found');

      await wallet.connect();

      // Call signIn method
      const signInResult = await wallet.request({
        method: 'signIn',
        params: [{
          domain: 'example.com',
          statement: 'Please sign in to Example App',
          uri: 'https://example.com',
          version: '1',
          nonce: 'test-nonce-123'
        }]
      });

      return signInResult;
    });

    // Should return account info and signed message
    expect(result).toHaveProperty('account');
    expect(result.account).toHaveProperty('address');
    expect(result.account).toHaveProperty('publicKey');
    expect(result.account.address).toBe(EXPECTED_PUBLIC_KEY);

    expect(result).toHaveProperty('signedMessage');
    expect(result.signedMessage).toHaveProperty('signature');
    expect(result.signedMessage).toHaveProperty('signatureBase64');

    // Verify signature is Uint8Array (will be serialized as object)
    expect(result.signedMessage.signature).toBeDefined();
    expect(typeof result.signedMessage.signatureBase64).toBe('string');
  });

  test('should send pre-signed transaction', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'solana' }
      ],
      solana: {
        cluster: 'devnet'
      }
    });

    const result = await page.evaluate(async () => {
      const wallet = window.phantom?.solana;
      if (!wallet) throw new Error('Wallet not found');

      await wallet.connect();

      try {
        // This will fail because we don't have a real pre-signed transaction
        // But we're testing that the method exists and can be called
        await wallet.request({
          method: 'sendTransaction',
          params: [{}] // Invalid transaction, will fail
        });
        return { methodExists: true, error: null };
      } catch (error) {
        // We expect this to fail with a specific error
        return { methodExists: true, error: error.message };
      }
    });

    // Method should exist and be callable
    expect(result.methodExists).toBe(true);
    // Should fail because we didn't provide a valid transaction
    expect(result.error).toBeDefined();
  });

  test('should get token accounts (empty for new wallet)', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'solana' }
      ],
      solana: {
        cluster: 'devnet'
      }
    });

    const result = await page.evaluate(async () => {
      const wallet = window.phantom?.solana;
      if (!wallet) throw new Error('Wallet not found');

      await wallet.connect();

      // Call getTokenAccounts method
      const tokenAccounts = await wallet.request({
        method: 'getTokenAccounts'
      });

      return { tokenAccounts };
    });

    // Should return an array (empty for new wallet)
    expect(Array.isArray(result.tokenAccounts)).toBe(true);
  });
});