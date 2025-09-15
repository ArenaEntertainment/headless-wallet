import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

test('simple wallet reinstall test', async ({ page }) => {
  const firstWalletPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const firstWalletAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  const secondWalletPrivateKey = generatePrivateKey();
  const secondWalletAccount = privateKeyToAccount(secondWalletPrivateKey);
  const secondWalletAddress = secondWalletAccount.address;

  await page.goto('http://localhost:5175/');

  console.log('Installing first wallet...');
  const walletId1 = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: firstWalletPrivateKey,
      type: 'evm'
    }],
    branding: {
      name: 'First Test Wallet'
    },
    autoConnect: false,
    debug: true
  });

  // Check first wallet exists
  let hasEthereum = await page.evaluate(() => {
    console.log('Checking ethereum exists:', typeof window.ethereum);
    console.log('Providers map:', window.__headlessWalletProviders);
    console.log('Listeners map:', window.__headlessWalletListeners);
    return typeof window.ethereum !== 'undefined';
  });
  expect(hasEthereum).toBe(true);

  // Connect first wallet
  const accounts1 = await page.evaluate(async () => {
    return await window.ethereum.request({ method: 'eth_requestAccounts' });
  });
  expect(accounts1).toContain(firstWalletAddress);

  console.log('Uninstalling first wallet...');
  await uninstallHeadlessWallet(page, walletId1);

  // Wait for cleanup
  await page.waitForTimeout(100);

  // Check wallet removed
  hasEthereum = await page.evaluate(() => {
    console.log('After uninstall - ethereum exists:', typeof window.ethereum);
    console.log('After uninstall - Providers map:', window.__headlessWalletProviders);
    console.log('After uninstall - Listeners map:', window.__headlessWalletListeners);
    console.log('After uninstall - exposed function exists:', typeof window.__headlessWalletRequest);
    return typeof window.ethereum !== 'undefined';
  });
  expect(hasEthereum).toBe(false);

  console.log('Installing second wallet...');
  const walletId2 = await installHeadlessWallet(page, {
    accounts: [{
      privateKey: secondWalletPrivateKey,
      type: 'evm'
    }],
    branding: {
      name: 'Second Test Wallet'
    },
    autoConnect: false,
    debug: true
  });

  // Wait for installation
  await page.waitForTimeout(100);

  // Check second wallet exists
  hasEthereum = await page.evaluate(() => {
    console.log('After second install - ethereum exists:', typeof window.ethereum);
    console.log('After second install - Providers map:', window.__headlessWalletProviders);
    console.log('After second install - Listeners map:', window.__headlessWalletListeners);
    return typeof window.ethereum !== 'undefined';
  });
  expect(hasEthereum).toBe(true);

  // Connect second wallet
  const accounts2 = await page.evaluate(async () => {
    return await window.ethereum.request({ method: 'eth_requestAccounts' });
  });
  expect(accounts2).toContain(secondWalletAddress);
  expect(accounts2).not.toContain(firstWalletAddress);

  await uninstallHeadlessWallet(page, walletId2);
});