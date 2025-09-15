const { chromium } = require('playwright');

async function testDemo(page, url, demoName) {
  console.log(`\n📋 Testing ${demoName} Demo at ${url}`);
  console.log('=' + '='.repeat(50));

  try {
    // Navigate to demo
    await page.goto(url);
    await page.waitForTimeout(2000);

    // Check for errors
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Take initial screenshot
    await page.screenshot({ path: `test-${demoName}-initial.png` });

    // Find connect button
    const connectButton = await page.locator('appkit-button, appkit-connect-button, .connect-button, button:has-text("Connect Wallet")').first();
    if (!connectButton) {
      console.log('❌ No connect button found');
      return false;
    }

    console.log('✅ Connect button found');

    // Click connect
    await connectButton.click();
    await page.waitForTimeout(2000);

    // Check if modal opened
    const modal = await page.locator('w3m-modal, appkit-modal, .modal').first();
    if (modal && await modal.isVisible()) {
      console.log('✅ Modal opened');

      // Look for Arena Wallet
      const arenaWallet = await page.locator('text=/Arena Wallet/i').first();
      if (arenaWallet && await arenaWallet.isVisible()) {
        console.log('✅ Arena Wallet found in modal');

        // Click Arena Wallet
        await arenaWallet.click();
        await page.waitForTimeout(3000);

        // Check connection status
        const connected = await page.locator('text=/Connected|0x[a-fA-F0-9]/i').first();
        if (connected && await connected.isVisible()) {
          console.log('✅ EVM Wallet connected');

          // Try to switch to Solana
          const networkButton = await page.locator('appkit-network-button, button:has-text("Network")').first();
          if (networkButton && await networkButton.isVisible()) {
            await networkButton.click();
            await page.waitForTimeout(1000);

            const solanaOption = await page.locator('text=/Solana/i').first();
            if (solanaOption && await solanaOption.isVisible()) {
              await solanaOption.click();
              await page.waitForTimeout(2000);

              const solanaConnected = await page.locator('text=/Solana|[A-Za-z0-9]{44}/').first();
              if (solanaConnected && await solanaConnected.isVisible()) {
                console.log('✅ Solana wallet connected');
              } else {
                console.log('⚠️ Solana connection status unclear');
              }
            } else {
              console.log('⚠️ Solana network option not found');
            }
          }

          // Test signing
          const signButton = await page.locator('button:has-text("Sign")').first();
          if (signButton && await signButton.isVisible()) {
            await signButton.click();
            await page.waitForTimeout(2000);

            const signature = await page.locator('text=/0x[a-fA-F0-9]{100,}|[A-Za-z0-9]{88,}/').first();
            if (signature && await signature.isVisible()) {
              console.log('✅ Message signed successfully');
            } else {
              console.log('⚠️ Signature not displayed');
            }
          }
        } else {
          console.log('❌ Wallet not connected');
        }
      } else {
        console.log('❌ Arena Wallet not found in modal');

        // Take screenshot of modal
        await page.screenshot({ path: `test-${demoName}-modal.png` });
      }
    } else {
      console.log('❌ Modal did not open');
    }

    // Check for console errors
    if (errors.length > 0) {
      console.log('\n⚠️ Console errors detected:');
      errors.forEach(err => console.log('  -', err.substring(0, 100)));
    }

    // Final screenshot
    await page.screenshot({ path: `test-${demoName}-final.png` });

    return errors.length === 0;
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  const results = {
    vanilla: false,
    react: false,
    nuxt: false
  };

  // Test vanilla demo
  let page = await context.newPage();
  results.vanilla = await testDemo(page, 'http://localhost:5173', 'vanilla');
  await page.close();

  // Test React demo
  page = await context.newPage();
  results.react = await testDemo(page, 'http://localhost:5177', 'react');
  await page.close();

  // Test Nuxt demo
  page = await context.newPage();
  results.nuxt = await testDemo(page, 'http://localhost:3000', 'nuxt');
  await page.close();

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(52));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(52));
  console.log(`Vanilla Demo: ${results.vanilla ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`React Demo: ${results.react ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Nuxt Demo: ${results.nuxt ? '✅ PASSED' : '❌ FAILED'}`);

  const allPassed = Object.values(results).every(r => r);
  console.log(`\nOverall: ${allPassed ? '✅ ALL DEMOS WORKING' : '❌ SOME DEMOS HAVE ISSUES'}`);
}

main().catch(console.error);