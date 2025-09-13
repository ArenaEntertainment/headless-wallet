/**
 * Memory Protection and Secure Data Handling
 *
 * Provides secure memory management for sensitive data including private keys,
 * seeds, and other cryptographic material to prevent memory disclosure attacks.
 *
 * OWASP Security Controls:
 * - A02: Cryptographic Failures Prevention
 * - A04: Insecure Design Prevention
 * - A08: Software and Data Integrity Failures Prevention
 */

export interface SecureMemoryConfig {
  /** Enable automatic cleanup of sensitive data */
  enableAutoCleanup?: boolean;
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number;
  /** Maximum lifetime for sensitive data in memory (ms) */
  maxDataLifetime?: number;
  /** Enable memory obfuscation */
  enableObfuscation?: boolean;
  /** Enable data integrity checks */
  enableIntegrityChecks?: boolean;
  /** Callback for security events */
  onSecurityEvent?: (event: MemorySecurityEvent) => void;
}

export interface MemorySecurityEvent {
  type: 'cleanup' | 'leak_detected' | 'integrity_violation' | 'access_violation';
  timestamp: number;
  details: any;
}

interface SecureDataEntry {
  id: string;
  data: Uint8Array;
  obfuscationKey: Uint8Array;
  createdAt: number;
  accessedAt: number;
  accessCount: number;
  integrityHash: string;
  metadata: {
    type: 'private_key' | 'seed' | 'mnemonic' | 'secret' | 'other';
    description: string;
  };
}

/**
 * Secure Buffer for holding sensitive cryptographic data
 */
export class SecureBuffer {
  private buffer: Uint8Array;
  private obfuscationKey: Uint8Array;
  private readonly originalLength: number;
  private isCleared = false;
  private accessCount = 0;
  private createdAt: number;

  constructor(data: Uint8Array) {
    this.originalLength = data.length;
    this.createdAt = Date.now();

    // Generate obfuscation key
    this.obfuscationKey = new Uint8Array(this.originalLength);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(this.obfuscationKey);
    } else if (typeof global !== 'undefined' && global.crypto) {
      global.crypto.getRandomValues(this.obfuscationKey);
    } else {
      // Fallback for Node.js
      try {
        const { randomBytes } = require('crypto');
        this.obfuscationKey = new Uint8Array(randomBytes(this.originalLength));
      } catch (e) {
        // Basic obfuscation as last resort
        for (let i = 0; i < this.originalLength; i++) {
          this.obfuscationKey[i] = Math.floor(Math.random() * 256);
        }
      }
    }

    // Store obfuscated data
    this.buffer = new Uint8Array(this.originalLength);
    for (let i = 0; i < this.originalLength; i++) {
      this.buffer[i] = data[i] ^ this.obfuscationKey[i];
    }

    // Clear original data reference
    data.fill(0);
  }

  /**
   * Get the unobfuscated data (creates a copy)
   */
  getData(): Uint8Array {
    if (this.isCleared) {
      throw new Error('SecureBuffer has been cleared');
    }

    this.accessCount++;
    const result = new Uint8Array(this.originalLength);

    for (let i = 0; i < this.originalLength; i++) {
      result[i] = this.buffer[i] ^ this.obfuscationKey[i];
    }

    return result;
  }

  /**
   * Get data length without exposing actual data
   */
  getLength(): number {
    return this.originalLength;
  }

  /**
   * Get creation timestamp
   */
  getCreatedAt(): number {
    return this.createdAt;
  }

  /**
   * Get access count
   */
  getAccessCount(): number {
    return this.accessCount;
  }

  /**
   * Check if buffer has been cleared
   */
  isDestroyed(): boolean {
    return this.isCleared;
  }

  /**
   * Securely clear the buffer
   */
  clear(): void {
    if (this.isCleared) return;

    // Multiple passes with random data
    const random = new Uint8Array(this.originalLength);
    for (let pass = 0; pass < 3; pass++) {
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(random);
      } else {
        for (let i = 0; i < random.length; i++) {
          random[i] = Math.floor(Math.random() * 256);
        }
      }
      this.buffer.set(random);
      this.obfuscationKey.set(random);
    }

    // Final zero fill
    this.buffer.fill(0);
    this.obfuscationKey.fill(0);
    this.isCleared = true;
  }
}

/**
 * Memory Protection Manager
 *
 * Manages secure storage and cleanup of sensitive cryptographic data.
 */
export class MemoryProtectionManager {
  private config: Required<SecureMemoryConfig>;
  private secureData = new Map<string, SecureDataEntry>();
  private cleanupTimer?: number;
  private isActive = false;

  constructor(config: SecureMemoryConfig = {}) {
    this.config = {
      enableAutoCleanup: config.enableAutoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60000, // 1 minute
      maxDataLifetime: config.maxDataLifetime ?? 30 * 60 * 1000, // 30 minutes
      enableObfuscation: config.enableObfuscation ?? true,
      enableIntegrityChecks: config.enableIntegrityChecks ?? true,
      onSecurityEvent: config.onSecurityEvent ?? this.defaultEventHandler.bind(this)
    };
  }

