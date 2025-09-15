import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

// Test private key (Hardhat test account #0)
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const EXPECTED_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

test.describe('New EVM Methods', () => {
  test('should get gas price', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ]
    });

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Call eth_gasPrice
      const gasPrice = await ethereum.request({
        method: 'eth_gasPrice'
      });

      return { gasPrice };
    });

    // Gas price should be a hex string
    expect(typeof result.gasPrice).toBe('string');
    expect(result.gasPrice).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  test('should estimate gas for transaction', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ]
    });

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Connect wallet
      await ethereum.request({ method: 'eth_requestAccounts' });

      // Estimate gas for a simple transfer
      const gasEstimate = await ethereum.request({
        method: 'eth_estimateGas',
        params: [{
          from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          value: '0x1000000000000000' // 0.001 ETH
        }]
      });

      return { gasEstimate };
    });

    // Gas estimate should be a hex string
    expect(typeof result.gasEstimate).toBe('string');
    expect(result.gasEstimate).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  test('should get contract code', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ]
    });

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Get code for an EOA (should return 0x)
      const code = await ethereum.request({
        method: 'eth_getCode',
        params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest']
      });

      return { code };
    });

    // EOA should have no code (0x)
    expect(result.code).toBe('0x');
  });

  test('should get transaction receipt (null for non-existent)', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ]
    });

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Try to get receipt for a non-existent transaction
      const receipt = await ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: ['0x0000000000000000000000000000000000000000000000000000000000000000']
      });

      return { receipt };
    });

    // Should return null for non-existent transaction
    expect(result.receipt).toBeNull();
  });

  test('should get logs with filter', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ]
    });

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Get logs (will be empty for test network)
      const logs = await ethereum.request({
        method: 'eth_getLogs',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          address: '0x0000000000000000000000000000000000000000'
        }]
      });

      return { logs };
    });

    // Should return an array (empty for test)
    expect(Array.isArray(result.logs)).toBe(true);
  });

  test('should watch asset (ERC20 token)', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ]
    });

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Request to watch a token
      const success = await ethereum.request({
        method: 'wallet_watchAsset',
        params: [{
          type: 'ERC20',
          options: {
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
            symbol: 'DAI',
            decimals: 18,
            image: 'https://example.com/dai-logo.png'
          }
        }]
      });

      return { success };
    });

    // Should return true for successful addition
    expect(result.success).toBe(true);
  });

  test('should reject invalid asset type', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ]
    });

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      try {
        // Try to watch an invalid asset type
        await ethereum.request({
          method: 'wallet_watchAsset',
          params: [{
            type: 'ERC721', // Only ERC20 is supported
            options: {
              address: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
            }
          }]
        });
        return { error: null };
      } catch (error) {
        return { error: error.message };
      }
    });

    // Should reject with error
    expect(result.error).toContain('Asset type must be ERC20');
  });

  test('should validate required asset parameters', async ({ page }) => {
    await page.goto('data:text/html,<html><body>Test</body></html>');

    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ]
    });

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      const errors = [];

      // Test missing address
      try {
        await ethereum.request({
          method: 'wallet_watchAsset',
          params: [{
            type: 'ERC20',
            options: {
              symbol: 'TEST',
              decimals: 18
            }
          }]
        });
      } catch (error) {
        errors.push(error.message);
      }

      // Test missing symbol
      try {
        await ethereum.request({
          method: 'wallet_watchAsset',
          params: [{
            type: 'ERC20',
            options: {
              address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              decimals: 18
            }
          }]
        });
      } catch (error) {
        errors.push(error.message);
      }

      // Test missing decimals
      try {
        await ethereum.request({
          method: 'wallet_watchAsset',
          params: [{
            type: 'ERC20',
            options: {
              address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              symbol: 'TEST'
            }
          }]
        });
      } catch (error) {
        errors.push(error.message);
      }

      return { errors };
    });

    // Should have validation errors
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]).toContain('Token address is required');
    expect(result.errors[1]).toContain('Token symbol is required');
    expect(result.errors[2]).toContain('Token decimals is required');
  });
});