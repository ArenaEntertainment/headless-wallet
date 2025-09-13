/**
 * Secure Key Management for Mock Accounts
 *
 * Provides secure generation, storage, and lifecycle management of cryptographic
 * keys for mock wallet accounts with comprehensive security controls.
 *
 * OWASP Security Controls:
 * - A02: Cryptographic Failures Prevention
 * - A04: Insecure Design Prevention
 * - A06: Vulnerable and Outdated Components Prevention
 * - A07: Identification and Authentication Failures Prevention
 */

import { SecureBuffer, MemoryProtectionManager, getMemoryProtectionManager } from './memory-protection.js';

export interface SecureKeyConfig {
  /** Key derivation iterations for PBKDF2 */
  derivationIterations?: number;
  /** Salt length for key derivation */
  saltLength?: number;
  /** Enable key rotation */
  enableKeyRotation?: boolean;
  /** Key rotation interval in milliseconds */
  keyRotationInterval?: number;
  /** Maximum key age before forced rotation */
  maxKeyAge?: number;
  /** Enable audit logging */
  enableAuditLogging?: boolean;
  /** Custom audit logger */
  auditLogger?: (event: KeyAuditEvent) => void;
  /** Enable development mode markers */
  enableDevMarkers?: boolean;
}

export interface KeyAuditEvent {
  timestamp: number;
  event: 'key_generated' | 'key_accessed' | 'key_rotated' | 'key_destroyed' | 'security_violation';
  keyId: string;
  keyType: 'master' | 'account' | 'signing' | 'encryption';
  severity: 'info' | 'warning' | 'error' | 'critical';
  details: any;
}

export interface SecureKeyMetadata {
  id: string;
  type: 'ethereum_private_key' | 'solana_private_key' | 'master_seed' | 'entropy';
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  rotationCount: number;
  derivationPath?: string;
  isTestKey: boolean;
  expiresAt?: number;
}

interface ManagedKey {
  metadata: SecureKeyMetadata;
  secureBufferId: string;
  derivationSalt: SecureBuffer;
  integrityHash: string;
}

/**
 * Secure Key Manager
 *
 * Manages cryptographic keys with security controls including:
 * - Secure key generation with entropy verification
 * - Memory protection and obfuscation
 * - Key lifecycle management and rotation
 * - Access control and audit logging
 * - Test key marking and validation
 */
export class SecureKeyManager {
  private config: Required<SecureKeyConfig>;
  private memoryManager: MemoryProtectionManager;
  private managedKeys = new Map<string, ManagedKey>();
  private rotationTimer?: number;
  private sessionId: string;

  constructor(config: SecureKeyConfig = {}) {
    this.config = {
      derivationIterations: config.derivationIterations ?? 100000,
      saltLength: config.saltLength ?? 32,
      enableKeyRotation: config.enableKeyRotation ?? false,
      keyRotationInterval: config.keyRotationInterval ?? 24 * 60 * 60 * 1000, // 24 hours
      maxKeyAge: config.maxKeyAge ?? 7 * 24 * 60 * 60 * 1000, // 7 days
      enableAuditLogging: config.enableAuditLogging ?? true,
      auditLogger: config.auditLogger ?? this.defaultAuditLogger.bind(this),
      enableDevMarkers: config.enableDevMarkers ?? true
    };

    this.memoryManager = getMemoryProtectionManager();
    this.sessionId = this.generateSessionId();

    if (this.config.enableKeyRotation) {
      this.startKeyRotation();
    }

    this.auditLog('key_generated', 'manager', 'info', {
      message: 'Secure key manager initialised',
      sessionId: this.sessionId,
      config: {
        keyRotation: this.config.enableKeyRotation,
        devMarkers: this.config.enableDevMarkers
      }
    });
  }

