import { HeadlessWallet } from '../packages/core/dist/index.js';

const wallet = new HeadlessWallet({
  accounts: [
    { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
  ]
});

console.log('✅ HeadlessWallet created');
console.log('hasEVM:', wallet.hasEVM());
console.log('hasSolana:', wallet.hasSolana());

try {
  const accounts = await wallet.request({ method: 'eth_accounts' });
  console.log('✅ Accounts:', accounts);

  const signature = await wallet.request({
    method: 'personal_sign',
    params: ['Test message', accounts[0]]
  });

  console.log('✅ Real signature:', signature);

} catch (error) {
  console.error('❌ Error:', error.message);
}