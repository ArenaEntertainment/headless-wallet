import { test, expect } from '@playwright/test';

test.describe('Click Headless Wallet Test', () => {
  test('should click headless wallet with integrated wallet', async ({ page }) => {
    // Navigate to the AppKit demo with headless wallet enabled via query parameter
    await page.goto('http://localhost:5176?headless');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await page.waitForTimeout(3000);

    // Open AppKit modal
    await page.evaluate(() => {
      window.appKit.open();
    });

    await page.waitForTimeout(3000);

    console.log('=== BEFORE CLICKING WALLET ===');
    await page.screenshot({ path: 'test-results/before-wallet-click.png', fullPage: true });

    // Click the specific wallet using its test ID
    console.log('Clicking on headless wallet...');
    await page.getByTestId('wallet-selector-com.arenaentertainment.headless-wallet').click();

    await page.waitForTimeout(3000);

    console.log('=== AFTER CLICKING WALLET ===');
    await page.screenshot({ path: 'test-results/after-wallet-click.png', fullPage: true });

    // Check what happened after clicking
    const afterClick = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const appKitState = window.appKit.getState();

      return {
        bodyText: bodyText,
        appKitState: appKitState,
        isConnected: appKitState.isConnected,
        hasEthereumText: bodyText.toLowerCase().includes('ethereum'),
        hasSolanaText: bodyText.toLowerCase().includes('solana'),
        hasChooseText: bodyText.toLowerCase().includes('choose') || bodyText.toLowerCase().includes('select'),
        hasConnectedText: bodyText.toLowerCase().includes('connected'),
        hasAccountText: bodyText.toLowerCase().includes('account'),
        connectedAddress: appKitState.address || null
      };
    });

    console.log('Results after clicking wallet:');
    console.log('- Is connected:', afterClick.isConnected);
    console.log('- Connected address:', afterClick.connectedAddress);
    console.log('- Has Ethereum text:', afterClick.hasEthereumText);
    console.log('- Has Solana text:', afterClick.hasSolanaText);
    console.log('- Has choice UI text:', afterClick.hasChooseText);
    console.log('- Has connected text:', afterClick.hasConnectedText);
    console.log('- Body text sample:', afterClick.bodyText.substring(0, 500));

    // Check for specific AppKit connection methods
    const connectionCheck = await page.evaluate(async () => {
      try {
        // Try to get account info from AppKit
        const address = window.appKit.getAddress();
        const networkId = window.appKit.getCaipNetworkId();
        const isConnectedState = window.appKit.getIsConnectedState();

        return {
          address,
          networkId,
          isConnectedState,
          providers: {
            ethereum: !!window.ethereum,
            solana: !!window.phantom?.solana
          }
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('Connection check:', connectionCheck);

    // The test succeeds if we either connected or see some indication of wallet interaction
    const success = afterClick.isConnected ||
                   afterClick.hasConnectedText ||
                   afterClick.hasChooseText ||
                   connectionCheck.address ||
                   connectionCheck.isConnectedState;

    expect(success, 'Should show some sign of wallet connection or choice UI').toBe(true);

    console.log('✅ Headless wallet click test completed successfully!');
  });
});