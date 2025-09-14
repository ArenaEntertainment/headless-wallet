import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';
import { recoverAddress } from 'viem';

test.describe('Ethers v6 Signature Compatibility', () => {
  test('should handle hex-encoded messages from ethers v6', async ({ page }) => {
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

    await installHeadlessWallet(page, {
      accounts: [{
        privateKey,
        type: 'evm'
      }],
      autoConnect: false
    });

    await page.goto('http://localhost:5175/');

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test 1: Plain text message (how most dApps send it)
    const plainTextTest = await page.evaluate(async () => {
      const message = 'Hi there! Test message';
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, accounts[0]]
      });
      return { message, signature, address: accounts[0] };
    });

    // Verify plain text signature
    const recoveredPlain = await recoverAddress({
      message: plainTextTest.message,
      signature: plainTextTest.signature
    });
    expect(recoveredPlain.toLowerCase()).toBe(address.toLowerCase());

    // Test 2: Hex-encoded message (how ethers v6 BrowserProvider sends it)
    const hexEncodedTest = await page.evaluate(async () => {
      const plainMessage = 'Hi there! Test message';
      // Convert to hex like ethers v6 does
      const encoder = new TextEncoder();
      const bytes = encoder.encode(plainMessage);
      const hexMessage = '0x' + Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [hexMessage, accounts[0]]
      });
      return {
        plainMessage,
        hexMessage,
        signature,
        address: accounts[0]
      };
    });

    // The signature should be for the original plain message, not the hex string
    // This is what ethers v6 expects
    const recoveredHex = await recoverAddress({
      message: hexEncodedTest.plainMessage,
      signature: hexEncodedTest.signature
    });
    expect(recoveredHex.toLowerCase()).toBe(address.toLowerCase());

    // Test 3: Verify ethers v6 behavior with hex that looks like text
    const ambiguousTest = await page.evaluate(async () => {
      // This is a valid hex string that could be interpreted as text
      const hexMessage = '0x48656c6c6f'; // "Hello" in hex

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [hexMessage, accounts[0]]
      });
      return {
        hexMessage,
        signature,
        address: accounts[0]
      };
    });

    // Should sign the decoded bytes, not the hex string
    const recoveredAmbiguous = await recoverAddress({
      message: 'Hello',
      signature: ambiguousTest.signature
    });
    expect(recoveredAmbiguous.toLowerCase()).toBe(address.toLowerCase());
  });

  test('should handle both string and hex messages correctly', async ({ page }) => {
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

    await installHeadlessWallet(page, {
      accounts: [{
        privateKey,
        type: 'evm'
      }],
      autoConnect: false
    });

    await page.goto('http://localhost:5175/');

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test mixed scenarios
    const testCases = [
      { input: 'Regular text message', type: 'plain' },
      { input: '0x0123456789abcdef', type: 'hex' },
      { input: 'Message with 0x prefix but not hex', type: 'plain' },
      { input: '0xGGGG', type: 'plain' }, // Invalid hex
      { input: '0x', type: 'hex' }, // Empty hex
    ];

    for (const testCase of testCases) {
      const result = await page.evaluate(async ({ input }) => {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [input, accounts[0]]
        });
        return { signature, address: accounts[0] };
      }, testCase);

      // Determine expected message for verification
      let expectedMessage = testCase.input;
      if (testCase.type === 'hex' && testCase.input.startsWith('0x')) {
        try {
          // If it's valid hex, decode it
          const hexRegex = /^0x[0-9a-fA-F]*$/;
          if (hexRegex.test(testCase.input)) {
            const hex = testCase.input.slice(2);
            if (hex.length % 2 === 0) {
              const bytes = hex.match(/.{2}/g) || [];
              expectedMessage = String.fromCharCode(...bytes.map(b => parseInt(b, 16)));
            }
          }
        } catch {
          // If decode fails, treat as plain text
        }
      }

      // Verify signature
      const recovered = await recoverAddress({
        message: expectedMessage,
        signature: result.signature
      });
      expect(recovered.toLowerCase()).toBe(address.toLowerCase());
    }
  });
});