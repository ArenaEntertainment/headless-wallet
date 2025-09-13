import { test, expect } from '@playwright/test';
import { installMockWallet, getMockWalletAccounts, signMockWalletMessage } from '../packages/playwright/dist/index.js';

// Test private key (hardhat account #0)
const TEST_EVM_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const EXPECTED_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

test.describe('Mock Wallet Integration', () => {
  test('should inject real EVM wallet with actual signing', async ({ page }) => {
    // Install the mock wallet with real private key
    await installMockWallet(page, {
      accounts: [
        { privateKey: TEST_EVM_KEY, type: 'evm' }
      ],
      autoConnect: false,
      debug: true
    });

    // Navigate to a blank page
    await page.goto('data:text/html,<html><body><h1>Test Page</h1></body></html>');

    // Verify window.ethereum exists
    const hasEthereum = await page.evaluate(() => !!window.ethereum);
    expect(hasEthereum).toBe(true);

    // Verify it's marked as MetaMask
    const isMetaMask = await page.evaluate(() => window.ethereum.isMetaMask);
    expect(isMetaMask).toBe(true);

    // Connect and get accounts
    const accounts = await getMockWalletAccounts(page);
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toBe(EXPECTED_ADDRESS);

    // Test real message signing
    const message = 'Hello from real crypto test!';
    const signature = await signMockWalletMessage(page, message, accounts[0]);

    // Verify signature format (130 chars = 0x + 64 bytes hex)
    expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);

    console.log('✅ Real signature generated:', signature);
  });

  test('should work with real Solana wallet', async ({ page }) => {
    // Test Solana keypair (32 bytes for secret key)
    const testSolanaKey = new Uint8Array([
      174,  47, 154, 16,  202, 193, 206, 113,  44, 243, 204, 198,  95, 215, 226, 118,
      131,  48,  92, 35,  174, 226, 177, 101,  60,  85, 169,  49,  28, 131, 154, 230,
      158, 109, 137, 137,  112, 241, 162, 219,  29,  81, 115, 199,  69,  23, 228, 69,
      142,  34, 184, 19,  127,  77, 183,  59, 135, 175, 182, 111, 118, 162, 101, 238
    ]);

    await installMockWallet(page, {
      accounts: [
        { privateKey: testSolanaKey, type: 'solana' }
      ],
      autoConnect: false,
      debug: true
    });

    await page.goto('data:text/html,<html><body><h1>Solana Test</h1></body></html>');

    // Verify Solana provider exists
    const hasSolana = await page.evaluate(() => !!window.phantom?.solana);
    expect(hasSolana).toBe(true);

    // Verify it's marked as Phantom
    const isPhantom = await page.evaluate(() => window.phantom.solana.isPhantom);
    expect(isPhantom).toBe(true);

    // Connect to Solana wallet
    const connection = await page.evaluate(() => window.phantom.solana.connect());
    expect(connection).toHaveProperty('publicKey');

    console.log('✅ Solana connection successful:', connection.publicKey.toString());
  });

  test('should support multi-chain wallet', async ({ page }) => {
    const testSolanaKey = new Uint8Array(32).fill(1); // Simple test key

    await installMockWallet(page, {
      accounts: [
        { privateKey: TEST_EVM_KEY, type: 'evm' },
        { privateKey: testSolanaKey, type: 'solana' }
      ],
      autoConnect: true,
      debug: true
    });

    await page.goto('data:text/html,<html><body><h1>Multi-chain Test</h1></body></html>');

    // Both providers should exist
    const hasEthereum = await page.evaluate(() => !!window.ethereum);
    const hasSolana = await page.evaluate(() => !!window.phantom?.solana);

    expect(hasEthereum).toBe(true);
    expect(hasSolana).toBe(true);

    // Both should be connected due to autoConnect
    const evmAccounts = await page.evaluate(() => window.ethereum.request({ method: 'eth_accounts' }));
    const solanaConnection = await page.evaluate(() => window.phantom.solana.connect());

    expect(evmAccounts).toHaveLength(1);
    expect(evmAccounts[0]).toBe(EXPECTED_ADDRESS);
    expect(solanaConnection).toHaveProperty('publicKey');

    console.log('✅ Multi-chain wallet working: EVM + Solana');
  });
});