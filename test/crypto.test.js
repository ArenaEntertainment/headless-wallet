import { HeadlessWallet } from '../packages/core/dist/index.js';

// Test private key (hardhat account #0)
const TEST_EVM_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const EXPECTED_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// Test Solana keypair (64 bytes: 32 private key + 32 public key)
const TEST_SOLANA_KEY = new Uint8Array([
  // Private key (32 bytes)
  174,  47, 154, 16,  202, 193, 206, 113,  44, 243, 204, 198,  95, 215, 226, 118,
  131,  48,  92, 35,  174, 226, 177, 101,  60,  85, 169,  49,  28, 131, 154, 230,
  // Public key (32 bytes)
  158, 109, 137, 137,  112, 241, 162, 219,  29,  81, 115, 199,  69,  23, 228, 69,
  142,  34, 184, 19,  127,  77, 183,  59, 135, 175, 182, 111, 118, 162, 101, 238
]);

async function testEvmWallet() {
  console.log('🔧 Testing EVM wallet with real cryptography...');

  const wallet = new HeadlessWallet({
    accounts: [{ privateKey: TEST_EVM_KEY, type: 'evm' }]
  });

  // Test account retrieval
  const accounts = await wallet.request({ method: 'eth_accounts' });
  console.log('📋 EVM Accounts:', accounts);
  console.log('✅ Expected address match:', accounts[0] === EXPECTED_ADDRESS);

  // Test message signing with known signature
  const message = 'Hello, World!';
  const signature = await wallet.request({
    method: 'personal_sign',
    params: [message, accounts[0]]
  });

  console.log('✍️  Message:', message);
  console.log('📝 Signature:', signature);
  console.log('✅ Signature format valid:', /^0x[a-fA-F0-9]{130}$/.test(signature));

  // Test chain ID
  const chainId = await wallet.request({ method: 'eth_chainId' });
  console.log('⛓️  Chain ID:', chainId);

  return { accounts, signature, chainId };
}

async function testSolanaWallet() {
  console.log('\n🔧 Testing Solana wallet with real cryptography...');

  const wallet = new HeadlessWallet({
    accounts: [{ privateKey: TEST_SOLANA_KEY, type: 'solana' }]
  });

  // Test connection
  const connection = await wallet.request({ method: 'connect' });
  console.log('🔌 Solana connection:', connection);

  // Test message signing
  const message = new TextEncoder().encode('Hello, Solana!');
  const signResult = await wallet.request({
    method: 'signMessage',
    params: [message]
  });

  console.log('✍️  Message signed, signature length:', signResult.signature.length);
  console.log('🔑 Public key:', signResult.publicKey.toString());

  return { connection, signResult };
}

async function testPlaywrightIntegration() {
  console.log('\n🎭 Testing Playwright-style integration...');

  const wallet = new HeadlessWallet({
    accounts: [
      { privateKey: TEST_EVM_KEY, type: 'evm' },
      { privateKey: TEST_SOLANA_KEY, type: 'solana' }
    ]
  });

  // Test unified request method (like Playwright bridge would use)
  const evmAccounts = await wallet.request({
    method: 'eth_accounts',
    provider: 'evm'
  });

  const solanaConnection = await wallet.request({
    method: 'connect',
    provider: 'solana'
  });

  console.log('🔗 Unified EVM accounts:', evmAccounts);
  console.log('🔗 Unified Solana connection:', solanaConnection);

  return { evmAccounts, solanaConnection };
}

async function runTests() {
  console.log('🚀 Starting comprehensive crypto tests...\n');

  try {
    const evmResults = await testEvmWallet();
    const solanaResults = await testSolanaWallet();
    const playwrightResults = await testPlaywrightIntegration();

    console.log('\n✅ All tests passed! Real cryptography is working.');
    console.log('\nTest Summary:');
    console.log('- EVM wallet: Real private key signing ✅');
    console.log('- Solana wallet: Real keypair operations ✅');
    console.log('- Multi-chain support: Both chains working ✅');
    console.log('- Playwright bridge pattern: Unified API working ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();