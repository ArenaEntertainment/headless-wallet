import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

test('Solana private keys should generate different addresses', async ({ page }) => {
  await page.goto('data:text/html,<html><body>Test</body></html>');

  // Generate two random keypairs
  const keypair1 = Keypair.generate();
  const keypair2 = Keypair.generate();

  const privateKey1 = bs58.encode(keypair1.secretKey);
  const privateKey2 = bs58.encode(keypair2.secretKey);

  const expectedAddress1 = keypair1.publicKey.toBase58();
  const expectedAddress2 = keypair2.publicKey.toBase58();

  console.log('Generated keys:');
  console.log('Key 1:', privateKey1);
  console.log('Expected Address 1:', expectedAddress1);
  console.log('Key 2:', privateKey2);
  console.log('Expected Address 2:', expectedAddress2);

  // Test first key
  await installHeadlessWallet(page, {
    accounts: [
      { privateKey: privateKey1, type: 'solana' }
    ],
    autoConnect: false
  });

  const result1 = await page.evaluate(async () => {
    if (!window.phantom?.solana) {
      throw new Error('Solana provider not found');
    }
    const { publicKey } = await window.phantom.solana.connect();
    return publicKey.toBase58();
  });

  console.log('Actual Address 1:', result1);
  expect(result1).toBe(expectedAddress1);

  // Test second key (need to reload page to reset wallet)
  await page.reload();

  await installHeadlessWallet(page, {
    accounts: [
      { privateKey: privateKey2, type: 'solana' }
    ],
    autoConnect: false
  });

  const result2 = await page.evaluate(async () => {
    if (!window.phantom?.solana) {
      throw new Error('Solana provider not found');
    }
    const { publicKey } = await window.phantom.solana.connect();
    return publicKey.toBase58();
  });

  console.log('Actual Address 2:', result2);
  expect(result2).toBe(expectedAddress2);

  // Verify addresses are different
  expect(result1).not.toBe(result2);
});