  /**
   * Start memory protection services
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;

    if (this.config.enableAutoCleanup) {
      this.cleanupTimer = window.setInterval(() => {
        this.performCleanup();
      }, this.config.cleanupInterval);
    }

    // Setup memory leak detection
    this.setupMemoryLeakDetection();

    this.emitSecurityEvent('cleanup', { message: 'Memory protection started' });
  }

  /**
   * Stop memory protection services
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // Clear all sensitive data
    this.clearAllData();

    this.emitSecurityEvent('cleanup', { message: 'Memory protection stopped' });
  }

  /**
   * Store sensitive data securely
   */
  storeSecureData(
    data: Uint8Array,
    type: SecureDataEntry['metadata']['type'] = 'other',
    description = 'Sensitive data'
  ): string {
    if (!this.isActive) {
      throw new Error('Memory protection manager is not active');
    }

    const id = this.generateSecureId();
    const now = Date.now();

    // Create obfuscation key if enabled
    const obfuscationKey = this.config.enableObfuscation
      ? this.generateObfuscationKey(data.length)
      : new Uint8Array(0);

    // Obfuscate data if enabled
    const secureData = new Uint8Array(data.length);
    if (this.config.enableObfuscation) {
      for (let i = 0; i < data.length; i++) {
        secureData[i] = data[i] ^ obfuscationKey[i];
      }
    } else {
      secureData.set(data);
    }

    // Generate integrity hash if enabled
    const integrityHash = this.config.enableIntegrityChecks
      ? this.calculateIntegrityHash(data)
      : '';

    // Store entry
    const entry: SecureDataEntry = {
      id,
      data: secureData,
      obfuscationKey,
      createdAt: now,
      accessedAt: now,
      accessCount: 0,
      integrityHash,
      metadata: { type, description }
    };

    this.secureData.set(id, entry);

    // Clear original data
    data.fill(0);

    return id;
  }

  /**
   * Retrieve sensitive data
   */
  retrieveSecureData(id: string): Uint8Array | null {
    const entry = this.secureData.get(id);
    if (!entry) return null;

    // Update access tracking
    entry.accessedAt = Date.now();
    entry.accessCount++;

    // Deobfuscate data if needed
    const result = new Uint8Array(entry.data.length);
    if (this.config.enableObfuscation && entry.obfuscationKey.length > 0) {
      for (let i = 0; i < entry.data.length; i++) {
        result[i] = entry.data[i] ^ entry.obfuscationKey[i];
      }
    } else {
      result.set(entry.data);
    }

    // Verify integrity if enabled
    if (this.config.enableIntegrityChecks && entry.integrityHash) {
      const currentHash = this.calculateIntegrityHash(result);
      if (currentHash !== entry.integrityHash) {
        this.emitSecurityEvent('integrity_violation', {
          id,
          expected: entry.integrityHash,
          actual: currentHash
        });

        // Clear compromised data
        this.clearSecureData(id);
        result.fill(0);
        return null;
      }
    }

    return result;
  }

  /**
   * Create secure buffer for sensitive data
   */
  createSecureBuffer(data: Uint8Array): SecureBuffer {
    if (!this.isActive) {
      throw new Error('Memory protection manager is not active');
    }

    return new SecureBuffer(data);
  }

  /**
   * Clear specific sensitive data
   */
  clearSecureData(id: string): boolean {
    const entry = this.secureData.get(id);
    if (!entry) return false;

    // Securely clear data
    this.secureClearData(entry.data);
    this.secureClearData(entry.obfuscationKey);

    this.secureData.delete(id);

    this.emitSecurityEvent('cleanup', {
      id,
      type: entry.metadata.type,
      description: entry.metadata.description
    });

    return true;
  }

  /**
   * Clear all sensitive data
   */
  clearAllData(): void {
    for (const [id, entry] of this.secureData) {
      this.secureClearData(entry.data);
      this.secureClearData(entry.obfuscationKey);
    }

    this.secureData.clear();

    this.emitSecurityEvent('cleanup', { message: 'All secure data cleared' });
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    totalEntries: number;
    totalBytes: number;
    entriesByType: Record<string, number>;
    oldestEntry: number;
    averageAccessCount: number;
  } {
    let totalBytes = 0;
    let totalAccessCount = 0;
    let oldestEntry = Date.now();
    const entriesByType: Record<string, number> = {};

    for (const entry of this.secureData.values()) {
      totalBytes += entry.data.length;
      totalAccessCount += entry.accessCount;
      oldestEntry = Math.min(oldestEntry, entry.createdAt);

      entriesByType[entry.metadata.type] = (entriesByType[entry.metadata.type] || 0) + 1;
    }

    return {
      totalEntries: this.secureData.size,
      totalBytes,
      entriesByType,
      oldestEntry: this.secureData.size > 0 ? oldestEntry : Date.now(),
      averageAccessCount: this.secureData.size > 0 ? totalAccessCount / this.secureData.size : 0
    };
  }

