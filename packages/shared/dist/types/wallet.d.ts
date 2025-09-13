import { Account, AccountConfig, AccountEvents } from './account.js';
import { SupportedChain, ChainEvents } from './chain.js';
/**
 * Wallet state interface
 */
export interface WalletState {
    /** Current accounts */
    accounts: Account[];
    /** Index of currently active account */
    activeAccountIndex: number;
    /** Currently active account */
    activeAccount: Account | null;
    /** Supported chains */
    chains: Record<string, SupportedChain>;
    /** Currently active chain per chain type */
    activeChains: {
        evm?: SupportedChain;
        solana?: SupportedChain;
    };
    /** Connection status */
    isConnected: boolean;
    /** Whether wallet is locked */
    isLocked: boolean;
    /** Wallet initialization status */
    isInitialized: boolean;
}
/**
 * Wallet configuration interface
 */
export interface WalletConfig {
    /** Initial accounts to create */
    accounts?: AccountConfig[];
    /** Default active account index */
    defaultAccountIndex?: number;
    /** Auto-connect on initialization */
    autoConnect?: boolean;
    /** Security settings */
    security?: {
        /** Enable production environment checks */
        enableProductionChecks?: boolean;
        /** Enable secure memory clearing */
        enableSecureMemory?: boolean;
        /** Auto-cleanup on page unload */
        autoCleanup?: boolean;
    };
    /** Debug settings */
    debug?: {
        /** Enable debug logging */
        enableLogging?: boolean;
        /** Log level */
        logLevel?: 'debug' | 'info' | 'warn' | 'error';
    };
}
/**
 * Transaction request interface (generic)
 */
export interface TransactionRequest {
    /** Target address/account */
    to?: string;
    /** Value/amount to send */
    value?: string;
    /** Transaction data */
    data?: string;
    /** Gas limit (EVM) or compute units (Solana) */
    gas?: string | number;
    /** Gas price (EVM only) */
    gasPrice?: string;
    /** Nonce (EVM only) */
    nonce?: number;
}
/**
 * Signature request interface
 */
export interface SignatureRequest {
    /** Data to sign */
    data: string | Uint8Array;
    /** Signature type */
    type: 'message' | 'transaction' | 'typed_data';
    /** Additional metadata */
    metadata?: Record<string, any>;
}
/**
 * Core wallet events
 */
export interface WalletEvents extends AccountEvents, ChainEvents {
    /** Fired when wallet connection state changes */
    connect: () => void;
    disconnect: () => void;
    /** Fired when wallet is locked/unlocked */
    lock: () => void;
    unlock: () => void;
    /** Fired when wallet state changes */
    stateChanged: (state: WalletState) => void;
    /** Fired on errors */
    error: (error: Error) => void;
}
/**
 * Event emitter interface
 */
export interface EventEmitter<T extends Record<string, (...args: any[]) => void> = Record<string, (...args: any[]) => void>> {
    on<K extends keyof T>(event: K, listener: T[K]): void;
    off<K extends keyof T>(event: K, listener: T[K]): void;
    once<K extends keyof T>(event: K, listener: T[K]): void;
    emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void;
    removeAllListeners<K extends keyof T>(event?: K): void;
}
/**
 * Mock wallet core interface
 */
export interface MockWallet extends EventEmitter<WalletEvents> {
    getState(): WalletState;
    isConnected(): boolean;
    isLocked(): boolean;
    addAccount(config: AccountConfig): Promise<string>;
    removeAccount(accountId: string): Promise<void>;
    switchAccount(accountIndex: number): Promise<void>;
    getAccounts(): Account[];
    getActiveAccount(): Account | null;
    addChain(chain: SupportedChain): Promise<void>;
    switchChain(chainId: string): Promise<void>;
    getChains(): Record<string, SupportedChain>;
    getActiveChain(type: 'evm' | 'solana'): SupportedChain | null;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    lock(): Promise<void>;
    unlock(): Promise<void>;
    destroy(): Promise<void>;
}
/**
 * Wallet factory interface
 */
export interface WalletFactory {
    create(config: WalletConfig): Promise<MockWallet>;
    createFromConfig(config: WalletConfig): Promise<MockWallet>;
}
//# sourceMappingURL=wallet.d.ts.map