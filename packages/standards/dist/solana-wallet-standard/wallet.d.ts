import { EventEmitter } from '../../../shared/src/index.ts';
import { WalletAccount, WalletProperties, SolanaWallet, SolanaWalletEvents, SolanaChain } from './types.js';
/**
 * Mock implementation of Solana Wallet Standard
 */
export declare class MockSolanaWallet implements SolanaWallet, EventEmitter<SolanaWalletEvents> {
    private _accounts;
    private _isConnected;
    private eventListeners;
    private readonly _properties;
    private readonly _features;
    constructor(config?: {
        name?: string;
        icon?: string;
        version?: string;
        chains?: SolanaChain[];
    });
    get properties(): WalletProperties;
    get accounts(): readonly WalletAccount[];
    get features(): SolanaWallet['features'];
    on<T extends keyof SolanaWalletEvents>(event: T, listener: SolanaWalletEvents[T]): void;
    off<T extends keyof SolanaWalletEvents>(event: T, listener: SolanaWalletEvents[T]): void;
    once<T extends keyof SolanaWalletEvents>(event: T, listener: SolanaWalletEvents[T]): void;
    emit<T extends keyof SolanaWalletEvents>(event: T, ...args: Parameters<SolanaWalletEvents[T]>): void;
    removeAllListeners<T extends keyof SolanaWalletEvents>(event?: T): void;
    setAccounts(accounts: WalletAccount[]): void;
    addAccount(account: WalletAccount): void;
    removeAccount(publicKey: string): void;
    private createConnectFeature;
    private createDisconnectFeature;
    private createEventsFeature;
    private createSignTransactionFeature;
    private createSignMessageFeature;
    private createSignAndSendTransactionFeature;
    private generateMockPublicKey;
    private generateMockTransactionSignature;
    destroy(): void;
}
//# sourceMappingURL=wallet.d.ts.map