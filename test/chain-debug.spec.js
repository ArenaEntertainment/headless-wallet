import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '../packages/playwright/dist/index.js';

test('debug chain ID method', async ({ page }) => {
  console.log('🔍 Testing chain ID method...');

  await page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await installHeadlessWallet(page, {
    accounts: [
      { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
    ],
    autoConnect: false,
    debug: true
  });

  await page.goto(`data:text/html,
    <html>
    <body>
      <button id="testChain">Test Chain ID</button>
      <div id="result"></div>

      <script>
        document.getElementById('testChain').onclick = async () => {
          console.log('Button clicked, calling eth_chainId...');
          try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log('Chain ID result:', chainId);
            document.getElementById('result').innerHTML = 'Chain ID: ' + chainId;
          } catch (error) {
            console.log('Chain ID error:', error);
            document.getElementById('result').innerHTML = 'Error: ' + error.message;
          }
        };

        // Also test it programmatically
        setTimeout(async () => {
          console.log('Testing chain ID programmatically...');
          try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log('Programmatic chain ID:', chainId);
          } catch (error) {
            console.log('Programmatic error:', error);
          }
        }, 1000);
      </script>
    </body>
    </html>`);

  await page.waitForTimeout(2000);

  const hasEthereum = await page.evaluate(() => !!window.ethereum);
  expect(hasEthereum).toBe(true);
  console.log('✅ window.ethereum exists');

  await page.click('#testChain');
  await page.waitForTimeout(2000);

  const result = await page.locator('#result').textContent();
  console.log('🔍 Button click result:', result);
});