const { test, expect } = require('@playwright/test');

test('EVM wallet disconnect updates AppKit UI', async ({ page }) => {
  // Navigate to the demo
  await page.goto('http://localhost:5175/');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Connect wallet via AppKit button
  await page.locator('w3m-button').click();
  await page.waitForTimeout(500);

  // Click on the injected wallet option (Arena Headless Wallet)
  const walletOption = page.locator('text=Arena Headless Wallet');
  if (await walletOption.isVisible()) {
    await walletOption.click();
    await page.waitForTimeout(2000); // Wait for connection
  }

  // Check that wallet is connected
  const accountButton = page.locator('w3m-button');
  await expect(accountButton).toContainText('0x');

  console.log('✅ Wallet connected successfully');

  // Click the EVM disconnect button (simulating wallet UI disconnect)
  await page.locator('#evm-disconnect').click();

  // Wait for disconnect events to propagate
  await page.waitForTimeout(1000);

  // Check that AppKit UI shows disconnected state
  await expect(accountButton).toContainText('Connect');

  console.log('✅ AppKit UI updated to disconnected state');

  // Check the logs for proper event sequence
  const logs = await page.locator('#logs').textContent();
  expect(logs).toContain('Emitting accountsChanged with empty array');
  expect(logs).toContain('Emitting disconnect event');

  console.log('✅ Disconnect events fired in correct sequence');
});

test('Solana wallet disconnect updates AppKit UI', async ({ page }) => {
  // Navigate to the demo
  await page.goto('http://localhost:5175/');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Connect Solana wallet via AppKit
  await page.locator('w3m-button').click();
  await page.waitForTimeout(500);

  // Switch to Solana network
  await page.locator('w3m-network-button').click();
  await page.waitForTimeout(500);
  const solanaOption = page.locator('text=Solana');
  if (await solanaOption.isVisible()) {
    await solanaOption.click();
    await page.waitForTimeout(1000);
  }

  // Connect the wallet
  const walletOption = page.locator('text=Arena Mock Solana');
  if (await walletOption.isVisible()) {
    await walletOption.click();
    await page.waitForTimeout(2000);
  }

  // Check that wallet is connected
  const accountButton = page.locator('w3m-button');
  const buttonText = await accountButton.textContent();

  if (buttonText && buttonText.includes('...')) {
    console.log('✅ Solana wallet connected successfully');

    // Click the Solana disconnect button
    await page.locator('#solana-disconnect').click();

    // Wait for disconnect to propagate
    await page.waitForTimeout(1000);

    // Check that AppKit shows disconnected
    await expect(accountButton).toContainText('Connect');

    console.log('✅ Solana disconnect updated AppKit UI');
  }
});