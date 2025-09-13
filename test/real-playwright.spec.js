import { test, expect } from '@playwright/test';
import { installMockWallet } from '../packages/playwright/dist/index.js';

// Real private key from hardhat test accounts
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const EXPECTED_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

test.describe('Real Wallet Integration Tests', () => {
  test('should inject real EVM wallet with actual cryptography', async ({ page }) => {
    console.log('🧪 Testing real wallet injection...');

    // Install wallet with real private key
    await installMockWallet(page, {
      accounts: [
        { privateKey: TEST_PRIVATE_KEY, type: 'evm' }
      ],
      autoConnect: false,
      debug: true
    });

    // Create a test page with wallet interaction
    await page.goto(`data:text/html,<!DOCTYPE html>
      <html>
      <head>
        <title>Wallet Test</title>
      </head>
      <body>
        <h1>Testing Mock Wallet</h1>
        <button id="connect">Connect</button>
        <button id="sign">Sign Message</button>
        <div id="result"></div>

        <script>
          document.getElementById('connect').onclick = async () => {
            try {
              const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
              document.getElementById('result').innerHTML = 'Connected: ' + accounts[0];
              console.log('Connected to accounts:', accounts);
            } catch (error) {
              document.getElementById('result').innerHTML = 'Error: ' + error.message;
            }
          };

          document.getElementById('sign').onclick = async () => {
            try {
              const accounts = await window.ethereum.request({ method: 'eth_accounts' });
              if (accounts.length === 0) {
                throw new Error('No accounts connected');
              }

              const message = 'Test message from Playwright';
              const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, accounts[0]]
              });

              document.getElementById('result').innerHTML = 'Signed: ' + signature;
              console.log('Signature:', signature);
            } catch (error) {
              document.getElementById('result').innerHTML = 'Sign Error: ' + error.message;
            }
          };
        </script>
      </body>
      </html>`);

    // Verify wallet is injected
    const hasEthereum = await page.evaluate(() => !!window.ethereum);
    expect(hasEthereum).toBe(true);
    console.log('✅ window.ethereum exists');

    const isMetaMask = await page.evaluate(() => window.ethereum.isMetaMask);
    expect(isMetaMask).toBe(true);
    console.log('✅ Marked as MetaMask');

    // Test connection
    await page.click('#connect');
    await page.waitForSelector('#result:has-text("Connected:")');

    const resultText = await page.locator('#result').textContent();
    expect(resultText).toContain(EXPECTED_ADDRESS);
    console.log('✅ Connected to correct address:', EXPECTED_ADDRESS);

    // Test real signing
    await page.click('#sign');
    await page.waitForSelector('#result:has-text("Signed:")');

    const signResult = await page.locator('#result').textContent();
    expect(signResult).toContain('Signed: 0x');

    // Extract signature
    const signature = signResult.replace('Signed: ', '');
    expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    console.log('✅ Real cryptographic signature generated:', signature.substring(0, 20) + '...');

    // Verify the signature is different for different messages
    await page.evaluate(() => {
      document.getElementById('sign').onclick = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: ['Different message', accounts[0]]
        });
        document.getElementById('result').innerHTML = 'Signed2: ' + signature;
      };
    });

    await page.click('#sign');
    await page.waitForSelector('#result:has-text("Signed2:")');

    const signResult2 = await page.locator('#result').textContent();
    const signature2 = signResult2.replace('Signed2: ', '');

    expect(signature2).not.toBe(signature);
    console.log('✅ Different messages produce different signatures');
  });

  test('should handle chain switching', async ({ page }) => {
    console.log('🧪 Testing chain switching...');

    await installMockWallet(page, {
      accounts: [{ privateKey: TEST_PRIVATE_KEY, type: 'evm' }],
      debug: true
    });

    await page.goto(`data:text/html,<html><body><button id="getChain">Get Chain</button><button id="switchChain">Switch to Polygon</button><div id="chainResult"></div><script>document.getElementById('getChain').onclick = async () => { const chainId = await window.ethereum.request({ method: 'eth_chainId' }); document.getElementById('chainResult').innerHTML = 'Chain: ' + chainId; }; document.getElementById('switchChain').onclick = async () => { try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89' }] }); const chainId = await window.ethereum.request({ method: 'eth_chainId' }); document.getElementById('chainResult').innerHTML = 'Switched to: ' + chainId; } catch (error) { document.getElementById('chainResult').innerHTML = 'Switch Error: ' + error.message; } };</script></body></html>`);

    // Test initial chain
    await page.click('#getChain');
    await page.waitForSelector('#chainResult:has-text("Chain:")');
    let chainResult = await page.locator('#chainResult').textContent();
    expect(chainResult).toBe('Chain: 0x1');
    console.log('✅ Initial chain is Ethereum mainnet (0x1)');

    // Test chain switching
    await page.click('#switchChain');
    await page.waitForSelector('#chainResult:has-text("Switched to:")');
    chainResult = await page.locator('#chainResult').textContent();
    expect(chainResult).toBe('Switched to: 0x89');
    console.log('✅ Successfully switched to Polygon (0x89)');
  });

  test('should work with multiple accounts', async ({ page }) => {
    console.log('🧪 Testing multiple accounts...');

    // Multiple hardhat accounts
    const account1 = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const account2 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

    await installMockWallet(page, {
      accounts: [
        { privateKey: account1, type: 'evm' },
        { privateKey: account2, type: 'evm' }
      ],
      autoConnect: true,
      debug: true
    });

    await page.goto(`data:text/html,<html><body><button id="getAccounts">Get Accounts</button><div id="accountsResult"></div><script>document.getElementById('getAccounts').onclick = async () => { const accounts = await window.ethereum.request({ method: 'eth_accounts' }); document.getElementById('accountsResult').innerHTML = 'Accounts: ' + accounts.length + ' - ' + accounts.join(', '); };</script></body></html>`);

    await page.click('#getAccounts');
    await page.waitForSelector('#accountsResult:has-text("Accounts:")');

    const accountsResult = await page.locator('#accountsResult').textContent();
    expect(accountsResult).toContain('Accounts: 2');
    expect(accountsResult).toContain('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'); // First account
    expect(accountsResult).toContain('0x70997970C51812dc3A010C7d01b50e0d17dc79C8'); // Second account

    console.log('✅ Multiple accounts working:', accountsResult);
  });
});