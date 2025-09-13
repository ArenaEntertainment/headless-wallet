import { MockWallet, WalletState, WalletConfig, WalletEvents, Account, AccountConfig, SupportedChain } from '../../../shared/src/index.ts';
import { EthereumProvider, SolanaWallet } from '../../../standards/src/index.ts';
/**
 * Unified multi-chain wallet implementation
 */
export declare class UnifiedWallet implements MockWallet {
    private eventEmitter;
    private productionGuard;
    private stateManager;
    private accountManager;
    private ethereumProvider?;
    private solanaWallet?;
    private config;
    private isDestroyed;
    constructor(config?: WalletConfig);
    on<K extends keyof WalletEvents>(event: K, listener: WalletEvents[K]): void;
    off<K extends keyof WalletEvents>(event: K, listener: WalletEvents[K]): void;
    once<K extends keyof WalletEvents>(event: K, listener: WalletEvents[K]): void;
    emit<K extends keyof WalletEvents>(event: K, ...args: Parameters<WalletEvents[K]>): void;
    removeAllListeners<K extends keyof WalletEvents>(event?: K): void;
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
    getEthereumProvider(): EthereumProvider | null;
    getSolanaWallet(): SolanaWallet | null;
    private initialize;
    private initializeProviders;
    private initializeEthereumProvider;
    private initializeSolanaWallet;
    private updateProviderAccounts;
    private updateEthereumProviderChain;
    private handleStateChange;
    private handlePageUnload;
    private validateWalletState;
    private ensureNotDestroyed;
}
//# sourceMappingURL=unified-wallet.d.ts.map