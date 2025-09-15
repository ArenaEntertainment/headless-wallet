import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '../packages/playwright/dist/index.js';

test.describe('Click Playwright Injected Wallet Test', () => {
  test('should click headless wallet injected via Playwright', async ({ page }) => {
    // Navigate to the external AppKit demo (without headless query param)
    await page.goto('http://localhost:5178');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Inject both EVM and Solana wallets via Playwright
    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' },
        { privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8', type: 'solana' }
      ],
      debug: true
    });

    await page.waitForTimeout(3000);

    // Open AppKit modal
    await page.evaluate(() => {
      window.appKit.open();
    });

    await page.waitForTimeout(3000);

    console.log('=== BEFORE CLICKING WALLET (Playwright Injection) ===');
    await page.screenshot({ path: 'test-results/before-playwright-wallet-click.png', fullPage: true });

    // Click the headless wallet button specifically (not the page title)
    console.log('Clicking on headless wallet...');
    await page.getByRole('button', { name: /Arena Headless Wallet/ }).click();

    await page.waitForTimeout(3000);

    console.log('=== AFTER CLICKING WALLET (Playwright Injection) ===');
    await page.screenshot({ path: 'test-results/after-playwright-wallet-click.png', fullPage: true });

    // Check what happened after clicking - maybe it connected directly without chain selection
    const afterClickState = await page.evaluate(() => {
      const appKitState = window.appKit.getState();
      return {
        isConnected: appKitState.isConnected,
        selectedNetworkId: appKitState.selectedNetworkId,
        address: appKitState.address,
        bodyText: document.body.innerText.substring(0, 1000) // First 1000 chars to see what's on screen
      };
    });

    console.log('State after clicking wallet:', afterClickState);

    // Check if we connected automatically (which is what's happening)
    const isConnectionSuccessful = afterClickState.bodyText.includes('Connected') &&
                                   afterClickState.bodyText.includes('0xf39Fd6e5');

    if (isConnectionSuccessful) {
      console.log('✅ Wallet connected successfully! AppKit detected and connected to the headless wallet.');

      // Verify the connection details from the UI text
      expect(afterClickState.bodyText.includes('Connected'), 'UI should show Connected status').toBe(true);
      expect(afterClickState.bodyText.includes('0xf39Fd6e5'), 'UI should show connected address').toBe(true);
      expect(afterClickState.selectedNetworkId, 'Should be on Sepolia testnet').toBe('eip155:11155111');

      console.log('✅ Playwright wallet injection and AppKit connection test PASSED!');
      console.log('✅ GitHub issue #18 has been RESOLVED - AppKit successfully detects Playwright-injected wallets!');
    } else {
      // Fallback: check if there's a chain selection dialog (shouldn't happen with current behavior)
      console.log('Connection not detected in UI, checking for chain selection dialog...');

      try {
        // Wait for the chain selection dialog to appear
        const chainSelectionDialog = page.locator('[role="alertdialog"]').filter({ hasText: /Select Chain|Choose Network|Chain/i });
        await expect(chainSelectionDialog).toBeVisible({ timeout: 5000 });

        console.log('Chain selection dialog found - this means both chains are available');
        // This would be a valid passing condition too
      } catch (e) {
        // No dialog found, connection might have failed
        console.log('❌ No connection detected and no chain selection dialog found');
        console.log('Body text:', afterClickState.bodyText.substring(0, 500));
        throw new Error('Expected either automatic connection or chain selection dialog');
      }
    }

    await uninstallHeadlessWallet(page, walletId);
  });
});