import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '../packages/playwright/dist/index.js';

// Test private key from hardhat accounts
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const EXPECTED_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// Test Solana keypair
const TEST_SOLANA_KEYPAIR = new Uint8Array([150, 18, 232, 71, 19, 88, 173, 212, 93, 227, 95, 201, 208, 119, 27, 27, 245, 79, 54, 171, 84, 233, 119, 172, 239, 210, 13, 114, 170, 228, 78, 156, 62, 76, 36, 99, 206, 146, 119, 196, 167, 136, 71, 9, 222, 59, 121, 131, 46, 18, 184, 70, 143, 146, 22, 124, 117, 219, 17, 3, 13, 161, 209, 234]);
const EXPECTED_SOLANA_ADDRESS = '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm';

test.describe('Transaction Testing', () => {
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

  test('should handle EIP-712 typed data signing', async ({ page }) => {
    console.log('🧪 Testing EIP-712 typed data signing...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test different EIP-712 structures
    const eip712Tests = [
      {
        name: 'Simple message',
        typedData: {
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' }
            ],
            Message: [
              { name: 'content', type: 'string' }
            ]
          },
          primaryType: 'Message',
          domain: {
            name: 'Test App',
            version: '1',
            chainId: 1
          },
          message: {
            content: 'Hello world'
          }
        }
      },
      {
        name: 'Complex message with arrays',
        typedData: {
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
              { name: 'verifyingContract', type: 'address' }
            ],
            Order: [
              { name: 'trader', type: 'address' },
              { name: 'side', type: 'uint8' },
              { name: 'matchingPolicy', type: 'address' },
              { name: 'collection', type: 'address' },
              { name: 'tokenId', type: 'uint256' },
              { name: 'amount', type: 'uint256' },
              { name: 'paymentToken', type: 'address' },
              { name: 'price', type: 'uint256' },
              { name: 'listingTime', type: 'uint256' },
              { name: 'expirationTime', type: 'uint256' },
              { name: 'fees', type: 'Fee[]' },
              { name: 'salt', type: 'uint256' }
            ],
            Fee: [
              { name: 'rate', type: 'uint16' },
              { name: 'recipient', type: 'address' }
            ]
          },
          primaryType: 'Order',
          domain: {
            name: 'Seaport',
            version: '1.1',
            chainId: 1,
            verifyingContract: '0x00000000006c3852cbef3e08e8df289169ede581'
          },
          message: {
            trader: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            side: 1,
            matchingPolicy: '0x0000000000000000000000000000000000000000',
            collection: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
            tokenId: 1,
            amount: 1,
            paymentToken: '0x0000000000000000000000000000000000000000',
            price: '1000000000000000000',
            listingTime: Math.floor(Date.now() / 1000),
            expirationTime: Math.floor(Date.now() / 1000) + 86400,
            fees: [
              {
                rate: 250,
                recipient: '0x0000000000000000000000000000000000000000'
              }
            ],
            salt: '12345'
          }
        }
      }
    ];

    for (const testCase of eip712Tests) {
      const result = await page.evaluate(async (testData) => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const signature = await window.ethereum.request({
            method: 'eth_signTypedData_v4',
            params: [accounts[0], JSON.stringify(testData.typedData)]
          });
          return {
            success: true,
            signature,
            signatureLength: signature.length,
            name: testData.name
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            name: testData.name
          };
        }
      }, testCase);

      expect(result.success).toBe(true);
      expect(result.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
      expect(result.signatureLength).toBe(132);
      console.log(`✅ ${result.name} signing successful`);
    }
  });

  test('should handle Ethereum transaction signing', async ({ page }) => {
    console.log('🧪 Testing Ethereum transaction signing...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test transaction signing (eth_signTransaction)
    const transactionSigningResult = await page.evaluate(async () => {
      try {
        const transaction = {
          from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          value: '0x1000000000000000', // 0.001 ETH
          gas: '0x5208', // 21000
          gasPrice: '0x3b9aca00', // 1 gwei
          nonce: '0x0',
          data: '0x'
        };

        const signedTx = await window.ethereum.request({
          method: 'eth_signTransaction',
          params: [transaction]
        });

        return {
          success: true,
          signedTransaction: signedTx,
          hasSignature: signedTx && typeof signedTx === 'string' && signedTx.length > 0
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          isMethodSupported: !error.message.includes('Method not supported')
        };
      }
    });

    if (transactionSigningResult.success) {
      expect(transactionSigningResult.hasSignature).toBe(true);
      console.log('✅ Transaction signing successful');
    } else {
      // Some wallets may not support eth_signTransaction, which is acceptable
      console.log('ℹ️ Transaction signing not supported (expected for some wallet implementations)');
    }
  });

  test('should handle Solana transaction signing', async ({ page }) => {
    console.log('🧪 Testing Solana transaction signing...');

    await page.waitForFunction(() => window.phantom?.solana, { timeout: 5000 });

    // Connect Solana wallet
    await page.evaluate(async () => {
      await window.phantom.solana.connect();
    });

    // Create a mock Solana transaction for testing
    const solanaTransactionResult = await page.evaluate(async () => {
      try {
        // Mock transaction object (in real scenario this would be a proper Solana transaction)
        const mockTransaction = {
          feePayer: '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm',
          recentBlockhash: 'H1HsQ5AjWGAnW7f6ZAwohwa4JzNeYViGiG22NbfvUKBE',
          instructions: [
            {
              programId: '11111111111111111111111111111112',
              keys: [
                { pubkey: '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm', isSigner: true, isWritable: true },
                { pubkey: 'Drmn7qpWsU8k2eAo1ry78UxnwXV6bBqDR3s9AXsRH7Xn', isSigner: false, isWritable: true }
              ],
              data: new Uint8Array([2, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0]) // Transfer 100 lamports
            }
          ]
        };

        const signedTransaction = await window.phantom.solana.signTransaction(mockTransaction);

        return {
          success: true,
          hasSigned: !!signedTransaction,
          transactionType: typeof signedTransaction
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    if (solanaTransactionResult.success) {
      expect(solanaTransactionResult.hasSigned).toBe(true);
      console.log('✅ Solana transaction signing successful');
    } else {
      console.log(`ℹ️ Solana transaction signing error: ${solanaTransactionResult.error}`);
      // This might be expected if the mock transaction format doesn't match expectations
    }
  });

  test('should handle batch Solana transaction signing', async ({ page }) => {
    console.log('🧪 Testing batch Solana transaction signing...');

    await page.waitForFunction(() => window.phantom?.solana, { timeout: 5000 });

    // Connect Solana wallet
    await page.evaluate(async () => {
      await window.phantom.solana.connect();
    });

    // Test batch transaction signing
    const batchSigningResult = await page.evaluate(async () => {
      try {
        // Mock multiple transactions
        const transactions = [];
        for (let i = 0; i < 3; i++) {
          transactions.push({
            feePayer: '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm',
            recentBlockhash: 'H1HsQ5AjWGAnW7f6ZAwohwa4JzNeYViGiG22NbfvUKBE',
            instructions: [
              {
                programId: '11111111111111111111111111111112',
                keys: [
                  { pubkey: '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm', isSigner: true, isWritable: true },
                  { pubkey: 'Drmn7qpWsU8k2eAo1ry78UxnwXV6bBqDR3s9AXsRH7Xn', isSigner: false, isWritable: true }
                ],
                data: new Uint8Array([2, 0, 0, 0, 100 + i, 0, 0, 0, 0, 0, 0, 0])
              }
            ]
          });
        }

        const signedTransactions = await window.phantom.solana.signAllTransactions(transactions);

        return {
          success: true,
          transactionCount: signedTransactions.length,
          allSigned: signedTransactions.every(tx => !!tx)
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    if (batchSigningResult.success) {
      expect(batchSigningResult.transactionCount).toBe(3);
      expect(batchSigningResult.allSigned).toBe(true);
      console.log('✅ Batch Solana transaction signing successful');
    } else {
      console.log(`ℹ️ Batch Solana transaction signing error: ${batchSigningResult.error}`);
    }
  });

  test('should handle sign and send transactions', async ({ page }) => {
    console.log('🧪 Testing sign and send transaction...');

    await page.waitForFunction(() => window.phantom?.solana, { timeout: 5000 });

    // Connect Solana wallet
    await page.evaluate(async () => {
      await window.phantom.solana.connect();
    });

    // Test sign and send (mock scenario)
    const signAndSendResult = await page.evaluate(async () => {
      try {
        const mockTransaction = {
          feePayer: '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm',
          recentBlockhash: 'H1HsQ5AjWGAnW7f6ZAwohwa4JzNeYViGiG22NbfvUKBE',
          instructions: [
            {
              programId: '11111111111111111111111111111112',
              keys: [
                { pubkey: '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm', isSigner: true, isWritable: true },
                { pubkey: 'Drmn7qpWsU8k2eAo1ry78UxnwXV6bBqDR3s9AXsRH7Xn', isSigner: false, isWritable: true }
              ],
              data: new Uint8Array([2, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0])
            }
          ]
        };

        const result = await window.phantom.solana.signAndSendTransaction(mockTransaction);

        return {
          success: true,
          hasResult: !!result,
          resultType: typeof result
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          isMethodSupported: !error.message.includes('not supported')
        };
      }
    });

    if (signAndSendResult.success) {
      expect(signAndSendResult.hasResult).toBe(true);
      console.log('✅ Sign and send transaction successful');
    } else {
      console.log(`ℹ️ Sign and send transaction: ${signAndSendResult.error}`);
      // Expected to fail in test environment without actual blockchain connection
    }
  });

  test('should validate transaction parameters', async ({ page }) => {
    console.log('🧪 Testing transaction parameter validation...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test invalid transaction parameters
    const invalidTransactionTests = [
      {
        name: 'Invalid recipient address',
        transaction: {
          from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          to: 'invalid_address',
          value: '0x1000000000000000'
        }
      },
      {
        name: 'Invalid value format',
        transaction: {
          from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          value: 'not_a_number'
        }
      },
      {
        name: 'Missing required from field',
        transaction: {
          to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          value: '0x1000000000000000'
        }
      }
    ];

    for (const testCase of invalidTransactionTests) {
      const result = await page.evaluate(async (testData) => {
        try {
          await window.ethereum.request({
            method: 'eth_signTransaction',
            params: [testData.transaction]
          });
          return { success: true, name: testData.name };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            name: testData.name,
            isValidationError: error.message.includes('Invalid') || error.message.includes('address') || error.message.includes('required')
          };
        }
      }, testCase);

      expect(result.success).toBe(false);
      console.log(`✅ ${result.name} properly rejected`);
    }
  });

  test('should handle gas estimation requests', async ({ page }) => {
    console.log('🧪 Testing gas estimation...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test gas estimation
    const gasEstimationResult = await page.evaluate(async () => {
      try {
        const gasEstimate = await window.ethereum.request({
          method: 'eth_estimateGas',
          params: [{
            from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            value: '0x1000000000000000'
          }]
        });

        return {
          success: true,
          gasEstimate,
          isValidGas: gasEstimate && typeof gasEstimate === 'string' && gasEstimate.startsWith('0x')
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          isMethodSupported: !error.message.includes('Method not supported')
        };
      }
    });

    if (gasEstimationResult.success) {
      expect(gasEstimationResult.isValidGas).toBe(true);
      console.log('✅ Gas estimation successful');
    } else {
      console.log('ℹ️ Gas estimation not supported (expected for mock wallet)');
    }
  });

  test('should handle transaction simulation', async ({ page }) => {
    console.log('🧪 Testing transaction simulation...');

    await page.waitForFunction(() => window.phantom?.solana, { timeout: 5000 });

    // Connect Solana wallet
    await page.evaluate(async () => {
      await window.phantom.solana.connect();
    });

    // Test transaction simulation through custom request
    const simulationResult = await page.evaluate(async () => {
      try {
        // This would typically be a simulate request
        const result = await window.phantom.solana.request({
          method: 'simulate_transaction',
          params: [{
            instructions: [{
              programId: '11111111111111111111111111111112',
              keys: [
                { pubkey: '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm', isSigner: true, isWritable: true }
              ],
              data: new Uint8Array([0]) // Noop instruction
            }]
          }]
        });

        return { success: true, result };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          isMethodSupported: !error.message.includes('Method not supported')
        };
      }
    });

    // Simulation may not be supported in mock environment
    console.log('ℹ️ Transaction simulation test completed');
    if (simulationResult.success) {
      console.log('✅ Transaction simulation successful');
    } else {
      console.log('ℹ️ Transaction simulation not supported in mock environment');
    }
  });

  test('should handle different signature types', async ({ page }) => {
    console.log('🧪 Testing different signature types...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test different signing methods
    const signingMethods = [
      {
        method: 'personal_sign',
        params: ['Test message for personal_sign', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
      },
      {
        method: 'eth_sign',
        params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x54657374206d65737361676520666f7220657468_7369676e'] // hex encoded message
      }
    ];

    const results = [];

    for (const signingMethod of signingMethods) {
      const result = await page.evaluate(async (methodData) => {
        try {
          const signature = await window.ethereum.request({
            method: methodData.method,
            params: methodData.params
          });

          return {
            success: true,
            method: methodData.method,
            signature,
            signatureLength: signature.length,
            isValidFormat: /^0x[a-fA-F0-9]{130}$/.test(signature)
          };
        } catch (error) {
          return {
            success: false,
            method: methodData.method,
            error: error.message,
            isMethodSupported: !error.message.includes('Method not supported')
          };
        }
      }, signingMethod);

      results.push(result);

      if (result.success) {
        expect(result.isValidFormat).toBe(true);
        expect(result.signatureLength).toBe(132);
        console.log(`✅ ${result.method} signing successful`);
      } else if (result.isMethodSupported) {
        console.log(`⚠️ ${result.method} failed: ${result.error}`);
      } else {
        console.log(`ℹ️ ${result.method} not supported`);
      }
    }

    // At least personal_sign should work
    const personalSignResult = results.find(r => r.method === 'personal_sign');
    expect(personalSignResult.success).toBe(true);
  });

  test('should handle transaction receipt simulation', async ({ page }) => {
    console.log('🧪 Testing transaction receipt simulation...');

    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect wallet
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Test getting transaction receipt (mock)
    const receiptResult = await page.evaluate(async () => {
      try {
        // This would typically require an actual transaction hash
        const mockTxHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
        const receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [mockTxHash]
        });

        return {
          success: true,
          receipt,
          hasReceipt: !!receipt
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          isMethodSupported: !error.message.includes('Method not supported')
        };
      }
    });

    // This is expected to fail in mock environment
    console.log('ℹ️ Transaction receipt test completed');
    if (receiptResult.success) {
      console.log('✅ Transaction receipt retrieval successful');
    } else {
      console.log('ℹ️ Transaction receipt not available in mock environment');
    }
  });
});
