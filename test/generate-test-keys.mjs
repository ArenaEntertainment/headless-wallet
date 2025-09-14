import('@solana/web3.js').then(({ Keypair }) => {
  // Use a fixed seed for consistency
  const seed = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    seed[i] = i;
  }

  const testKeypair = Keypair.fromSeed(seed);
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
});