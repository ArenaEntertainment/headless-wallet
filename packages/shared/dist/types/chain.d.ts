/**
 * Chain configuration interface
 */
export interface Chain {
    /** Unique chain identifier */
    id: string;
    /** Chain type */
    type: 'evm' | 'solana';
    /** Human-readable chain name */
    name: string;
    /** Native currency information */
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    /** RPC endpoints */
    rpcUrls: {
        default: {
            http: string[];
            webSocket?: string[];
        };
        public?: {
            http: string[];
            webSocket?: string[];
        };
    };
    /** Block explorer URLs */
    blockExplorers?: {
        default: {
            name: string;
            url: string;
        };
    };
    /** Whether this is a testnet */
    testnet?: boolean;
}
/**
 * EVM-specific chain configuration
 */
export interface EVMChain extends Chain {
    type: 'evm';
    /** Numeric chain ID for EVM networks */
    chainId: number;
    /** Hex representation of chain ID */
    chainIdHex: string;
}
/**
 * Solana-specific cluster configuration
 */
export interface SolanaCluster extends Chain {
    type: 'solana';
    /** Solana cluster type */
    cluster: 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet';
    /** Cluster endpoint */
    endpoint: string;
}
/**
 * Union type for all chain types
 */
export type SupportedChain = EVMChain | SolanaCluster;
/**
 * Chain management events
 */
export interface ChainEvents {
    /** Fired when a new chain is added */
    chainAdded: (chain: SupportedChain) => void;
    /** Fired when a chain is removed */
    chainRemoved: (chainId: string) => void;
    /** Fired when the active chain changes */
    chainChanged: (chain: SupportedChain) => void;
    /** Fired when chain configuration is updated */
    chainUpdated: (chain: SupportedChain) => void;
    /** Index signature for compatibility */
    [key: string]: (...args: any[]) => void;
}
/**
 * Predefined chain configurations
 */
export declare const CHAIN_PRESETS: {
    readonly ethereum: EVMChain;
    readonly polygon: EVMChain;
    readonly localhost: EVMChain;
    readonly solanaMainnet: SolanaCluster;
    readonly solanaDevnet: SolanaCluster;
};
//# sourceMappingURL=chain.d.ts.map