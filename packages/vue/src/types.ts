/**
 * Vue-specific types for the wallet mock plugin
 */

import type { App, ComputedRef, Ref } from 'vue';
import type {
  MockWallet,
  WalletConfig,
  WalletState,
  Account,
  SupportedChain,
  WalletEvents
} from '@arenaentertainment/wallet-mock';

/**
 * Configuration for the Vue plugin
 */
export interface MockWalletPluginOptions extends Partial<WalletConfig> {
  /** Whether to connect automatically when the plugin is installed */
  autoConnect?: boolean;
  /** Whether to enable Vue DevTools integration */
  devtools?: boolean;
  /** Custom key for providing/injecting the wallet instance */
  injectKey?: string | symbol;
  /** Production environment checks */
  productionChecks?: boolean;
}

/**
 * Vue plugin install function signature
 */
export interface MockWalletPlugin {
  install(app: App, options?: MockWalletPluginOptions): void;
}

/**
 * Reactive wallet state returned by useWallet composable
 */
export interface ReactiveWalletState {
  /** The wallet instance */
  wallet: Ref<MockWallet | null>;
  /** Whether the wallet is connected */
  isConnected: ComputedRef<boolean>;
  /** Current wallet accounts */
  accounts: ComputedRef<Account[]>;
  /** Current wallet state */
  state: ComputedRef<WalletState | null>;
  /** Whether the wallet is connecting */
  isConnecting: Ref<boolean>;
  /** Last connection error */
  connectionError: Ref<Error | null>;
  /** Connect to the wallet */
  connect(): Promise<void>;
  /** Disconnect from the wallet */
  disconnect(): Promise<void>;
  /** Refresh wallet state */
  refresh(): Promise<void>;
}

/**
 * Reactive account state returned by useAccount composable
 */
export interface ReactiveAccountState {
  /** Current active account */
  currentAccount: ComputedRef<Account | null>;
  /** All available accounts */
  accounts: ComputedRef<Account[]>;
  /** Current account index */
  currentAccountIndex: Ref<number>;
  /** Switch to a specific account */
  switchAccount(accountOrIndex: Account | number): Promise<void>;
  /** Get account by address */
  getAccount(address: string): Account | undefined;
  /** Whether account switching is in progress */
  isSwitching: Ref<boolean>;
  /** Last account switching error */
  switchError: Ref<Error | null>;
}

/**
 * Reactive chain state returned by useChain composable
 */
export interface ReactiveChainState {
  /** Current active chain */
  currentChain: ComputedRef<SupportedChain | null>;
  /** All supported chains */
  supportedChains: ComputedRef<SupportedChain[]>;
  /** Switch to a specific chain */
  switchChain(chainId: string): Promise<void>;
  /** Whether chain switching is in progress */
  isSwitching: Ref<boolean>;
  /** Last chain switching error */
  switchError: Ref<Error | null>;
  /** Whether the current chain is EVM */
  isEVM: ComputedRef<boolean>;
  /** Whether the current chain is Solana */
  isSolana: ComputedRef<boolean>;
}

/**
 * Options for wallet composables
 */
export interface WalletComposableOptions {
  /** Whether to automatically connect on component mount */
  autoConnect?: boolean;
  /** Whether to throw errors or store them in state */
  throwOnError?: boolean;
}

/**
 * Vue DevTools integration state
 */
export interface DevToolsState {
  wallet: MockWallet | null;
  accounts: Account[];
  currentAccount: Account | null;
  currentChain: SupportedChain | null;
  isConnected: boolean;
  connectionHistory: Array<{
    timestamp: Date;
    action: 'connect' | 'disconnect' | 'account_change' | 'chain_change';
    data: any;
  }>;
}

/**
 * Event listener options for composables
 */
export interface ComposableEventOptions {
  /** Whether to automatically clean up listeners on unmount */
  autoCleanup?: boolean;
  /** Whether to immediately execute the callback with current state */
  immediate?: boolean;
}

/**
 * Wallet event handler for Vue composables
 */
export type WalletEventHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * Typed event listeners for wallet events
 */
export interface WalletEventListeners {
  connect: WalletEventHandler<{ accounts: Account[] }>;
  disconnect: WalletEventHandler<void>;
  accountsChanged: WalletEventHandler<{ accounts: Account[] }>;
  chainChanged: WalletEventHandler<{ chainId: string }>;
  error: WalletEventHandler<Error>;
}

/**
 * Security and production check results
 */
export interface ProductionSafetyCheck {
  isProduction: boolean;
  warnings: string[];
  blockingErrors: string[];
  canProceed: boolean;
}

/**
 * Component props for built-in Vue components
 */
export interface WalletConnectButtonProps {
  /** Custom connect button text */
  connectText?: string;
  /** Custom disconnect button text */
  disconnectText?: string;
  /** Whether to show account address when connected */
  showAccount?: boolean;
  /** Whether to show current chain */
  showChain?: boolean;
  /** Custom CSS classes */
  class?: string;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

export interface AccountSelectorProps {
  /** Whether to show account balances */
  showBalances?: boolean;
  /** Whether to show chain indicators */
  showChains?: boolean;
  /** Custom CSS classes */
  class?: string;
  /** Custom item renderer */
  itemRenderer?: (account: Account) => string;
}

export interface ChainSelectorProps {
  /** Whether to show chain logos */
  showLogos?: boolean;
  /** Whether to show network status */
  showStatus?: boolean;
  /** Filter chains by type */
  filterByType?: 'evm' | 'solana' | 'all';
  /** Custom CSS classes */
  class?: string;
}