import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';
import { sepolia } from 'viem/chains';

// Test private key (Hardhat test account #0)
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

test.describe('Automatic Testnet Configuration', () => {
  test('should auto-configure testnet chains when no chains specified', async ({ page }) => {
    console.log('🔧 Testing automatic testnet configuration (ALL testnets)');

    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ],
      // No evm config - should auto-configure testnets
      debug: true
    });

    await page.goto('data:text/html,<html><body>Auto Testnet Config Test</body></html>');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Should start with Sepolia (default testnet)
      const initialChainId = await ethereum.request({ method: 'eth_chainId' });

      // Test switching to other auto-configured testnets
      const testnetResults = [];

      // Test switching to Polygon Mumbai (80001)
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13881' }] // 80001 = 0x13881
        });
        await new Promise(resolve => setTimeout(resolve, 100));

        const polygonChainId = await ethereum.request({ method: 'eth_chainId' });
        testnetResults.push({ name: 'Polygon Mumbai', chainId: polygonChainId, expected: '0x13881' });
      } catch (error) {
        testnetResults.push({ name: 'Polygon Mumbai', error: error.message });
      }

      // Test switching to Arbitrum Sepolia (421614)
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x66eee' }] // 421614 = 0x66eee
        });
        await new Promise(resolve => setTimeout(resolve, 100));

        const arbitrumChainId = await ethereum.request({ method: 'eth_chainId' });
        testnetResults.push({ name: 'Arbitrum Sepolia', chainId: arbitrumChainId, expected: '0x66eee' });
      } catch (error) {
        testnetResults.push({ name: 'Arbitrum Sepolia', error: error.message });
      }

      // Test switching to Base Sepolia (84532)
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x14a34' }] // 84532 = 0x14a34
        });
        await new Promise(resolve => setTimeout(resolve, 100));

        const baseChainId = await ethereum.request({ method: 'eth_chainId' });
        testnetResults.push({ name: 'Base Sepolia', chainId: baseChainId, expected: '0x14a34' });
      } catch (error) {
        testnetResults.push({ name: 'Base Sepolia', error: error.message });
      }

      return {
        initialChainId,
        testnetResults
      };
    });

    console.log('Initial chain ID (should be Sepolia):', result.initialChainId);
    console.log('Testnet switching results:', result.testnetResults);

    // Should start with Sepolia
    expect(result.initialChainId).toBe('0xaa36a7'); // Sepolia

    // At least some testnets should be available for switching
    const successfulSwitches = result.testnetResults.filter(r => r.chainId && !r.error);
    console.log(`Successfully switched to ${successfulSwitches.length}/${result.testnetResults.length} auto-configured testnets`);

    // Should be able to switch to at least 2 other testnets (out of 200+ available)
    expect(successfulSwitches.length).toBeGreaterThanOrEqual(2);

    // Verify chain IDs match expected values
    successfulSwitches.forEach(testnet => {
      expect(testnet.chainId).toBe(testnet.expected);
    });

    await uninstallHeadlessWallet(page, walletId);
  });

  test('should respect explicit chains configuration over auto-testnets', async ({ page }) => {
    console.log('🎯 Testing explicit chains override auto-testnets');

    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ],
      evm: {
        // Explicit chains should override auto-testnets
        chains: [sepolia] // Only Sepolia, no other testnets
      },
      debug: true
    });

    await page.goto('data:text/html,<html><body>Explicit Chains Test</body></html>');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      const initialChainId = await ethereum.request({ method: 'eth_chainId' });

      // Try to switch to Polygon Mumbai - should fail since it's not in explicit chains
      let polygonSwitchFailed = false;
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13881' }] // Polygon Mumbai
        });
      } catch (error) {
        polygonSwitchFailed = true;
      }

      return {
        initialChainId,
        polygonSwitchFailed
      };
    });

    console.log('Initial chain (explicit):', result.initialChainId);
    console.log('Polygon switch failed (expected):', result.polygonSwitchFailed);

    // Should still start with Sepolia
    expect(result.initialChainId).toBe('0xaa36a7');

    // Should not be able to switch to Polygon Mumbai since it's not in explicit chains
    expect(result.polygonSwitchFailed).toBe(true);

    await uninstallHeadlessWallet(page, walletId);
  });
});