import { EIP6963ProviderInfo, EIP6963ProviderDetail, WalletAnnouncerConfig } from './types.js';
import { EthereumProvider } from '../eip1193/types.js';
/**
 * EIP-6963 Wallet Announcer
 * Handles wallet discovery according to EIP-6963 standard
 */
export declare class EIP6963WalletAnnouncer {
    private config;
    private eventTarget;
    private isAnnouncing;
    constructor(config: WalletAnnouncerConfig);
    /**
     * Start listening for provider requests
     */
    startListening(): void;
    /**
     * Stop listening for provider requests
     */
    stopListening(): void;
    /**
     * Announce the wallet provider
     */
    announce(): void;
    /**
     * Update provider info
     */
    updateInfo(info: Partial<EIP6963ProviderInfo>): void;
    /**
     * Update the provider instance
     */
    updateProvider(provider: EthereumProvider): void;
    /**
     * Get current provider detail
     */
    getProviderDetail(): EIP6963ProviderDetail;
    /**
     * Handle provider request events
     */
    private handleProviderRequest;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Utility function to create a standard wallet announcer
 */
export declare function createWalletAnnouncer(info: EIP6963ProviderInfo, provider: EthereumProvider, options?: Partial<WalletAnnouncerConfig>): EIP6963WalletAnnouncer;
/**
 * Utility function to generate a UUID for wallet identification
 */
export declare function generateWalletUUID(): string;
/**
 * Predefined wallet info templates
 */
export declare const WalletInfoTemplates: {
    mockWallet: (uuid?: string) => EIP6963ProviderInfo;
    metamaskMock: (uuid?: string) => EIP6963ProviderInfo;
};
//# sourceMappingURL=announcer.d.ts.map