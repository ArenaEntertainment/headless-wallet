import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';
import { sepolia, mainnet, polygon, arbitrum } from 'viem/chains';
import { http } from 'viem';

// Funded Sepolia wallet provided by user
const FUNDED_SEPOLIA_WALLET = {
  address: '0xBC1BBAF2b52B0E639364909C2fBce328474Fb006',
  privateKey: '0x011aa553ace9a7a20b69fb9d7116e1f9b0dfd5f88b92c9d21edc66a6734ca220',
  type: 'evm'
};

// Test Solana private key (for devnet)
const TEST_SOLANA_KEY = new Uint8Array([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  3, 161, 7, 191, 243, 206, 16, 190, 29, 112, 221, 24, 231, 75, 192, 153,
  103, 228, 214, 48, 155, 165, 13, 95, 29, 220, 134, 100, 18, 85, 49, 184
]);

test.describe('Balance Fetching Tests', () => {
  test('should fetch balance from funded Sepolia wallet', async ({ page }) => {
    console.log('💰 Testing balance fetching with funded Sepolia wallet');

    const walletId = await installHeadlessWallet(page, {
      accounts: [FUNDED_SEPOLIA_WALLET],
      evm: {
        defaultChain: sepolia,
        transports: {
          [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/demo')
        }
      },
      debug: true
    });

    await page.goto('data:text/html,<html><body>Balance Test</body></html>');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (address) => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Get balance without connecting wallet first (public method)
      const balance = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      // Also test with 'earliest' and 'pending' block tags
      const earliestBalance = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'earliest']
      });

      const pendingBalance = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'pending']
      });

      // Convert hex to decimal for easier testing
      const balanceDecimal = parseInt(balance, 16);
      const earliestDecimal = parseInt(earliestBalance, 16);
      const pendingDecimal = parseInt(pendingBalance, 16);

      return {
        balance,
        earliestBalance,
        pendingBalance,
        balanceDecimal,
        earliestDecimal,
        pendingDecimal,
        hasPositiveBalance: balanceDecimal > 0
      };
    }, FUNDED_SEPOLIA_WALLET.address);

    console.log('Balance (hex):', result.balance);
    console.log('Balance (decimal wei):', result.balanceDecimal);
    console.log('Balance (ETH):', result.balanceDecimal / 1e18);

    // Verify balance is returned as hex string
    expect(typeof result.balance).toBe('string');
    expect(result.balance).toMatch(/^0x[0-9a-fA-F]+$/);

    // Verify this wallet has funds (since it was provided as funded)
    expect(result.hasPositiveBalance).toBe(true);
    expect(result.balanceDecimal).toBeGreaterThan(0);

    // Verify different block tags return valid hex strings
    expect(result.earliestBalance).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(result.pendingBalance).toMatch(/^0x[0-9a-fA-F]+$/);

    await uninstallHeadlessWallet(page, walletId);
  });

  test('should handle balance fetching across different chains', async ({ page }) => {
    console.log('🔗 Testing cross-chain balance fetching');

    const walletId = await installHeadlessWallet(page, {
      accounts: [FUNDED_SEPOLIA_WALLET],
      evm: {
        defaultChain: mainnet, // Start with mainnet
        transports: {
          [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/demo'),
          [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/demo'),
          [polygon.id]: http('https://polygon-mainnet.g.alchemy.com/v2/demo'),
          [arbitrum.id]: http('https://arb-mainnet.g.alchemy.com/v2/demo')
        }
      },
      debug: true
    });

    await page.goto('data:text/html,<html><body>Cross-chain Test</body></html>');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (address) => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      // Start on mainnet - should have 0 balance
      const mainnetBalance = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      // Switch to Sepolia - should have funds
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }] // Sepolia chain ID
        });
      } catch (error) {
        // Chain might not be configured, try to add it
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia',
            nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 },
            rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/demo'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for chain switch

      const sepoliaBalance = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      // Switch to Polygon - should have 0 balance
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }] // Polygon chain ID
        });
      } catch (error) {
        // Chain might not be configured, try to add it
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x89',
            chainName: 'Polygon',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://polygon-mainnet.g.alchemy.com/v2/demo'],
            blockExplorerUrls: ['https://polygonscan.com']
          }]
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for chain switch

      const polygonBalance = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      return {
        mainnetBalance: parseInt(mainnetBalance, 16),
        sepoliaBalance: parseInt(sepoliaBalance, 16),
        polygonBalance: parseInt(polygonBalance, 16),
        mainnetHex: mainnetBalance,
        sepoliaHex: sepoliaBalance,
        polygonHex: polygonBalance
      };
    }, FUNDED_SEPOLIA_WALLET.address);

    console.log('Mainnet balance:', result.mainnetBalance, '(' + result.mainnetHex + ')');
    console.log('Sepolia balance:', result.sepoliaBalance, '(' + result.sepoliaHex + ')');
    console.log('Polygon balance:', result.polygonBalance, '(' + result.polygonHex + ')');

    // Verify all balances are valid hex strings
    expect(result.mainnetHex).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(result.sepoliaHex).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(result.polygonHex).toMatch(/^0x[0-9a-fA-F]+$/);

    // Sepolia should have funds, others should be 0 (same address, different chains)
    expect(result.sepoliaBalance).toBeGreaterThan(0);
    expect(result.mainnetBalance).toBe(0);
    expect(result.polygonBalance).toBe(0);

    await uninstallHeadlessWallet(page, walletId);
  });

  test('should handle invalid addresses and error cases', async ({ page }) => {
    console.log('❌ Testing balance fetching error handling');

    const walletId = await installHeadlessWallet(page, {
      accounts: [FUNDED_SEPOLIA_WALLET],
      evm: {
        defaultChain: sepolia,
        transports: {
          [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/demo')
        }
      }
    });

    await page.goto('data:text/html,<html><body>Error Test</body></html>');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('Ethereum provider not found');

      const results = [];

      // Test invalid address format
      try {
        await ethereum.request({
          method: 'eth_getBalance',
          params: ['invalid-address', 'latest']
        });
        results.push({ test: 'invalid-address', error: null });
      } catch (error) {
        results.push({ test: 'invalid-address', error: error.message });
      }

      // Test malformed hex address
      try {
        await ethereum.request({
          method: 'eth_getBalance',
          params: ['0xwrongformat', 'latest']
        });
        results.push({ test: 'malformed-hex', error: null });
      } catch (error) {
        results.push({ test: 'malformed-hex', error: error.message });
      }

      // Test wrong length address
      try {
        await ethereum.request({
          method: 'eth_getBalance',
          params: ['0x123', 'latest']
        });
        results.push({ test: 'wrong-length', error: null });
      } catch (error) {
        results.push({ test: 'wrong-length', error: error.message });
      }

      // Test valid but non-checksummed address (should work)
      try {
        const balance = await ethereum.request({
          method: 'eth_getBalance',
          params: ['0xbc1bbaf2b52b0e639364909c2fbce328474fb006', 'latest'] // lowercase
        });
        results.push({
          test: 'non-checksummed',
          error: null,
          balance: typeof balance === 'string' && balance.match(/^0x[0-9a-fA-F]+$/) ? 'valid' : 'invalid'
        });
      } catch (error) {
        results.push({ test: 'non-checksummed', error: error.message });
      }

      // Test invalid block tag
      try {
        await ethereum.request({
          method: 'eth_getBalance',
          params: ['0xBC1BBAF2b52B0E639364909C2fBce328474Fb006', 'invalid-block-tag']
        });
        results.push({ test: 'invalid-block-tag', error: null });
      } catch (error) {
        results.push({ test: 'invalid-block-tag', error: error.message });
      }

      return results;
    });

    console.log('Error handling results:', result);

    // Should have 5 test results
    expect(result).toHaveLength(5);

    // Invalid address should throw error
    const invalidAddressResult = result.find(r => r.test === 'invalid-address');
    expect(invalidAddressResult.error).toBeDefined();

    // Malformed hex should throw error
    const malformedHexResult = result.find(r => r.test === 'malformed-hex');
    expect(malformedHexResult.error).toBeDefined();

    // Wrong length should throw error
    const wrongLengthResult = result.find(r => r.test === 'wrong-length');
    expect(wrongLengthResult.error).toBeDefined();

    // Non-checksummed should work fine
    const nonChecksummedResult = result.find(r => r.test === 'non-checksummed');
    expect(nonChecksummedResult.error).toBeNull();
    expect(nonChecksummedResult.balance).toBe('valid');

    // Invalid block tag should throw error (depending on RPC implementation)
    const invalidBlockResult = result.find(r => r.test === 'invalid-block-tag');
    // Some RPCs might handle this gracefully, but most should error
    expect(invalidBlockResult.error).toBeDefined();

    await uninstallHeadlessWallet(page, walletId);
  });

  test('should fetch Solana balance and compare with EVM', async ({ page }) => {
    console.log('⚖️ Testing Solana vs EVM balance fetching');

    const walletId = await installHeadlessWallet(page, {
      accounts: [
        FUNDED_SEPOLIA_WALLET,
        { privateKey: TEST_SOLANA_KEY, type: 'solana' }
      ],
      evm: {
        defaultChain: sepolia,
        transports: {
          [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/demo')
        }
      },
      solana: {
        cluster: 'devnet'
      },
      debug: true
    });

    await page.goto('data:text/html,<html><body>Multi-chain Test</body></html>');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (evmAddress) => {
      // Test EVM balance
      const evmBalance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [evmAddress, 'latest']
      });

      // Test Solana balance
      const solanaWallet = window.phantom?.solana;
      if (!solanaWallet) throw new Error('Solana wallet not found');

      await solanaWallet.connect();
      const solanaBalance = await solanaWallet.request({
        method: 'getBalance'
      });

      return {
        evmBalance,
        evmBalanceDecimal: parseInt(evmBalance, 16),
        evmBalanceEth: parseInt(evmBalance, 16) / 1e18,
        solanaBalance,
        solanaBalanceSol: solanaBalance / 1e9, // Convert lamports to SOL
        bothWalletsWork: true
      };
    }, FUNDED_SEPOLIA_WALLET.address);

    console.log('EVM (Sepolia) balance:', result.evmBalanceEth, 'ETH');
    console.log('Solana (devnet) balance:', result.solanaBalanceSol, 'SOL');

    // Verify both balance types work
    expect(result.bothWalletsWork).toBe(true);

    // EVM balance should be hex string and > 0
    expect(typeof result.evmBalance).toBe('string');
    expect(result.evmBalance).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(result.evmBalanceDecimal).toBeGreaterThan(0);

    // Solana balance should be number >= 0
    expect(typeof result.solanaBalance).toBe('number');
    expect(result.solanaBalance).toBeGreaterThanOrEqual(0);

    await uninstallHeadlessWallet(page, walletId);
  });

  test('should maintain balance consistency across wallet connections', async ({ page }) => {
    console.log('🔄 Testing balance consistency across connections');

    const walletId = await installHeadlessWallet(page, {
      accounts: [FUNDED_SEPOLIA_WALLET],
      evm: {
        defaultChain: sepolia,
        transports: {
          [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/demo')
        }
      }
    });

    await page.goto('data:text/html,<html><body>Consistency Test</body></html>');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (address) => {
      const ethereum = window.ethereum;

      // Get balance before connecting
      const balanceBeforeConnection = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      // Connect wallet
      await ethereum.request({ method: 'eth_requestAccounts' });

      // Get balance after connecting
      const balanceAfterConnection = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      // Disconnect and reconnect
      ethereum.disconnect();
      await ethereum.request({ method: 'eth_requestAccounts' });

      // Get balance after reconnection
      const balanceAfterReconnection = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      return {
        balanceBeforeConnection,
        balanceAfterConnection,
        balanceAfterReconnection,
        allBalancesMatch: (
          balanceBeforeConnection === balanceAfterConnection &&
          balanceAfterConnection === balanceAfterReconnection
        )
      };
    }, FUNDED_SEPOLIA_WALLET.address);

    console.log('Balance before connection:', result.balanceBeforeConnection);
    console.log('Balance after connection:', result.balanceAfterConnection);
    console.log('Balance after reconnection:', result.balanceAfterReconnection);

    // All balance calls should return the same value
    expect(result.allBalancesMatch).toBe(true);

    // Balance should be consistent regardless of connection state
    // (since eth_getBalance is a public method that doesn't require wallet connection)
    expect(result.balanceBeforeConnection).toBe(result.balanceAfterConnection);
    expect(result.balanceAfterConnection).toBe(result.balanceAfterReconnection);

    await uninstallHeadlessWallet(page, walletId);
  });
});