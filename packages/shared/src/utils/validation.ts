/**
 * Validation utilities for wallet operations
 */

/**
 * Validate Ethereum private key format
 */
export function isValidEthereumPrivateKey(key: string): boolean {
  if (!key.startsWith('0x')) return false;
  if (key.length !== 66) return false;

  const hex = key.slice(2);
  return /^[0-9a-fA-F]{64}$/.test(hex);
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address.startsWith('0x')) return false;
  if (address.length !== 42) return false;

  const hex = address.slice(2);
  return /^[0-9a-fA-F]{40}$/.test(hex);
}

/**
 * Validate Solana public key format (Base58)
 */
export function isValidSolanaPublicKey(publicKey: string): boolean {
  // Solana public keys are 32 bytes encoded in Base58, typically 43-44 characters
  if (publicKey.length < 43 || publicKey.length > 44) return false;

  // Basic Base58 character set validation
  return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(publicKey);
}

/**
 * Validate chain ID format
 */
export function isValidChainId(chainId: string): boolean {
  if (!chainId || typeof chainId !== 'string') return false;
  return chainId.length > 0 && chainId.length < 100;
}

/**
 * Validate account name
 */
export function isValidAccountName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  if (name.length < 1 || name.length > 100) return false;

  // Allow alphanumeric, spaces, hyphens, underscores
  return /^[a-zA-Z0-9\s\-_]+$/.test(name);
}

/**
 * Validate RPC URL
 */
export function isValidRpcUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Check if running in production environment
 */
export function isProductionEnvironment(): boolean {
  const checks = [
    () => process.env.NODE_ENV === 'production',
    () => typeof window !== 'undefined' &&
         window.location.hostname !== 'localhost' &&
         !window.location.hostname.includes('127.0.0.1') &&
         !window.location.hostname.includes('0.0.0.0'),
    () => typeof window !== 'undefined' &&
         window.location.protocol === 'https:' &&
         !window.location.hostname.includes('localhost'),
    () => typeof document !== 'undefined' &&
         document.domain &&
         !['localhost', '127.0.0.1', '0.0.0.0'].includes(document.domain)
  ];

  return checks.some(check => {
    try {
      return check();
    } catch {
      return false;
    }
  });
}

/**
 * Validate environment for mock wallet usage
 */
export function validateMockWalletEnvironment(): { isValid: boolean; reason?: string } {
  if (isProductionEnvironment()) {
    return {
      isValid: false,
      reason: 'Mock wallet cannot be used in production environment'
    };
  }

  return { isValid: true };
}

/**
 * Sanitize string for logging (remove sensitive patterns)
 */
export function sanitizeForLogging(input: string): string {
  return input
    .replace(/0x[a-fA-F0-9]{64}/g, '0x[PRIVATE_KEY]')
    .replace(/0x[a-fA-F0-9]{40}/g, '0x[ADDRESS]')
    .replace(/[a-zA-Z0-9]{43,44}/g, '[PUBKEY]'); // Solana public keys
}