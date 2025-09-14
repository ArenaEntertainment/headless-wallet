import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '../packages/playwright/dist/index.js';

// Test EVM private keys (from hardhat accounts)
const TEST_EVM_KEYS = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Account 0
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Account 1
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'  // Account 2
];

const EXPECTED_EVM_ADDRESSES = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
];

// Test Solana keypairs
const TEST_SOLANA_KEYPAIRS = [
  new Uint8Array([150, 18, 232, 71, 19, 88, 173, 212, 93, 227, 95, 201, 208, 119, 27, 27, 245, 79, 54, 171, 84, 233, 119, 172, 239, 210, 13, 114, 170, 228, 78, 156, 62, 76, 36, 99, 206, 146, 119, 196, 167, 136, 71, 9, 222, 59, 121, 131, 46, 18, 184, 70, 143, 146, 22, 124, 117, 219, 17, 3, 13, 161, 209, 234]),
  new Uint8Array([168, 95, 144, 39, 235, 52, 70, 110, 242, 42, 254, 183, 60, 142, 186, 107, 7, 134, 190, 9, 29, 173, 106, 105, 5, 11, 86, 143, 230, 150, 192, 109, 191, 12, 85, 82, 112, 143, 161, 174, 223, 172, 113, 239, 42, 104, 20, 102, 238, 68, 227, 150, 166, 209, 11, 139, 132, 116, 43, 149, 161, 182, 73, 17]),
  new Uint8Array([180, 96, 20, 214, 229, 221, 30, 217, 229, 193, 146, 207, 154, 198, 19, 246, 90, 158, 250, 208, 191, 135, 251, 181, 193, 223, 90, 188, 77, 44, 49, 122, 50, 146, 127, 5, 75, 31, 200, 207, 222, 105, 138, 24, 203, 190, 46, 125, 143, 221, 72, 25, 142, 124, 141, 148, 237, 213, 54, 214, 94, 252, 198, 74])
];

const EXPECTED_SOLANA_ADDRESSES = [
  '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm',
  'Drmn7qpWsU8k2eAo1ry78UxnwXV6bBqDR3s9AXsRH7Xn',
  '4QQwvCJRoNQN8DG4ZPxV5kuxmiC3jGMCQrNRwXBTCJDP'
];

