/**
 * Account type enumeration
 */
export enum AccountType {
  EVM_ONLY = 'evm_only',
  SOLANA_ONLY = 'solana_only',
  DUAL_CHAIN = 'dual_chain'
}

/**
 * Chain types supported by the wallet
 */
export type ChainType = 'evm' | 'solana';

/**
 * Base account interface
 */
export interface BaseAccount {
  /** Unique identifier for the account */
  id: string;
  /** Human-readable name for the account */
  name?: string;
  /** Account type */
  type: AccountType;
  /** Whether the account is currently active */
  isActive: boolean;
  /** Timestamp when account was created */
  createdAt: number;
}

/**
 * EVM-specific account data
 */
export interface EVMAccountData {
  /** EVM private key in hex format */
  privateKey: string;
  /** EVM address derived from private key */
  address: string;
  /** Supported EVM chain IDs */
  chainIds: string[];
}

/**
 * Solana-specific account data
 */
export interface SolanaAccountData {
  /** Solana secret key as Uint8Array */
  secretKey: Uint8Array;
  /** Solana public key */
  publicKey: string;
  /** Supported Solana clusters */
  clusters: string[];
}

/**
 * EVM-only account
 */
export interface EVMAccount extends BaseAccount {
  type: AccountType.EVM_ONLY;
  evm: EVMAccountData;
}

/**
 * Solana-only account
 */
export interface SolanaAccount extends BaseAccount {
  type: AccountType.SOLANA_ONLY;
  solana: SolanaAccountData;
}

/**
 * Dual-chain account supporting both EVM and Solana
 */
export interface DualChainAccount extends BaseAccount {
  type: AccountType.DUAL_CHAIN;
  evm: EVMAccountData;
  solana: SolanaAccountData;
}

/**
 * Union type for all account types
 */
export type Account = EVMAccount | SolanaAccount | DualChainAccount;

/**
 * Configuration for creating a new account
 */
export interface AccountConfig {
  /** Account type to create */
  type: AccountType;
  /** Optional account name */
  name?: string;
  /** EVM configuration (required for EVM_ONLY and DUAL_CHAIN) */
  evm?: {
    /** Private key (if not provided, will be generated) */
    privateKey?: string;
    /** Chain IDs to support */
    chainIds: string[];
  };
  /** Solana configuration (required for SOLANA_ONLY and DUAL_CHAIN) */
  solana?: {
    /** Secret key (if not provided, will be generated) */
    secretKey?: Uint8Array;
    /** Clusters to support */
    clusters: string[];
  };
}

/**
 * Account management events
 */
export interface AccountEvents {
  /** Fired when a new account is added */
  accountAdded: (account: Account) => void;
  /** Fired when an account is removed */
  accountRemoved: (accountId: string) => void;
  /** Fired when the active account changes */
  accountChanged: (account: Account | null) => void;
  /** Fired when account data is updated */
  accountUpdated: (account: Account) => void;
  /** Index signature for compatibility */
  [key: string]: (...args: any[]) => void;
}