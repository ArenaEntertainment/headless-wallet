import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';
import { mainnet, polygon, arbitrum } from 'viem/chains';
import { http } from 'viem';

test('should expose correct chain ID on connection - default mainnet', async ({ page }) => {
  console.log('🎯 Testing default mainnet chain ID exposure');

  const walletId = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      type: 'evm'
    }],
    debug: true
  });

  await page.goto('http://localhost:5178');
  await page.waitForLoadState('networkidle');

  // Test chain ID before connection
  const chainIdBeforeConnection = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_chainId' })
  );
  console.log('Chain ID before connection:', chainIdBeforeConnection);
  expect(chainIdBeforeConnection).toBe('0x1'); // Mainnet

  // Connect and verify chain ID is still correct
  const accounts = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_requestAccounts' })
  );

  const chainIdAfterConnection = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_chainId' })
  );
  console.log('Chain ID after connection:', chainIdAfterConnection);
  expect(chainIdAfterConnection).toBe('0x1'); // Should remain mainnet

  expect(accounts).toContain('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

  await uninstallHeadlessWallet(page, walletId);
});

test('should expose correct chain ID - polygon configuration', async ({ page }) => {
  console.log('🎯 Testing polygon chain ID exposure');

  const walletId = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      type: 'evm'
    }],
    evm: {
      defaultChain: polygon,
      transports: {
        [polygon.id]: http('https://polygon-mainnet.g.alchemy.com/v2/demo')
      }
    },
    debug: true
  });

  await page.goto('http://localhost:5178');
  await page.waitForLoadState('networkidle');

  // Verify polygon chain ID (0x89 = 137)
  const chainId = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_chainId' })
  );
  console.log('Polygon chain ID:', chainId);
  expect(chainId).toBe('0x89');

  // Connect and verify chain ID consistency
  await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_requestAccounts' })
  );

  const chainIdAfterConnection = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_chainId' })
  );
  expect(chainIdAfterConnection).toBe('0x89');

  await uninstallHeadlessWallet(page, walletId);
});

test('should expose correct chain ID - arbitrum configuration', async ({ page }) => {
  console.log('🎯 Testing arbitrum chain ID exposure');

  const walletId = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      type: 'evm'
    }],
    evm: {
      defaultChain: arbitrum,
      transports: {
        [arbitrum.id]: http('https://arb-mainnet.g.alchemy.com/v2/demo')
      }
    },
    debug: true
  });

  await page.goto('http://localhost:5178');
  await page.waitForLoadState('networkidle');

  // Verify arbitrum chain ID (0xa4b1 = 42161)
  const chainId = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_chainId' })
  );
  console.log('Arbitrum chain ID:', chainId);
  expect(chainId).toBe('0xa4b1');

  await uninstallHeadlessWallet(page, walletId);
});

test('should expose correct Solana cluster information', async ({ page }) => {
  console.log('🎯 Testing Solana cluster exposure');

  const walletId = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8',
      type: 'solana'
    }],
    solana: {
      cluster: 'mainnet-beta'
    },
    debug: true
  });

  await page.goto('http://localhost:5178');
  await page.waitForLoadState('networkidle');

  // Verify Solana cluster exposure
  const clusterInfo = await page.evaluate(async () => {
    if (!window.phantom?.solana) return null;

    // Connect first
    await window.phantom.solana.connect();

    return {
      cluster: window.phantom.solana.cluster,
      isConnected: window.phantom.solana.isConnected
    };
  });

  console.log('Solana cluster info:', clusterInfo);
  expect(clusterInfo).not.toBeNull();
  expect(clusterInfo.cluster).toBe('mainnet-beta');
  expect(clusterInfo.isConnected).toBe(true);

  await uninstallHeadlessWallet(page, walletId);
});

test('should expose correct Solana cluster - devnet configuration', async ({ page }) => {
  console.log('🎯 Testing Solana devnet cluster exposure');

  const walletId = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8',
      type: 'solana'
    }],
    solana: {
      cluster: 'devnet'  // Explicit devnet
    },
    debug: true
  });

  await page.goto('http://localhost:5178');
  await page.waitForLoadState('networkidle');

  const clusterInfo = await page.evaluate(async () => {
    if (!window.phantom?.solana) return null;

    await window.phantom.solana.connect();

    return {
      cluster: window.phantom.solana.cluster,
      isConnected: window.phantom.solana.isConnected
    };
  });

  console.log('Solana devnet cluster info:', clusterInfo);
  expect(clusterInfo.cluster).toBe('devnet');

  await uninstallHeadlessWallet(page, walletId);
});

test('should handle chain switching with correct chain ID updates', async ({ page }) => {
  console.log('🎯 Testing chain switching with chain ID updates');

  const walletId = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      type: 'evm'
    }],
    evm: {
      defaultChain: mainnet,
      transports: {
        [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/demo'),
        [polygon.id]: http('https://polygon-mainnet.g.alchemy.com/v2/demo')
      }
    },
    debug: true
  });

  await page.goto('http://localhost:5178');
  await page.waitForLoadState('networkidle');

  // Connect and verify initial chain (mainnet)
  await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_requestAccounts' })
  );

  const initialChainId = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_chainId' })
  );
  expect(initialChainId).toBe('0x1'); // Mainnet

  // Switch to polygon
  await page.evaluate(() =>
    window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x89' }]
    })
  );

  await page.waitForTimeout(100); // Wait for chain switch

  const newChainId = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_chainId' })
  );
  expect(newChainId).toBe('0x89'); // Polygon

  console.log('✅ Chain switching test passed:', { initial: initialChainId, switched: newChainId });

  await uninstallHeadlessWallet(page, walletId);
});

test('should maintain consistent chain ID across reconnections', async ({ page }) => {
  console.log('🎯 Testing chain ID consistency across reconnections');

  const walletId = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      type: 'evm'
    }],
    evm: {
      defaultChain: polygon,
      transports: {
        [polygon.id]: http('https://polygon-mainnet.g.alchemy.com/v2/demo')
      }
    },
    debug: true
  });

  await page.goto('http://localhost:5178');
  await page.waitForLoadState('networkidle');

  // Initial connection
  await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_requestAccounts' })
  );

  const chainId1 = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_chainId' })
  );

  // Disconnect
  await page.evaluate(() =>
    window.ethereum.disconnect()
  );

  await page.waitForTimeout(100);

  // Reconnect
  await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_requestAccounts' })
  );

  const chainId2 = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_chainId' })
  );

  console.log('Chain IDs across reconnection:', { first: chainId1, second: chainId2 });
  expect(chainId1).toBe('0x89'); // Polygon
  expect(chainId2).toBe('0x89'); // Should remain the same
  expect(chainId1).toBe(chainId2); // Consistency check

  await uninstallHeadlessWallet(page, walletId);
});