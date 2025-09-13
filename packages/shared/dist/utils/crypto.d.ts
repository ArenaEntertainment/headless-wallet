/**
 * Generate random hexadecimal string
 * @param bytesLength - Length in bytes
 * @returns Hex string without 0x prefix
 */
export declare function generateRandomHex(bytesLength: number): string;
/**
 * Generate random bytes
 * @param length - Length in bytes
 * @returns Random bytes as Uint8Array
 */
export declare function generateRandomBytes(length: number): Uint8Array;
/**
 * Security utilities for handling sensitive data
 */
export declare class SecureCrypto {
    /**
     * Generate a cryptographically secure random private key
     * @returns 32-byte private key as hex string
     */
    static generatePrivateKey(): string;
    /**
     * Generate a cryptographically secure random seed
     * @param length - Length of seed in bytes (default: 32)
     * @returns Random seed as Uint8Array
     */
    static generateSeed(length?: number): Uint8Array;
    /**
     * Securely clear sensitive data from memory
     * @param data - Buffer or Uint8Array to clear
     */
    static secureClear(data: Uint8Array): void;
    /**
     * Generate a test-only private key with clear marking
     * @param seed - Optional seed string for deterministic generation
     * @returns Test private key with TEST_ONLY prefix
     */
    static generateTestKey(seed?: string): string;
    /**
     * Validate that a private key is marked as test-only
     * @param key - Private key to validate
     * @returns True if key is properly marked for testing
     */
    static isTestKey(key: string): boolean;
}
//# sourceMappingURL=crypto.d.ts.map