/**
 * Legacy EVM methods for backward compatibility
 * Implements deprecated but still-used methods from older Web3 versions
 */

import type { EVMWallet } from './wallet.js';

export interface LegacyMethodHandlers {
  eth_compileLLL?: (code: string) => Promise<string>;
  eth_compileSerpent?: (code: string) => Promise<string>;
  eth_compileSolidity?: (code: string) => Promise<any>;
  eth_getCompilers?: () => Promise<string[]>;
  eth_getWork?: () => Promise<[string, string, string]>;
  eth_submitWork?: (nonce: string, powHash: string, digest: string) => Promise<boolean>;
  eth_submitHashrate?: (hashrate: string, id: string) => Promise<boolean>;
  db_putString?: (db: string, key: string, value: string) => Promise<boolean>;
  db_getString?: (db: string, key: string) => Promise<string>;
  db_putHex?: (db: string, key: string, value: string) => Promise<boolean>;
  db_getHex?: (db: string, key: string) => Promise<string>;
  shh_version?: () => Promise<string>;
  shh_post?: (params: any) => Promise<boolean>;
  shh_newIdentity?: () => Promise<string>;
  shh_hasIdentity?: (identity: string) => Promise<boolean>;
  shh_newGroup?: () => Promise<string>;
  shh_addToGroup?: (identity: string) => Promise<boolean>;
  shh_newFilter?: (params: any) => Promise<string>;
  shh_uninstallFilter?: (id: string) => Promise<boolean>;
  shh_getFilterChanges?: (id: string) => Promise<any[]>;
  shh_getMessages?: (id: string) => Promise<any[]>;
}

/**
 * Legacy method provider for maintaining backward compatibility
 */
export class LegacyMethodProvider {
  private wallet: EVMWallet;
  private deprecationWarnings: Set<string> = new Set();

  constructor(wallet: EVMWallet) {
    this.wallet = wallet;
  }

  /**
   * Handle legacy method requests
   */
  async handleLegacyMethod(method: string, params: any[]): Promise<any> {
    // Log deprecation warning once per method
    if (!this.deprecationWarnings.has(method)) {
      console.warn(`⚠️ Legacy method '${method}' is deprecated and may be removed in future versions`);
      this.deprecationWarnings.add(method);
    }

    switch (method) {
      // Compilation methods (deprecated, not functional)
      case 'eth_compileLLL':
      case 'eth_compileSerpent':
      case 'eth_compileSolidity':
        throw new Error(`${method} is no longer supported. Please use external compilation tools.`);

      case 'eth_getCompilers':
        return [];

      // Mining methods (deprecated, limited support)
      case 'eth_getWork':
        throw new Error('Mining is not supported by this wallet');

      case 'eth_submitWork':
      case 'eth_submitHashrate':
        return false;

      // Database methods (deprecated, not functional)
      case 'db_putString':
      case 'db_putHex':
        console.warn(`${method}: Database methods are deprecated and non-functional`);
        return false;

      case 'db_getString':
      case 'db_getHex':
        console.warn(`${method}: Database methods are deprecated and non-functional`);
        return null;

      // Whisper methods (deprecated, not functional)
      case 'shh_version':
        return '0.0.0';

      case 'shh_post':
      case 'shh_addToGroup':
      case 'shh_uninstallFilter':
        return false;

      case 'shh_newIdentity':
      case 'shh_newGroup':
      case 'shh_newFilter':
        return '0x0';

      case 'shh_hasIdentity':
        return false;

      case 'shh_getFilterChanges':
      case 'shh_getMessages':
        return [];

      // Legacy transaction and account methods
      case 'eth_sendTransaction':
        // Handle old-style transaction sending
        return this.#handleLegacySendTransaction(params[0]);

      case 'eth_sign':
        // Handle old-style message signing
        return this.#handleLegacySign(params[0], params[1]);

      case 'eth_getTransactionCount':
        // Support old-style nonce fetching
        return this.wallet.request({
          method: 'eth_getTransactionCount',
          params: [params[0], params[1] || 'latest']
        });

      // Web3 legacy methods
      case 'web3_clientVersion':
        return 'Arena-Headless-Wallet/1.0.0/legacy';

      case 'web3_sha3':
        // Deprecated in favor of keccak256
        if (params[0]) {
          return this.#web3Sha3(params[0]);
        }
        throw new Error('Invalid input for web3_sha3');

      // Network legacy methods
      case 'net_version':
        const chainId = await this.wallet.request({ method: 'eth_chainId' });
        return String(parseInt(chainId, 16));

      case 'net_listening':
        return true;

      case 'net_peerCount':
        return '0x1';

      // Other legacy methods
      case 'eth_protocolVersion':
        return '0x41'; // Protocol version 65

      case 'eth_syncing':
        return false;

      case 'eth_coinbase':
        // Return first account as coinbase
        const accounts = await this.wallet.request({ method: 'eth_accounts' });
        return accounts[0] || null;

      case 'eth_mining':
        return false;

      case 'eth_hashrate':
        return '0x0';

      case 'eth_gasPrice':
        // Still supported but often replaced by EIP-1559
        return this.wallet.request({ method: 'eth_gasPrice' });

      // Account import/export (security-sensitive, limited support)
      case 'personal_importRawKey':
        throw new Error('Importing raw keys is not supported for security reasons');

      case 'personal_listAccounts':
        return this.wallet.request({ method: 'eth_accounts' });

      case 'personal_lockAccount':
        console.warn('Account locking is managed internally');
        return true;

      case 'personal_newAccount':
        throw new Error('Creating new accounts is not supported in this context');

      case 'personal_unlockAccount':
        console.warn('Account unlocking is managed internally');
        return true;

      case 'personal_sendTransaction':
        // Similar to eth_sendTransaction but with password field (ignored)
        const { password, ...tx } = params[0];
        return this.wallet.request({
          method: 'eth_sendTransaction',
          params: [tx]
        });

      case 'personal_sign':
        // Already supported but ensure compatibility
        return this.wallet.request({
          method: 'personal_sign',
          params
        });

      case 'personal_ecRecover':
        // Recover address from signed message
        return this.#personalEcRecover(params[0], params[1]);

      default:
        throw new Error(`Unknown legacy method: ${method}`);
    }
  }

