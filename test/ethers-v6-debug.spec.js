import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

test('debug ethers v6 hex message handling', async ({ page }) => {
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  await page.goto('http://localhost:5174/');

  await installHeadlessWallet(page, {
    accounts: [{
      privateKey,
      type: 'evm'
    }],
    autoConnect: false,
    debug: true
  });

  // Connect wallet
  await page.evaluate(async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  });

  // Test 1: Plain text message
  console.log('Testing plain text message...');
  const plainResult = await page.evaluate(async () => {
    const message = 'Hi there! Test message';
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    console.log('Accounts:', accounts);
    console.log('Signing message:', message);

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, accounts[0]]
      });
      console.log('Signature:', signature);
      return { success: true, signature, message };
    } catch (error) {
      console.error('Error signing:', error);
      return { success: false, error: error.message };
    }
  });

  console.log('Plain text result:', plainResult);
  expect(plainResult.success).toBe(true);
  expect(plainResult.signature).toBeTruthy();

  // Test 2: Hex-encoded message (like ethers v6)
  console.log('Testing hex-encoded message...');
  const hexResult = await page.evaluate(async () => {
    const plainMessage = 'Hi there! Test message';
    // Convert to hex like ethers v6 does
    const encoder = new TextEncoder();
    const bytes = encoder.encode(plainMessage);
    const hexMessage = '0x' + Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('Original message:', plainMessage);
    console.log('Hex message:', hexMessage);

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [hexMessage, accounts[0]]
      });
      console.log('Signature for hex:', signature);
      return { success: true, signature, hexMessage, plainMessage };
    } catch (error) {
      console.error('Error signing hex:', error);
      return { success: false, error: error.message };
    }
  });

  console.log('Hex result:', hexResult);
  expect(hexResult.success).toBe(true);
  expect(hexResult.signature).toBeTruthy();

  // Compare signatures - they should be the SAME after the fix
  // Hex message should be decoded and produce same signature as plain text
  console.log('Plain signature:', plainResult.signature);
  console.log('Hex signature:', hexResult.signature);

  // After fix, both should produce the same signature
  expect(hexResult.signature).toBe(plainResult.signature);
});