  /**
   * Perform cleanup of expired sensitive data
   */
  private performCleanup(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, entry] of this.secureData) {
      const age = now - entry.createdAt;
      const timeSinceAccess = now - entry.accessedAt;

      // Remove data that's too old or hasn't been accessed recently
      if (age > this.config.maxDataLifetime || timeSinceAccess > this.config.maxDataLifetime / 2) {
        expiredIds.push(id);
      }
    }

    for (const id of expiredIds) {
      this.clearSecureData(id);
    }

    if (expiredIds.length > 0) {
      this.emitSecurityEvent('cleanup', {
        expiredEntries: expiredIds.length,
        totalEntries: this.secureData.size
      });
    }
  }

  /**
   * Setup memory leak detection
   */
  private setupMemoryLeakDetection(): void {
    if (typeof window === 'undefined') return;

    // Monitor for potential memory leaks
    let lastHeapUsed = 0;

    setInterval(() => {
      // @ts-ignore - performance.memory is available in Chrome
      if (window.performance && window.performance.memory) {
        // @ts-ignore
        const currentHeapUsed = window.performance.memory.usedJSHeapSize;
        const growth = currentHeapUsed - lastHeapUsed;

        // Alert if significant memory growth without cleanup
        if (growth > 10 * 1024 * 1024) { // 10MB growth
          this.emitSecurityEvent('leak_detected', {
            memoryGrowth: growth,
            totalHeapUsed: currentHeapUsed,
            secureDataEntries: this.secureData.size
          });
        }

        lastHeapUsed = currentHeapUsed;
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Generate secure random ID
   */
  private generateSecureId(): string {
    const bytes = new Uint8Array(16);

    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(bytes);
    } else if (typeof global !== 'undefined' && global.crypto) {
      global.crypto.getRandomValues(bytes);
    } else {
      // Fallback
      try {
        const { randomBytes } = require('crypto');
        bytes.set(new Uint8Array(randomBytes(16)));
      } catch (e) {
        for (let i = 0; i < 16; i++) {
          bytes[i] = Math.floor(Math.random() * 256);
        }
      }
    }

    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate obfuscation key
   */
  private generateObfuscationKey(length: number): Uint8Array {
    const key = new Uint8Array(length);

    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(key);
    } else if (typeof global !== 'undefined' && global.crypto) {
      global.crypto.getRandomValues(key);
    } else {
      try {
        const { randomBytes } = require('crypto');
        key.set(new Uint8Array(randomBytes(length)));
      } catch (e) {
        for (let i = 0; i < length; i++) {
          key[i] = Math.floor(Math.random() * 256);
        }
      }
    }

    return key;
  }

  /**
   * Calculate integrity hash for data
   */
  private calculateIntegrityHash(data: Uint8Array): string {
    // Simple hash implementation for integrity checking
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
    }
    return hash.toString(16);
  }

  /**
   * Securely clear data array
   */
  private secureClearData(data: Uint8Array): void {
    if (!data || data.length === 0) return;

    // Multiple passes with different patterns
    const patterns = [0xFF, 0x00, 0xAA, 0x55];

    for (const pattern of patterns) {
      data.fill(pattern);
    }

    // Final random fill if crypto is available
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(data);
    } else if (typeof global !== 'undefined' && global.crypto) {
      global.crypto.getRandomValues(data);
    }

    // Final zero fill
    data.fill(0);
  }

  /**
   * Emit security event
   */
  private emitSecurityEvent(type: MemorySecurityEvent['type'], details: any): void {
    this.config.onSecurityEvent({
      type,
      timestamp: Date.now(),
      details
    });
  }

  /**
   * Default security event handler
   */
  private defaultEventHandler(event: MemorySecurityEvent): void {
    const message = `[MemoryProtection] ${event.type}: ${JSON.stringify(event.details)}`;

    switch (event.type) {
      case 'leak_detected':
      case 'integrity_violation':
      case 'access_violation':
        console.warn(message);
        break;
      case 'cleanup':
        console.info(message);
        break;
    }
  }
}

/**
 * Global memory protection manager instance
 */
let globalMemoryManager: MemoryProtectionManager | null = null;

/**
 * Get or create global memory protection manager
 */
export function getMemoryProtectionManager(config?: SecureMemoryConfig): MemoryProtectionManager {
  if (!globalMemoryManager) {
    globalMemoryManager = new MemoryProtectionManager(config);
    globalMemoryManager.start();

    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        globalMemoryManager?.stop();
      });
    }
  }

  return globalMemoryManager;
}

/**
 * Create secure memory manager with default configuration
 */
export function createMemoryProtectionManager(config: SecureMemoryConfig = {}): MemoryProtectionManager {
  return new MemoryProtectionManager({
    enableAutoCleanup: true,
    cleanupInterval: 60000, // 1 minute
    maxDataLifetime: 30 * 60 * 1000, // 30 minutes
    enableObfuscation: true,
    enableIntegrityChecks: true,
    ...config
  });
}