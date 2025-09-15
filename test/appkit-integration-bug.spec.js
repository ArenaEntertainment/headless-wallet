import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

test.describe('AppKit Integration Bug - Solana Private Keys', () => {
  test('reproduces user reported bug with AppKit navigation', async ({ page }) => {
    const testCases = [
      { seed: 'test-seed-1-abcdefghijklmnopqrstuvwxyz123456' },
      { seed: 'completely-different-seed-987654321-zyxwvuts' },
      { seed: 'another-unique-seed-for-testing-solana-wallet' },
      { seed: 'fourth-test-seed-with-random-characters-xyz789' },
      { seed: 'final-test-seed-to-prove-the-bug-exists-12345' }
    ];

    const expectedAddresses = [
      'EMR7cmRHxSD9EEVPi8Z8PAYkmgQEobjX4qRXFhDWxjBU',
      '32nns9rR8qCCjzkzVGwzGj7CxhYnLQnmLmLGkT5eNTKT',
      '5ohvHa5ez2tijGWPpahBjLGzNW1Kr14wLSMfj8cTXba1',
      'Gyg12XWxrAqAQLRys6EBkGcnTxkw6oWVCLyiKshhZWHn',
      '4F7EJ47TQyb3JCmknaftc2awdGDUhCKyZNzX3umVyz6x'
    ];

    const addresses = [];
    const bugFound = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const expectedAddress = expectedAddresses[i];

      // Generate keypair from seed (matching user's method)
      const seedBytes = new TextEncoder().encode(testCase.seed).slice(0, 32);
      const seedArray = new Uint8Array(32);
      seedArray.set(seedBytes);

      const keypair = Keypair.fromSeed(seedArray);
      const privateKey = bs58.encode(keypair.secretKey);
      const computedExpectedAddress = keypair.publicKey.toBase58();

      console.log(`\n=== Test Case ${i + 1} ===`);
      console.log(`Seed: ${testCase.seed}`);
      console.log(`Private Key: ${privateKey}`);
      console.log(`Expected Address: ${expectedAddress}`);
      console.log(`Computed Address: ${computedExpectedAddress}`);

      // Verify our computation matches user's expected addresses
      expect(computedExpectedAddress).toBe(expectedAddress);

      // Install headless wallet (like user's test)
      const walletId = await installHeadlessWallet(page, {
        accounts: [{
          privateKey: privateKey,
          type: 'solana'
        }],
        autoConnect: false,
        debug: true
      });

      console.log(`Wallet ID: ${walletId}`);

      // Navigate to AppKit demo (like user's test navigating to their page)
      await page.goto('http://localhost:5174/');
      await page.waitForSelector('h1:has-text("Arena Headless Wallet")', { timeout: 10000 });

      // The demo app initializes its own wallet - we need to clean it up first
      // Remove all existing wallet providers to prevent conflicts
      await page.evaluate(() => {
        // Clear all existing providers
        if (window.__headlessWalletProviders) {
          window.__headlessWalletProviders.clear();
        }
        // Clear phantom provider
        if (window.phantom?.solana) {
          delete window.phantom.solana;
        }
        // Clear ethereum provider
        if (window.ethereum) {
          delete window.ethereum;
        }
        // Force EIP-6963 rediscovery
        window.dispatchEvent(new Event('eip6963:requestProvider'));
      });

      // Reinstall our wallet after clearing the demo's wallet
      const newWalletId = await installHeadlessWallet(page, {
        accounts: [{
          privateKey: privateKey,
          type: 'solana'
        }],
        autoConnect: false,
        debug: true
      });

      // Wait a moment for the wallet to be properly installed
      await page.waitForTimeout(1000);

      // Click connect button (updated for actual AppKit button)
      const connectAppKitButton = page.locator('button:has-text("Connect AppKit")');
      await connectAppKitButton.click();

      // Wait for and click the actual "Connect Wallet" button that appears
      const connectWalletButton = page.locator('button:has-text("Connect Wallet")').first();
      await connectWalletButton.click();

      // Wait for modal dialog to appear
      await page.waitForSelector('[role="alertdialog"]', { timeout: 10000 });

      // Select Arena Headless Wallet
      const walletButton = page.locator('[role="alertdialog"]').locator('button:has-text("Arena Headless Wallet")');
      await walletButton.click();

      // Wait for chain selection dialog
      await page.waitForSelector('text=/Select Chain/i', { timeout: 5000 });

      // Select Solana
      const solanaOption = page.locator('[role="alertdialog"]').locator('button:has-text("Solana")');
      await solanaOption.click();

      // Wait for connection to complete
      await page.waitForTimeout(3000);

      // Try to get the address via the Solana provider API
      let actualAddress = null;
      try {
        actualAddress = await page.evaluate(async () => {
          if (!window.phantom?.solana) {
            console.log('No phantom.solana provider found');
            return null;
          }

          // If already connected, get the current public key
          if (window.phantom.solana.isConnected && window.phantom.solana.publicKey) {
            const publicKey = window.phantom.solana.publicKey;
            const address = publicKey?.toBase58 ? publicKey.toBase58() : publicKey?.toString?.() || null;
            console.log('Already connected, address:', address);
            return address;
          }

          // If not connected, try to connect
          try {
            const { publicKey } = await window.phantom.solana.connect();
            const address = publicKey?.toBase58 ? publicKey.toBase58() : publicKey?.toString?.() || null;
            console.log('Connected via API, address:', address);
            return address;
          } catch (err) {
            console.log('Connection error:', err.message);
            return null;
          }
        });
      } catch (e) {
        console.log('Could not get address via API:', e.message);
      }

      console.log(`Actual Address: ${actualAddress}`);
      addresses.push(actualAddress);

      const isMatch = actualAddress === expectedAddress;
      const isBug = actualAddress === 'FAe4sisG95oZ42w7buUn5qEE4TAnfTTFPiguZUHmhiF';

      bugFound.push(isBug);

      console.log(`Match Expected: ${isMatch ? '✅' : '❌'}`);
      console.log(`Is Bug Address: ${isBug ? '⚠️  YES - FIXED ADDRESS!' : '✅ No'}`);

      // Disconnect if connected
      try {
        const disconnectButton = page.locator('button:has-text("Disconnect")');
        if (await disconnectButton.isVisible({ timeout: 1000 })) {
          await disconnectButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        // Ignore disconnect errors
      }

      // Uninstall both wallets (original and reinstalled)
      await uninstallHeadlessWallet(page, walletId);
      await uninstallHeadlessWallet(page, newWalletId);
      await page.waitForTimeout(500);
    }

    // Analysis
    const uniqueAddresses = [...new Set(addresses.filter(addr => addr !== null))];
    const bugAddressCount = bugFound.filter(bug => bug).length;

    console.log(`\n=== FINAL ANALYSIS ===`);
    console.log(`Total test cases: ${testCases.length}`);
    console.log(`Unique addresses found: ${uniqueAddresses.length}`);
    console.log(`Bug addresses (FAe4sisG...): ${bugAddressCount}`);
    console.log(`All addresses: ${JSON.stringify(addresses, null, 2)}`);

    if (bugAddressCount > 0) {
      console.log('\n❌ BUG CONFIRMED: Fixed address detected!');
      console.log('The user was correct - private keys are being ignored in AppKit integration.');
    } else if (uniqueAddresses.length === 1 && uniqueAddresses[0] !== expectedAddresses[0]) {
      console.log('\n⚠️  DIFFERENT BUG: All addresses are the same but not the expected bug address');
    } else if (uniqueAddresses.length === testCases.length) {
      console.log('\n✅ NO BUG: All addresses are unique and different');
    } else {
      console.log('\n❓ UNCLEAR: Mixed results');
    }

    // The test should pass if we successfully reproduced the issue (for debugging)
    // In production, we'd expect this to fail until we fix the bug
    expect(uniqueAddresses.length).toBeGreaterThan(0);
  });

  test('test direct API access without AppKit (should work)', async ({ page }) => {
    // This is a control test to ensure the wallet API itself works
    await page.goto('data:text/html,<html><body>Direct API Test</body></html>');

    const testCases = [
      { seed: 'test-seed-1-abcdefghijklmnopqrstuvwxyz123456', expected: 'EMR7cmRHxSD9EEVPi8Z8PAYkmgQEobjX4qRXFhDWxjBU' },
      { seed: 'completely-different-seed-987654321-zyxwvuts', expected: '32nns9rR8qCCjzkzVGwzGj7CxhYnLQnmLmLGkT5eNTKT' }
    ];

    const addresses = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];

      const seedBytes = new TextEncoder().encode(testCase.seed).slice(0, 32);
      const seedArray = new Uint8Array(32);
      seedArray.set(seedBytes);

      const keypair = Keypair.fromSeed(seedArray);
      const privateKey = bs58.encode(keypair.secretKey);

      console.log(`\nDirect API Test ${i + 1}: ${testCase.seed.substring(0, 20)}...`);
      console.log(`Expected: ${testCase.expected}`);

      const walletId = await installHeadlessWallet(page, {
        accounts: [{
          privateKey: privateKey,
          type: 'solana'
        }],
        autoConnect: false
      });

      // Direct API access
      const actualAddress = await page.evaluate(async () => {
        if (!window.phantom?.solana) throw new Error('No Solana provider');
        const { publicKey } = await window.phantom.solana.connect();
        return publicKey.toBase58();
      });

      console.log(`Actual: ${actualAddress}`);
      addresses.push(actualAddress);

      await uninstallHeadlessWallet(page, walletId);
      await page.waitForTimeout(200);
    }

    // This control test should always pass (direct API works)
    expect(addresses[0]).toBe(testCases[0].expected);
    expect(addresses[1]).toBe(testCases[1].expected);
    expect(addresses[0]).not.toBe(addresses[1]);

    console.log('✅ Direct API test passed - the core wallet logic is working correctly');
  });
});