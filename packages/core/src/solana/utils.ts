import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';

/**
 * Converts various Solana key formats to Uint8Array
 * Supports:
 * - Uint8Array (64 bytes) - returns as is
 * - JSON array string - parses array of numbers
 * - Base58 string - decodes from base58 (common for Solana)
 * - Hex string (0x prefixed or not) - decodes from hex
 * - Base64 string - decodes from base64
 */
export function convertSolanaKey(key: string | Uint8Array | any): Uint8Array {
  // If already Uint8Array, validate and return
  if (key instanceof Uint8Array) {
    if (key.length !== 64) {
      throw new Error(`Invalid Solana secret key: expected 64 bytes, got ${key.length}`);
    }
    return key;
  }

  // Handle serialized Uint8Array (plain object with numeric keys)
  if (typeof key === 'object' && key !== null && !Array.isArray(key)) {
    // Check if it looks like a serialized Uint8Array: {0: 1, 1: 2, ...}
    const keys = Object.keys(key);
    const isSerializedUint8Array = keys.every(k => !isNaN(Number(k))) &&
      keys.length > 0 &&
      typeof key[0] === 'number';

    if (isSerializedUint8Array) {
      try {
        const bytes = new Uint8Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
          bytes[i] = key[i];
        }
        if (bytes.length !== 64) {
          throw new Error(`Invalid Solana secret key: expected 64 bytes, got ${bytes.length}`);
        }
        return bytes;
      } catch (e) {
        throw new Error('Invalid serialized Uint8Array format for Solana secret key');
      }
    }
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
    } else if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(key)) {
      // Base58 format - uses specific alphabet without 0, O, I, l
      // This is the most common format for Solana keys
      // Check this BEFORE base64 since base58 is more restrictive
      try {
        bytes = base58ToBytes(key);
      } catch (e: any) {
        throw new Error(`Invalid base58 format: ${e.message || e}`);
      }
    } else if (/^[A-Za-z0-9+/]+=*$/.test(key)) {
      // Base64 format (contains +, /, or = which are not in base58)
      // This must come AFTER base58 check
      bytes = base64ToBytes(key);
    } else {
      throw new Error(`Invalid Solana secret key format: could not identify format (not JSON array, hex, base64, or base58)`);
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

function base58ToBytes(base58String: string): Uint8Array {
  try {
    // Use the bs58 library for proper base58 decoding
    // Handle both ESM and CommonJS imports
    const bs58Module = (bs58 as any).default || bs58;
    const decoded = bs58Module.decode(base58String);

    // Ensure it's a Uint8Array
    if (!(decoded instanceof Uint8Array)) {
      return new Uint8Array(decoded);
    }
    return decoded;
  } catch (e: any) {
    throw new Error(`Invalid base58 string: ${e.message || e}`);
  }
}

/**
 * Creates a Keypair from various key formats
 */
export function createKeypairFromKey(key: string | Uint8Array): Keypair {
  const secretKey = convertSolanaKey(key);
  return Keypair.fromSecretKey(secretKey);
}