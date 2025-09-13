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
export const CHAIN_PRESETS = {
  ethereum: {
    id: '1',
    type: 'evm',
    chainId: 1,
    chainIdHex: '0x1',
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://cloudflare-eth.com'] }
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://etherscan.io' }
    }
  } as EVMChain,

  polygon: {
    id: '137',
    type: 'evm',
    chainId: 137,
    chainIdHex: '0x89',
    name: 'Polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://polygon-rpc.com'] }
    },
    blockExplorers: {
      default: { name: 'PolygonScan', url: 'https://polygonscan.com' }
    }
  } as EVMChain,

  localhost: {
    id: '31337',
    type: 'evm',
    chainId: 31337,
    chainIdHex: '0x7a69',
    name: 'Localhost',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['http://127.0.0.1:8545'] }
    },
    testnet: true
  } as EVMChain,

  solanaMainnet: {
    id: 'solana-mainnet',
    type: 'solana',
    cluster: 'mainnet-beta',
    name: 'Solana Mainnet',
    endpoint: 'https://api.mainnet-beta.solana.com',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    rpcUrls: {
      default: { http: ['https://api.mainnet-beta.solana.com'] }
    },
    blockExplorers: {
      default: { name: 'Solscan', url: 'https://solscan.io' }
    }
  } as SolanaCluster,

  solanaDevnet: {
    id: 'solana-devnet',
    type: 'solana',
    cluster: 'devnet',
    name: 'Solana Devnet',
    endpoint: 'https://api.devnet.solana.com',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    rpcUrls: {
      default: { http: ['https://api.devnet.solana.com'] }
    },
    blockExplorers: {
      default: { name: 'Solscan', url: 'https://solscan.io' }
    },
    testnet: true
  } as SolanaCluster
} as const;