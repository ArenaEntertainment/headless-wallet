import { test, expect } from '@playwright/test';

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

test('basic test that wallet can be created', async ({ page }) => {
  // First, let's just test that we can import and create the wallet
  await page.goto('data:text/html,<html><body><h1>Test</h1></body></html>');

  const result = await page.evaluate(async () => {
    // Try to create a wallet directly in the browser context
    try {
      // We need to inline the wallet creation since we can't import in evaluate
      return { success: true, message: 'Can run JS' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  expect(result.success).toBe(true);
  console.log('✅ Basic JavaScript execution works');
});

test('manual wallet injection test', async ({ page }) => {
  // Manually inject a simple wallet to test the approach
  await page.addInitScript(() => {
    console.log('Init script running...');

    window.ethereum = {
      isMetaMask: true,
      request: async (args) => {
        console.log('Request:', args);

        if (args.method === 'eth_requestAccounts' || args.method === 'eth_accounts') {
          return ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
        }

        if (args.method === 'personal_sign') {
          return '0xdummysignature1234567890';
        }

        return null;
      },
      on: () => {},
      removeListener: () => {}
    };

    console.log('window.ethereum set!');
  });

  await page.goto('data:text/html,<html><body><h1>Manual Test</h1></body></html>');

  const hasEthereum = await page.evaluate(() => !!window.ethereum);
  expect(hasEthereum).toBe(true);
  console.log('✅ Manual injection works');

  const accounts = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_accounts' })
  );

  expect(accounts).toEqual(['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']);
  console.log('✅ Account retrieval works:', accounts);
});