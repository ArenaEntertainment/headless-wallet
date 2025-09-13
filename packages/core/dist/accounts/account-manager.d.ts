import { Account, AccountConfig, EventEmitter, WalletEvents, AccountType } from '../../../shared/src/index.ts';
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
export declare class AccountManager {
    private accounts;
    private config;
    private eventEmitter?;
    constructor(config?: AccountManagerConfig, eventEmitter?: EventEmitter<WalletEvents>);
    /**
     * Create a new account
     */
    createAccount(accountConfig: AccountConfig): Promise<AccountCreationResult>;
    /**
     * Remove an account
     */
    removeAccount(accountId: string): Promise<void>;
    /**
     * Get account by ID
     */
    getAccount(accountId: string): Account | null;
    /**
     * Get all accounts
     */
    getAllAccounts(): Account[];
    /**
     * Get accounts by type
     */
    getAccountsByType(type: AccountType): Account[];
    /**
     * Get accounts supporting specific chain type
     */
    getAccountsByChainType(chainType: 'evm' | 'solana'): Account[];
    /**
     * Update account metadata
     */
    updateAccount(accountId: string, updates: Partial<Pick<Account, 'name' | 'isActive'>>): Promise<Account>;
    /**
     * Check if account exists
     */
    hasAccount(accountId: string): boolean;
    /**
     * Get account count
     */
    getAccountCount(): number;
    /**
     * Get EVM address for account
     */
    getEVMAddress(accountId: string): string | null;
    /**
     * Get Solana public key for account
     */
    getSolanaPublicKey(accountId: string): string | null;
    /**
     * Clear all accounts and sensitive data
     */
    clearAllAccounts(): Promise<void>;
    /**
     * Create EVM-only account
     */
    private createEVMAccount;
    /**
     * Create Solana-only account
     */
    private createSolanaAccount;
    /**
     * Create dual-chain account
     */
    private createDualChainAccount;
    /**
     * Validate account configuration
     */
    private validateAccountConfig;
    /**
     * Clear sensitive account data
     */
    private clearAccountData;
    /**
     * Generate default account ID
     */
    private defaultAccountIdGenerator;
    /**
     * Derive EVM address from private key (simplified implementation)
     */
    private deriveEVMAddress;
    /**
     * Derive Solana public key from secret key (simplified implementation)
     */
    private deriveSolanaPublicKey;
    /**
     * Simple hash function for mock key derivation
     */
    private simpleHash;
}
//# sourceMappingURL=account-manager.d.ts.map