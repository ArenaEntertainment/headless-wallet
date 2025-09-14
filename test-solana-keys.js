import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

console.log('Testing Solana key formats:\n');

// Create a test keypair
const keypair = Keypair.generate();
const secretKey = keypair.secretKey; // This is a Uint8Array of 64 bytes

console.log('Generated keypair:');
console.log('Secret key length:', secretKey.length, 'bytes');
console.log('Public key:', keypair.publicKey.toBase58());

// Test different formats
console.log('\n=== Different secret key formats ===\n');

// 1. Uint8Array (standard)
console.log('1. Uint8Array (first 10 bytes):', Array.from(secretKey.slice(0, 10)));

// 2. Base58 encoding
const base58Secret = bs58.encode(secretKey);
console.log('2. Base58 encoded:', base58Secret);
console.log('   Base58 length:', base58Secret.length, 'characters');

// 3. Hex encoding
const hexSecret = Buffer.from(secretKey).toString('hex');
console.log('3. Hex encoded (first 20 chars):', hexSecret.slice(0, 20) + '...');
console.log('   Hex length:', hexSecret.length, 'characters');

// 4. Base64 encoding
const base64Secret = Buffer.from(secretKey).toString('base64');
console.log('4. Base64 encoded:', base64Secret);
console.log('   Base64 length:', base64Secret.length, 'characters');

// 5. JSON array
const jsonArraySecret = JSON.stringify(Array.from(secretKey));
console.log('5. JSON array (first 50 chars):', jsonArraySecret.slice(0, 50) + '...');
console.log('   JSON length:', jsonArraySecret.length, 'characters');

// Test decoding back to Uint8Array
console.log('\n=== Testing decoding ===\n');

try {
  // Decode from base58
  const decodedBase58 = bs58.decode(base58Secret);
  const keypairFromBase58 = Keypair.fromSecretKey(decodedBase58);
  console.log('Base58 decoded successfully:', keypairFromBase58.publicKey.toBase58() === keypair.publicKey.toBase58());
} catch (e) {
  console.log('Base58 decode error:', e.message);
}

try {
  // Decode from hex
  const decodedHex = Buffer.from(hexSecret, 'hex');
  const keypairFromHex = Keypair.fromSecretKey(decodedHex);
  console.log('Hex decoded successfully:', keypairFromHex.publicKey.toBase58() === keypair.publicKey.toBase58());
} catch (e) {
  console.log('Hex decode error:', e.message);
}

try {
  // Decode from base64
  const decodedBase64 = Buffer.from(base64Secret, 'base64');
  const keypairFromBase64 = Keypair.fromSecretKey(decodedBase64);
  console.log('Base64 decoded successfully:', keypairFromBase64.publicKey.toBase58() === keypair.publicKey.toBase58());
} catch (e) {
  console.log('Base64 decode error:', e.message);
}

// Test common wallet export formats
console.log('\n=== Common wallet formats ===\n');

// Phantom wallet style - they export as JSON array
console.log('Phantom wallet exports as: JSON array of numbers');

// Solana CLI format
console.log('Solana CLI keypair file: JSON array in a file');

// Some wallets use base58
console.log('Some wallets/tools: Base58 encoded string');

// Test a real-world example
console.log('\n=== Real-world example ===\n');

// This is a common test key used in Solana examples
const testSecretKey = new Uint8Array([
  37,21,197,185,105,201,212,148,164,108,251,159,174,252,43,246,
  225,156,38,203,99,74,61,73,158,96,253,107,244,123,155,55,
  15,36,62,12,238,130,61,58,163,194,152,195,122,73,184,86,
  232,138,110,125,1,113,189,211,36,250,22,222,83,46,137,163
]);

try {
  const testKeypair = Keypair.fromSecretKey(testSecretKey);
  console.log('Test keypair public key:', testKeypair.publicKey.toBase58());
  console.log('Test keypair as base58:', bs58.encode(testSecretKey));
} catch (e) {
  console.log('Test keypair error:', e.message);
}