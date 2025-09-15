const { chromium } = require('playwright');

async function testReactSolana() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Testing React demo Solana functionality...');

  // Navigate
  await page.goto('http://localhost:5177');
  await page.waitForTimeout(3000);

  // Check console for registration message
  page.on('console', msg => {
    if (msg.text().includes('Solana wallet registered')) {
      console.log('✅ ' + msg.text());
    }
  });

  // Check if wallet is registered
  const walletInfo = await page.evaluate(() => {
    const wallets = window.wallets || [];
    return {
      count: wallets.length,
      names: wallets.map(w => w.name),
      hasSolana: wallets.some(w => w.chains?.some(c => c.includes('solana')))
    };
  });

  console.log('Wallet info:', walletInfo);

  // Click connect
  const connectButton = await page.locator('appkit-button').first();
  await connectButton.click();
  await page.waitForTimeout(2000);

  // Search for Arena wallet in Solana mode
  const networkButton = await page.locator('button:has-text("Ethereum")').first();
  if (networkButton) {
    await networkButton.click();
    await page.waitForTimeout(1000);

    const solanaOption = await page.locator('text=/Solana/i').first();
    if (solanaOption) {
      await solanaOption.click();
      await page.waitForTimeout(2000);

      // Check if Arena wallet appears
      const searchButton = await page.locator('button:has-text("Search Wallet")').first();
      if (searchButton) {
        await searchButton.click();
        await page.waitForTimeout(1000);

        await page.fill('input[type="search"]', 'Arena');
        await page.waitForTimeout(1000);

        const arenaWallet = await page.locator('text=/Arena/i').first();
        if (arenaWallet && await arenaWallet.isVisible()) {
          console.log('✅ Arena Wallet found in Solana search!');
        } else {
          console.log('❌ Arena Wallet NOT found in Solana search');
        }
      }
    }
  }

  await page.screenshot({ path: 'react-solana-test.png' });
  await browser.close();
}

testReactSolana().catch(console.error);