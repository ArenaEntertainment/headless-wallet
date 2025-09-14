import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '../packages/playwright/dist/index.js';

// Test private keys from hardhat accounts (multiple for stress testing)
const TEST_EVM_KEYS = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Account 0
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Account 1
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', // Account 2
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6', // Account 3
  '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a'  // Account 4
];

const EXPECTED_EVM_ADDRESSES = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
];

// Multiple Solana keypairs for stress testing
const TEST_SOLANA_KEYPAIRS = [
  new Uint8Array([150, 18, 232, 71, 19, 88, 173, 212, 93, 227, 95, 201, 208, 119, 27, 27, 245, 79, 54, 171, 84, 233, 119, 172, 239, 210, 13, 114, 170, 228, 78, 156, 62, 76, 36, 99, 206, 146, 119, 196, 167, 136, 71, 9, 222, 59, 121, 131, 46, 18, 184, 70, 143, 146, 22, 124, 117, 219, 17, 3, 13, 161, 209, 234]),
  new Uint8Array([168, 95, 144, 39, 235, 52, 70, 110, 242, 42, 254, 183, 60, 142, 186, 107, 7, 134, 190, 9, 29, 173, 106, 105, 5, 11, 86, 143, 230, 150, 192, 109, 191, 12, 85, 82, 112, 143, 161, 174, 223, 172, 113, 239, 42, 104, 20, 102, 238, 68, 227, 150, 166, 209, 11, 139, 132, 116, 43, 149, 161, 182, 73, 17]),
  new Uint8Array([180, 96, 20, 214, 229, 221, 30, 217, 229, 193, 146, 207, 154, 198, 19, 246, 90, 158, 250, 208, 191, 135, 251, 181, 193, 223, 90, 188, 77, 44, 49, 122, 50, 146, 127, 5, 75, 31, 200, 207, 222, 105, 138, 24, 203, 190, 46, 125, 143, 221, 72, 25, 142, 124, 141, 148, 237, 213, 54, 214, 94, 252, 198, 74])
];

