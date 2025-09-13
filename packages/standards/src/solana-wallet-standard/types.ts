/**
 * Solana Wallet Standard Types
 * Based on https://github.com/wallet-standard/wallet-standard
 */

/**
 * Wallet account interface
 */
export interface WalletAccount {
  /** Base58-encoded public key */
  publicKey: string;
  /** Optional account label */
  label?: string;
  /** Optional account icon */
  icon?: string;
  /** Supported chains for this account */
  chains: string[];
  /** Supported features for this account */
  features: string[];
}

/**
 * Wallet properties
 */
export interface WalletProperties {
  /** Wallet name */
  name: string;
  /** Wallet icon URL or data URI */
  icon: string;
  /** Wallet version */
  version: string;
  /** Supported chains */
  chains: string[];
  /** Supported features */
  features: Record<string, unknown>;
}

/**
 * Base feature interface
 */
export interface WalletFeature {
  /** Feature name */
  readonly name: string;
}

/**
 * Standard connect feature
 */
export interface SolanaConnect extends WalletFeature {
  readonly name: 'standard:connect';
  connect(properties?: { onlyIfTrusted?: boolean }): Promise<{ accounts: WalletAccount[] }>;
}

/**
 * Standard disconnect feature
 */
export interface SolanaDisconnect extends WalletFeature {
  readonly name: 'standard:disconnect';
  disconnect(): Promise<void>;
}

/**
 * Standard events feature
 */
export interface SolanaEvents extends WalletFeature {
  readonly name: 'standard:events';
  on<T extends keyof SolanaWalletEvents>(
    event: T,
    listener: SolanaWalletEvents[T],
    options?: { once?: boolean }
  ): () => void;
}

/**
 * Solana sign transaction feature
 */
export interface SolanaSignTransaction extends WalletFeature {
  readonly name: 'solana:signTransaction';
  signTransaction<T extends SolanaTransaction>(
    inputs: Array<{
      account: WalletAccount;
      transaction: T;
      chain?: string;
    }>
  ): Promise<Array<{ signedTransaction: T }>>;
}

/**
 * Solana sign message feature
 */
export interface SolanaSignMessage extends WalletFeature {
  readonly name: 'solana:signMessage';
  signMessage(
    inputs: Array<{
      account: WalletAccount;
      message: Uint8Array;
    }>
  ): Promise<Array<{ signature: Uint8Array }>>;
}

/**
 * Solana sign and send transaction feature
 */
export interface SolanaSignAndSendTransaction extends WalletFeature {
  readonly name: 'solana:signAndSendTransaction';
  signAndSendTransaction<T extends SolanaTransaction>(
    inputs: Array<{
      account: WalletAccount;
      transaction: T;
      chain?: string;
      options?: {
        skipPreflight?: boolean;
        preflightCommitment?: string;
        maxRetries?: number;
      };
    }>
  ): Promise<Array<{ signature: string }>>;
}

/**
 * Wallet standard events
 */
export interface SolanaWalletEvents {
  /** Account change event */
  change: (properties: { accounts: WalletAccount[] }) => void;
  /** Index signature for compatibility */
  [key: string]: (...args: any[]) => void;
}

/**
 * Solana transaction interface (minimal)
 */
export interface SolanaTransaction {
  /** Serialized transaction */
  serialize(): Uint8Array;
  /** Add signature to transaction */
  addSignature(publicKey: string, signature: Uint8Array): void;
}

/**
 * Mock Solana transaction for testing
 */
export class MockSolanaTransaction implements SolanaTransaction {
  private signatures: Map<string, Uint8Array> = new Map();

  constructor(private data: Uint8Array = new Uint8Array(0)) {}

  serialize(): Uint8Array {
    return this.data;
  }

  addSignature(publicKey: string, signature: Uint8Array): void {
    this.signatures.set(publicKey, signature);
  }

  getSignature(publicKey: string): Uint8Array | undefined {
    return this.signatures.get(publicKey);
  }
}

/**
 * Complete Solana wallet interface combining all features
 */
export interface SolanaWallet {
  /** Wallet properties */
  readonly properties: WalletProperties;
  /** Wallet accounts */
  readonly accounts: readonly WalletAccount[];
  /** Available features */
  readonly features: {
    'standard:connect': SolanaConnect;
    'standard:disconnect': SolanaDisconnect;
    'standard:events': SolanaEvents;
    'solana:signTransaction': SolanaSignTransaction;
    'solana:signMessage': SolanaSignMessage;
    'solana:signAndSendTransaction'?: SolanaSignAndSendTransaction;
  };
}

/**
 * Solana chains
 */
export const SolanaChains = {
  MAINNET: 'solana:mainnet',
  TESTNET: 'solana:testnet',
  DEVNET: 'solana:devnet',
  LOCALNET: 'solana:localnet'
} as const;

export type SolanaChain = typeof SolanaChains[keyof typeof SolanaChains];

/**
 * Feature names
 */
export const FeatureNames = {
  STANDARD_CONNECT: 'standard:connect',
  STANDARD_DISCONNECT: 'standard:disconnect',
  STANDARD_EVENTS: 'standard:events',
  SOLANA_SIGN_TRANSACTION: 'solana:signTransaction',
  SOLANA_SIGN_MESSAGE: 'solana:signMessage',
  SOLANA_SIGN_AND_SEND_TRANSACTION: 'solana:signAndSendTransaction'
} as const;