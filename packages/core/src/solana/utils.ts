import { Keypair } from '@solana/web3.js';

/**
 * Converts various Solana key formats to Uint8Array
 * Supports:
 * - Uint8Array (64 bytes) - returns as is
 * - JSON array string - parses array of numbers
 * - Base58 string - decodes from base58
 * - Hex string (0x prefixed or not) - decodes from hex
 * - Base64 string - decodes from base64
 */
export function convertSolanaKey(key: string | Uint8Array): Uint8Array {
  // If already Uint8Array, validate and return
  if (key instanceof Uint8Array) {
    if (key.length !== 64) {
      throw new Error(`Invalid Solana secret key: expected 64 bytes, got ${key.length}`);
    }
    return key;
  }

  // Handle string formats
  if (typeof key === 'string') {
    let bytes: Uint8Array;

    // Remove any whitespace
    key = key.trim();

    // Check if it's a JSON array string like "[1,2,3,...]"
    if (key.startsWith('[') && key.endsWith(']')) {
      try {
        const parsed = JSON.parse(key);
        if (Array.isArray(parsed)) {
          bytes = new Uint8Array(parsed);
        } else {
          throw new Error('Not an array');
        }
      } catch (e) {
        throw new Error(`Invalid JSON array format for Solana secret key`);
      }
    } else if (key.startsWith('0x')) {
      // Hex format with 0x prefix
      bytes = hexToBytes(key.slice(2));
    } else if (/^[0-9a-fA-F]+$/.test(key) && key.length === 128) {
      // Hex format without prefix (64 bytes = 128 hex chars)
      bytes = hexToBytes(key);
    } else if (/^[A-Za-z0-9+/]+=*$/.test(key)) {
      // Base64 format
      bytes = base64ToBytes(key);
    } else {
      // Assume base58 format (most common for Solana)
      // Try to use it directly with Keypair - it might handle base58 internally
      try {
        bytes = base58ToBytes(key);
      } catch (e) {
        throw new Error(`Invalid Solana secret key format: could not decode as JSON array, hex, base64, or base58`);
      }
    }

    // Validate length
    if (bytes.length !== 64) {
      throw new Error(`Invalid Solana secret key: expected 64 bytes, got ${bytes.length}`);
    }

    return bytes;
  }

  throw new Error('Solana secret key must be a string or Uint8Array');
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string: odd length');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(hex.substr(i * 2, 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hex string at position ${i * 2}`);
    }
    bytes[i] = byte;
  }
  return bytes;
}

function base64ToBytes(base64: string): Uint8Array {
  // Browser-compatible base64 decoding
  if (typeof atob !== 'undefined') {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } else if (typeof Buffer !== 'undefined') {
    // Node.js environment
    return new Uint8Array(Buffer.from(base64, 'base64'));
  } else {
    throw new Error('Base64 decoding not available in this environment');
  }
}

// Base58 alphabet used by Bitcoin and Solana
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58ToBytes(base58: string): Uint8Array {
  if (!base58 || base58.length === 0) {
    return new Uint8Array(0);
  }

  const bytes: number[] = [0];

  for (let i = 0; i < base58.length; i++) {
    const char = base58[i];
    const value = BASE58_ALPHABET.indexOf(char);

    if (value === -1) {
      throw new Error(`Invalid base58 character: ${char}`);
    }

    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }

    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // Handle leading zeros
  for (let i = 0; i < base58.length && base58[i] === '1'; i++) {
    bytes.push(0);
  }

  return new Uint8Array(bytes.reverse());
}

/**
 * Creates a Keypair from various key formats
 */
export function createKeypairFromKey(key: string | Uint8Array): Keypair {
  const secretKey = convertSolanaKey(key);
  return Keypair.fromSecretKey(secretKey);
}