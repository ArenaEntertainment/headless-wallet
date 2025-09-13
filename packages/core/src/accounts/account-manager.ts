import type {
  Account,
  AccountConfig,
  EVMAccount,
  SolanaAccount,
  DualChainAccount,
  EventEmitter,
  WalletEvents
} from '@arenaentertainment/wallet-mock-shared';
import { AccountType } from '@arenaentertainment/wallet-mock-shared';
import { generateRandomHex, generateRandomBytes } from '@arenaentertainment/wallet-mock-shared';

/**
 * Account manager configuration
 */
export interface AccountManagerConfig {
  /** Maximum number of accounts allowed */
  maxAccounts?: number;
  /** Enable automatic key generation */
  enableKeyGeneration?: boolean;
  /** Default account name prefix */
  defaultNamePrefix?: string;
  /** Custom account ID generator */
  accountIdGenerator?: () => string;
}

/**
 * Account creation result
 */
export interface AccountCreationResult {
  /** Created account */
  account: Account;
  /** Generated private keys (if any) */
  generatedKeys?: {
    evm?: string;
    solana?: Uint8Array;
  };
}

/**
 * Account manager for handling multi-chain account operations
 */
export class AccountManager {
  private accounts: Map<string, Account> = new Map();
  private config: Required<AccountManagerConfig>;
  private eventEmitter?: EventEmitter<WalletEvents>;

  constructor(config: AccountManagerConfig = {}, eventEmitter?: EventEmitter<WalletEvents>) {
    this.config = {
      maxAccounts: config.maxAccounts ?? 10,
      enableKeyGeneration: config.enableKeyGeneration ?? true,
      defaultNamePrefix: config.defaultNamePrefix || 'Account',
      accountIdGenerator: config.accountIdGenerator || this.defaultAccountIdGenerator
    };
    this.eventEmitter = eventEmitter;
  }

  /**
   * Create a new account
   */
  async createAccount(accountConfig: AccountConfig): Promise<AccountCreationResult> {
    // Check account limit
    if (this.accounts.size >= this.config.maxAccounts) {
      throw new Error(`Maximum number of accounts reached: ${this.config.maxAccounts}`);
    }

    // Validate account configuration
    this.validateAccountConfig(accountConfig);

    // Generate account ID
    const accountId = this.config.accountIdGenerator();

    // Ensure unique account ID
    if (this.accounts.has(accountId)) {
      throw new Error(`Account ID already exists: ${accountId}`);
    }

    // Generate account name if not provided
    const accountName = accountConfig.name || `${this.config.defaultNamePrefix} ${this.accounts.size + 1}`;

    const generatedKeys: { evm?: string; solana?: Uint8Array } = {};
    let account: Account;

    switch (accountConfig.type) {
      case AccountType.EVM_ONLY:
        account = await this.createEVMAccount(accountId, accountName, accountConfig, generatedKeys);
        break;
      case AccountType.SOLANA_ONLY:
        account = await this.createSolanaAccount(accountId, accountName, accountConfig, generatedKeys);
        break;
      case AccountType.DUAL_CHAIN:
        account = await this.createDualChainAccount(accountId, accountName, accountConfig, generatedKeys);
        break;
      default:
        throw new Error(`Unsupported account type: ${accountConfig.type}`);
    }

    // Store account
    this.accounts.set(accountId, account);

    // Emit account added event
    this.eventEmitter?.emit('accountAdded', account);

    return {
      account,
      generatedKeys: Object.keys(generatedKeys).length > 0 ? generatedKeys : undefined
    };
  }

  /**
   * Remove an account
   */
  async removeAccount(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    // Remove account from storage
    this.accounts.delete(accountId);

    // Clear sensitive data
    this.clearAccountData(account);

    // Emit account removed event
    this.eventEmitter?.emit('accountRemoved', accountId);
  }

