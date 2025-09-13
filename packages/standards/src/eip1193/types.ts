/**
 * EIP-1193 Ethereum Provider Types
 * https://eips.ethereum.org/EIPS/eip-1193
 */

/**
 * Provider request method signature
 */
export interface ProviderRequest {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

/**
 * Provider RPC error as per EIP-1193
 */
export interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
}

/**
 * Provider events as per EIP-1193
 */
export interface ProviderEvents {
  /** Chain changed event */
  chainChanged: (chainId: string) => void;
  /** Accounts changed event */
  accountsChanged: (accounts: string[]) => void;
  /** Connect event */
  connect: (connectInfo: { chainId: string }) => void;
  /** Disconnect event */
  disconnect: (error: ProviderRpcError) => void;
  /** Message event for subscription results */
  message: (message: { type: string; data: unknown }) => void;
  /** Index signature for compatibility */
  [key: string]: (...args: any[]) => void;
}

/**
 * EIP-1193 Ethereum Provider interface
 */
export interface EthereumProvider {
  /**
   * Makes an RPC request to the Ethereum node
   */
  request(args: ProviderRequest): Promise<unknown>;

  /**
   * Adds an event listener
   */
  on<T extends keyof ProviderEvents>(event: T, listener: ProviderEvents[T]): void;

  /**
   * Removes an event listener
   */
  removeListener<T extends keyof ProviderEvents>(event: T, listener: ProviderEvents[T]): void;

  /**
   * Removes all listeners for an event
   */
  removeAllListeners?(event?: keyof ProviderEvents): void;

  /**
   * Provider identification
   */
  readonly isMetaMask?: boolean;
  readonly isConnected?: () => boolean;
  readonly networkVersion?: string;
  readonly chainId?: string;
  readonly selectedAddress?: string | null;
}

/**
 * Common Ethereum RPC methods
 */
export enum EthereumMethod {
  // Account management
  ETH_REQUEST_ACCOUNTS = 'eth_requestAccounts',
  ETH_ACCOUNTS = 'eth_accounts',

  // Chain information
  ETH_CHAIN_ID = 'eth_chainId',
  NET_VERSION = 'net_version',

  // Signing
  PERSONAL_SIGN = 'personal_sign',
  ETH_SIGN = 'eth_sign',
  ETH_SIGN_TYPED_DATA = 'eth_signTypedData',
  ETH_SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
  ETH_SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',

  // Transactions
  ETH_SEND_TRANSACTION = 'eth_sendTransaction',
  ETH_SEND_RAW_TRANSACTION = 'eth_sendRawTransaction',

  // Chain management
  WALLET_SWITCH_ETHEREUM_CHAIN = 'wallet_switchEthereumChain',
  WALLET_ADD_ETHEREUM_CHAIN = 'wallet_addEthereumChain',

  // Permissions
  WALLET_REQUEST_PERMISSIONS = 'wallet_requestPermissions',
  WALLET_GET_PERMISSIONS = 'wallet_getPermissions',

  // Watch assets
  WALLET_WATCH_ASSET = 'wallet_watchAsset'
}

/**
 * Error codes as per EIP-1193
 */
export enum ProviderErrorCode {
  // Standard JSON-RPC 2.0 errors
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,

  // EIP-1193 specific errors
  USER_REJECTED_REQUEST = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,

  // Common wallet errors
  UNSUPPORTED_CHAIN = 4902,
  RESOURCE_UNAVAILABLE = -32002,
  RESOURCE_NOT_FOUND = -32001,
  TRANSACTION_REJECTED = -32003
}

/**
 * Transaction object for eth_sendTransaction
 */
export interface TransactionObject {
  from: string;
  to?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  data?: string;
  nonce?: string;
  type?: string;
}

/**
 * Chain configuration for wallet_addEthereumChain
 */
export interface AddEthereumChainParameter {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

/**
 * Switch chain parameter for wallet_switchEthereumChain
 */
export interface SwitchEthereumChainParameter {
  chainId: string;
}

/**
 * Asset to watch for wallet_watchAsset
 */
export interface WatchAssetParameter {
  type: 'ERC20';
  options: {
    address: string;
    symbol: string;
    decimals: number;
    image?: string;
  };
}

/**
 * Permission object
 */
export interface PermissionObject {
  invoker: string;
  parentCapability: string;
  id: string;
  date: number;
  caveats?: Array<{
    type: string;
    value: unknown;
  }>;
}