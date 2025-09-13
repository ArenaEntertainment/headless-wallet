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
export declare class SecureKeyManager {
    private config;
    private memoryManager;
    private managedKeys;
    private rotationTimer?;
    private sessionId;
    constructor(config?: SecureKeyConfig);
    /**
     * Generate secure private key for Ethereum
     */
    generateEthereumPrivateKey(options?: {
        testOnly?: boolean;
        derivationPath?: string;
        expiresAt?: number;
    }): string;
    /**
     * Generate secure private key for Solana
     */
    generateSolanaPrivateKey(options?: {
        testOnly?: boolean;
        derivationPath?: string;
        expiresAt?: number;
    }): Uint8Array;
    /**
     * Generate secure master seed for key derivation
     */
    generateMasterSeed(options?: {
        seedLength?: number;
        testOnly?: boolean;
        expiresAt?: number;
    }): Uint8Array;
    /**
     * Retrieve key by ID
     */
    getKey(keyId: string): Uint8Array | null;
    /**
     * Get key metadata without exposing the key itself
     */
    getKeyMetadata(keyId: string): SecureKeyMetadata | null;
    /**
     * List all managed key IDs and their metadata
     */
    listKeys(): SecureKeyMetadata[];
    /**
     * Rotate a specific key
     */
    rotateKey(keyId: string): string | null;
    /**
     * Destroy a key and clear it from memory
     */
    destroyKey(keyId: string): boolean;
    /**
     * Destroy all keys and cleanup
     */
    destroyAllKeys(): void;
    /**
     * Validate if a key is properly marked for testing
     */
    validateTestKey(key: string | Uint8Array): boolean;
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
    };
    /**
     * Cleanup expired keys
     */
    cleanupExpiredKeys(): number;
    /**
     * Generate cryptographically secure entropy
     */
    private generateSecureEntropy;
    /**
     * Store key securely in memory
     */
    private storeSecureKey;
    /**
     * Validate entropy quality
     */
    private validateEntropy;
    /**
     * Check if key is cryptographically weak
     */
    private isWeakKey;
    /**
     * Enhanced validation for master seeds
     */
    private isWeakSeed;
    /**
     * Add test marker to key for development identification
     */
    private addTestMarker;
    /**
     * Check for known test key patterns
     */
    private isKnownTestPattern;
    /**
     * Calculate integrity hash for key
     */
    private calculateKeyHash;
    /**
     * Generate unique key ID
     */
    private generateKeyId;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Convert buffer to hex string
     */
    private bufferToHex;
    /**
     * Check if two arrays are equal
     */
    private arraysEqual;
    /**
     * Start automatic key rotation
     */
    private startKeyRotation;
    /**
     * Perform automatic key rotation for aged keys
     */
    private performKeyRotation;
    /**
     * Emit audit log event
     */
    private auditLog;
    /**
     * Default audit logger
     */
    private defaultAuditLogger;
}
/**
 * Create secure key manager with default configuration
 */
export declare function createSecureKeyManager(config?: SecureKeyConfig): SecureKeyManager;
//# sourceMappingURL=secure-key-management.d.ts.map