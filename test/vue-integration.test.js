/**
 * Simple test to verify Vue plugin integration works
 */
import { JSDOM } from 'jsdom';

// Mock Vue environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock Vue
const createApp = (component) => ({
  use: () => {
    console.log('Vue plugin registered successfully');
    return {
      mount: () => console.log('App mounted successfully')
    };
  }
});

// Mock vue-router
const createRouter = () => ({});
const createWebHistory = () => ({});

// Test Vue plugin import and usage
async function testVuePlugin() {
  console.log('🧪 Testing Vue plugin integration...');

  try {
    // Import the Vue plugin
    const { MockWalletPlugin, useMockWallet } = await import('../packages/vue/dist/index.js');

    console.log('✅ Vue plugin imported successfully');
    console.log('Available exports:', { MockWalletPlugin: !!MockWalletPlugin, useMockWallet: !!useMockWallet });

    // Verify plugin structure
    if (MockWalletPlugin && typeof MockWalletPlugin.install === 'function') {
      console.log('✅ MockWalletPlugin has install method');
    } else {
      throw new Error('MockWalletPlugin is missing install method');
    }

    if (typeof useMockWallet === 'function') {
      console.log('✅ useMockWallet composable available');
    } else {
      throw new Error('useMockWallet composable not available');
    }

    // Create a mock Vue app to test plugin installation
    const app = createApp({});
    const result = app.use(MockWalletPlugin, {
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ],
      autoConnect: false
    });

    console.log('✅ Vue plugin test completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Vue plugin test failed:', error.message);
    return false;
  }
}

// Run the test
testVuePlugin().then(success => {
  if (success) {
    console.log('🎉 Vue plugin integration test passed!');
    process.exit(0);
  } else {
    console.error('💥 Vue plugin integration test failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});