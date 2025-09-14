#!/usr/bin/env node
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// Generate the same test keypair from the test file
const seed = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
  seed[i] = i;
}

// Create keypair from seed
const keypair = Keypair.fromSeed(seed);
const secretKey = keypair.secretKey;

console.log('Solana Test Key Generation');
console.log('===========================\n');

console.log('Secret Key (64 bytes):');
console.log('- Length:', secretKey.length, 'bytes');
console.log('- Uint8Array:', Array.from(secretKey));
console.log('- Hex (0x):', '0x' + Buffer.from(secretKey).toString('hex'));
console.log('- Hex (no prefix):', Buffer.from(secretKey).toString('hex'));
console.log('- Base64:', Buffer.from(secretKey).toString('base64'));
console.log('- Base58:', bs58.encode(secretKey));
console.log('- JSON Array:', JSON.stringify(Array.from(secretKey)));

console.log('\nPublic Key:');
console.log('- Base58:', keypair.publicKey.toBase58());

// Verify base58 decoding
const base58String = bs58.encode(secretKey);
const decodedBase58 = bs58.decode(base58String);
console.log('\nBase58 Verification:');
console.log('- Original length:', secretKey.length);
console.log('- Base58 string:', base58String);
console.log('- Base58 string length:', base58String.length, 'characters');
console.log('- Decoded length:', decodedBase58.length);
console.log('- Matches original:', Buffer.from(decodedBase58).equals(Buffer.from(secretKey)));