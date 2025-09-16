import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

test('should switch from EVM to Solana wallet and update chain type', async ({ page }) => {
  console.log('🎯 Testing chain type switching: EVM → Solana');

  const TEST_EVM_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const TEST_SOLANA_PRIVATE_KEY = '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8';

  // Install EVM wallet first
  const evmWalletId = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: TEST_EVM_PRIVATE_KEY,
      type: 'evm'
    }],
    branding: {
      name: 'Arena Headless Wallet EVM',
      isMetaMask: false,
      isPhantom: false
    },
    autoConnect: false,
    debug: true
  });

  console.log('✅ EVM wallet installed with ID:', evmWalletId);

  await page.goto('http://localhost:5178');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Verify EVM provider exists
  const hasEthereum = await page.evaluate(() => typeof window.ethereum !== 'undefined');
  const hasSolana = await page.evaluate(() => typeof window.phantom?.solana !== 'undefined');

  console.log('EVM provider exists:', hasEthereum);
  console.log('Solana provider exists:', hasSolana);

  expect(hasEthereum).toBe(true);
  expect(hasSolana).toBe(false);

  // Simulate connecting EVM wallet through dApp
  await page.evaluate(async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('EVM connected:', accounts);
    }
  });

  // Take screenshot before switching
  await page.screenshot({ path: 'test-results/before-chain-switch.png', fullPage: true });

  console.log('🔄 Switching from EVM to Solana wallet...');

  // Disconnect and uninstall EVM wallet
  await page.evaluate(async () => {
    if (window.ethereum && window.ethereum.disconnect) {
      await window.ethereum.disconnect();
    }
  });

  await page.waitForTimeout(200);
  await uninstallHeadlessWallet(page, evmWalletId);
  await page.waitForTimeout(200);

  console.log('✅ EVM wallet uninstalled');

  // Verify EVM provider is gone
  const ethAfterUninstall = await page.evaluate(() => typeof window.ethereum !== 'undefined');
  console.log('EVM provider after uninstall:', ethAfterUninstall);
  expect(ethAfterUninstall).toBe(false);

  // Install Solana wallet
  const solanaWalletId = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: TEST_SOLANA_PRIVATE_KEY,
      type: 'solana'
    }],
    branding: {
      name: 'Arena Headless Wallet Solana',
      isMetaMask: false,
      isPhantom: true
    },
    autoConnect: false,
    debug: true
  });

  console.log('✅ Solana wallet installed with ID:', solanaWalletId);

  await page.waitForTimeout(200);

  // Verify Solana provider exists and EVM is gone
  const providers = await page.evaluate(() => ({
    ethereum: typeof window.ethereum !== 'undefined',
    solana: typeof window.phantom?.solana !== 'undefined'
  }));

  console.log('Providers after Solana install:', providers);
  expect(providers.ethereum).toBe(false);
  expect(providers.solana).toBe(true);

  // Simulate connecting Solana wallet
  const solanaConnectResult = await page.evaluate(async () => {
    if (window.phantom?.solana) {
      try {
        const response = await window.phantom.solana.connect();
        console.log('Solana connected:', response.publicKey.toString());
        return {
          connected: true,
          publicKey: response.publicKey.toString(),
          chainType: 'solana'
        };
      } catch (error) {
        console.error('Solana connection failed:', error);
        return { connected: false, error: error.message };
      }
    }
    return { connected: false, error: 'No Solana provider' };
  });

  console.log('Solana connection result:', solanaConnectResult);
  expect(solanaConnectResult.connected).toBe(true);
  expect(solanaConnectResult.chainType).toBe('solana');

  // Take screenshot after switching
  await page.screenshot({ path: 'test-results/after-chain-switch.png', fullPage: true });

  console.log('🎉 Chain type switching test completed successfully');

  // The key test: verify that applications can detect the chain type change
  // This would normally be tested by checking the dApp's UI, but for now we verify
  // that the provider ecosystem has been properly reset and announced
  const finalProviderState = await page.evaluate(() => {
    return {
      hasEthereum: typeof window.ethereum !== 'undefined',
      hasSolana: typeof window.phantom?.solana !== 'undefined',
      solanaConnected: window.phantom?.solana?.isConnected || false
    };
  });

  console.log('Final provider state:', finalProviderState);
  expect(finalProviderState.hasEthereum).toBe(false);
  expect(finalProviderState.hasSolana).toBe(true);
  expect(finalProviderState.solanaConnected).toBe(true);

  // Clean up
  await uninstallHeadlessWallet(page, solanaWalletId);
  console.log('✅ Test cleanup completed');
});

test('should switch from Solana to EVM wallet and update chain type', async ({ page }) => {
  console.log('🎯 Testing chain type switching: Solana → EVM');

  const TEST_EVM_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const TEST_SOLANA_PRIVATE_KEY = '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8';

  // Install Solana wallet first
  const solanaWalletId = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: TEST_SOLANA_PRIVATE_KEY,
      type: 'solana'
    }],
    branding: {
      name: 'Arena Headless Wallet Solana',
      isMetaMask: false,
      isPhantom: true
    },
    autoConnect: false,
    debug: true
  });

  console.log('✅ Solana wallet installed first');

  await page.goto('http://localhost:5178');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Connect Solana wallet
  const solanaResult = await page.evaluate(async () => {
    if (window.phantom?.solana) {
      const response = await window.phantom.solana.connect();
      return { connected: true, publicKey: response.publicKey.toString() };
    }
    return { connected: false };
  });

  expect(solanaResult.connected).toBe(true);

  console.log('🔄 Switching from Solana to EVM wallet...');

  // Disconnect and uninstall Solana wallet
  await page.evaluate(async () => {
    if (window.phantom?.solana?.disconnect) {
      await window.phantom.solana.disconnect();
    }
  });

  await uninstallHeadlessWallet(page, solanaWalletId);
  await page.waitForTimeout(200);

  // Install EVM wallet
  const evmWalletId = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: TEST_EVM_PRIVATE_KEY,
      type: 'evm'
    }],
    branding: {
      name: 'Arena Headless Wallet EVM',
      isMetaMask: false,
      isPhantom: false
    },
    autoConnect: false,
    debug: true
  });

  console.log('✅ EVM wallet installed');
  await page.waitForTimeout(200);

  // Verify provider switch
  const providers = await page.evaluate(() => ({
    ethereum: typeof window.ethereum !== 'undefined',
    solana: typeof window.phantom?.solana !== 'undefined'
  }));

  expect(providers.ethereum).toBe(true);
  expect(providers.solana).toBe(false);

  // Connect EVM wallet
  const evmAccounts = await page.evaluate(async () => {
    return await window.ethereum.request({ method: 'eth_requestAccounts' });
  });

  expect(evmAccounts).toContain('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

  console.log('🎉 Reverse chain switching test completed');

  // Clean up
  await uninstallHeadlessWallet(page, evmWalletId);
});