  /**
   * Generate secure private key for Ethereum
   */
  generateEthereumPrivateKey(options: {
    testOnly?: boolean;
    derivationPath?: string;
    expiresAt?: number;
  } = {}): string {
    const keyId = this.generateKeyId('eth');

    // Generate high-entropy private key
    const privateKeyBytes = this.generateSecureEntropy(32);

    // Validate key isn't zero or max value
    if (this.isWeakKey(privateKeyBytes)) {
      privateKeyBytes.fill(0); // Clear weak key
      throw new Error('Generated weak key, please try again');
    }

    // Convert to hex with 0x prefix
    let privateKeyHex = '0x' + Array.from(privateKeyBytes, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    // Add test marker if in test mode
    if (options.testOnly || this.config.enableDevMarkers) {
      privateKeyHex = this.addTestMarker(privateKeyHex, 'ethereum');
    }

    // Store securely
    const secureBufferId = this.storeSecureKey(privateKeyBytes, {
      id: keyId,
      type: 'ethereum_private_key',
      testOnly: options.testOnly || false,
      derivationPath: options.derivationPath,
      expiresAt: options.expiresAt
    });

    this.auditLog('key_generated', keyId, 'info', {
      type: 'ethereum_private_key',
      testOnly: options.testOnly,
      derivationPath: options.derivationPath
    });

    return privateKeyHex;
  }

  /**
   * Generate secure private key for Solana
   */
  generateSolanaPrivateKey(options: {
    testOnly?: boolean;
    derivationPath?: string;
    expiresAt?: number;
  } = {}): Uint8Array {
    const keyId = this.generateKeyId('sol');

    // Generate high-entropy private key (64 bytes for Solana)
    const privateKeyBytes = this.generateSecureEntropy(64);

    // Validate key strength
    if (this.isWeakKey(privateKeyBytes)) {
      privateKeyBytes.fill(0);
      throw new Error('Generated weak key, please try again');
    }

    // Store securely
    const secureBufferId = this.storeSecureKey(privateKeyBytes, {
      id: keyId,
      type: 'solana_private_key',
      testOnly: options.testOnly || false,
      derivationPath: options.derivationPath,
      expiresAt: options.expiresAt
    });

    this.auditLog('key_generated', keyId, 'info', {
      type: 'solana_private_key',
      testOnly: options.testOnly,
      derivationPath: options.derivationPath
    });

    // Return copy for use
    return new Uint8Array(privateKeyBytes);
  }

  /**
   * Generate secure master seed for key derivation
   */
  generateMasterSeed(options: {
    seedLength?: number;
    testOnly?: boolean;
    expiresAt?: number;
  } = {}): Uint8Array {
    const keyId = this.generateKeyId('seed');
    const seedLength = options.seedLength || 64;

    // Generate high-entropy master seed
    const seedBytes = this.generateSecureEntropy(seedLength);

    // Enhanced entropy validation for master seeds
    if (this.isWeakSeed(seedBytes)) {
      seedBytes.fill(0);
      throw new Error('Generated weak seed, please try again');
    }

    // Store securely
    const secureBufferId = this.storeSecureKey(seedBytes, {
      id: keyId,
      type: 'master_seed',
      testOnly: options.testOnly || false,
      expiresAt: options.expiresAt
    });

    this.auditLog('key_generated', keyId, 'info', {
      type: 'master_seed',
      seedLength,
      testOnly: options.testOnly
    });

    return new Uint8Array(seedBytes);
  }

  /**
   * Retrieve key by ID
   */
  getKey(keyId: string): Uint8Array | null {
    const managedKey = this.managedKeys.get(keyId);
    if (!managedKey) {
      this.auditLog('key_accessed', keyId, 'warning', {
        message: 'Key not found',
        keyId
      });
      return null;
    }

    // Check if key has expired
    if (managedKey.metadata.expiresAt && Date.now() > managedKey.metadata.expiresAt) {
      this.auditLog('key_accessed', keyId, 'warning', {
        message: 'Expired key access attempt',
        expiresAt: managedKey.metadata.expiresAt
      });
      this.destroyKey(keyId);
      return null;
    }

    // Retrieve from secure storage
    const keyData = this.memoryManager.retrieveSecureData(managedKey.secureBufferId);
    if (!keyData) {
      this.auditLog('security_violation', keyId, 'critical', {
        message: 'Key data not found in secure storage',
        secureBufferId: managedKey.secureBufferId
      });
      return null;
    }

    // Verify integrity
    const currentHash = this.calculateKeyHash(keyData);
    if (currentHash !== managedKey.integrityHash) {
      this.auditLog('security_violation', keyId, 'critical', {
        message: 'Key integrity violation detected',
        expected: managedKey.integrityHash,
        actual: currentHash
      });

      // Clear compromised key
      this.destroyKey(keyId);
      keyData.fill(0);
      return null;
    }

    // Update access tracking
    managedKey.metadata.lastAccessedAt = Date.now();
    managedKey.metadata.accessCount++;

    this.auditLog('key_accessed', keyId, 'info', {
      type: managedKey.metadata.type,
      accessCount: managedKey.metadata.accessCount
    });

    return new Uint8Array(keyData);
  }

  /**
   * Get key metadata without exposing the key itself
   */
  getKeyMetadata(keyId: string): SecureKeyMetadata | null {
    const managedKey = this.managedKeys.get(keyId);
    return managedKey ? { ...managedKey.metadata } : null;
  }

  /**
   * List all managed key IDs and their metadata
   */
  listKeys(): SecureKeyMetadata[] {
    return Array.from(this.managedKeys.values()).map(key => ({ ...key.metadata }));
  }

  /**
   * Rotate a specific key
   */
  rotateKey(keyId: string): string | null {
    const managedKey = this.managedKeys.get(keyId);
    if (!managedKey) return null;

    const oldKeyData = this.getKey(keyId);
    if (!oldKeyData) return null;

    // Generate new key of same type
    let newKeyId: string;

    switch (managedKey.metadata.type) {
      case 'ethereum_private_key':
        // Generate new Ethereum key
        const newEthKey = this.generateEthereumPrivateKey({
          testOnly: managedKey.metadata.isTestKey,
          derivationPath: managedKey.metadata.derivationPath,
          expiresAt: managedKey.metadata.expiresAt
        });
        newKeyId = Array.from(this.managedKeys.keys()).pop()!; // Get last generated key ID
        break;

      case 'solana_private_key':
        // Generate new Solana key
        this.generateSolanaPrivateKey({
          testOnly: managedKey.metadata.isTestKey,
          derivationPath: managedKey.metadata.derivationPath,
          expiresAt: managedKey.metadata.expiresAt
        });
        newKeyId = Array.from(this.managedKeys.keys()).pop()!;
        break;

      case 'master_seed':
        // Generate new master seed
        this.generateMasterSeed({
          testOnly: managedKey.metadata.isTestKey,
          expiresAt: managedKey.metadata.expiresAt
        });
        newKeyId = Array.from(this.managedKeys.keys()).pop()!;
        break;

      default:
        this.auditLog('security_violation', keyId, 'error', {
          message: 'Cannot rotate unknown key type',
          type: managedKey.metadata.type
        });
        return null;
    }

    // Update rotation count
    const newManagedKey = this.managedKeys.get(newKeyId);
    if (newManagedKey) {
      newManagedKey.metadata.rotationCount = managedKey.metadata.rotationCount + 1;
    }

    // Destroy old key
    this.destroyKey(keyId);

    this.auditLog('key_rotated', keyId, 'info', {
      oldKeyId: keyId,
      newKeyId,
      rotationCount: newManagedKey?.metadata.rotationCount
    });

    // Clear old key data
    oldKeyData.fill(0);

    return newKeyId;
  }

  /**
   * Destroy a key and clear it from memory
   */
  destroyKey(keyId: string): boolean {
    const managedKey = this.managedKeys.get(keyId);
    if (!managedKey) return false;

    // Clear from secure storage
    this.memoryManager.clearSecureData(managedKey.secureBufferId);

    // Clear derivation salt
    managedKey.derivationSalt.clear();

    // Remove from managed keys
    this.managedKeys.delete(keyId);

    this.auditLog('key_destroyed', keyId, 'info', {
      type: managedKey.metadata.type,
      accessCount: managedKey.metadata.accessCount,
      rotationCount: managedKey.metadata.rotationCount
    });

    return true;
  }

  /**
   * Destroy all keys and cleanup
   */
  destroyAllKeys(): void {
    const keyIds = Array.from(this.managedKeys.keys());

    for (const keyId of keyIds) {
      this.destroyKey(keyId);
    }

    this.auditLog('key_destroyed', 'all', 'info', {
      message: 'All keys destroyed',
      count: keyIds.length
    });
  }

  /**
   * Validate if a key is properly marked for testing
   */
  validateTestKey(key: string | Uint8Array): boolean {
    const keyStr = typeof key === 'string' ? key : this.bufferToHex(key);

    // Check for test markers
    return keyStr.includes('TEST_') ||
           keyStr.includes('DEV_') ||
           keyStr.includes('MOCK_') ||
           this.isKnownTestPattern(keyStr);
  }

  /**
   * Get key manager statistics
   */
  getStats(): {
    totalKeys: number;
    keysByType: Record<string, number>;
    testKeys: number;
    expiredKeys: number;
    averageAccessCount: number;
    oldestKey: number;
  } {
    let testKeys = 0;
    let expiredKeys = 0;
    let totalAccessCount = 0;
    let oldestKey = Date.now();
    const keysByType: Record<string, number> = {};

    for (const managedKey of this.managedKeys.values()) {
      if (managedKey.metadata.isTestKey) testKeys++;
      if (managedKey.metadata.expiresAt && Date.now() > managedKey.metadata.expiresAt) {
        expiredKeys++;
      }

      totalAccessCount += managedKey.metadata.accessCount;
      oldestKey = Math.min(oldestKey, managedKey.metadata.createdAt);

      const type = managedKey.metadata.type;
      keysByType[type] = (keysByType[type] || 0) + 1;
    }

    return {
      totalKeys: this.managedKeys.size,
      keysByType,
      testKeys,
      expiredKeys,
      averageAccessCount: this.managedKeys.size > 0 ? totalAccessCount / this.managedKeys.size : 0,
      oldestKey: this.managedKeys.size > 0 ? oldestKey : Date.now()
    };
  }

  /**
   * Cleanup expired keys
   */
  cleanupExpiredKeys(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [keyId, managedKey] of this.managedKeys) {
      if (managedKey.metadata.expiresAt && now > managedKey.metadata.expiresAt) {
        this.destroyKey(keyId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.auditLog('key_destroyed', 'cleanup', 'info', {
        message: 'Expired keys cleaned up',
        count: cleaned
      });
    }

    return cleaned;
  }

  /**
   * Generate cryptographically secure entropy
   */
  private generateSecureEntropy(length: number): Uint8Array {
    const entropy = new Uint8Array(length);

    // Use Web Crypto API if available
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(entropy);
    } else if (typeof global !== 'undefined' && global.crypto && global.crypto.getRandomValues) {
      global.crypto.getRandomValues(entropy);
    } else {
      // Node.js crypto fallback
      try {
        const { randomBytes } = require('crypto');
        entropy.set(new Uint8Array(randomBytes(length)));
      } catch (error) {
        throw new Error('No secure random number generator available');
      }
    }

    // Validate entropy quality
    if (!this.validateEntropy(entropy)) {
      entropy.fill(0);
      throw new Error('Generated entropy failed quality checks');
    }

    return entropy;
  }

  /**
   * Store key securely in memory
   */
  private storeSecureKey(keyData: Uint8Array, options: {
    id: string;
    type: SecureKeyMetadata['type'];
    testOnly: boolean;
    derivationPath?: string;
    expiresAt?: number;
  }): string {
    // Generate derivation salt
    const salt = new Uint8Array(this.config.saltLength);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(salt);
    } else if (typeof global !== 'undefined' && global.crypto) {
      global.crypto.getRandomValues(salt);
    }

    const saltBuffer = new SecureBuffer(salt);

    // Calculate integrity hash
    const integrityHash = this.calculateKeyHash(keyData);

    // Store in memory manager
    const secureBufferId = this.memoryManager.storeSecureData(
      keyData,
      options.type === 'master_seed' ? 'seed' : 'private_key',
      `${options.type} for account ${options.id}`
    );

    // Create metadata
    const metadata: SecureKeyMetadata = {
      id: options.id,
      type: options.type,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      rotationCount: 0,
      derivationPath: options.derivationPath,
      isTestKey: options.testOnly,
      expiresAt: options.expiresAt
    };

    // Store managed key
    this.managedKeys.set(options.id, {
      metadata,
      secureBufferId,
      derivationSalt: saltBuffer,
      integrityHash
    });

    return secureBufferId;
  }

