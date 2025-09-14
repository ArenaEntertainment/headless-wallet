import { Keypair } from '@solana/web3.js';

// Generate a test keypair
const testKeypair = Keypair.generate();
const secretKey = testKeypair.secretKey;
const publicKey = testKeypair.publicKey.toString();

console.log('Test Solana Keys:');
console.log('================');
console.log('Secret Key (Uint8Array):', Array.from(secretKey));
console.log('Secret Key (hex):', Buffer.from(secretKey).toString('hex'));
console.log('Secret Key (hex with 0x):', '0x' + Buffer.from(secretKey).toString('hex'));
console.log('Secret Key (base64):', Buffer.from(secretKey).toString('base64'));
console.log('Secret Key (JSON array):', JSON.stringify(Array.from(secretKey)));
console.log('Public Key:', publicKey);
console.log('Secret Key Length:', secretKey.length, 'bytes');

// Try to encode with base58 (note: this typically doesn't work for secret keys)
try {
  const bs58 = await import('bs58');
  console.log('Secret Key (base58):', bs58.default.encode(secretKey));
} catch (e) {
  console.log('Note: bs58 not available, skipping base58 encoding');
}