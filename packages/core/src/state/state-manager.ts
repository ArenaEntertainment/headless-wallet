import type {
  WalletState,
  WalletConfig,
  EventEmitter,
  Account,
  SupportedChain
} from '@arenaentertainment/wallet-mock-shared';

/**
 * State change event handler type
 */
export type StateChangeHandler = (state: WalletState) => void;

/**
 * State manager configuration
 */
export interface StateManagerConfig {
  /** Initial state */
  initialState?: Partial<WalletState>;
  /** Enable state persistence */
  enablePersistence?: boolean;
  /** Storage key for persisted state */
  storageKey?: string;
  /** State validation function */
  stateValidator?: (state: WalletState) => boolean;
  /** Auto-save delay in milliseconds */
  autoSaveDelay?: number;
}

/**
 * State manager for wallet state management and persistence
 */
export class StateManager {
  private state: WalletState;
  private config: Required<StateManagerConfig>;
  private listeners: Set<StateChangeHandler> = new Set();
  private saveTimeout?: ReturnType<typeof setTimeout>;

  constructor(config: StateManagerConfig = {}) {
    this.config = {
      initialState: config.initialState || {},
      enablePersistence: config.enablePersistence ?? false,
      storageKey: config.storageKey || 'wallet-mock-state',
      stateValidator: config.stateValidator || this.defaultStateValidator,
      autoSaveDelay: config.autoSaveDelay ?? 500
    };

    // Initialize state
    this.state = this.createInitialState();

    // Load persisted state if enabled
    if (this.config.enablePersistence) {
      this.loadPersistedState();
    }
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.state }; // Return a copy to prevent external mutations
  }

  /**
   * Update wallet state
   */
  updateState(updates: Partial<WalletState>): void {
    const newState = { ...this.state, ...updates };

    // Validate new state
    if (!this.config.stateValidator(newState)) {
      throw new Error('Invalid state update');
    }

    const oldState = this.state;
    this.state = newState;

    // Emit state change event
    this.notifyListeners(this.state);

    // Schedule persistence if enabled
    if (this.config.enablePersistence) {
      this.schedulePersistence();
    }
  }

  /**
   * Update specific state property
   */
  updateStateProperty<K extends keyof WalletState>(
    key: K,
    value: WalletState[K]
  ): void {
    this.updateState({ [key]: value } as Partial<WalletState>);
  }

  /**
   * Reset state to initial values
   */
  resetState(): void {
    this.state = this.createInitialState();
    this.notifyListeners(this.state);

    if (this.config.enablePersistence) {
      this.clearPersistedState();
    }
  }

  /**
   * Add state change listener
   */
  addStateChangeListener(handler: StateChangeHandler): void {
    this.listeners.add(handler);
  }

  /**
   * Remove state change listener
   */
  removeStateChangeListener(handler: StateChangeHandler): void {
    this.listeners.delete(handler);
  }

  /**
   * Remove all state change listeners
   */
  removeAllStateChangeListeners(): void {
    this.listeners.clear();
  }

  /**
   * Account management methods
   */
  addAccount(account: Account): void {
    const accounts: Account[] = [...this.state.accounts, account];

    // Set as active if it's the first account
    const activeAccountIndex = this.state.accounts.length === 0 ? 0 : this.state.activeAccountIndex;
    const activeAccount: Account | null = activeAccountIndex === accounts.length - 1 ? account : this.state.activeAccount;

    this.updateState({
      accounts,
      activeAccountIndex,
      activeAccount
    });
  }

  removeAccount(accountId: string): void {
    const accountIndex = this.state.accounts.findIndex(account => account.id === accountId);
    if (accountIndex === -1) {
      throw new Error(`Account with id ${accountId} not found`);
    }

    const accounts: Account[] = this.state.accounts.filter((account: Account) => account.id !== accountId);
    let activeAccountIndex = this.state.activeAccountIndex;
    let activeAccount = this.state.activeAccount;

    // Adjust active account index if necessary
    if (accountIndex === this.state.activeAccountIndex) {
      // Active account was removed
      if (accounts.length === 0) {
        activeAccountIndex = 0;
        activeAccount = null;
      } else {
        activeAccountIndex = Math.min(activeAccountIndex, accounts.length - 1);
        activeAccount = accounts[activeAccountIndex];
      }
    } else if (accountIndex < this.state.activeAccountIndex) {
      // Account before active account was removed
      activeAccountIndex = this.state.activeAccountIndex - 1;
    }

    this.updateState({
      accounts,
      activeAccountIndex,
      activeAccount
    });
  }

  switchAccount(accountIndex: number): void {
    if (accountIndex < 0 || accountIndex >= this.state.accounts.length) {
      throw new Error(`Invalid account index: ${accountIndex}`);
    }

    const activeAccount = this.state.accounts[accountIndex];
    this.updateState({
      activeAccountIndex: accountIndex,
      activeAccount
    });
  }

  /**
   * Chain management methods
   */
  addChain(chain: SupportedChain): void {
    const chains = {
      ...this.state.chains,
      [chain.id]: chain
    };

    const updates: Partial<WalletState> = { chains };

    // Set as active chain if none exists for this type
    if (chain.type === 'evm' && !this.state.activeChains.evm) {
      updates.activeChains = {
        ...this.state.activeChains,
        evm: chain
      };
    } else if (chain.type === 'solana' && !this.state.activeChains.solana) {
      updates.activeChains = {
        ...this.state.activeChains,
        solana: chain
      };
    }

    this.updateState(updates);
  }

  removeChain(chainId: string): void {
    const { [chainId]: removedChain, ...chains } = this.state.chains;

    if (!removedChain) {
      throw new Error(`Chain with id ${chainId} not found`);
    }

    const updates: Partial<WalletState> = { chains };

    // Update active chain if the removed chain was active
    if (this.state.activeChains.evm?.id === chainId) {
      const alternativeChain = Object.values(chains).find((chain: SupportedChain) => chain.type === 'evm');
      updates.activeChains = {
        ...this.state.activeChains,
        evm: alternativeChain
      };
    }

    if (this.state.activeChains.solana?.id === chainId) {
      const alternativeChain = Object.values(chains).find((chain: SupportedChain) => chain.type === 'solana');
      updates.activeChains = {
        ...this.state.activeChains,
        solana: alternativeChain
      };
    }

    this.updateState(updates);
  }

  switchChain(chainId: string): void {
    const chain = this.state.chains[chainId];
    if (!chain) {
      throw new Error(`Chain with id ${chainId} not found`);
    }

    const activeChains = {
      ...this.state.activeChains,
      [chain.type]: chain
    };

    this.updateState({ activeChains });
  }

  /**
   * Connection state management
   */
  setConnected(isConnected: boolean): void {
    this.updateState({ isConnected });
  }

  setLocked(isLocked: boolean): void {
    this.updateState({ isLocked });
  }

  setInitialized(isInitialized: boolean): void {
    this.updateState({ isInitialized });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Cancel pending saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Clear listeners
    this.removeAllStateChangeListeners();

    // Clear persisted state if enabled
    if (this.config.enablePersistence) {
      this.clearPersistedState();
    }
  }

  /**
   * Create initial state
   */
  private createInitialState(): WalletState {
    const defaultState: WalletState = {
      accounts: [],
      activeAccountIndex: 0,
      activeAccount: null,
      chains: {},
      activeChains: {},
      isConnected: false,
      isLocked: false,
      isInitialized: false
    };

    return {
      ...defaultState,
      ...this.config.initialState
    };
  }

  /**
   * Default state validator
   */
  private defaultStateValidator(state: WalletState): boolean {
    try {
      // Check required properties exist
      if (typeof state.accounts === 'undefined' ||
          typeof state.activeAccountIndex !== 'number' ||
          typeof state.chains === 'undefined' ||
          typeof state.activeChains === 'undefined' ||
          typeof state.isConnected !== 'boolean' ||
          typeof state.isLocked !== 'boolean' ||
          typeof state.isInitialized !== 'boolean') {
        return false;
      }

      // Check arrays are valid
      if (!Array.isArray(state.accounts)) {
        return false;
      }

      // Check active account index is valid
      if (state.activeAccountIndex < 0 ||
          (state.accounts.length > 0 && state.activeAccountIndex >= state.accounts.length)) {
        return false;
      }

      // Check active account consistency
      if (state.accounts.length === 0 && state.activeAccount !== null) {
        return false;
      }

      if (state.accounts.length > 0) {
        const expectedActiveAccount = state.accounts[state.activeAccountIndex];
        if (state.activeAccount?.id !== expectedActiveAccount?.id) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Notify all state change listeners
   */
  private notifyListeners(state: WalletState): void {
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    }
  }

  /**
   * Load persisted state from storage
   */
  private loadPersistedState(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const persistedState = localStorage.getItem(this.config.storageKey);
        if (persistedState) {
          const parsedState = JSON.parse(persistedState);
          if (this.config.stateValidator(parsedState)) {
            this.state = parsedState;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }

  /**
   * Schedule state persistence
   */
  private schedulePersistence(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.persistState();
    }, this.config.autoSaveDelay);
  }

  /**
   * Persist current state to storage
   */
  private persistState(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.state));
      }
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }

  /**
   * Clear persisted state from storage
   */
  private clearPersistedState(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.config.storageKey);
      }
    } catch (error) {
      console.warn('Failed to clear persisted state:', error);
    }
  }
}