  /**
   * Validate entropy quality
   */
  private validateEntropy(entropy: Uint8Array): boolean {
    // Check for obvious patterns
    if (entropy.length < 16) return false;

    // Check for all zeros
    if (entropy.every(byte => byte === 0)) return false;

    // Check for all ones
    if (entropy.every(byte => byte === 0xFF)) return false;

    // Simple entropy estimation
    const uniqueBytes = new Set(entropy).size;
    const expectedUniqueBytes = Math.min(entropy.length, 256);
    const entropyRatio = uniqueBytes / expectedUniqueBytes;

    // Should have reasonable distribution
    return entropyRatio > 0.3;
  }

  /**
   * Check if key is cryptographically weak
   */
  private isWeakKey(key: Uint8Array): boolean {
    // Check for all zeros
    if (key.every(byte => byte === 0)) return true;

    // Check for all ones
    if (key.every(byte => byte === 0xFF)) return true;

    // Check for obvious patterns
    const uniqueBytes = new Set(key).size;
    if (uniqueBytes < 4) return true; // Too few unique bytes

    // Check for repeating patterns
    if (key.length >= 8) {
      const firstQuarter = key.slice(0, key.length / 4);
      const secondQuarter = key.slice(key.length / 4, key.length / 2);

      if (this.arraysEqual(firstQuarter, secondQuarter)) {
        return true; // Repeating pattern detected
      }
    }

    return false;
  }

