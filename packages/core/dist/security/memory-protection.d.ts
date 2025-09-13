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
export declare class SecureBuffer {
    private buffer;
    private obfuscationKey;
    private readonly originalLength;
    private isCleared;
    private accessCount;
    private createdAt;
    constructor(data: Uint8Array);
    /**
     * Get the unobfuscated data (creates a copy)
     */
    getData(): Uint8Array;
    /**
     * Get data length without exposing actual data
     */
    getLength(): number;
    /**
     * Get creation timestamp
     */
    getCreatedAt(): number;
    /**
     * Get access count
     */
    getAccessCount(): number;
    /**
     * Check if buffer has been cleared
     */
    isDestroyed(): boolean;
    /**
     * Securely clear the buffer
     */
    clear(): void;
}
/**
 * Memory Protection Manager
 *
 * Manages secure storage and cleanup of sensitive cryptographic data.
 */
export declare class MemoryProtectionManager {
    private config;
    private secureData;
    private cleanupTimer?;
    private isActive;
    constructor(config?: SecureMemoryConfig);
    /**
     * Start memory protection services
     */
    start(): void;
    /**
     * Stop memory protection services
     */
    stop(): void;
    /**
     * Store sensitive data securely
     */
    storeSecureData(data: Uint8Array, type?: SecureDataEntry['metadata']['type'], description?: string): string;
    /**
     * Retrieve sensitive data
     */
    retrieveSecureData(id: string): Uint8Array | null;
    /**
     * Create secure buffer for sensitive data
     */
    createSecureBuffer(data: Uint8Array): SecureBuffer;
    /**
     * Clear specific sensitive data
     */
    clearSecureData(id: string): boolean;
    /**
     * Clear all sensitive data
     */
    clearAllData(): void;
    /**
     * Get memory usage statistics
     */
    getMemoryStats(): {
        totalEntries: number;
        totalBytes: number;
        entriesByType: Record<string, number>;
        oldestEntry: number;
        averageAccessCount: number;
    };
    /**
     * Perform cleanup of expired sensitive data
     */
    private performCleanup;
    /**
     * Setup memory leak detection
     */
    private setupMemoryLeakDetection;
    /**
     * Generate secure random ID
     */
    private generateSecureId;
    /**
     * Generate obfuscation key
     */
    private generateObfuscationKey;
    /**
     * Calculate integrity hash for data
     */
    private calculateIntegrityHash;
    /**
     * Securely clear data array
     */
    private secureClearData;
    /**
     * Emit security event
     */
    private emitSecurityEvent;
    /**
     * Default security event handler
     */
    private defaultEventHandler;
}
/**
 * Get or create global memory protection manager
 */
export declare function getMemoryProtectionManager(config?: SecureMemoryConfig): MemoryProtectionManager;
/**
 * Create secure memory manager with default configuration
 */
export declare function createMemoryProtectionManager(config?: SecureMemoryConfig): MemoryProtectionManager;
export {};
//# sourceMappingURL=memory-protection.d.ts.map