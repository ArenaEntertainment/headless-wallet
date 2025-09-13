import { EventEmitter } from '../../../shared/src/index.ts';
import { EthereumProvider, ProviderRequest, ProviderRpcError, ProviderEvents } from './types.js';
/**
 * EIP-1193 compliant Ethereum provider implementation
 */
export declare class MockEthereumProvider implements EthereumProvider, EventEmitter<ProviderEvents> {
    private eventListeners;
    private _chainId;
    private _accounts;
    private _isConnected;
    private _networkVersion;
    readonly isMetaMask = false;
    readonly isMockWallet = true;
    constructor(initialChainId?: string);
    /**
     * Get current chain ID
     */
    get chainId(): string;
    /**
     * Get network version
     */
    get networkVersion(): string;
    /**
     * Get selected address (first account)
     */
    get selectedAddress(): string | null;
    /**
     * Check if provider is connected
     */
    isConnected(): boolean;
    /**
     * Make an RPC request
     */
    request(args: ProviderRequest): Promise<unknown>;
    /**
     * Add event listener
     */
    on<T extends keyof ProviderEvents>(event: T, listener: ProviderEvents[T]): void;
    /**
     * Remove event listener
     */
    removeListener<T extends keyof ProviderEvents>(event: T, listener: ProviderEvents[T]): void;
    /**
     * Remove all listeners for an event
     */
    removeAllListeners(event?: keyof ProviderEvents): void;
    /**
     * Remove event listener (alias for removeListener)
     */
    off<T extends keyof ProviderEvents>(event: T, listener: ProviderEvents[T]): void;
    /**
     * Add one-time event listener
     */
    once<T extends keyof ProviderEvents>(event: T, listener: ProviderEvents[T]): void;
    /**
     * Emit an event
     */
    emit<T extends keyof ProviderEvents>(event: T, ...args: Parameters<ProviderEvents[T]>): void;
    /**
     * Set accounts and emit accountsChanged event
     */
    setAccounts(accounts: string[]): void;
    /**
     * Set chain ID and emit chainChanged event
     */
    setChainId(chainId: string): void;
    /**
     * Connect the provider
     */
    connect(): void;
    /**
     * Disconnect the provider
     */
    disconnect(error?: ProviderRpcError): void;
    private handleRequestAccounts;
    private handleAccounts;
    private handleChainId;
    private handleNetVersion;
    private handlePersonalSign;
    private handleSignTypedDataV4;
    private handleSendTransaction;
    private handleSwitchChain;
    private handleAddChain;
    private handleWatchAsset;
    private handlePermissions;
    /**
     * Create a properly formatted provider error
     */
    private createError;
}
//# sourceMappingURL=provider.d.ts.map