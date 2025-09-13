import { EIP6963ProviderDetail } from './types.js';
/**
 * EIP-6963 Wallet Discovery Client
 * Discovers available wallets according to EIP-6963 standard
 */
export declare class EIP6963WalletDiscovery {
    private eventTarget;
    private discoveredWallets;
    private isListening;
    private listeners;
    constructor(eventTarget?: EventTarget);
    /**
     * Start discovering wallets
     */
    startDiscovery(): void;
    /**
     * Stop discovering wallets
     */
    stopDiscovery(): void;
    /**
     * Request providers to announce themselves
     */
    requestProviders(): void;
    /**
     * Get all discovered wallets
     */
    getDiscoveredWallets(): EIP6963ProviderDetail[];
    /**
     * Get a specific wallet by UUID
     */
    getWallet(uuid: string): EIP6963ProviderDetail | undefined;
    /**
     * Get a wallet by name
     */
    getWalletByName(name: string): EIP6963ProviderDetail | undefined;
    /**
     * Get a wallet by RDNS
     */
    getWalletByRDNS(rdns: string): EIP6963ProviderDetail | undefined;
    /**
     * Add a listener for wallet discoveries
     */
    onWalletsChanged(listener: (wallets: EIP6963ProviderDetail[]) => void): void;
    /**
     * Remove a wallet discovery listener
     */
    removeWalletsListener(listener: (wallets: EIP6963ProviderDetail[]) => void): void;
    /**
     * Clear all discovered wallets
     */
    clearWallets(): void;
    /**
     * Handle wallet announcement events
     */
    private handleWalletAnnouncement;
    /**
     * Notify all listeners of wallet changes
     */
    private notifyListeners;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Utility function to discover wallets with a timeout
 */
export declare function discoverWallets(timeout?: number, eventTarget?: EventTarget): Promise<EIP6963ProviderDetail[]>;
/**
 * Utility function to find a specific wallet by name
 */
export declare function findWallet(name: string, timeout?: number, eventTarget?: EventTarget): Promise<EIP6963ProviderDetail | null>;
//# sourceMappingURL=discovery.d.ts.map