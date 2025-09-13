import { MockWallet, WalletFactory, WalletConfig, AccountConfig } from '../../../shared/src/index.ts';
/**
 * Preset wallet configurations for common use cases
 */
export interface WalletPreset {
    name: string;
    description: string;
    config: WalletConfig;
}
/**
 * Builder pattern for wallet configuration
 */
export declare class WalletConfigBuilder {
    private config;
    /**
     * Set initial accounts
     */
    withAccounts(accounts: AccountConfig[]): WalletConfigBuilder;
    /**
     * Add a single account
     */
    withAccount(account: AccountConfig): WalletConfigBuilder;
    /**
     * Add EVM-only account
     */
    withEVMAccount(name?: string, chainIds?: string[]): WalletConfigBuilder;
    /**
     * Add Solana-only account
     */
    withSolanaAccount(name?: string, clusters?: string[]): WalletConfigBuilder;
    /**
     * Add dual-chain account
     */
    withDualChainAccount(name?: string, chainIds?: string[], clusters?: string[]): WalletConfigBuilder;
    /**
     * Set default active account index
     */
    withDefaultAccountIndex(index: number): WalletConfigBuilder;
    /**
     * Enable auto-connect
     */
    withAutoConnect(autoConnect?: boolean): WalletConfigBuilder;
    /**
     * Configure security settings
     */
    withSecurity(security: WalletConfig['security']): WalletConfigBuilder;
    /**
     * Enable production checks
     */
    withProductionChecks(enabled?: boolean): WalletConfigBuilder;
    /**
     * Configure debug settings
     */
    withDebug(debug: WalletConfig['debug']): WalletConfigBuilder;
    /**
     * Enable debug logging
     */
    withDebugLogging(enabled?: boolean, logLevel?: 'debug' | 'info' | 'warn' | 'error'): WalletConfigBuilder;
    /**
     * Build the wallet configuration
     */
    build(): WalletConfig;
}
/**
 * Wallet factory implementation for easy instantiation
 */
export declare class MockWalletFactory implements WalletFactory {
    /**
     * Create a wallet with the given configuration
     */
    create(config: WalletConfig): Promise<MockWallet>;
    /**
     * Create a wallet from configuration (alias for create)
     */
    createFromConfig(config: WalletConfig): Promise<MockWallet>;
    /**
     * Create a wallet using a builder pattern
     */
    createWithBuilder(builderFn: (builder: WalletConfigBuilder) => WalletConfigBuilder): Promise<MockWallet>;
    /**
     * Create a wallet from a preset configuration
     */
    createFromPreset(presetName: keyof typeof WALLET_PRESETS): Promise<MockWallet>;
    /**
     * Create a minimal EVM-only wallet
     */
    createEVMWallet(config?: {
        chainIds?: string[];
        accountName?: string;
        autoConnect?: boolean;
    }): Promise<MockWallet>;
    /**
     * Create a minimal Solana-only wallet
     */
    createSolanaWallet(config?: {
        clusters?: string[];
        accountName?: string;
        autoConnect?: boolean;
    }): Promise<MockWallet>;
    /**
     * Create a multi-chain wallet supporting both EVM and Solana
     */
    createMultiChainWallet(config?: {
        evmChainIds?: string[];
        solanaClusters?: string[];
        accountName?: string;
        autoConnect?: boolean;
    }): Promise<MockWallet>;
    /**
     * Create a development wallet with relaxed security
     */
    createDevWallet(config?: {
        accounts?: AccountConfig[];
        autoConnect?: boolean;
        enableLogging?: boolean;
    }): Promise<MockWallet>;
    /**
     * Get configuration builder
     */
    configBuilder(): WalletConfigBuilder;
    /**
     * Get available presets
     */
    getPresets(): Record<string, WalletPreset>;
}
/**
 * Predefined wallet configurations
 */
export declare const WALLET_PRESETS: Record<string, WalletPreset>;
/**
 * Default factory instance
 */
export declare const walletFactory: MockWalletFactory;
/**
 * Convenience functions for creating wallets
 */
export declare const createWallet: (config: WalletConfig) => Promise<MockWallet>;
export declare const createEVMWallet: (config?: {
    chainIds?: string[];
    accountName?: string;
    autoConnect?: boolean;
}) => Promise<MockWallet>;
export declare const createSolanaWallet: (config?: {
    clusters?: string[];
    accountName?: string;
    autoConnect?: boolean;
}) => Promise<MockWallet>;
export declare const createMultiChainWallet: (config?: {
    evmChainIds?: string[];
    solanaClusters?: string[];
    accountName?: string;
    autoConnect?: boolean;
}) => Promise<MockWallet>;
export declare const createDevWallet: (config?: {
    accounts?: AccountConfig[];
    autoConnect?: boolean;
    enableLogging?: boolean;
}) => Promise<MockWallet>;
export declare const createWalletFromPreset: (presetName: keyof typeof WALLET_PRESETS) => Promise<MockWallet>;
//# sourceMappingURL=wallet-factory.d.ts.map