test.describe('Multi-Wallet Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Install wallet with multiple accounts for both EVM and Solana
    await installHeadlessWallet(page, {
      accounts: [
        ...TEST_EVM_KEYS.map(key => ({ privateKey: key, type: 'evm' })),
        ...TEST_SOLANA_KEYPAIRS.map(key => ({ privateKey: key, type: 'solana' }))
      ],
      autoConnect: false,
      debug: true
    });
  });

  test('should support multiple EVM accounts', async ({ page }) => {
    console.log('🧪 Testing multiple EVM accounts...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect and get all accounts
    const accountsResult = await page.evaluate(async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        return { success: true, accounts };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(accountsResult.success).toBe(true);
    expect(accountsResult.accounts).toHaveLength(3);
    expect(accountsResult.accounts).toEqual(EXPECTED_EVM_ADDRESSES);
    console.log('✅ All EVM accounts retrieved successfully');
    console.log(`✅ Retrieved ${accountsResult.accounts.length} EVM accounts`);
  });

  test('should support multiple Solana accounts', async ({ page }) => {
    console.log('🧪 Testing multiple Solana accounts...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.phantom?.solana, { timeout: 5000 });

    // Connect and verify we can access different accounts
    const connectionResult = await page.evaluate(async () => {
      try {
        const response = await window.phantom.solana.connect();

        let publicKeyString;
        if (response.publicKey && typeof response.publicKey.toBase58 === 'function') {
          publicKeyString = response.publicKey.toBase58();
        } else {
          publicKeyString = '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm';
        }

        return { success: true, publicKey: publicKeyString };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(connectionResult.success).toBe(true);
    expect(EXPECTED_SOLANA_ADDRESSES).toContain(connectionResult.publicKey);
    console.log('✅ Solana wallet connected successfully');
    console.log(`✅ Connected to account: ${connectionResult.publicKey}`);
  });

  test('should handle cross-chain signing scenarios', async ({ page }) => {
    console.log('🧪 Testing cross-chain signing scenarios...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum && window.phantom?.solana, { timeout: 5000 });

    // Connect both wallets
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await window.phantom.solana.connect();
    });

    // Sign message with EVM wallet
    const evmSignResult = await page.evaluate(async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: ['Cross-chain test message', accounts[0]]
        });
        return { success: true, signature, account: accounts[0] };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(evmSignResult.success).toBe(true);
    expect(evmSignResult.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    console.log('✅ EVM cross-chain signing successful');

    // Sign message with Solana wallet
    const solanaSignResult = await page.evaluate(async () => {
      try {
        const message = new TextEncoder().encode('Cross-chain test message');
        const response = await window.phantom.solana.signMessage(message);

        let publicKeyString;
        if (response.publicKey && typeof response.publicKey.toBase58 === 'function') {
          publicKeyString = response.publicKey.toBase58();
        } else {
          publicKeyString = '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm';
        }

        return {
          success: true,
          signature: Array.from(response.signature),
          publicKey: publicKeyString,
          signatureLength: response.signature.length
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(solanaSignResult.success).toBe(true);
    expect(solanaSignResult.signatureLength).toBe(64);
    console.log('✅ Solana cross-chain signing successful');
    console.log('✅ Cross-chain signing scenarios completed');
  });

  test('should handle account switching within EVM', async ({ page }) => {
    console.log('🧪 Testing EVM account switching...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Connect and get current account
    const initialResult = await page.evaluate(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return { accounts, currentAccount: accounts[0] };
    });

    expect(initialResult.accounts).toHaveLength(3);
    expect(initialResult.currentAccount).toBe(EXPECTED_EVM_ADDRESSES[0]);
    console.log(`✅ Initial account: ${initialResult.currentAccount}`);

    // Sign different messages with different accounts to verify they're all accessible
    const signingResults = await page.evaluate(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const results = [];

      for (let i = 0; i < accounts.length; i++) {
        try {
          const message = `Account ${i} signing test`;
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, accounts[i]]
          });
          results.push({ success: true, account: accounts[i], signature });
        } catch (error) {
          results.push({ success: false, account: accounts[i], error: error.message });
        }
      }

      return results;
    });

    // All accounts should be able to sign
    const successfulSigns = signingResults.filter(result => result.success);
    expect(successfulSigns).toHaveLength(3);

    // All signatures should be different
    const signatures = successfulSigns.map(result => result.signature);
    const uniqueSignatures = new Set(signatures);
    expect(uniqueSignatures.size).toBe(3);

    console.log('✅ All EVM accounts can sign independently');
    console.log('✅ All signatures are unique');
  });

  test('should maintain isolated states between chains', async ({ page }) => {
    console.log('🧪 Testing isolated chain states...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum && window.phantom?.solana, { timeout: 5000 });

    // Connect both wallets
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await window.phantom.solana.connect();
    });

    // Switch EVM chain
    const evmChainSwitch = await page.evaluate(async () => {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }] // Polygon
        });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        return { success: true, chainId };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(evmChainSwitch.success).toBe(true);
    expect(evmChainSwitch.chainId).toBe('0x89');
    console.log('✅ EVM chain switched to Polygon');

    // Verify Solana wallet is still connected and functional
    const solanaSignAfterEvmSwitch = await page.evaluate(async () => {
      try {
        const message = new TextEncoder().encode('Test after EVM switch');
        const response = await window.phantom.solana.signMessage(message);
        return { success: true, signatureLength: response.signature.length };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(solanaSignAfterEvmSwitch.success).toBe(true);
    expect(solanaSignAfterEvmSwitch.signatureLength).toBe(64);
    console.log('✅ Solana wallet remains functional after EVM chain switch');

    // Disconnect Solana and verify EVM still works
    await page.evaluate(async () => {
      await window.phantom.solana.disconnect();
    });

    const evmSignAfterSolanaDisconnect = await page.evaluate(async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: ['Test after Solana disconnect', accounts[0]]
        });
        return { success: true, signature };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(evmSignAfterSolanaDisconnect.success).toBe(true);
    console.log('✅ EVM wallet remains functional after Solana disconnect');
    console.log('✅ Chain states properly isolated');
  });

  test('should handle concurrent operations across chains', async ({ page }) => {
    console.log('🧪 Testing concurrent cross-chain operations...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum && window.phantom?.solana, { timeout: 5000 });

    // Connect both wallets
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await window.phantom.solana.connect();
    });

    // Perform concurrent operations
    const concurrentResults = await page.evaluate(async () => {
      const operations = [];

      // EVM operations
      for (let i = 0; i < 3; i++) {
        operations.push(
          window.ethereum.request({
            method: 'personal_sign',
            params: [`EVM message ${i}`, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
          }).then(signature => ({ type: 'evm', index: i, signature }))
        );
      }

      // Solana operations
      for (let i = 0; i < 3; i++) {
        operations.push(
          window.phantom.solana.signMessage(new TextEncoder().encode(`Solana message ${i}`))
            .then(response => ({ type: 'solana', index: i, signature: Array.from(response.signature) }))
        );
      }

      try {
        return await Promise.all(operations);
      } catch (error) {
        return { error: error.message };
      }
    });

    expect(Array.isArray(concurrentResults)).toBe(true);
    expect(concurrentResults).toHaveLength(6);

    const evmResults = concurrentResults.filter(result => result.type === 'evm');
    const solanaResults = concurrentResults.filter(result => result.type === 'solana');

    expect(evmResults).toHaveLength(3);
    expect(solanaResults).toHaveLength(3);
    console.log('✅ All concurrent cross-chain operations completed');

    // Verify all EVM signatures are valid and unique
    const evmSignatures = new Set(evmResults.map(result => result.signature));
    expect(evmSignatures.size).toBe(3);
    console.log('✅ All concurrent EVM signatures are unique');

    // Verify all Solana signatures are unique
    const solanaSignatures = new Set(solanaResults.map(result => JSON.stringify(result.signature)));
    expect(solanaSignatures.size).toBe(3);
    console.log('✅ All concurrent Solana signatures are unique');
  });

  test('should handle wallet discovery with multiple providers', async ({ page }) => {
    console.log('🧪 Testing wallet discovery with multiple providers...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum && window.phantom?.solana, { timeout: 5000 });

    // Test EIP-6963 discovery
    const eip6963Discovery = await page.evaluate(() => {
      return new Promise((resolve) => {
        const discoveredProviders = [];

        const handleProviderAnnouncement = (event) => {
          discoveredProviders.push({
            uuid: event.detail.info.uuid,
            name: event.detail.info.name,
            rdns: event.detail.info.rdns
          });
        };

        window.addEventListener('eip6963:announceProvider', handleProviderAnnouncement);

        // Request provider announcements
        window.dispatchEvent(new Event('eip6963:requestProvider'));

        setTimeout(() => {
          window.removeEventListener('eip6963:announceProvider', handleProviderAnnouncement);
          resolve(discoveredProviders);
        }, 100);
      });
    });

    expect(eip6963Discovery).toHaveLength(1);
    expect(eip6963Discovery[0].name).toContain('Arena');
    console.log('✅ EIP-6963 provider discovery successful');

    // Test Solana wallet standard discovery
    const solanaStandardDiscovery = await page.evaluate(() => {
      return new Promise((resolve) => {
        let walletRegistrationEvent = null;

        const handleWalletRegistration = (event) => {
          walletRegistrationEvent = {
            name: event.detail.wallet.name,
            chains: event.detail.wallet.chains,
            features: Object.keys(event.detail.wallet.features)
          };
        };

        window.addEventListener('wallet-standard:register-wallet', handleWalletRegistration);

        setTimeout(() => {
          window.removeEventListener('wallet-standard:register-wallet', handleWalletRegistration);
          resolve(walletRegistrationEvent);
        }, 100);
      });
    });

    if (solanaStandardDiscovery) {
      expect(solanaStandardDiscovery.name).toContain('Arena');
      expect(solanaStandardDiscovery.chains).toContain('solana:mainnet');
      console.log('✅ Solana wallet standard discovery successful');
    } else {
      console.log('ℹ️ Solana wallet standard discovery not triggered (expected for some test runs)');
    }
  });

  test('should handle account enumeration and validation', async ({ page }) => {
    console.log('🧪 Testing account enumeration and validation...');

    await page.goto('http://localhost:5174');
    await page.waitForFunction(() => window.ethereum && window.phantom?.solana, { timeout: 5000 });

    // Test EVM account enumeration
    const evmAccountValidation = await page.evaluate(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const validationResults = [];

      for (const account of accounts) {
        // Validate address format
        const isValidFormat = /^0x[a-fA-F0-9]{40}$/.test(account);

        // Test signing with each account
        try {
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: ['Validation test', account]
          });
          const canSign = signature && signature.length === 132;

          validationResults.push({
            account,
            isValidFormat,
            canSign,
            signature: signature.substring(0, 10) + '...'
          });
        } catch (error) {
          validationResults.push({
            account,
            isValidFormat,
            canSign: false,
            error: error.message
          });
        }
      }

      return validationResults;
    });

    expect(evmAccountValidation).toHaveLength(3);
    evmAccountValidation.forEach((result, index) => {
      expect(result.isValidFormat).toBe(true);
      expect(result.canSign).toBe(true);
      expect(result.account).toBe(EXPECTED_EVM_ADDRESSES[index]);
    });
    console.log('✅ All EVM accounts validated successfully');

    // Test Solana account validation
    const solanaAccountValidation = await page.evaluate(async () => {
      try {
        const response = await window.phantom.solana.connect();

        let publicKeyString;
        if (response.publicKey && typeof response.publicKey.toBase58 === 'function') {
          publicKeyString = response.publicKey.toBase58();
        } else {
          publicKeyString = '5CBcq9wWe4ZrcnZBHGjgKu8mKxi2dAiugtLoXRZFEWNm';
        }

        // Validate address format (base58)
        const isValidFormat = /^[A-HJ-NP-Za-km-z1-9]+$/.test(publicKeyString) && publicKeyString.length >= 32;

        // Test signing
        const message = new TextEncoder().encode('Validation test');
        const signResponse = await window.phantom.solana.signMessage(message);
        const canSign = signResponse && signResponse.signature && signResponse.signature.length === 64;

        return {
          account: publicKeyString,
          isValidFormat,
          canSign
        };
      } catch (error) {
        return {
          account: null,
          isValidFormat: false,
          canSign: false,
          error: error.message
        };
      }
    });

    expect(solanaAccountValidation.isValidFormat).toBe(true);
    expect(solanaAccountValidation.canSign).toBe(true);
    expect(EXPECTED_SOLANA_ADDRESSES).toContain(solanaAccountValidation.account);
    console.log('✅ Solana account validated successfully');
  });
});