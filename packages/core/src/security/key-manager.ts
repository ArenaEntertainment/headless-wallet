const nacl = require('tweetnacl');
import { scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Secure key management system
 * Implements encryption at rest and secure key derivation
 *
 * SECURITY WARNING: This is a basic implementation.
 * For production, consider using:
 * - Hardware Security Modules (HSMs)
 * - Secure Enclaves (iOS Secure Enclave, Android TrustZone)
 * - Multi-Party Computation (MPC)
 */
export class SecureKeyManager {
  private encryptedKeys: Map<string, EncryptedKey> = new Map();
  private sessionKeys: Map<string, Uint8Array> = new Map();
  private readonly SALT_LENGTH = 32;
  private readonly KEY_LENGTH = 32;
  private readonly SCRYPT_N = 16384; // CPU/memory cost
  private readonly SCRYPT_R = 8;     // Block size
  private readonly SCRYPT_P = 1;     // Parallelization

  /**
   * Encrypt a private key with a password
   */
  async encryptKey(
    keyId: string,
    privateKey: Uint8Array | string,
    password: string
  ): Promise<void> {
    // Convert to Uint8Array if needed
    const keyBytes = typeof privateKey === 'string'
      ? this.hexToBytes(privateKey)
      : privateKey;

    // Generate salt for key derivation
    const salt = nacl.randomBytes(this.SALT_LENGTH);

    // Derive encryption key from password
    const derivedKey = await this.deriveKey(password, salt);

    // Generate nonce for encryption
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);

    // Encrypt the private key
    const encryptedData = nacl.secretbox(keyBytes, nonce, derivedKey);

    // Store encrypted key
    this.encryptedKeys.set(keyId, {
      salt,
      nonce,
      encryptedData,
      algorithm: 'nacl.secretbox',
      scryptParams: {
        N: this.SCRYPT_N,
        r: this.SCRYPT_R,
        p: this.SCRYPT_P,
      },
    });

    // Clear sensitive data from memory
    this.clearMemory(keyBytes);
    this.clearMemory(derivedKey);
  }

  /**
   * Decrypt a private key with a password
   */
  async decryptKey(keyId: string, password: string): Promise<Uint8Array> {
    const encryptedKey = this.encryptedKeys.get(keyId);
    if (!encryptedKey) {
      throw new Error('Key not found');
    }

    // Derive decryption key from password
    const derivedKey = await this.deriveKey(password, encryptedKey.salt);

    // Decrypt the private key
    const decrypted = nacl.secretbox.open(
      encryptedKey.encryptedData,
      encryptedKey.nonce,
      derivedKey
    );

    // Clear derived key from memory
    this.clearMemory(derivedKey);

    if (!decrypted) {
      throw new Error('Invalid password or corrupted data');
    }

    return decrypted;
  }

  /**
   * Unlock a key for a session
   */
  async unlockKeyForSession(
    keyId: string,
    password: string,
    sessionDurationMs: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<void> {
    const decryptedKey = await this.decryptKey(keyId, password);

    // Store in session cache
    this.sessionKeys.set(keyId, decryptedKey);

    // Auto-lock after session duration
    setTimeout(() => {
      this.lockKey(keyId);
    }, sessionDurationMs);
  }

  /**
   * Get a key from session cache
   */
  getSessionKey(keyId: string): Uint8Array | null {
    return this.sessionKeys.get(keyId) || null;
  }

  /**
   * Lock a key (remove from session cache)
   */
  lockKey(keyId: string): void {
    const key = this.sessionKeys.get(keyId);
    if (key) {
      this.clearMemory(key);
      this.sessionKeys.delete(keyId);
    }
  }

  /**
   * Lock all keys
   */
  lockAllKeys(): void {
    for (const [keyId, key] of this.sessionKeys) {
      this.clearMemory(key);
    }
    this.sessionKeys.clear();
  }

  /**
   * Derive a key from password using scrypt
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
    // Note: Node.js crypto.scrypt doesn't support custom N, r, p parameters in the same way
    // For production, consider using a library like scrypt-js or @noble/hashes
    const key = await scryptAsync(
      password,
      salt,
      this.KEY_LENGTH
    ) as Buffer;

    return new Uint8Array(key);
  }

  /**
   * Clear sensitive data from memory
   * Note: This is best-effort in JavaScript
   */
  private clearMemory(data: Uint8Array): void {
    if (data && data.length > 0) {
      crypto.getRandomValues(data);
      data.fill(0);
    }
  }

  /**
   * Convert hex string to bytes
   */
  private hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  /**
   * Export encrypted keys for backup
   */
  exportEncryptedKeys(): string {
    const keys: Record<string, EncryptedKeyExport> = {};

    for (const [keyId, encKey] of this.encryptedKeys) {
      keys[keyId] = {
        salt: Buffer.from(encKey.salt).toString('base64'),
        nonce: Buffer.from(encKey.nonce).toString('base64'),
        encryptedData: Buffer.from(encKey.encryptedData).toString('base64'),
        algorithm: encKey.algorithm,
        scryptParams: encKey.scryptParams,
      };
    }

    return JSON.stringify(keys, null, 2);
  }

  /**
   * Import encrypted keys from backup
   */
  importEncryptedKeys(backup: string): void {
    const keys = JSON.parse(backup) as Record<string, EncryptedKeyExport>;

    for (const [keyId, encKey] of Object.entries(keys)) {
      this.encryptedKeys.set(keyId, {
        salt: new Uint8Array(Buffer.from(encKey.salt, 'base64')),
        nonce: new Uint8Array(Buffer.from(encKey.nonce, 'base64')),
        encryptedData: new Uint8Array(Buffer.from(encKey.encryptedData, 'base64')),
        algorithm: encKey.algorithm,
        scryptParams: encKey.scryptParams,
      });
    }
  }
}

interface EncryptedKey {
  salt: Uint8Array;
  nonce: Uint8Array;
  encryptedData: Uint8Array;
  algorithm: string;
  scryptParams: {
    N: number;
    r: number;
    p: number;
  };
}

interface EncryptedKeyExport {
  salt: string;
  nonce: string;
  encryptedData: string;
  algorithm: string;
  scryptParams: {
    N: number;
    r: number;
    p: number;
  };
}

// Export singleton instance
export const keyManager = new SecureKeyManager();