import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

test.describe('Comprehensive Solana Private Key Bug Investigation', () => {
  test('Test multiple random Solana keypairs with page reloads', async ({ page }) => {
    const testResults = [];

    // Test with 5 different randomly generated Solana keypairs
    for (let i = 0; i < 5; i++) {
      await page.goto('data:text/html,<html><body>Test ' + i + '</body></html>');

      const keypair = Keypair.generate(); // Completely random
      const privateKey = bs58.encode(keypair.secretKey);
      const expectedAddress = keypair.publicKey.toBase58();

      console.log(`=== Test Case ${i + 1} ===`);
      console.log(`Private Key: ${privateKey}`);
      console.log(`Expected Address: ${expectedAddress}`);

      await installHeadlessWallet(page, {
        accounts: [{
          privateKey: privateKey,
          type: 'solana'
        }],
        autoConnect: false
      });

      // Connect wallet and get actual address
      const actualAddress = await page.evaluate(async () => {
        if (!window.phantom?.solana) {
          throw new Error('Solana provider not found');
        }
        const { publicKey } = await window.phantom.solana.connect();
        return publicKey.toBase58();
      });

      console.log(`Actual Address: ${actualAddress}`);
      console.log(`Match: ${actualAddress === expectedAddress ? '✅' : '❌'}`);

      testResults.push({
        iteration: i + 1,
        privateKey: privateKey,
        expected: expectedAddress,
        actual: actualAddress,
        match: actualAddress === expectedAddress
      });
    }

    // Log complete results
    console.log('\n=== COMPLETE RESULTS ===');
    testResults.forEach(result => {
      console.log(`Test ${result.iteration}: ${result.match ? 'PASS' : 'FAIL'} - Expected: ${result.expected}, Actual: ${result.actual}`);
    });

    // Check if all addresses are unique and match expected
    const allMatched = testResults.every(r => r.match);
    const uniqueActualAddresses = [...new Set(testResults.map(r => r.actual))];
    const uniqueExpectedAddresses = [...new Set(testResults.map(r => r.expected))];

    console.log(`\nUnique actual addresses: ${uniqueActualAddresses.length}`);
    console.log(`Unique expected addresses: ${uniqueExpectedAddresses.length}`);
    console.log(`All matched: ${allMatched}`);

    if (!allMatched) {
      console.log('\n❌ BUG CONFIRMED: Private keys are being ignored!');
      console.log(`All actual addresses: ${JSON.stringify(testResults.map(r => r.actual), null, 2)}`);
    }

    expect(allMatched).toBe(true);
    expect(uniqueActualAddresses.length).toBe(5); // Should have 5 different addresses
  });

  test('Test with specific seeds like user reported', async ({ page }) => {
    const testSeeds = [
      'test-seed-1-abcdefghijklmnopqrstuvwxyz123456',
      'completely-different-seed-987654321-zyxwvuts',
      'another-unique-seed-for-testing-solana-wallet',
      'fourth-test-seed-with-random-characters-xyz789',
      'final-test-seed-to-prove-the-bug-exists-12345'
    ];

    const expectedAddresses = [
      'EMR7cmRHxSD9EEVPi8Z8PAYkmgQEobjX4qRXFhDWxjBU',
      '32nns9rR8qCCjzkzVGwzGj7CxhYnLQnmLmLGkT5eNTKT',
      '5ohvHa5ez2tijGWPpahBjLGzNW1Kr14wLSMfj8cTXba1',
      'Gyg12XWxrAqAQLRys6EBkGcnTxkw6oWVCLyiKshhZWHn',
      '4F7EJ47TQyb3JCmknaftc2awdGDUhCKyZNzX3umVyz6x'
    ];

    const testResults = [];

    for (let i = 0; i < testSeeds.length; i++) {
      await page.goto(`data:text/html,<html><body>Seed Test ${i}</body></html>`);

      // Create keypair from seed (matching user's method)
      const seedBytes = new TextEncoder().encode(testSeeds[i]).slice(0, 32);
      const seedArray = new Uint8Array(32);
      seedArray.set(seedBytes);

      const keypair = Keypair.fromSeed(seedArray);
      const privateKey = bs58.encode(keypair.secretKey);
      const expectedAddress = keypair.publicKey.toBase58();

      console.log(`=== Seed Test ${i + 1} ===`);
      console.log(`Seed: ${testSeeds[i]}`);
      console.log(`Expected from user: ${expectedAddresses[i]}`);
      console.log(`Expected from keypair: ${expectedAddress}`);

      await installHeadlessWallet(page, {
        accounts: [{
          privateKey: privateKey,
          type: 'solana'
        }],
        autoConnect: false
      });

      const actualAddress = await page.evaluate(async () => {
        if (!window.phantom?.solana) {
          throw new Error('Solana provider not found');
        }
        const { publicKey } = await window.phantom.solana.connect();
        return publicKey.toBase58();
      });

      console.log(`Actual Address: ${actualAddress}`);
      console.log(`Match with expected: ${actualAddress === expectedAddress ? '✅' : '❌'}`);

      testResults.push({
        seed: testSeeds[i],
        expected: expectedAddress,
        actual: actualAddress,
        match: actualAddress === expectedAddress
      });
    }

    console.log('\n=== SEED TEST RESULTS ===');
    testResults.forEach((result, i) => {
      console.log(`Seed Test ${i + 1}: ${result.match ? 'PASS' : 'FAIL'} - Expected: ${result.expected}, Actual: ${result.actual}`);
    });

    const allMatched = testResults.every(r => r.match);
    if (!allMatched) {
      console.log('\n❌ BUG CONFIRMED: Seed-based private keys are being ignored!');
    }

    expect(allMatched).toBe(true);
  });
});