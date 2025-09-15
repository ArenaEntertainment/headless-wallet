import { test, expect } from '@playwright/test';
import { installHeadlessWallet, uninstallHeadlessWallet } from '../packages/playwright/dist/index.js';

test.describe('Real AppKit Integration Test', () => {
  test('should connect to external AppKit application via Playwright injection only', async ({ page }) => {
    // Create a completely external AppKit application with NO headless wallet integration
    const appkitApp = `data:text/html,<!DOCTYPE html>
<html>
<head>
  <title>External AppKit App</title>
  <script type="module" src="https://unpkg.com/@reown/appkit@1.8.4/dist/index.js"></script>
  <script type="module">
    import { createAppKit } from 'https://unpkg.com/@reown/appkit@1.8.4/dist/index.js';
    import { mainnet, arbitrum, base, optimism, solana } from 'https://unpkg.com/@reown/appkit@1.8.4/networks';

    // Initialize AppKit with NO headless wallet integration
    const appKit = createAppKit({
      adapters: [
        // Will use detected wallets only
      ],
      networks: [mainnet, arbitrum, base, optimism, solana],
      metadata: {
        name: 'External AppKit Test',
        description: 'Testing external AppKit integration',
        url: 'https://test.com',
        icons: ['https://test.com/icon.png']
      },
      projectId: '2f05ae7f1116030fde2d36508f472bfb', // Demo project ID
      enableAnalytics: false,
      enableOnramp: false,
      features: {
        socials: false,
        email: false,
        emailShowWallets: false
      }
    });

    window.appKit = appKit;
    console.log('AppKit initialized:', appKit);
  </script>
</head>
<body>
  <div id="app">
    <h1>External AppKit Application</h1>
    <p>No built-in headless wallet integration</p>

    <button onclick="window.appKit.open()">Connect Wallet</button>
    <button onclick="testConnection()">Test Connection</button>

    <div id="status"></div>
    <div id="account-info"></div>
  </div>

  <script>
    async function testConnection() {
      const status = document.getElementById('status');
      const accountInfo = document.getElementById('account-info');

      try {
        status.innerHTML = 'Testing connection...';

        // Check if wallets are detected
        const hasEthereum = !!window.ethereum;
        const hasSolana = !!window.phantom?.solana;

        status.innerHTML = \`
          <p>EVM Provider: \${hasEthereum ? '✅ Detected' : '❌ Missing'}</p>
          <p>Solana Provider: \${hasSolana ? '✅ Detected' : '❌ Missing'}</p>
        \`;

        // Try to get current state from AppKit
        const state = window.appKit?.getState?.();
        if (state) {
          accountInfo.innerHTML = '<p>AppKit State: ' + JSON.stringify(state, null, 2) + '</p>';
        }

      } catch (error) {
        status.innerHTML = '<p>Error: ' + error.message + '</p>';
      }
    }

    // Auto-test after load
    window.addEventListener('load', () => {
      setTimeout(testConnection, 1000);
    });
  </script>
</body>
</html>`;

    // CRITICAL: Navigate to external AppKit app FIRST
    await page.goto(appkitApp);
    await page.waitForLoadState('domcontentloaded');

    // Wait for AppKit to initialize
    await page.waitForTimeout(2000);

    // NOW inject wallets via Playwright (the real test!)
    const walletId = await installHeadlessWallet(page, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' },
        { privateKey: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8', type: 'solana' }
      ],
      debug: true
    });

    // Wait for injection to complete
    await page.waitForTimeout(1000);

    // Verify providers are injected
    const providersDetected = await page.evaluate(() => {
      return {
        hasEthereum: !!window.ethereum,
        hasSolana: !!window.phantom?.solana,
        appKitExists: !!window.appKit
      };
    });

    console.log('Providers detected:', providersDetected);

    expect(providersDetected.hasEthereum).toBe(true);
    expect(providersDetected.hasSolana).toBe(true);
    expect(providersDetected.appKitExists).toBe(true);

    // Test that AppKit can see the providers by triggering the connection UI
    await page.locator('button:has-text("Connect Wallet")').click();

    // Wait for AppKit modal to appear
    await page.waitForSelector('w3m-modal', { timeout: 10000 }).catch(() => {
      // Fallback for different AppKit versions
      return page.waitForSelector('[data-testid="w3m-modal"]', { timeout: 5000 });
    }).catch(() => {
      // Another fallback
      return page.waitForSelector('.w3m-modal', { timeout: 5000 });
    });

    // Look for our injected wallet in the AppKit modal
    const walletVisible = await page.locator('text=/Arena Headless Wallet|Headless Wallet/i').isVisible().catch(() => false);

    if (walletVisible) {
      console.log('✅ Headless wallet detected in AppKit modal!');
    } else {
      console.log('⚠️  Headless wallet not visible in AppKit modal, checking DOM...');

      // Debug: Check what wallets AppKit detected
      const modalContent = await page.evaluate(() => {
        const modal = document.querySelector('w3m-modal') ||
                     document.querySelector('[data-testid="w3m-modal"]') ||
                     document.querySelector('.w3m-modal');
        return modal ? modal.innerHTML : 'No modal found';
      });

      console.log('AppKit modal content sample:', modalContent.substring(0, 500));
    }

    // The key test: AppKit should detect our injected wallet
    expect(walletVisible).toBe(true);

    await uninstallHeadlessWallet(page, walletId);
  });
});