/**
 * React-specific TypeScript types for wallet-mock
 */

import type { ReactNode } from 'react';
import type {
  MockWallet,
  Account,
  WalletState,
  Chain,
  SupportedChain,
  AccountConfig,
  WalletConfig,
  ProductionGuardConfig
} from '@arenaentertainment/wallet-mock';

// Re-export core types for convenience
export type {
  MockWallet,
  Account,
  WalletState,
  Chain,
  SupportedChain,
  AccountConfig,
  WalletConfig,
  ProductionGuardConfig
};

// =============================================================================
// Provider Configuration
// =============================================================================

/**
 * Configuration for the MockWalletProvider
 */
export interface MockWalletProviderConfig {
  /** Initial wallet configuration */
  wallet?: Partial<WalletConfig>;
  /** Initial accounts to create */
  accounts?: AccountConfig[];
  /** Initial chain to connect to */
  initialChain?: SupportedChain;
  /** Whether to auto-connect on mount */
  autoConnect?: boolean;
  /** Production environment checks */
  production?: ProductionGuardConfig;
  /** Enable development mode features */
  devMode?: boolean;
  /** Custom wallet instance (overrides wallet config) */
  walletInstance?: MockWallet;
}

/**
 * Props for the MockWalletProvider component
 */
export interface MockWalletProviderProps extends MockWalletProviderConfig {
  /** React children */
  children: ReactNode;
}

// =============================================================================
// Context State
// =============================================================================

/**
 * React context state for wallet functionality
 */
export interface WalletContextState {
  /** Current wallet instance */
  wallet: MockWallet | null;
  /** Current wallet state */
  state: WalletState | null;
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Current accounts */
  accounts: Account[];
  /** Current account (first account or explicitly selected) */
  currentAccount: Account | null;
  /** Current chain */
  currentChain: Chain | null;
  /** Available chains */
  availableChains: Chain[];
  /** Connection status */
  isConnecting: boolean;
  /** Last connection error */
  error: Error | null;
  /** Whether provider is initialised */
  isInitialised: boolean;
}

/**
 * React context actions for wallet functionality
 */
export interface WalletContextActions {
  /** Connect to wallet */
  connect: () => Promise<void>;
  /** Disconnect from wallet */
  disconnect: () => Promise<void>;
  /** Switch to a specific account */
  switchAccount: (accountId: string) => Promise<void>;
  /** Switch to a specific chain */
  switchChain: (chainId: string) => Promise<void>;
  /** Add a new account */
  addAccount: (config: AccountConfig) => Promise<Account>;
  /** Remove an account */
  removeAccount: (accountId: string) => Promise<void>;
  /** Refresh wallet state */
  refresh: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Complete wallet context type
 */
export interface WalletContext extends WalletContextState, WalletContextActions {}

// =============================================================================
// Hook Options
// =============================================================================

/**
 * Options for wallet-related hooks
 */
export interface WalletHookOptions {
  /** Whether to throw errors instead of setting error state */
  throwOnError?: boolean;
  /** Whether to auto-connect on mount */
  autoConnect?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Custom connection handler */
  onConnect?: (accounts: Account[]) => void;
  /** Custom disconnection handler */
  onDisconnect?: () => void;
}

/**
 * Options for useAccount hook
 */
export interface UseAccountOptions extends WalletHookOptions {
  /** Account ID to select initially */
  initialAccountId?: string;
  /** Whether to auto-switch to first account */
  autoSelect?: boolean;
}

/**
 * Options for useChain hook
 */
export interface UseChainOptions extends WalletHookOptions {
  /** Chain ID to select initially */
  initialChainId?: string;
  /** Whether to auto-switch to first available chain */
  autoSelect?: boolean;
}

// =============================================================================
// Hook Return Types
// =============================================================================

/**
 * Return type for useWallet hook
 */
export interface UseWalletReturn extends WalletContextState, WalletContextActions {
  /** Subscribe to wallet events */
  subscribe: <T = any>(event: string, handler: (data: T) => void) => () => void;
  /** Listen to an event once */
  once: <T = any>(event: string, handler: (data: T) => void) => () => void;
}

/**
 * Return type for useAccount hook
 */
export interface UseAccountReturn {
  /** Current selected account */
  account: Account | null;
  /** All available accounts */
  accounts: Account[];
  /** Switch to an account */
  switchAccount: (accountId: string) => Promise<void>;
  /** Add new account */
  addAccount: (config: AccountConfig) => Promise<Account>;
  /** Remove account */
  removeAccount: (accountId: string) => Promise<void>;
  /** Whether switching account */
  isSwitching: boolean;
  /** Account switch error */
  error: Error | null;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Return type for useChain hook
 */
export interface UseChainReturn {
  /** Current selected chain */
  chain: Chain | null;
  /** All available chains */
  chains: Chain[];
  /** Switch to a chain */
  switchChain: (chainId: string) => Promise<void>;
  /** Whether switching chain */
  isSwitching: boolean;
  /** Chain switch error */
  error: Error | null;
  /** Clear error state */
  clearError: () => void;
  /** Check if chain is supported */
  isSupported: (chainId: string) => boolean;
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * Wallet event handler type
 */
export type WalletEventHandler<T = any> = (data: T) => void;

/**
 * Event subscription cleanup function
 */
export type EventCleanup = () => void;

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for wallet connection components
 */
export interface WalletConnectionProps {
  /** Custom connect button content */
  connectText?: ReactNode;
  /** Custom disconnect button content */
  disconnectText?: ReactNode;
  /** Custom connecting state content */
  connectingText?: ReactNode;
  /** Custom styling */
  className?: string;
  /** Loading state styling */
  loadingClassName?: string;
  /** Disabled state styling */
  disabledClassName?: string;
  /** Click handlers */
  onConnect?: () => void;
  onDisconnect?: () => void;
  /** Whether to show connection status */
  showStatus?: boolean;
}

/**
 * Props for account selector components
 */
export interface AccountSelectorProps {
  /** Custom account display renderer */
  renderAccount?: (account: Account, isSelected: boolean) => ReactNode;
  /** Custom styling */
  className?: string;
  /** Selected option styling */
  selectedClassName?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Change handler */
  onChange?: (account: Account) => void;
  /** Whether to show add account option */
  showAddAccount?: boolean;
}

/**
 * Props for chain selector components
 */
export interface ChainSelectorProps {
  /** Custom chain display renderer */
  renderChain?: (chain: Chain, isSelected: boolean) => ReactNode;
  /** Custom styling */
  className?: string;
  /** Selected option styling */
  selectedClassName?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Change handler */
  onChange?: (chain: Chain) => void;
  /** Filter chains function */
  filterChains?: (chains: Chain[]) => Chain[];
}

/**
 * Props for wallet status display components
 */
export interface WalletStatusProps {
  /** Show connection status */
  showConnection?: boolean;
  /** Show current account */
  showAccount?: boolean;
  /** Show current chain */
  showChain?: boolean;
  /** Show account balance */
  showBalance?: boolean;
  /** Custom styling */
  className?: string;
  /** Custom status renderer */
  renderStatus?: (state: WalletContextState) => ReactNode;
}