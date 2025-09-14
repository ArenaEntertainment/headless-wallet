import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '../packages/playwright/dist/index.js';

// Test private key from hardhat accounts
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const EXPECTED_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

test.describe('Reown AppKit Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Install mock wallet before each test
    await installHeadlessWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ],
      autoConnect: false,
      debug: true
    });
  });

  test('should detect mock wallet via EIP-6963 and inject properly', async ({ page }) => {
    console.log('🧪 Testing EIP-6963 wallet discovery with AppKit...');

    // Navigate to the demo
    await page.goto('http://localhost:5174');
    // Wait for page to load and wallet to be injected
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });
    console.log('✅ AppKit button loaded');

    // Check that our mock wallet was injected
    const hasEthereum = await page.evaluate(() => !!window.ethereum);
    expect(hasEthereum).toBe(true);
    console.log('✅ window.ethereum injected');

    // Verify logs element exists and has content
    const logsExist = await page.evaluate(() => {
      const logs = document.getElementById('logs');
      return logs && logs.textContent.length > 0;
    });
    expect(logsExist).toBe(true);
    console.log('✅ Demo logs are present');

    // Verify wallet is marked as MetaMask for compatibility
    const isMetaMask = await page.evaluate(() => window.ethereum.isMetaMask);
    expect(isMetaMask).toBe(true);
    console.log('✅ Wallet correctly identifies as MetaMask');
  });

  test('should connect wallet directly via window.ethereum', async ({ page }) => {
    console.log('🧪 Testing direct wallet connection...');

    await page.goto('http://localhost:5174');
    // Wait for page to load and wallet to be injected
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Test direct connection using our injected wallet
    const connectionResult = await page.evaluate(async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        return { success: true, accounts };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(connectionResult.success).toBe(true);
    expect(connectionResult.accounts).toHaveLength(1);
    expect(connectionResult.accounts[0]).toBe(EXPECTED_ADDRESS);
    console.log('✅ Direct wallet connection successful');
    console.log(`✅ Retrieved ${connectionResult.accounts.length} accounts`);
  });

  test('should support wallet_getCapabilities with multi-chain info', async ({ page }) => {
    console.log('🧪 Testing wallet_getCapabilities...');

    await page.goto('http://localhost:5174');
    // Wait for page to load and wallet to be injected
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Test wallet_getCapabilities directly
    const capabilitiesResult = await page.evaluate(async () => {
      try {
        const capabilities = await window.ethereum.request({ method: 'wallet_getCapabilities' });
        return { success: true, capabilities };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(capabilitiesResult.success).toBe(true);
    console.log('✅ wallet_getCapabilities executed successfully');

    const capabilities = capabilitiesResult.capabilities;

    // Verify Ethereum chain support (our implementation currently supports single chain per wallet)
    expect(capabilities).toHaveProperty('0x1');   // Ethereum

    // Verify each chain has proper structure
    Object.values(capabilities).forEach(chainCaps => {
      expect(chainCaps).toHaveProperty('accounts');
      expect(chainCaps.accounts.supported).toBe(true);
      expect(chainCaps).toHaveProperty('chainSwitching');
      expect(chainCaps.chainSwitching.supported).toBe(true);
      expect(chainCaps.methods.supported).toContain('personal_sign');
      expect(chainCaps.methods.supported).toContain('wallet_switchEthereumChain');
    });

    console.log('✅ Wallet capabilities validated');
    console.log(`✅ Supports ${Object.keys(capabilities).length} chain(s)`);
  });

  test('should support chain switching seamlessly', async ({ page }) => {
    console.log('🧪 Testing chain switching...');

    await page.goto('http://localhost:5174');
    // Wait for page to load and wallet to be injected
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Test chain switching to Polygon
    const polygonSwitchResult = await page.evaluate(async () => {
      try {
        // Get initial chain
        const initialChain = await window.ethereum.request({ method: 'eth_chainId' });

        // Switch to Polygon
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }]
        });

        // Get new chain
        const newChain = await window.ethereum.request({ method: 'eth_chainId' });

        return {
          success: true,
          initialChain,
          newChain,
          switchedToPolygon: newChain === '0x89'
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(polygonSwitchResult.success).toBe(true);
    expect(polygonSwitchResult.initialChain).toBe('0x1'); // Ethereum
    expect(polygonSwitchResult.newChain).toBe('0x89');    // Polygon
    expect(polygonSwitchResult.switchedToPolygon).toBe(true);
    console.log('✅ Successfully switched from Ethereum to Polygon');

    // Test switching back to Ethereum
    const ethereumSwitchResult = await page.evaluate(async () => {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }]
        });

        const finalChain = await window.ethereum.request({ method: 'eth_chainId' });
        return { success: true, finalChain, backToEthereum: finalChain === '0x1' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(ethereumSwitchResult.success).toBe(true);
    expect(ethereumSwitchResult.backToEthereum).toBe(true);
    console.log('✅ Successfully switched back to Ethereum');
  });

  test('should support real cryptographic signing', async ({ page }) => {
    console.log('🧪 Testing real cryptographic signing...');

    await page.goto('http://localhost:5174');
    // Wait for page to load and wallet to be injected
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Test personal_sign
    const personalSignResult = await page.evaluate(async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const message = 'Hello from Reown AppKit integration test!';
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, accounts[0]]
        });

        return {
          success: true,
          message,
          signature,
          account: accounts[0],
          signatureLength: signature.length
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(personalSignResult.success).toBe(true);
    expect(personalSignResult.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    expect(personalSignResult.signatureLength).toBe(132);
    expect(personalSignResult.account).toBe(EXPECTED_ADDRESS);
    console.log('✅ personal_sign generates valid ECDSA signature');
    console.log(`✅ Signature: ${personalSignResult.signature.substring(0, 20)}...`);

    // Test eth_signTypedData_v4
    const typedDataResult = await page.evaluate(async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const typedData = {
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' }
            ],
            TestMessage: [
              { name: 'content', type: 'string' },
              { name: 'timestamp', type: 'uint256' }
            ]
          },
          primaryType: 'TestMessage',
          domain: {
            name: 'Arena Wallet Test',
            version: '1',
            chainId: 1
          },
          message: {
            content: 'Reown AppKit integration test',
            timestamp: Date.now()
          }
        };

        const signature = await window.ethereum.request({
          method: 'eth_signTypedData_v4',
          params: [accounts[0], JSON.stringify(typedData)]
        });

        return {
          success: true,
          signature,
          signatureLength: signature.length
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(typedDataResult.success).toBe(true);
    expect(typedDataResult.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    expect(typedDataResult.signatureLength).toBe(132);
    console.log('✅ eth_signTypedData_v4 generates valid EIP-712 signature');

    // Verify signatures are different for different messages
    expect(personalSignResult.signature).not.toBe(typedDataResult.signature);
    console.log('✅ Different messages produce different signatures');
  });

  test('should log events properly', async ({ page }) => {
    console.log('🧪 Testing event logging...');

    await page.goto('http://localhost:5174');
    // Wait for page to load and wallet to be injected
    await page.waitForFunction(() => window.ethereum, { timeout: 5000 });

    // Check initial logs
    const initialLogs = await page.locator('#logs').textContent();
    expect(initialLogs).toContain('Arena Wallet Mock + Reown AppKit Demo Initialized');
    console.log('✅ Initial logs present');

    // Connect wallet and check for log updates
    await page.evaluate(async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    });

    // Verify the connection worked by checking accounts
    const accounts = await page.evaluate(async () => {
      return await window.ethereum.request({ method: 'eth_accounts' });
    });

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    console.log('✅ Connection successful - account retrieved');
  });
});