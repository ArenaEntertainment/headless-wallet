import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '../packages/playwright/dist/index.js';

// Test private key from hardhat accounts
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Test Solana keypair
const TEST_SOLANA_KEYPAIR = new Uint8Array([150, 18, 232, 71, 19, 88, 173, 212, 93, 227, 95, 201, 208, 119, 27, 27, 245, 79, 54, 171, 84, 233, 119, 172, 239, 210, 13, 114, 170, 228, 78, 156, 62, 76, 36, 99, 206, 146, 119, 196, 167, 136, 71, 9, 222, 59, 121, 131, 46, 18, 184, 70, 143, 146, 22, 124, 117, 219, 17, 3, 13, 161, 209, 234]);

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' },
        { privateKey: TEST_SOLANA_KEYPAIR, type: 'solana' }
      ],
      autoConnect: false,
      debug: true
    });
  });

  test('should handle invalid method calls gracefully', async ({ page }) => {
    console.log('🧪 Testing invalid method calls...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Test invalid EVM method
    const invalidEvmResult = await page.evaluate(async () => {
      try {
        await window.ethereum.request({ method: 'invalid_method' });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message, code: error.code };
      }
    });

    expect(invalidEvmResult.success).toBe(false);
    expect(invalidEvmResult.error).toContain('Unsupported method');
    console.log('✅ Invalid EVM method properly rejected');

    // Test invalid Solana method
    const invalidSolanaResult = await page.evaluate(async () => {
      try {
        await window.phantom.solana.request({ method: 'invalid_solana_method' });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(invalidSolanaResult.success).toBe(false);
    console.log('✅ Invalid Solana method properly rejected');
  });

  test('should handle malformed parameters gracefully', async ({ page }) => {
    console.log('🧪 Testing malformed parameters...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Test personal_sign with invalid parameters
    const malformedPersonalSign = await page.evaluate(async () => {
      try {
        await window.ethereum.request({
          method: 'personal_sign',
          params: ['not_enough_params'] // Missing address parameter
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(malformedPersonalSign.success).toBe(false);
    console.log('✅ Malformed personal_sign parameters properly rejected');

    // Test chain switch with invalid chain ID
    const invalidChainSwitch = await page.evaluate(async () => {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: 'not_hex' }] // Invalid hex format
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(invalidChainSwitch.success).toBe(false);
    console.log('✅ Invalid chain ID format properly rejected');
  });

  test('should handle disconnected state properly', async ({ page }) => {
    console.log('🧪 Testing disconnected state handling...');

    await page.waitForFunction(() => window.phantom?.solana, { timeout: 5000 });

    // Test Solana operations before connection
    const beforeConnectionResult = await page.evaluate(async () => {
      try {
        const message = new TextEncoder().encode('Test message');
        await window.phantom.solana.signMessage(message);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(beforeConnectionResult.success).toBe(false);
    console.log('✅ Solana operations properly rejected when disconnected');

    // Connect and then disconnect
    await page.evaluate(async () => {
      await window.phantom.solana.connect();
      await window.phantom.solana.disconnect();
    });

    // Test operations after disconnect
    const afterDisconnectResult = await page.evaluate(async () => {
      try {
        const message = new TextEncoder().encode('Test message');
        await window.phantom.solana.signMessage(message);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(afterDisconnectResult.success).toBe(false);
    console.log('✅ Solana operations properly rejected after disconnect');
  });

  test('should handle concurrent requests properly', async ({ page }) => {
    console.log('🧪 Testing concurrent request handling...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect first
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Send multiple concurrent signing requests
    const concurrentResults = await page.evaluate(async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          window.ethereum.request({
            method: 'personal_sign',
            params: [`Message ${i}`, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
          }).catch(error => ({ error: error.message }))
        );
      }
      return await Promise.all(promises);
    });

    // All requests should succeed (no race conditions)
    const successCount = concurrentResults.filter(result => !result.error).length;
    expect(successCount).toBe(5);
    console.log('✅ All concurrent requests handled successfully');

    // Verify all signatures are different
    const signatures = concurrentResults.filter(result => !result.error);
    const uniqueSignatures = new Set(signatures);
    expect(uniqueSignatures.size).toBe(5);
    console.log('✅ All concurrent signatures are unique');
  });

  test('should handle large data payloads', async ({ page }) => {
    console.log('🧪 Testing large data payload handling...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test signing a very large message
    const largeMessageResult = await page.evaluate(async () => {
      try {
        const largeMessage = 'A'.repeat(10000); // 10KB message
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [largeMessage, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
        });
        return { success: true, signatureLength: signature.length };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(largeMessageResult.success).toBe(true);
    expect(largeMessageResult.signatureLength).toBe(132); // Standard ECDSA signature length
    console.log('✅ Large message signing handled successfully');
  });

  test('should handle rapid chain switching', async ({ page }) => {
    console.log('🧪 Testing rapid chain switching...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Rapidly switch between multiple chains
    const rapidSwitchResult = await page.evaluate(async () => {
      const chains = ['0x1', '0x89', '0xa', '0x38', '0x1']; // Ethereum, Polygon, Optimism, BSC, back to Ethereum
      const results = [];

      for (const chainId of chains) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }]
          });
          const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
          results.push({ success: true, expected: chainId, actual: currentChain });
        } catch (error) {
          results.push({ success: false, error: error.message, expected: chainId });
        }
      }

      return results;
    });

    // All switches should succeed
    const successCount = rapidSwitchResult.filter(result => result.success).length;
    expect(successCount).toBe(5);

    // Final chain should be Ethereum
    const finalResult = rapidSwitchResult[rapidSwitchResult.length - 1];
    expect(finalResult.actual).toBe('0x1');
    console.log('✅ Rapid chain switching handled successfully');
  });

  test('should handle invalid transaction data', async ({ page }) => {
    console.log('🧪 Testing invalid transaction data handling...');

    await page.waitForFunction(() => window.phantom?.solana, { timeout: 5000 });

    // Connect Solana wallet
    await page.evaluate(async () => {
      await window.phantom.solana.connect();
    });

    // Test signing invalid transaction
    const invalidTransactionResult = await page.evaluate(async () => {
      try {
        // Invalid transaction object
        const invalidTx = { invalid: 'transaction' };
        await window.phantom.solana.signTransaction(invalidTx);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(invalidTransactionResult.success).toBe(false);
    console.log('✅ Invalid Solana transaction properly rejected');
  });

  test('should handle memory pressure gracefully', async ({ page }) => {
    console.log('🧪 Testing memory pressure handling...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Create many event listeners to test memory management
    const memoryTestResult = await page.evaluate(async () => {
      let listenerCount = 0;
      const maxListeners = 100;

      try {
        for (let i = 0; i < maxListeners; i++) {
          const handler = () => { /* dummy handler */ };
          window.ethereum.on('accountsChanged', handler);
          listenerCount++;
        }

        // Clean up
        for (let i = 0; i < maxListeners; i++) {
          const handler = () => { /* dummy handler */ };
          window.ethereum.removeListener('accountsChanged', handler);
        }

        return { success: true, listenerCount };
      } catch (error) {
        return { success: false, error: error.message, listenerCount };
      }
    });

    expect(memoryTestResult.success).toBe(true);
    expect(memoryTestResult.listenerCount).toBe(100);
    console.log('✅ Memory pressure test completed successfully');
  });

  test('should handle unicode and special characters in messages', async ({ page }) => {
    console.log('🧪 Testing unicode and special character handling...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test signing message with unicode characters
    const unicodeResult = await page.evaluate(async () => {
      try {
        const unicodeMessage = '🚀 Hello 世界! Émoji tëst with spëcial châractërs: ñoñó 🔥';
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [unicodeMessage, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
        });
        return { success: true, signature, messageLength: unicodeMessage.length };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(unicodeResult.success).toBe(true);
    expect(unicodeResult.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    console.log('✅ Unicode message signing handled successfully');
  });

  test('should handle null and undefined parameters', async ({ page }) => {
    console.log('🧪 Testing null and undefined parameter handling...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Test with null parameters
    const nullParamsResult = await page.evaluate(async () => {
      try {
        await window.ethereum.request({
          method: 'personal_sign',
          params: null
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(nullParamsResult.success).toBe(false);
    console.log('✅ Null parameters properly rejected');

    // Test with undefined parameters
    const undefinedParamsResult = await page.evaluate(async () => {
      try {
        await window.ethereum.request({
          method: 'personal_sign',
          params: undefined
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(undefinedParamsResult.success).toBe(false);
    console.log('✅ Undefined parameters properly rejected');
  });
});
