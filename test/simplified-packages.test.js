/**
 * Test to verify the simplified Vue and React packages work correctly
 */
import { JSDOM } from 'jsdom';

// Mock browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Don't override the main process object, just set NODE_ENV
process.env.NODE_ENV = 'development';

async function testSimplifiedPackages() {
  console.log('🧪 Testing simplified Vue and React packages...');
  let allTestsPassed = true;

  try {
    // Test Vue Plugin
    console.log('\n📦 Testing Vue Plugin...');
    const { HeadlessWalletPlugin } = await import('../packages/vue/dist/index.js');

    if (!HeadlessWalletPlugin || typeof HeadlessWalletPlugin.install !== 'function') {
      throw new Error('Vue HeadlessWalletPlugin missing or invalid');
    }

    // Mock Vue app
    let pluginCalled = false;
    const mockApp = {
      provide: () => {},
      use: (plugin, options) => {
        if (plugin === HeadlessWalletPlugin) {
          plugin.install(mockApp, options);
          pluginCalled = true;
        }
      }
    };

    // Test plugin installation
    mockApp.use(HeadlessWalletPlugin, {
      enabled: true,
      accounts: [
        { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
      ]
    });

    if (!pluginCalled) {
      throw new Error('Vue plugin install method was not called');
    }

    // Verify window.ethereum was injected
    if (!global.window.ethereum || typeof global.window.ethereum.request !== 'function') {
      throw new Error('Vue plugin did not inject window.ethereum correctly');
    }

    console.log('✅ Vue plugin works correctly - injects window.ethereum');

    // Test React Provider
    console.log('\n📦 Testing React Provider...');
    const { HeadlessWalletProvider } = await import('../packages/react/dist/index.js');

    if (!HeadlessWalletProvider || typeof HeadlessWalletProvider !== 'function') {
      throw new Error('React HeadlessWalletProvider missing or invalid');
    }

    console.log('✅ React provider exports correctly');

    // Test that both packages only export what they should
    console.log('\n📋 Verifying simplified exports...');

    const vueExports = await import('../packages/vue/dist/index.js');
    const vueExportKeys = Object.keys(vueExports);

    if (vueExportKeys.length !== 1 || !vueExportKeys.includes('HeadlessWalletPlugin')) {
      console.warn('⚠️  Vue package exports:', vueExportKeys);
      console.warn('Expected only: HeadlessWalletPlugin');
    } else {
      console.log('✅ Vue package exports only HeadlessWalletPlugin');
    }

    const reactExports = await import('../packages/react/dist/index.js');
    const reactExportKeys = Object.keys(reactExports);

    if (reactExportKeys.length !== 1 || !reactExportKeys.includes('HeadlessWalletProvider')) {
      console.warn('⚠️  React package exports:', reactExportKeys);
      console.warn('Expected only: HeadlessWalletProvider');
    } else {
      console.log('✅ React package exports only HeadlessWalletProvider');
    }

    // Test basic wallet functionality through window.ethereum
    console.log('\n🔗 Testing wallet functionality through injected provider...');

    const accounts = await global.window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from injected provider');
    }
    console.log('✅ Accounts retrieved:', accounts[0]);

    const chainId = await global.window.ethereum.request({ method: 'eth_chainId' });
    if (!chainId) {
      throw new Error('No chain ID returned');
    }
    console.log('✅ Chain ID retrieved:', chainId);

    const signature = await global.window.ethereum.request({
      method: 'personal_sign',
      params: ['Test message from simplified package', accounts[0]]
    });

    if (!signature || !signature.startsWith('0x')) {
      throw new Error('Invalid signature returned');
    }
    console.log('✅ Real signature generated:', signature.substring(0, 20) + '...');

    console.log('\n🎉 All simplified package tests passed!');
    return true;

  } catch (error) {
    console.error('\n❌ Simplified package test failed:', error.message);
    allTestsPassed = false;
    return false;
  }
}

// Run the test
testSimplifiedPackages().then(success => {
  if (success) {
    console.log('\n✅ Simplified packages are working correctly!');
    console.log('\n💡 Key benefits of simplification:');
    console.log('   - Vue plugin: Only exports HeadlessWalletPlugin');
    console.log('   - React provider: Only exports HeadlessWalletProvider');
    console.log('   - Both simply inject window.ethereum for standard tooling');
    console.log('   - Developers use wagmi, ethers, viem, etc. for wallet interaction');
    console.log('   - No custom hooks/composables to learn or maintain');
    process.exit(0);
  } else {
    console.error('\n💥 Simplified package tests failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Test execution failed:', error);
  process.exit(1);
});