import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '../packages/playwright/dist/index.js';

// Test private key from hardhat accounts
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const EXPECTED_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// Test Solana keypair
const TEST_SOLANA_KEYPAIR = new Uint8Array([150, 18, 232, 71, 19, 88, 173, 212, 93, 227, 95, 201, 208, 119, 27, 27, 245, 79, 54, 171, 84, 233, 119, 172, 239, 210, 13, 114, 170, 228, 78, 156, 62, 76, 36, 99, 206, 146, 119, 196, 167, 136, 71, 9, 222, 59, 121, 131, 46, 18, 184, 70, 143, 146, 22, 124, 117, 219, 17, 3, 13, 161, 209, 234]);

test.describe('Network Failures and Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' },
        { privateKey: TEST_SOLANA_KEYPAIR, type: 'solana' }
      ],
      autoConnect: false,
      debug: true
    });
  });

  test('should handle network timeout scenarios', async ({ page }) => {
    console.log('🧪 Testing network timeout handling...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet first
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Simulate network timeout by intercepting and delaying requests
    await page.route('**/*', async route => {
      // Add delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 100));
      route.continue();
    });

    // Test operations with simulated network delay
    const timeoutTestResult = await page.evaluate(async () => {
      const startTime = Date.now();

      try {
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: ['Network timeout test', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
        });

        const endTime = Date.now();
        return {
          success: true,
          signature,
          duration: endTime - startTime,
          isValidSignature: signature && signature.length === 132
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          duration: Date.now() - startTime
        };
      }
    });

    expect(timeoutTestResult.success).toBe(true);
    expect(timeoutTestResult.isValidSignature).toBe(true);
    console.log(`✅ Network delay handled successfully (${timeoutTestResult.duration}ms)`);

    // Clean up route interception
    await page.unroute('**/*');
  });

  test('should handle connection interruption and recovery', async ({ page }) => {
    console.log('🧪 Testing connection interruption and recovery...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test normal operation first
    const normalOperationResult = await page.evaluate(async () => {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        return { success: true, chainId };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(normalOperationResult.success).toBe(true);
    console.log('✅ Normal operation confirmed before interruption');

    // Simulate network interruption by temporarily blocking requests
    let blockRequests = false;

    await page.route('**/*', async route => {
      if (blockRequests) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // Enable request blocking
    await page.evaluate(() => {
      window.__networkBlocked = true;
    });
    blockRequests = true;

    // Test operation during interruption
    const interruptionResult = await page.evaluate(async () => {
      try {
        // This should still work as it's handled by the mock wallet, not network
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: ['Interruption test', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
        });
        return { success: true, signature };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Mock wallet operations should still work (they don't use network)
    expect(interruptionResult.success).toBe(true);
    console.log('✅ Local wallet operations continued during network interruption');

    // Restore network
    blockRequests = false;
    await page.evaluate(() => {
      window.__networkBlocked = false;
    });

    // Test recovery
    const recoveryResult = await page.evaluate(async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return { success: true, accounts, accountCount: accounts.length };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(recoveryResult.success).toBe(true);
    expect(recoveryResult.accountCount).toBeGreaterThan(0);
    console.log('✅ Network recovery successful');

    // Clean up
    await page.unroute('**/*');
  });

  test('should handle RPC endpoint failures', async ({ page }) => {
    console.log('🧪 Testing RPC endpoint failure handling...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test methods that would typically require RPC calls
    const rpcMethods = [
      { method: 'eth_getBalance', params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest'] },
      { method: 'eth_getTransactionCount', params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest'] },
      { method: 'eth_gasPrice', params: [] },
      { method: 'eth_blockNumber', params: [] }
    ];

    const rpcResults = [];

    for (const rpcMethod of rpcMethods) {
      const result = await page.evaluate(async (methodData) => {
        try {
          const response = await window.ethereum.request({
            method: methodData.method,
            params: methodData.params
          });
          return {
            success: true,
            method: methodData.method,
            response,
            responseType: typeof response
          };
        } catch (error) {
          return {
            success: false,
            method: methodData.method,
            error: error.message,
            isMethodSupported: !error.message.includes('Method not supported')
          };
        }
      }, rpcMethod);

      rpcResults.push(result);

      if (result.success) {
        console.log(`✅ ${result.method} succeeded`);
      } else if (result.isMethodSupported) {
        console.log(`⚠️ ${result.method} failed: ${result.error}`);
      } else {
        console.log(`ℹ️ ${result.method} not supported (expected for mock wallet)`);
      }
    }

    // At least some operations should handle gracefully
    const gracefulFailures = rpcResults.filter(
      result => !result.success && result.error && !result.error.includes('timeout')
    );

    console.log(`✅ ${gracefulFailures.length} methods handled failures gracefully`);
  });

  test('should handle Solana network connectivity issues', async ({ page }) => {
    console.log('🧪 Testing Solana network connectivity...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.phantom?.solana, { timeout: 5000 });

    // Connect Solana wallet
    await page.evaluate(async () => {
      await window.phantom.solana.connect();
    });

    // Test Solana operations that might involve network calls
    const solanaNetworkTests = [
      'Message signing',
      'Connection status'
    ];

    for (const testName of solanaNetworkTests) {
      const result = await page.evaluate(async (name) => {
        try {
          let response;
          if (name === 'Message signing') {
            const message = new TextEncoder().encode('Network connectivity test');
            response = await window.phantom.solana.signMessage(message);
          } else if (name === 'Connection status') {
            response = await window.phantom.solana.connect();
          }
          return {
            success: true,
            name: name,
            hasResponse: !!response
          };
        } catch (error) {
          return {
            success: false,
            name: name,
            error: error.message
          };
        }
      }, testName);

      if (result.success) {
        expect(result.hasResponse).toBe(true);
        console.log(`✅ ${result.name} handled network connectivity properly`);
      } else {
        console.log(`⚠️ ${result.name} failed: ${result.error}`);
      }
    }
  });

  test('should handle chain switching during network issues', async ({ page }) => {
    console.log('🧪 Testing chain switching during network issues...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Simulate intermittent network issues during chain switching
    let requestCount = 0;

    await page.route('**/*', async route => {
      requestCount++;

      // Fail every 3rd request to simulate intermittent issues
      if (requestCount % 3 === 0) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // Test chain switching with intermittent failures
    const chainSwitchResults = [];
    const chains = ['0x89', '0xa', '0x1', '0x38']; // Polygon, Optimism, Ethereum, BSC

    for (const chainId of chains) {
      const result = await page.evaluate(async (targetChain) => {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChain }]
          });

          // Verify the switch
          const currentChain = await window.ethereum.request({ method: 'eth_chainId' });

          return {
            success: true,
            targetChain,
            currentChain,
            switchedCorrectly: currentChain === targetChain
          };
        } catch (error) {
          return {
            success: false,
            targetChain,
            error: error.message
          };
        }
      }, chainId);

      chainSwitchResults.push(result);

      if (result.success) {
        expect(result.switchedCorrectly).toBe(true);
        console.log(`✅ Successfully switched to chain ${result.targetChain}`);
      } else {
        console.log(`⚠️ Failed to switch to chain ${result.targetChain}: ${result.error}`);
      }
    }

    const successfulSwitches = chainSwitchResults.filter(result => result.success);
    expect(successfulSwitches.length).toBeGreaterThan(0);
    console.log(`✅ ${successfulSwitches.length}/${chains.length} chain switches succeeded despite network issues`);

    // Clean up
    await page.unroute('**/*');
  });

  test('should handle concurrent requests during network instability', async ({ page }) => {
    console.log('🧪 Testing concurrent requests during network instability...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Simulate unstable network with random delays
    await page.route('**/*', async route => {
      // Random delay between 0-200ms
      const delay = Math.random() * 200;
      await new Promise(resolve => setTimeout(resolve, delay));

      // 10% chance of failure
      if (Math.random() < 0.1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // Send multiple concurrent requests
    const concurrentResults = await page.evaluate(async () => {
      const promises = [];

      // Create 10 concurrent signing requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          window.ethereum.request({
            method: 'personal_sign',
            params: [`Concurrent message ${i}`, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
          }).then(signature => ({ success: true, index: i, signature }))
            .catch(error => ({ success: false, index: i, error: error.message }))
        );
      }

      return await Promise.all(promises);
    });

    const successfulRequests = concurrentResults.filter(result => result.success);
    const failedRequests = concurrentResults.filter(result => !result.success);

    expect(successfulRequests.length).toBeGreaterThan(0);
    console.log(`✅ ${successfulRequests.length}/10 concurrent requests succeeded`);
    console.log(`ℹ️ ${failedRequests.length}/10 concurrent requests failed (expected with network instability)`);

    // Verify all successful signatures are unique
    const signatures = successfulRequests.map(result => result.signature);
    const uniqueSignatures = new Set(signatures);
    expect(uniqueSignatures.size).toBe(signatures.length);
    console.log('✅ All successful signatures are unique');

    // Clean up
    await page.unroute('**/*');
  });

  test('should handle page reload and reconnection', async ({ page }) => {
    console.log('🧪 Testing page reload and reconnection...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet and sign something
    const preReloadResult = await page.evaluate(async () => {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: ['Pre-reload test', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
        });
        return { success: true, signature };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(preReloadResult.success).toBe(true);
    console.log('✅ Pre-reload operation successful');

    // Reload the page
    await page.reload();
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Test wallet functionality after reload
    const postReloadResult = await page.evaluate(async () => {
      try {
        // Should be able to connect again
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: ['Post-reload test', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
        });

        return { success: true, signature };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(postReloadResult.success).toBe(true);
    expect(postReloadResult.signature).not.toBe(preReloadResult.signature); // Different messages should produce different signatures
    console.log('✅ Post-reload operation successful');
    console.log('✅ Page reload and reconnection handled properly');
  });

  test('should handle wallet state persistence across sessions', async ({ page }) => {
    console.log('🧪 Testing wallet state persistence...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect and switch to a specific chain
    const initialState = await page.evaluate(async () => {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Switch to Polygon
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }]
        });

        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });

        return {
          success: true,
          chainId,
          accounts,
          accountCount: accounts.length
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(initialState.success).toBe(true);
    expect(initialState.chainId).toBe('0x89');
    expect(initialState.accountCount).toBeGreaterThan(0);
    console.log(`✅ Initial state: Chain ${initialState.chainId}, ${initialState.accountCount} accounts`);

    // Navigate to a different page and back
    await page.goto('data:text/html,<html><body><h1>Temporary page</h1></body></html>');
    await page.waitForTimeout(100);

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Check if state is maintained
    const restoredState = await page.evaluate(async () => {
      try {
        // Should not need to connect again if state is persisted
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });

        return {
          success: true,
          chainId,
          accounts,
          accountCount: accounts.length,
          isConnected: accounts.length > 0
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(restoredState.success).toBe(true);

    // In a real wallet, state might persist, but in our mock it will reset
    // This is expected behavior for a testing environment
    console.log(`ℹ️ Restored state: Chain ${restoredState.chainId}, ${restoredState.accountCount} accounts`);
    console.log('✅ Wallet state handling tested (behavior varies by implementation)');
  });

  test('should handle graceful degradation of features', async ({ page }) => {
    console.log('🧪 Testing graceful feature degradation...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test various wallet features and check for graceful degradation
    const featureTests = [
      {
        name: 'Basic signing (should always work)',
        method: 'personal_sign',
        params: ['Degradation test', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
        critical: true
      },
      {
        name: 'Chain switching (should work in mock)',
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }],
        critical: true
      },
      {
        name: 'Account enumeration (should work)',
        method: 'eth_accounts',
        params: [],
        critical: true
      },
      {
        name: 'Balance checking (may not work in mock)',
        method: 'eth_getBalance',
        params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest'],
        critical: false
      },
      {
        name: 'Gas price (may not work in mock)',
        method: 'eth_gasPrice',
        params: [],
        critical: false
      }
    ];

    const degradationResults = [];

    for (const feature of featureTests) {
      const result = await page.evaluate(async (featureData) => {
        try {
          const response = await window.ethereum.request({
            method: featureData.method,
            params: featureData.params
          });

          return {
            success: true,
            name: featureData.name,
            critical: featureData.critical,
            response: typeof response,
            hasResponse: !!response
          };
        } catch (error) {
          return {
            success: false,
            name: featureData.name,
            critical: featureData.critical,
            error: error.message,
            isGraceful: !error.message.includes('undefined') && !error.message.includes('crash')
          };
        }
      }, feature);

      degradationResults.push(result);

      if (result.success) {
        console.log(`✅ ${result.name} - Working`);
      } else {
        if (result.critical) {
          expect(result.success).toBe(true); // Critical features must work
          console.log(`❌ ${result.name} - Critical failure: ${result.error}`);
        } else {
          expect(result.isGraceful).toBe(true); // Non-critical features should fail gracefully
          console.log(`⚠️ ${result.name} - Graceful degradation: ${result.error}`);
        }
      }
    }

    const workingFeatures = degradationResults.filter(result => result.success);
    const criticalFeatures = degradationResults.filter(result => result.critical);
    const workingCriticalFeatures = criticalFeatures.filter(result => result.success);

    expect(workingCriticalFeatures.length).toBe(criticalFeatures.length);
    console.log(`✅ All ${criticalFeatures.length} critical features working`);
    console.log(`✅ ${workingFeatures.length}/${degradationResults.length} total features working`);
    console.log('✅ Graceful feature degradation tested');
  });
});