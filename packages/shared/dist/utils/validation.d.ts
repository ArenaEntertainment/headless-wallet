/**
 * Validation utilities for wallet operations
 */
/**
 * Validate Ethereum private key format
 */
export declare function isValidEthereumPrivateKey(key: string): boolean;
/**
 * Validate Ethereum address format
 */
export declare function isValidEthereumAddress(address: string): boolean;
/**
 * Validate Solana public key format (Base58)
 */
export declare function isValidSolanaPublicKey(publicKey: string): boolean;
/**
 * Validate chain ID format
 */
export declare function isValidChainId(chainId: string): boolean;
/**
 * Validate account name
 */
export declare function isValidAccountName(name: string): boolean;
/**
 * Validate RPC URL
 */
export declare function isValidRpcUrl(url: string): boolean;
/**
 * Check if running in production environment
 */
export declare function isProductionEnvironment(): boolean;
/**
 * Validate environment for mock wallet usage
 */
export declare function validateMockWalletEnvironment(): {
    isValid: boolean;
    reason?: string;
};
/**
 * Sanitize string for logging (remove sensitive patterns)
 */
export declare function sanitizeForLogging(input: string): string;
//# sourceMappingURL=validation.d.ts.map