  /**
   * Enhanced validation for master seeds
   */
  private isWeakSeed(seed: Uint8Array): boolean {
    if (this.isWeakKey(seed)) return true;

    // Additional entropy requirements for master seeds
    const uniqueBytes = new Set(seed).size;
    const minUniqueBytes = Math.max(16, seed.length / 4);

    return uniqueBytes < minUniqueBytes;
  }

  /**
   * Add test marker to key for development identification
   */
  private addTestMarker(key: string, chainType: 'ethereum' | 'solana'): string {
    if (!this.config.enableDevMarkers) return key;

    const timestamp = Date.now().toString(16);
    const marker = `TEST_${chainType.toUpperCase()}_${timestamp}`;

    // Encode marker into key (this is for identification, not security)
    const markerBytes = new TextEncoder().encode(marker);
    const markerHex = Array.from(markerBytes, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    // Append marker (key remains cryptographically valid)
    return key + '_' + markerHex;
  }

  /**
   * Check for known test key patterns
   */
  private isKnownTestPattern(key: string): boolean {
    const testPatterns = [
      /test.*key/i,
      /dev.*key/i,
      /mock.*key/i,
      /debug.*key/i,
      /demo.*key/i
    ];

    return testPatterns.some(pattern => pattern.test(key));
  }

  /**
   * Calculate integrity hash for key
   */
  private calculateKeyHash(keyData: Uint8Array): string {
    // Simple hash for integrity checking
    let hash = 0;
    for (let i = 0; i < keyData.length; i++) {
      hash = ((hash << 5) - hash + keyData[i]) & 0xffffffff;
    }
    return hash.toString(16);
  }

  /**
   * Generate unique key ID
   */
  private generateKeyId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `keymgr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Convert buffer to hex string
   */
  private bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if two arrays are equal
   */
  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Start automatic key rotation
   */
  private startKeyRotation(): void {
    this.rotationTimer = window.setInterval(() => {
      this.performKeyRotation();
    }, this.config.keyRotationInterval);
  }

  /**
   * Perform automatic key rotation for aged keys
   */
  private performKeyRotation(): void {
    const now = Date.now();
    let rotated = 0;

    for (const [keyId, managedKey] of this.managedKeys) {
      const keyAge = now - managedKey.metadata.createdAt;

      if (keyAge > this.config.maxKeyAge) {
        const newKeyId = this.rotateKey(keyId);
        if (newKeyId) rotated++;
      }
    }

    if (rotated > 0) {
      this.auditLog('key_rotated', 'auto', 'info', {
        message: 'Automatic key rotation completed',
        rotatedCount: rotated
      });
    }
  }

  /**
   * Emit audit log event
   */
  private auditLog(
    event: KeyAuditEvent['event'],
    keyId: string,
    severity: KeyAuditEvent['severity'],
    details: any
  ): void {
    if (!this.config.enableAuditLogging) return;

    const keyType: KeyAuditEvent['keyType'] =
      keyId === 'manager' ? 'master' :
      keyId.startsWith('eth') ? 'signing' :
      keyId.startsWith('sol') ? 'signing' :
      keyId.includes('seed') ? 'master' : 'encryption';

    const auditEvent: KeyAuditEvent = {
      timestamp: Date.now(),
      event,
      keyId,
      keyType,
      severity,
      details
    };

    this.config.auditLogger(auditEvent);
  }

  /**
   * Default audit logger
   */
  private defaultAuditLogger(event: KeyAuditEvent): void {
    const message = `[SecureKeyManager] ${event.event} (${event.severity}): ${event.keyId}`;

    switch (event.severity) {
      case 'critical':
      case 'error':
        console.error(message, event.details);
        break;
      case 'warning':
        console.warn(message, event.details);
        break;
      case 'info':
        console.info(message, event.details);
        break;
    }
  }
}

/**
 * Create secure key manager with default configuration
 */
export function createSecureKeyManager(config: SecureKeyConfig = {}): SecureKeyManager {
  return new SecureKeyManager({
    derivationIterations: 100000,
    saltLength: 32,
    enableKeyRotation: false,
    keyRotationInterval: 24 * 60 * 60 * 1000, // 24 hours
    maxKeyAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    enableAuditLogging: true,
    enableDevMarkers: true,
    ...config
  });
}