  /**
   * Get account by ID
   */
  getAccount(accountId: string): Account | null {
    return this.accounts.get(accountId) || null;
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Get accounts by type
   */
  getAccountsByType(type: AccountType): Account[] {
    return this.getAllAccounts().filter(account => account.type === type);
  }

  /**
   * Get accounts supporting specific chain type
   */
  getAccountsByChainType(chainType: 'evm' | 'solana'): Account[] {
    return this.getAllAccounts().filter(account => {
      if (chainType === 'evm') {
        return account.type === AccountType.EVM_ONLY || account.type === AccountType.DUAL_CHAIN;
      } else {
        return account.type === AccountType.SOLANA_ONLY || account.type === AccountType.DUAL_CHAIN;
      }
    });
  }

  /**
   * Update account metadata
   */
  async updateAccount(accountId: string, updates: Partial<Pick<Account, 'name' | 'isActive'>>): Promise<Account> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    // Apply updates
    const updatedAccount: Account = {
      ...account,
      ...updates
    };

    // Store updated account
    this.accounts.set(accountId, updatedAccount);

    // Emit account updated event
    this.eventEmitter?.emit('accountUpdated', updatedAccount);

    return updatedAccount;
  }

  /**
   * Check if account exists
   */
  hasAccount(accountId: string): boolean {
    return this.accounts.has(accountId);
  }

  /**
   * Get account count
   */
  getAccountCount(): number {
    return this.accounts.size;
  }

  /**
   * Get EVM address for account
   */
  getEVMAddress(accountId: string): string | null {
    const account = this.accounts.get(accountId);
    if (!account) {
      return null;
    }

    if (account.type === AccountType.EVM_ONLY || account.type === AccountType.DUAL_CHAIN) {
      return account.evm.address;
    }

    return null;
  }

  /**
   * Get Solana public key for account
   */
  getSolanaPublicKey(accountId: string): string | null {
    const account = this.accounts.get(accountId);
    if (!account) {
      return null;
    }

    if (account.type === AccountType.SOLANA_ONLY || account.type === AccountType.DUAL_CHAIN) {
      return account.solana.publicKey;
    }

    return null;
  }

  /**
   * Clear all accounts and sensitive data
   */
  async clearAllAccounts(): Promise<void> {
    for (const account of this.accounts.values()) {
      this.clearAccountData(account);
    }

    this.accounts.clear();
  }

  /**
   * Create EVM-only account
   */
  private async createEVMAccount(
    accountId: string,
    accountName: string,
    config: AccountConfig,
    generatedKeys: { evm?: string; solana?: Uint8Array }
  ): Promise<EVMAccount> {
    if (!config.evm) {
      throw new Error('EVM configuration required for EVM account');
    }

    let privateKey: string = config.evm.privateKey || '';

    // Generate private key if not provided
    if (!privateKey) {
      if (!this.config.enableKeyGeneration) {
        throw new Error('Key generation is disabled and no private key provided');
      }
      privateKey = generateRandomHex(32);
      generatedKeys.evm = privateKey;
    }

    // Derive address from private key (simplified - in real implementation would use proper crypto)
    const address = this.deriveEVMAddress(privateKey);

    return {
      id: accountId,
      name: accountName,
      type: AccountType.EVM_ONLY,
      isActive: false,
      createdAt: Date.now(),
      evm: {
        privateKey,
        address,
        chainIds: config.evm.chainIds
      }
    };
  }

  /**
   * Create Solana-only account
   */
  private async createSolanaAccount(
    accountId: string,
    accountName: string,
    config: AccountConfig,
    generatedKeys: { evm?: string; solana?: Uint8Array }
  ): Promise<SolanaAccount> {
    if (!config.solana) {
      throw new Error('Solana configuration required for Solana account');
    }

    let secretKey: Uint8Array | undefined = config.solana.secretKey;

    // Generate secret key if not provided
    if (!secretKey) {
      if (!this.config.enableKeyGeneration) {
        throw new Error('Key generation is disabled and no secret key provided');
      }
      secretKey = generateRandomBytes(64);
      generatedKeys.solana = secretKey;
    }

    // At this point secretKey is guaranteed to exist
    const finalSecretKey: Uint8Array = secretKey!;

    // Derive public key from secret key (simplified - in real implementation would use proper crypto)
    const publicKey = this.deriveSolanaPublicKey(finalSecretKey);

    return {
      id: accountId,
      name: accountName,
      type: AccountType.SOLANA_ONLY,
      isActive: false,
      createdAt: Date.now(),
      solana: {
        secretKey: finalSecretKey,
        publicKey,
        clusters: config.solana.clusters
      }
    };
  }

