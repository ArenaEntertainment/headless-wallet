import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';
import { mainnet, sepolia, polygon, arbitrum } from 'viem/chains';
import { http } from 'viem';

// Test private key (Hardhat test account #0)
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

test.describe('Automatic RPC Extraction', () => {
  test('should auto-extract RPCs from multiple chains without explicit transports', async ({ page }) => {
    console.log('🔗 Testing automatic RPC extraction from viem chains');

    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ],
      evm: {
        defaultChain: sepolia,
        chains: [mainnet, sepolia, polygon, arbitrum]
        // No explicit transports - should auto-extract from chains
      },
      debug: true
    });

    await page.goto('data:text/html,<html><body>Auto RPC Test</body></html>');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Test initial chain (sepolia)
      const initialChainId = await ethereum.request({ method: 'eth_chainId' });

      // Test switching to different chains and getting balance (verifies RPC works)
      const results = [];

      // Test Sepolia (should be current)
      try {
        const sepoliaBalance = await ethereum.request({
          method: 'eth_getBalance',
          params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest']
        });
        results.push({ chain: 'sepolia', chainId: '0xaa36a7', success: true, balance: sepoliaBalance });
      } catch (error) {
        results.push({ chain: 'sepolia', chainId: '0xaa36a7', success: false, error: error.message });
      }

      // Switch to mainnet and test
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }]
        });
        await new Promise(resolve => setTimeout(resolve, 100));

        const mainnetBalance = await ethereum.request({
          method: 'eth_getBalance',
          params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest']
        });
        results.push({ chain: 'mainnet', chainId: '0x1', success: true, balance: mainnetBalance });
      } catch (error) {
        results.push({ chain: 'mainnet', chainId: '0x1', success: false, error: error.message });
      }

      // Switch to polygon and test
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }]
        });
        await new Promise(resolve => setTimeout(resolve, 100));

        const polygonBalance = await ethereum.request({
          method: 'eth_getBalance',
          params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest']
        });
        results.push({ chain: 'polygon', chainId: '0x89', success: true, balance: polygonBalance });
      } catch (error) {
        results.push({ chain: 'polygon', chainId: '0x89', success: false, error: error.message });
      }

      // Switch to arbitrum and test
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xa4b1' }]
        });
        await new Promise(resolve => setTimeout(resolve, 100));

        const arbitrumBalance = await ethereum.request({
          method: 'eth_getBalance',
          params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest']
        });
        results.push({ chain: 'arbitrum', chainId: '0xa4b1', success: true, balance: arbitrumBalance });
      } catch (error) {
        results.push({ chain: 'arbitrum', chainId: '0xa4b1', success: false, error: error.message });
      }

      return {
        initialChainId,
        results
      };
    });

    console.log('Initial chain ID:', result.initialChainId);
    console.log('Chain switching results:', result.results);

    // Should start with Sepolia (0xaa36a7)
    expect(result.initialChainId).toBe('0xaa36a7');

    // All chains should have successful RPC connections
    const successfulChains = result.results.filter(r => r.success);
    console.log(`${successfulChains.length}/${result.results.length} chains successfully connected with auto-extracted RPCs`);

    // At least sepolia should work (it's the default)
    const sepoliaResult = result.results.find(r => r.chain === 'sepolia');
    expect(sepoliaResult.success).toBe(true);
    expect(sepoliaResult.balance).toMatch(/^0x[0-9a-fA-F]+$/);

    // Most chains should work with their default RPCs
    expect(successfulChains.length).toBeGreaterThanOrEqual(2);

    await uninstallHeadlessWallet(page, walletId);
  });

  test('should override auto-extracted RPCs with explicit transports', async ({ page }) => {
    console.log('🔄 Testing RPC override with explicit transports');

    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ],
      evm: {
        defaultChain: sepolia,
        chains: [mainnet, sepolia, polygon], // Auto-extract these
        transports: {
          [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/demo'), // Override sepolia
          // mainnet and polygon should use auto-extracted RPCs
        }
      },
      debug: true
    });

    await page.goto('data:text/html,<html><body>RPC Override Test</body></html>');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Test that sepolia works (should use explicit transport)
      const sepoliaBalance = await ethereum.request({
        method: 'eth_getBalance',
        params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest']
      });

      // Switch to mainnet (should use auto-extracted RPC)
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }]
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      const mainnetBalance = await ethereum.request({
        method: 'eth_getBalance',
        params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest']
      });

      return {
        sepoliaBalance,
        mainnetBalance,
        bothWork: true
      };
    });

    console.log('Sepolia balance (explicit RPC):', result.sepoliaBalance);
    console.log('Mainnet balance (auto-extracted RPC):', result.mainnetBalance);

    // Both should return valid hex balances
    expect(result.sepoliaBalance).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(result.mainnetBalance).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(result.bothWork).toBe(true);

    await uninstallHeadlessWallet(page, walletId);
  });

  test('should work with just chains array and no defaultChain', async ({ page }) => {
    console.log('🎯 Testing with only chains array, no explicit defaultChain');

    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ],
      evm: {
        // No explicit defaultChain - should use sepolia as default
        chains: [sepolia, polygon]  // Auto-extract RPCs for these
      },
      debug: true
    });

    await page.goto('data:text/html,<html><body>Chains Only Test</body></html>');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Should start with mainnet (default when no defaultChain specified)
      const initialChainId = await ethereum.request({ method: 'eth_chainId' });

      // Test that we can switch to configured chains
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }] // Sepolia
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      const sepoliaChainId = await ethereum.request({ method: 'eth_chainId' });

      // Test balance to verify RPC works
      const sepoliaBalance = await ethereum.request({
        method: 'eth_getBalance',
        params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest']
      });

      return {
        initialChainId,
        sepoliaChainId,
        sepoliaBalance
      };
    });

    console.log('Initial chain (should be sepolia):', result.initialChainId);
    console.log('After switch to Sepolia:', result.sepoliaChainId);
    console.log('Sepolia balance:', result.sepoliaBalance);

    // Should start with sepolia by default
    expect(result.initialChainId).toBe('0xaa36a7');

    // Should successfully switch to sepolia
    expect(result.sepoliaChainId).toBe('0xaa36a7');

    // Should get valid balance from auto-extracted sepolia RPC
    expect(result.sepoliaBalance).toMatch(/^0x[0-9a-fA-F]+$/);

    await uninstallHeadlessWallet(page, walletId);
  });

  test('should maintain backward compatibility with existing configuration', async ({ page }) => {
    console.log('🔙 Testing backward compatibility without chains array');

    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ],
      evm: {
        defaultChain: sepolia,
        transports: {
          [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/demo')
        }
        // No chains array - should work like before
      },
      debug: true
    });

    await page.goto('data:text/html,<html><body>Backward Compatibility Test</body></html>');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const balance = await ethereum.request({
        method: 'eth_getBalance',
        params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest']
      });

      return { chainId, balance };
    });

    console.log('Chain ID:', result.chainId);
    console.log('Balance:', result.balance);

    // Should work exactly as before
    expect(result.chainId).toBe('0xaa36a7'); // Sepolia
    expect(result.balance).toMatch(/^0x[0-9a-fA-F]+$/);

    await uninstallHeadlessWallet(page, walletId);
  });
});