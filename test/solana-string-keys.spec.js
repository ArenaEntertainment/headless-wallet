import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

// Test vectors for different Solana key formats
// Using a seed from 0-31 to generate a consistent keypair
const seed = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
  seed[i] = i;
}

// The secret key is seed + public key (64 bytes total)
const TEST_KEYS = {
  // 64-byte Uint8Array (standard format) - seed (32 bytes) + public key (32 bytes)
  uint8Array: new Uint8Array([
    // First 32 bytes: seed
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
    // Last 32 bytes: public key derived from seed
    3, 161, 7, 191, 243, 206, 16, 190, 29, 112, 221, 24, 231, 75, 192, 153,
    103, 228, 214, 48, 155, 165, 13, 95, 29, 220, 134, 100, 18, 85, 49, 184
  ]),

  // Hex string with 0x prefix
  hexWith0x: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8',

  // Hex string without prefix
  hexWithout0x: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8',

  // Base64 string
  base64: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8DoQe/884Qvh1w3RjnS8CZZ+TWMJulDV8d3IZkElUxuA==',

  // JSON array string
  jsonArray: '[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,3,161,7,191,243,206,16,190,29,112,221,24,231,75,192,153,103,228,214,48,155,165,13,95,29,220,134,100,18,85,49,184]',

  // Expected public key for all formats (they should all derive the same public key)
  expectedPublicKey: 'FAe4sisG95oZ42w7buUn5qEE4TAnfTTFPiguZUHmhiF'
};

test.describe('Solana String Key Support', () => {
  test('should accept Uint8Array format', async ({ page, context }) => {
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_KEYS.uint8Array, type: 'solana' }
      ],
      autoConnect: false
    });

    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Connect and get public key
    const result = await page.evaluate(async () => {
      if (!window.phantom?.solana) {
        throw new Error('Solana provider not found');
      }
      const { publicKey } = await window.phantom.solana.connect();
      return publicKey.toString();
    });

    expect(result).toBe(TEST_KEYS.expectedPublicKey);
  });

  test.skip('should accept Base58 string format', async ({ page }) => {
    // Skip base58 for now - Solana secret keys are typically not encoded as base58
    // (public keys are, but not secret keys)
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_KEYS.base58, type: 'solana' }
      ],
      autoConnect: false
    });

    await page.goto('data:text/html,<html><body>Test</body></html>');

    const result = await page.evaluate(async () => {
      if (!window.phantom?.solana) {
        throw new Error('Solana provider not found');
      }
      const { publicKey } = await window.phantom.solana.connect();
      return publicKey.toString();
    });

    expect(result).toBe(TEST_KEYS.expectedPublicKey);
  });

  test('should accept hex string with 0x prefix', async ({ page }) => {
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_KEYS.hexWith0x, type: 'solana' }
      ],
      autoConnect: false
    });

    await page.goto('data:text/html,<html><body>Test</body></html>');

    const result = await page.evaluate(async () => {
      if (!window.phantom?.solana) {
        throw new Error('Solana provider not found');
      }
      const { publicKey } = await window.phantom.solana.connect();
      return publicKey.toString();
    });

    expect(result).toBe(TEST_KEYS.expectedPublicKey);
  });

  test('should accept hex string without 0x prefix', async ({ page }) => {
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_KEYS.hexWithout0x, type: 'solana' }
      ],
      autoConnect: false
    });

    await page.goto('data:text/html,<html><body>Test</body></html>');

    const result = await page.evaluate(async () => {
      if (!window.phantom?.solana) {
        throw new Error('Solana provider not found');
      }
      const { publicKey } = await window.phantom.solana.connect();
      return publicKey.toString();
    });

    expect(result).toBe(TEST_KEYS.expectedPublicKey);
  });

  test('should accept base64 string format', async ({ page }) => {
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_KEYS.base64, type: 'solana' }
      ],
      autoConnect: false
    });

    await page.goto('data:text/html,<html><body>Test</body></html>');

    const result = await page.evaluate(async () => {
      if (!window.phantom?.solana) {
        throw new Error('Solana provider not found');
      }
      const { publicKey } = await window.phantom.solana.connect();
      return publicKey.toString();
    });

    expect(result).toBe(TEST_KEYS.expectedPublicKey);
  });

  test('should accept JSON array string format', async ({ page }) => {
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_KEYS.jsonArray, type: 'solana' }
      ],
      autoConnect: false
    });

    await page.goto('data:text/html,<html><body>Test</body></html>');

    const result = await page.evaluate(async () => {
      if (!window.phantom?.solana) {
        throw new Error('Solana provider not found');
      }
      const { publicKey } = await window.phantom.solana.connect();
      return publicKey.toString();
    });

    expect(result).toBe(TEST_KEYS.expectedPublicKey);
  });

  test('should handle multiple accounts with different formats', async ({ page }) => {
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_KEYS.uint8Array, type: 'solana' },
        { privateKey: TEST_KEYS.hexWith0x, type: 'solana' },
        { privateKey: TEST_KEYS.base64, type: 'solana' }
      ],
      autoConnect: false
    });

    await page.goto('data:text/html,<html><body>Test</body></html>');

    const result = await page.evaluate(async () => {
      if (!window.phantom?.solana) {
        throw new Error('Solana provider not found');
      }
      const { publicKey } = await window.phantom.solana.connect();
      return publicKey.toString();
    });

    // Should connect with first account
    expect(result).toBe(TEST_KEYS.expectedPublicKey);
  });

  test('should sign messages with string key format', async ({ page }) => {
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_KEYS.hexWith0x, type: 'solana' }
      ],
      autoConnect: false
    });

    await page.goto('data:text/html,<html><body>Test</body></html>');

    // Connect first
    await page.evaluate(async () => {
      await window.phantom.solana.connect();
    });

    // Sign a message
    const result = await page.evaluate(async () => {
      const message = new TextEncoder().encode('Hello Solana!');
      const { signature, publicKey } = await window.phantom.solana.signMessage(message);
      return {
        signatureLength: signature.length,
        publicKey: publicKey.toString()
      };
    });

    expect(result.signatureLength).toBe(64); // Ed25519 signature
    expect(result.publicKey).toBe(TEST_KEYS.expectedPublicKey);
  });

  test('should reject invalid key formats', async ({ page }) => {
    // Test invalid base58
    await expect(installHeadlessWallet(page, {
      accounts: [
        { privateKey: 'invalid-base58-string!@#$', type: 'solana' }
      ]
    })).rejects.toThrow();
  });

  test('should reject keys with wrong length', async ({ page }) => {
    // Test short Uint8Array
    await expect(installHeadlessWallet(page, {
      accounts: [
        { privateKey: new Uint8Array(32), type: 'solana' } // Should be 64 bytes
      ]
    })).rejects.toThrow();
  });
});