test.describe('Performance and Stress Testing', () => {
  test.beforeEach(async ({ page }) => {
    await installHeadlessWallet(page, {
      accounts: [
        ...TEST_EVM_KEYS.map(key => ({ privateKey: key, type: 'evm' })),
        ...TEST_SOLANA_KEYPAIRS.map(key => ({ privateKey: key, type: 'solana' }))
      ],
      autoConnect: false,
      debug: false // Disable debug for performance tests
    });
  });

  test('should handle high-frequency signing requests', async ({ page }) => {
    console.log('🧪 Testing high-frequency signing performance...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Performance test: 100 rapid signing requests
    const performanceResult = await page.evaluate(async () => {
      const startTime = performance.now();
      const requestCount = 100;
      const results = [];

      for (let i = 0; i < requestCount; i++) {
        const requestStart = performance.now();

        try {
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [`High frequency test ${i}`, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
          });

          const requestEnd = performance.now();
          results.push({
            success: true,
            index: i,
            duration: requestEnd - requestStart,
            signature: signature.substring(0, 10) + '...'
          });
        } catch (error) {
          const requestEnd = performance.now();
          results.push({
            success: false,
            index: i,
            duration: requestEnd - requestStart,
            error: error.message
          });
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      return {
        totalTime,
        requestCount,
        results,
        successCount: results.filter(r => r.success).length,
        averageTime: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
        maxTime: Math.max(...results.map(r => r.duration)),
        minTime: Math.min(...results.map(r => r.duration))
      };
    });

    expect(performanceResult.successCount).toBe(performanceResult.requestCount);
    expect(performanceResult.totalTime).toBeLessThan(30000); // Should complete within 30 seconds
    expect(performanceResult.averageTime).toBeLessThan(1000); // Average request should be under 1 second

    console.log(`✅ Completed ${performanceResult.requestCount} signing requests`);
    console.log(`✅ Total time: ${performanceResult.totalTime.toFixed(2)}ms`);
    console.log(`✅ Average time per request: ${performanceResult.averageTime.toFixed(2)}ms`);
    console.log(`✅ Min/Max time: ${performanceResult.minTime.toFixed(2)}ms / ${performanceResult.maxTime.toFixed(2)}ms`);
  });

  test('should handle concurrent signing operations', async ({ page }) => {
    console.log('🧪 Testing concurrent signing performance...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Concurrent performance test: 50 simultaneous signing requests
    const concurrentResult = await page.evaluate(async () => {
      const startTime = performance.now();
      const concurrentCount = 50;

      const promises = [];
      for (let i = 0; i < concurrentCount; i++) {
        promises.push(
          window.ethereum.request({
            method: 'personal_sign',
            params: [`Concurrent test ${i}`, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
          }).then(signature => ({
            success: true,
            index: i,
            signature: signature.substring(0, 10) + '...'
          })).catch(error => ({
            success: false,
            index: i,
            error: error.message
          }))
        );
      }

      const results = await Promise.all(promises);
      const endTime = performance.now();

      return {
        totalTime: endTime - startTime,
        concurrentCount,
        results,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
      };
    });

    expect(concurrentResult.successCount).toBe(concurrentResult.concurrentCount);
    expect(concurrentResult.failureCount).toBe(0);
    expect(concurrentResult.totalTime).toBeLessThan(10000); // Should complete within 10 seconds

    console.log(`✅ Completed ${concurrentResult.concurrentCount} concurrent signing requests`);
    console.log(`✅ Total concurrent time: ${concurrentResult.totalTime.toFixed(2)}ms`);
    console.log(`✅ Success rate: ${concurrentResult.successCount}/${concurrentResult.concurrentCount}`);
  });

  test('should handle rapid chain switching performance', async ({ page }) => {
    console.log('🧪 Testing rapid chain switching performance...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Rapid chain switching test
    const chainSwitchingResult = await page.evaluate(async () => {
      const startTime = performance.now();
      const chains = ['0x1', '0x89', '0xa', '0x38', '0x1', '0x89', '0xa', '0x38']; // 8 chain switches
      const results = [];

      for (const chainId of chains) {
        const switchStart = performance.now();

        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }]
          });

          const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
          const switchEnd = performance.now();

          results.push({
            success: true,
            targetChain: chainId,
            actualChain: currentChain,
            duration: switchEnd - switchStart,
            correct: currentChain === chainId
          });
        } catch (error) {
          const switchEnd = performance.now();
          results.push({
            success: false,
            targetChain: chainId,
            duration: switchEnd - switchStart,
            error: error.message
          });
        }
      }

      const endTime = performance.now();

      return {
        totalTime: endTime - startTime,
        switchCount: chains.length,
        results,
        successCount: results.filter(r => r.success).length,
        correctCount: results.filter(r => r.success && r.correct).length,
        averageTime: results.reduce((sum, r) => sum + r.duration, 0) / results.length
      };
    });

    expect(chainSwitchingResult.successCount).toBe(chainSwitchingResult.switchCount);
    expect(chainSwitchingResult.correctCount).toBe(chainSwitchingResult.switchCount);
    expect(chainSwitchingResult.averageTime).toBeLessThan(500); // Average switch should be under 500ms

    console.log(`✅ Completed ${chainSwitchingResult.switchCount} chain switches`);
    console.log(`✅ Total switching time: ${chainSwitchingResult.totalTime.toFixed(2)}ms`);
    console.log(`✅ Average time per switch: ${chainSwitchingResult.averageTime.toFixed(2)}ms`);
  });

  test('should handle large message signing performance', async ({ page }) => {
    console.log('🧪 Testing large message signing performance...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test signing messages of various sizes
    const messageSizeTests = [
      { name: 'Small message', size: 100 },      // 100 bytes
      { name: 'Medium message', size: 1024 },    // 1KB
      { name: 'Large message', size: 10240 },    // 10KB
      { name: 'Very large message', size: 102400 } // 100KB
    ];

    const sizeResults = [];

    for (const testCase of messageSizeTests) {
      const result = await page.evaluate(async (test) => {
        const message = 'A'.repeat(test.size);
        const startTime = performance.now();

        try {
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
          });

          const endTime = performance.now();
          return {
            success: true,
            name: test.name,
            size: test.size,
            duration: endTime - startTime,
            signature: signature.substring(0, 10) + '...',
            throughput: test.size / ((endTime - startTime) / 1000) // bytes per second
          };
        } catch (error) {
          const endTime = performance.now();
          return {
            success: false,
            name: test.name,
            size: test.size,
            duration: endTime - startTime,
            error: error.message
          };
        }
      }, testCase);

      sizeResults.push(result);

      if (result.success) {
        expect(result.duration).toBeLessThan(5000); // Should complete within 5 seconds
        console.log(`✅ ${result.name} (${result.size} bytes): ${result.duration.toFixed(2)}ms`);
        console.log(`   Throughput: ${(result.throughput / 1024).toFixed(2)} KB/s`);
      } else {
        console.log(`❌ ${result.name} failed: ${result.error}`);
      }
    }

    const successfulTests = sizeResults.filter(r => r.success);
    expect(successfulTests.length).toBeGreaterThan(0);
    console.log(`✅ ${successfulTests.length}/${messageSizeTests.length} size tests passed`);
  });

  test('should handle complex EIP-712 signing performance', async ({ page }) => {
    console.log('🧪 Testing complex EIP-712 signing performance...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Performance test with complex EIP-712 structures
    const eip712PerformanceResult = await page.evaluate(async () => {
      const createComplexTypedData = (index) => ({
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ],
          ComplexOrder: [
            { name: 'id', type: 'uint256' },
            { name: 'trader', type: 'address' },
            { name: 'collection', type: 'address' },
            { name: 'tokenIds', type: 'uint256[]' },
            { name: 'amounts', type: 'uint256[]' },
            { name: 'strategy', type: 'address' },
            { name: 'currency', type: 'address' },
            { name: 'price', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'startTime', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'minPercentageToAsk', type: 'uint256' },
            { name: 'params', type: 'bytes' },
            { name: 'fees', type: 'Fee[]' },
            { name: 'signature', type: 'bytes' }
          ],
          Fee: [
            { name: 'percentage', type: 'uint256' },
            { name: 'to', type: 'address' }
          ]
        },
        primaryType: 'ComplexOrder',
        domain: {
          name: 'ComplexMarketplace',
          version: '1.0',
          chainId: 1,
          verifyingContract: '0x1234567890123456789012345678901234567890'
        },
        message: {
          id: index,
          trader: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          collection: '0x1234567890123456789012345678901234567890',
          tokenIds: [1, 2, 3, 4, 5],
          amounts: [1, 1, 1, 1, 1],
          strategy: '0x1234567890123456789012345678901234567890',
          currency: '0x0000000000000000000000000000000000000000',
          price: '1000000000000000000',
          nonce: index * 1000,
          startTime: Math.floor(Date.now() / 1000),
          endTime: Math.floor(Date.now() / 1000) + 86400,
          minPercentageToAsk: 8500,
          params: '0x',
          fees: [
            { percentage: 250, to: '0x1234567890123456789012345678901234567890' },
            { percentage: 250, to: '0x0987654321098765432109876543210987654321' }
          ],
          signature: '0x'
        }
      });

      const startTime = performance.now();
      const results = [];
      const testCount = 20; // 20 complex EIP-712 signatures

      for (let i = 0; i < testCount; i++) {
        const requestStart = performance.now();
        const typedData = createComplexTypedData(i);

        try {
          const signature = await window.ethereum.request({
            method: 'eth_signTypedData_v4',
            params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', JSON.stringify(typedData)]
          });

          const requestEnd = performance.now();
          results.push({
            success: true,
            index: i,
            duration: requestEnd - requestStart,
            signature: signature.substring(0, 10) + '...',
            dataSize: JSON.stringify(typedData).length
          });
        } catch (error) {
          const requestEnd = performance.now();
          results.push({
            success: false,
            index: i,
            duration: requestEnd - requestStart,
            error: error.message
          });
        }
      }

      const endTime = performance.now();

      return {
        totalTime: endTime - startTime,
        testCount,
        results,
        successCount: results.filter(r => r.success).length,
        averageTime: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
        averageDataSize: results.filter(r => r.success).reduce((sum, r) => sum + r.dataSize, 0) / results.filter(r => r.success).length
      };
    });

    expect(eip712PerformanceResult.successCount).toBe(eip712PerformanceResult.testCount);
    expect(eip712PerformanceResult.averageTime).toBeLessThan(1000); // Average should be under 1 second

    console.log(`✅ Completed ${eip712PerformanceResult.testCount} complex EIP-712 signatures`);
    console.log(`✅ Total time: ${eip712PerformanceResult.totalTime.toFixed(2)}ms`);
    console.log(`✅ Average time: ${eip712PerformanceResult.averageTime.toFixed(2)}ms`);
    console.log(`✅ Average data size: ${(eip712PerformanceResult.averageDataSize / 1024).toFixed(2)} KB`);
  });

  test('should handle memory usage during sustained operations', async ({ page }) => {
    console.log('🧪 Testing memory usage during sustained operations...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum && window.phantom?.solana, { timeout: 5000 });

    // Connect both wallets
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await window.phantom.solana.connect();
    });

    // Sustained operations test
    const memoryTestResult = await page.evaluate(async () => {
      const initialMemory = performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null;

      const startTime = performance.now();
      const sustainedCount = 200; // 200 operations
      const results = [];
      const memorySnapshots = [];

      for (let i = 0; i < sustainedCount; i++) {
        // Alternate between EVM and Solana operations
        const requestStart = performance.now();

        try {
          if (i % 2 === 0) {
            // EVM operation
            const signature = await window.ethereum.request({
              method: 'personal_sign',
              params: [`Sustained EVM test ${i}`, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
            });
            results.push({ success: true, type: 'evm', index: i });
          } else {
            // Solana operation
            const message = new TextEncoder().encode(`Sustained Solana test ${i}`);
            const signature = await window.phantom.solana.signMessage(message);
            results.push({ success: true, type: 'solana', index: i });
          }

          // Take memory snapshot every 50 operations
          if (i % 50 === 0 && performance.memory) {
            memorySnapshots.push({
              operation: i,
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize
            });
          }
        } catch (error) {
          results.push({
            success: false,
            type: i % 2 === 0 ? 'evm' : 'solana',
            index: i,
            error: error.message
          });
        }

        const requestEnd = performance.now();
        // Add small delay to prevent overwhelming the system
        if ((requestEnd - requestStart) < 10) {
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }

      const endTime = performance.now();
      const finalMemory = performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null;

      return {
        totalTime: endTime - startTime,
        sustainedCount,
        results,
        successCount: results.filter(r => r.success).length,
        evmCount: results.filter(r => r.type === 'evm' && r.success).length,
        solanaCount: results.filter(r => r.type === 'solana' && r.success).length,
        memorySnapshots,
        initialMemory,
        finalMemory,
        memoryGrowth: finalMemory && initialMemory ? finalMemory.used - initialMemory.used : null
      };
    });

    expect(memoryTestResult.successCount).toBe(memoryTestResult.sustainedCount);
    expect(memoryTestResult.evmCount).toBeGreaterThan(0);
    expect(memoryTestResult.solanaCount).toBeGreaterThan(0);

    console.log(`✅ Completed ${memoryTestResult.sustainedCount} sustained operations`);
    console.log(`✅ EVM operations: ${memoryTestResult.evmCount}`);
    console.log(`✅ Solana operations: ${memoryTestResult.solanaCount}`);
    console.log(`✅ Total time: ${memoryTestResult.totalTime.toFixed(2)}ms`);

    if (memoryTestResult.initialMemory && memoryTestResult.finalMemory) {
      const memoryGrowthMB = memoryTestResult.memoryGrowth / (1024 * 1024);
      console.log(`✅ Memory growth: ${memoryGrowthMB.toFixed(2)} MB`);
      console.log(`✅ Memory snapshots taken: ${memoryTestResult.memorySnapshots.length}`);

      // Memory growth should be reasonable (less than 50MB for 200 operations)
      expect(Math.abs(memoryGrowthMB)).toBeLessThan(50);
    } else {
      console.log('ℹ️ Memory monitoring not available in this browser');
    }
  });

  test('should handle rapid account switching performance', async ({ page }) => {
    console.log('🧪 Testing rapid account switching performance...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet to get all accounts
    const accountSwitchResult = await page.evaluate(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const startTime = performance.now();
      const results = [];
      const switchCount = 20; // 20 rapid account operations

      for (let i = 0; i < switchCount; i++) {
        const accountIndex = i % accounts.length;
        const targetAccount = accounts[accountIndex];
        const requestStart = performance.now();

        try {
          // Test signing with different accounts to simulate switching
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [`Account switch test ${i}`, targetAccount]
          });

          const requestEnd = performance.now();
          results.push({
            success: true,
            index: i,
            account: targetAccount,
            duration: requestEnd - requestStart
          });
        } catch (error) {
          const requestEnd = performance.now();
          results.push({
            success: false,
            index: i,
            account: targetAccount,
            duration: requestEnd - requestStart,
            error: error.message
          });
        }
      }

      const endTime = performance.now();

      return {
        totalTime: endTime - startTime,
        switchCount,
        availableAccounts: accounts.length,
        results,
        successCount: results.filter(r => r.success).length,
        averageTime: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
        accountsUsed: [...new Set(results.filter(r => r.success).map(r => r.account))].length
      };
    });

    expect(accountSwitchResult.successCount).toBe(accountSwitchResult.switchCount);
    expect(accountSwitchResult.accountsUsed).toBe(accountSwitchResult.availableAccounts);
    expect(accountSwitchResult.averageTime).toBeLessThan(500); // Average should be under 500ms

    console.log(`✅ Completed ${accountSwitchResult.switchCount} account operations`);
    console.log(`✅ Available accounts: ${accountSwitchResult.availableAccounts}`);
    console.log(`✅ Accounts used: ${accountSwitchResult.accountsUsed}`);
    console.log(`✅ Total time: ${accountSwitchResult.totalTime.toFixed(2)}ms`);
    console.log(`✅ Average time: ${accountSwitchResult.averageTime.toFixed(2)}ms`);
  });

  test('should maintain performance under load', async ({ page }) => {
    console.log('🧪 Testing performance under load...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum && window.phantom?.solana, { timeout: 5000 });

    // Connect both wallets
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await window.phantom.solana.connect();
    });

    // Load test: Mix of different operations
    const loadTestResult = await page.evaluate(async () => {
      const startTime = performance.now();
      const loadOperations = [];
      const totalOperations = 100;

      // Generate mixed workload
      for (let i = 0; i < totalOperations; i++) {
        const operationType = i % 4;

        switch (operationType) {
          case 0: // EVM personal_sign
            loadOperations.push({
              type: 'evm_personal_sign',
              index: i,
              operation: async () => {
                return await window.ethereum.request({
                  method: 'personal_sign',
                  params: [`Load test ${i}`, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
                });
              }
            });
            break;

          case 1: // Chain switching
            loadOperations.push({
              type: 'chain_switch',
              index: i,
              operation: async () => {
                const chains = ['0x1', '0x89', '0xa', '0x38'];
                const chainId = chains[i % chains.length];
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId }]
                });
                return await window.ethereum.request({ method: 'eth_chainId' });
              }
            });
            break;

          case 2: // Solana signing
            loadOperations.push({
              type: 'solana_sign',
              index: i,
              operation: async () => {
                const message = new TextEncoder().encode(`Solana load test ${i}`);
                return await window.phantom.solana.signMessage(message);
              }
            });
            break;

          case 3: // Account queries
            loadOperations.push({
              type: 'account_query',
              index: i,
              operation: async () => {
                return await window.ethereum.request({ method: 'eth_accounts' });
              }
            });
            break;
        }
      }

      // Execute all operations concurrently
      const results = await Promise.allSettled(
        loadOperations.map(async (op) => {
          const opStart = performance.now();
          try {
            const result = await op.operation();
            const opEnd = performance.now();
            return {
              success: true,
              type: op.type,
              index: op.index,
              duration: opEnd - opStart,
              hasResult: !!result
            };
          } catch (error) {
            const opEnd = performance.now();
            return {
              success: false,
              type: op.type,
              index: op.index,
              duration: opEnd - opStart,
              error: error.message
            };
          }
        })
      );

      const endTime = performance.now();

      const successfulResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .filter(r => r.success);

      const typeStats = {};
      successfulResults.forEach(result => {
        if (!typeStats[result.type]) {
          typeStats[result.type] = { count: 0, totalTime: 0 };
        }
        typeStats[result.type].count++;
        typeStats[result.type].totalTime += result.duration;
      });

      Object.keys(typeStats).forEach(type => {
        typeStats[type].averageTime = typeStats[type].totalTime / typeStats[type].count;
      });

      return {
        totalTime: endTime - startTime,
        totalOperations,
        successCount: successfulResults.length,
        failureCount: results.length - successfulResults.length,
        typeStats,
        overallAverageTime: successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length
      };
    });

    expect(loadTestResult.successCount).toBeGreaterThan(loadTestResult.totalOperations * 0.9); // At least 90% success rate
    expect(loadTestResult.totalTime).toBeLessThan(30000); // Should complete within 30 seconds
    expect(loadTestResult.overallAverageTime).toBeLessThan(1000); // Average operation under 1 second

    console.log(`✅ Load test completed: ${loadTestResult.successCount}/${loadTestResult.totalOperations} operations`);
    console.log(`✅ Total time: ${loadTestResult.totalTime.toFixed(2)}ms`);
    console.log(`✅ Overall average time: ${loadTestResult.overallAverageTime.toFixed(2)}ms`);
    console.log(`✅ Success rate: ${((loadTestResult.successCount / loadTestResult.totalOperations) * 100).toFixed(1)}%`);

    // Log performance by operation type
    Object.entries(loadTestResult.typeStats).forEach(([type, stats]) => {
      console.log(`   ${type}: ${stats.count} ops, avg ${stats.averageTime.toFixed(2)}ms`);
    });
  });
});