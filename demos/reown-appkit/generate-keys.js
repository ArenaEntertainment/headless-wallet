import { Keypair } from '@solana/web3.js';

console.log('Generating 3 valid Solana keypairs...\n');

for (let i = 0; i < 3; i++) {
  const keypair = Keypair.generate();
  const secretKey = Array.from(keypair.secretKey);

  console.log(`// Account ${i} - Public Key: ${keypair.publicKey.toString()}`);
  console.log(`new Uint8Array([${secretKey.join(', ')}]),`);
  console.log('');
}