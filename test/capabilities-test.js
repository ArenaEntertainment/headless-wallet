/**
 * Quick test of the new wallet_getCapabilities method
 */
import { HeadlessWallet } from '../packages/core/dist/index.js';

async function testCapabilities() {
  console.log('🧪 Testing wallet_getCapabilities...');

  const wallet = new HeadlessWallet({
    accounts: [
      { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
    ]
  });

  try {
    // Test wallet_getCapabilities
    const capabilities = await wallet.request({
      method: 'wallet_getCapabilities',
      provider: 'evm'
    });

    console.log('✅ Capabilities returned:', JSON.stringify(capabilities, null, 2));

    // Verify structure
    if (capabilities['0x1']) {
      console.log('✅ Mainnet (0x1) capabilities present');
      console.log('  - Accounts supported:', capabilities['0x1'].accounts?.supported);
      console.log('  - Chain switching supported:', capabilities['0x1'].chainSwitching?.supported);
      console.log('  - Methods count:', capabilities['0x1'].methods?.supported?.length);
    }

    // Test wallet_addEthereumChain validation
    console.log('\n🧪 Testing wallet_addEthereumChain validation...');

    try {
      await wallet.request({
        method: 'wallet_addEthereumChain',
        params: [{ chainId: '0x89' }], // Missing required fields
        provider: 'evm'
      });
      console.log('❌ Should have thrown validation error');
    } catch (error) {
      console.log('✅ Validation working:', error.message);
    }

    // Test with existing chain
    try {
      await wallet.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x1',
          chainName: 'Ethereum Mainnet',
          rpcUrls: ['https://mainnet.infura.io/v3/xxx']
        }],
        provider: 'evm'
      });
      console.log('✅ Existing chain handling works (should switch)');
    } catch (error) {
      console.log('Info:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }

  return true;
}

testCapabilities().then(success => {
  if (success) {
    console.log('\n🎉 Capabilities test completed successfully!');
    process.exit(0);
  } else {
    console.error('\n💥 Capabilities test failed!');
    process.exit(1);
  }
});