  /**
   * Check if a method is a legacy method
   */
  isLegacyMethod(method: string): boolean {
    const legacyPrefixes = ['shh_', 'db_', 'eth_compile'];
    const legacyMethods = [
      'eth_getCompilers',
      'eth_getWork',
      'eth_submitWork',
      'eth_submitHashrate',
      'personal_importRawKey',
      'personal_listAccounts',
      'personal_lockAccount',
      'personal_newAccount',
      'personal_unlockAccount',
      'personal_sendTransaction',
      'personal_ecRecover',
    ];

    return (
      legacyPrefixes.some(prefix => method.startsWith(prefix)) ||
      legacyMethods.includes(method)
    );
  }

  /**
   * Get information about legacy method support
   */
  getLegacyMethodInfo(method: string): {
    supported: boolean;
    deprecated: boolean;
    alternative?: string;
    message: string;
  } {
    const info: Record<string, any> = {
      'eth_compileLLL': {
        supported: false,
        deprecated: true,
        alternative: 'Use external Solidity compiler',
        message: 'LLL compilation is no longer supported'
      },
      'eth_compileSerpent': {
        supported: false,
        deprecated: true,
        alternative: 'Use external Solidity compiler',
        message: 'Serpent compilation is no longer supported'
      },
      'eth_compileSolidity': {
        supported: false,
        deprecated: true,
        alternative: 'Use external Solidity compiler',
        message: 'In-browser compilation is deprecated'
      },
      'shh_version': {
        supported: true,
        deprecated: true,
        alternative: 'Use Waku or other messaging protocols',
        message: 'Whisper protocol is deprecated'
      },
      'db_putString': {
        supported: false,
        deprecated: true,
        alternative: 'Use browser localStorage or IndexedDB',
        message: 'Database methods are deprecated'
      },
      'web3_sha3': {
        supported: true,
        deprecated: true,
        alternative: 'Use keccak256 from ethers.js or viem',
        message: 'web3_sha3 is deprecated in favor of library functions'
      },
      'personal_importRawKey': {
        supported: false,
        deprecated: true,
        alternative: 'Use secure key management solutions',
        message: 'Raw key import is disabled for security'
      },
    };

    const methodInfo = info[method];
    if (methodInfo) {
      return methodInfo;
    }

    if (this.isLegacyMethod(method)) {
      return {
        supported: true,
        deprecated: true,
        message: `${method} is a legacy method with limited support`
      };
    }

    return {
      supported: false,
      deprecated: false,
      message: `${method} is not a recognized legacy method`
    };
  }

  // Private helper methods

  async #handleLegacySendTransaction(tx: any): Promise<string> {
    // Convert legacy transaction format to modern format
    const modernTx = {
      from: tx.from,
      to: tx.to,
      value: tx.value,
      data: tx.data || tx.input, // Support both 'data' and 'input'
      gas: tx.gas || tx.gasLimit, // Support both formats
      gasPrice: tx.gasPrice,
      nonce: tx.nonce,
    };

    return this.wallet.request({
      method: 'eth_sendTransaction',
      params: [modernTx]
    });
  }

  async #handleLegacySign(address: string, message: string): Promise<string> {
    // eth_sign is dangerous and deprecated, convert to personal_sign
    console.warn('⚠️ eth_sign is deprecated and unsafe. Converting to personal_sign.');

    return this.wallet.request({
      method: 'personal_sign',
      params: [message, address]
    });
  }

  #web3Sha3(data: string): string {
    // Simple keccak256 implementation for compatibility
    // In production, use a proper crypto library
    const { keccak256 } = require('js-sha3');

    // Remove 0x prefix if present
    const cleanData = data.startsWith('0x') ? data.slice(2) : data;

    // Convert hex string to bytes and hash
    const bytes = Buffer.from(cleanData, 'hex');
    return '0x' + keccak256(bytes);
  }

  async #personalEcRecover(message: string, signature: string): Promise<string> {
    // Recover the address that signed a message
    // This would need proper implementation with ecrecover
    console.warn('personal_ecRecover is not fully implemented');

    // Placeholder - in production, implement proper signature recovery
    const accounts = await this.wallet.request({ method: 'eth_accounts' });
    return accounts[0] || '0x0000000000000000000000000000000000000000';
  }
}

/**
 * Middleware to intercept and handle legacy methods
 */
export function createLegacyMiddleware(provider: LegacyMethodProvider) {
  return async (req: any, res: any, next: () => void) => {
    if (provider.isLegacyMethod(req.method)) {
      try {
        res.result = await provider.handleLegacyMethod(req.method, req.params || []);
      } catch (error: any) {
        res.error = {
          code: -32601,
          message: error.message || 'Legacy method error'
        };
      }
    } else {
      await next();
    }
  };
}