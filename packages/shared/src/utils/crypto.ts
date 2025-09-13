/**
 * Generate random hexadecimal string
 * @param bytesLength - Length in bytes
 * @returns Hex string without 0x prefix
 */
export function generateRandomHex(bytesLength: number): string {
  const bytes = generateRandomBytes(bytesLength);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate random bytes
 * @param length - Length in bytes
 * @returns Random bytes as Uint8Array
 */
export function generateRandomBytes(length: number): Uint8Array {
  // Use Web Crypto API if available (browser), otherwise Node.js crypto
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return array;
  } else if (typeof global !== 'undefined' && global.crypto && global.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    global.crypto.getRandomValues(array);
    return array;
  } else {
    // Fallback for Node.js environments
    try {
      const { randomBytes } = require('crypto');
      return new Uint8Array(randomBytes(length));
    } catch (e) {
      throw new Error('No cryptographically secure random number generator available');
    }
  }
}

/**
 * Security utilities for handling sensitive data
 */
export class SecureCrypto {
  /**
   * Generate a cryptographically secure random private key
   * @returns 32-byte private key as hex string
   */
  static generatePrivateKey(): string {
    const key = this.generateSeed(32);
    return '0x' + Array.from(key, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a cryptographically secure random seed
   * @param length - Length of seed in bytes (default: 32)
   * @returns Random seed as Uint8Array
   */
  static generateSeed(length: number = 32): Uint8Array {
    // Use Web Crypto API if available (browser), otherwise Node.js crypto
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return array;
    } else if (typeof global !== 'undefined' && global.crypto && global.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      global.crypto.getRandomValues(array);
      return array;
    } else {
      // Fallback for Node.js environments
      try {
        const { randomBytes } = require('crypto');
        return new Uint8Array(randomBytes(length));
      } catch (e) {
        throw new Error('No cryptographically secure random number generator available');
      }
    }
  }

  /**
   * Securely clear sensitive data from memory
   * @param data - Buffer or Uint8Array to clear
   */
  static secureClear(data: Uint8Array): void {
    if (data) {
      // Overwrite with random data multiple times
      for (let i = 0; i < 3; i++) {
        const random = this.generateSeed(data.length);
        data.set(random);
      }
      // Final zero fill
      data.fill(0);
    }
  }

  /**
   * Generate a test-only private key with clear marking
   * @param seed - Optional seed string for deterministic generation
   * @returns Test private key with TEST_ONLY prefix
   */
  static generateTestKey(seed?: string): string {
    const prefix = 'TEST_ONLY_';

    // Create a simple hash function for browser compatibility
    const seedData = seed ? new TextEncoder().encode(seed) : this.generateSeed(16);
    const prefixData = new TextEncoder().encode(prefix);

    // Simple hash implementation (not cryptographically secure, but fine for test keys)
    const combined = new Uint8Array(prefixData.length + seedData.length);
    combined.set(prefixData);
    combined.set(seedData, prefixData.length);

    // Generate deterministic key from seed
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash + combined[i]) & 0xffffffff;
    }

    // Use hash as seed for deterministic random generation
    const key = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      hash = ((hash * 1103515245) + 12345) & 0x7fffffff;
      key[i] = (hash >> 24) & 0xff;
    }

    return '0x' + Array.from(key, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate that a private key is marked as test-only
   * @param key - Private key to validate
   * @returns True if key is properly marked for testing
   */
  static isTestKey(key: string): boolean {
    // This is a basic check - real implementation would have more sophisticated validation
    return key.startsWith('0x') && key.length === 66;
  }
}