  /**
   * Create dual-chain account
   */
  private async createDualChainAccount(
    accountId: string,
    accountName: string,
    config: AccountConfig,
    generatedKeys: { evm?: string; solana?: Uint8Array }
  ): Promise<DualChainAccount> {
    if (!config.evm || !config.solana) {
      throw new Error('Both EVM and Solana configurations required for dual-chain account');
    }

    let evmPrivateKey: string = config.evm.privateKey || '';
    let solanaSecretKey: Uint8Array | undefined = config.solana.secretKey;

    // Generate keys if not provided
    if (!evmPrivateKey) {
      if (!this.config.enableKeyGeneration) {
        throw new Error('Key generation is disabled and no EVM private key provided');
      }
      evmPrivateKey = generateRandomHex(32);
      generatedKeys.evm = evmPrivateKey;
    }

    if (!solanaSecretKey) {
      if (!this.config.enableKeyGeneration) {
        throw new Error('Key generation is disabled and no Solana secret key provided');
      }
      solanaSecretKey = generateRandomBytes(64);
      generatedKeys.solana = solanaSecretKey;
    }

    // At this point both keys are guaranteed to exist
    const finalSolanaSecretKey: Uint8Array = solanaSecretKey!;

    // Derive addresses
    const evmAddress = this.deriveEVMAddress(evmPrivateKey);
    const solanaPublicKey = this.deriveSolanaPublicKey(finalSolanaSecretKey);

    return {
      id: accountId,
      name: accountName,
      type: AccountType.DUAL_CHAIN,
      isActive: false,
      createdAt: Date.now(),
      evm: {
        privateKey: evmPrivateKey,
        address: evmAddress,
        chainIds: config.evm.chainIds
      },
      solana: {
        secretKey: finalSolanaSecretKey,
        publicKey: solanaPublicKey,
        clusters: config.solana.clusters
      }
    };
  }

  /**
   * Validate account configuration
   */
  private validateAccountConfig(config: AccountConfig): void {
    if (!Object.values(AccountType).includes(config.type)) {
      throw new Error(`Invalid account type: ${config.type}`);
    }

    switch (config.type) {
      case AccountType.EVM_ONLY:
        if (!config.evm) {
          throw new Error('EVM configuration required for EVM account');
        }
        if (!config.evm.chainIds || config.evm.chainIds.length === 0) {
          throw new Error('At least one chain ID required for EVM account');
        }
        break;

      case AccountType.SOLANA_ONLY:
        if (!config.solana) {
          throw new Error('Solana configuration required for Solana account');
        }
        if (!config.solana.clusters || config.solana.clusters.length === 0) {
          throw new Error('At least one cluster required for Solana account');
        }
        break;

      case AccountType.DUAL_CHAIN:
        if (!config.evm || !config.solana) {
          throw new Error('Both EVM and Solana configurations required for dual-chain account');
        }
        if (!config.evm.chainIds || config.evm.chainIds.length === 0) {
          throw new Error('At least one chain ID required for dual-chain account');
        }
        if (!config.solana.clusters || config.solana.clusters.length === 0) {
          throw new Error('At least one cluster required for dual-chain account');
        }
        break;
    }
  }

  /**
   * Clear sensitive account data
   */
  private clearAccountData(account: Account): void {
    try {
      if (account.type === AccountType.EVM_ONLY || account.type === AccountType.DUAL_CHAIN) {
        // Clear EVM private key
        if (account.evm.privateKey) {
          (account.evm as any).privateKey = '0'.repeat(account.evm.privateKey.length);
        }
      }

      if (account.type === AccountType.SOLANA_ONLY || account.type === AccountType.DUAL_CHAIN) {
        // Clear Solana secret key
        if (account.solana.secretKey) {
          account.solana.secretKey.fill(0);
        }
      }
    } catch (error) {
      console.warn('Error clearing account data:', error);
    }
  }

  /**
   * Generate default account ID
   */
  private defaultAccountIdGenerator(): string {
    return `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Derive EVM address from private key (simplified implementation)
   */
  private deriveEVMAddress(privateKey: string): string {
    // In a real implementation, this would use proper cryptographic functions
    // This is a simplified mock implementation
    const hash = this.simpleHash(privateKey);
    return `0x${hash.slice(0, 40)}`;
  }

  /**
   * Derive Solana public key from secret key (simplified implementation)
   */
  private deriveSolanaPublicKey(secretKey: Uint8Array): string {
    // In a real implementation, this would use proper ed25519 key derivation
    // This is a simplified mock implementation
    const hash = this.simpleHash(Array.from(secretKey).map(b => b.toString(16).padStart(2, '0')).join(''));
    return hash.slice(0, 44);
  }

  /**
   * Simple hash function for mock key derivation
   */
  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}