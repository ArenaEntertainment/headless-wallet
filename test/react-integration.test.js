/**
 * Simple test to verify React provider integration works
 */
import { JSDOM } from 'jsdom';

// Mock React environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Test React provider import and usage
async function testReactProvider() {
  console.log('🧪 Testing React provider integration...');

  try {
    // Import the React provider
    const {
      MockWalletProvider,
      useMockWallet,
      useEvmWallet,
      useSolanaWallet,
      useWalletConnection,
      useWalletAccounts,
      useWalletSigning
    } = await import('../packages/react/dist/index.js');

    console.log('✅ React provider imported successfully');

    // Verify all exports are available
    const exports = {
      MockWalletProvider: !!MockWalletProvider,
      useMockWallet: !!useMockWallet,
      useEvmWallet: !!useEvmWallet,
      useSolanaWallet: !!useSolanaWallet,
      useWalletConnection: !!useWalletConnection,
      useWalletAccounts: !!useWalletAccounts,
      useWalletSigning: !!useWalletSigning
    };

    console.log('Available exports:', exports);

    // Verify all exports are functions
    const allExportsValid = Object.entries(exports).every(([name, exists]) => {
      if (!exists) {
        console.error(`❌ Missing export: ${name}`);
        return false;
      }
      return true;
    });

    if (!allExportsValid) {
      throw new Error('Some exports are missing');
    }

    // Verify MockWalletProvider is a function
    if (typeof MockWalletProvider !== 'function') {
      throw new Error('MockWalletProvider is not a function');
    }

    // Verify hooks are functions
    const hooks = { useMockWallet, useEvmWallet, useSolanaWallet, useWalletConnection, useWalletAccounts, useWalletSigning };
    for (const [hookName, hook] of Object.entries(hooks)) {
      if (typeof hook !== 'function') {
        throw new Error(`${hookName} is not a function`);
      }
      console.log(`✅ ${hookName} is available`);
    }

    console.log('✅ React provider test completed successfully');
    return true;

  } catch (error) {
    console.error('❌ React provider test failed:', error.message);
    return false;
  }
}

// Run the test
testReactProvider().then(success => {
  if (success) {
    console.log('🎉 React provider integration test passed!');
    process.exit(0);
  } else {
    console.error('💥 React provider integration test failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});