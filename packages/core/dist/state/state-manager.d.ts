import { WalletState, Account, SupportedChain } from '../../../shared/src/index.ts';
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
export declare class StateManager {
    private state;
    private config;
    private listeners;
    private saveTimeout?;
    constructor(config?: StateManagerConfig);
    /**
     * Get current wallet state
     */
    getState(): WalletState;
    /**
     * Update wallet state
     */
    updateState(updates: Partial<WalletState>): void;
    /**
     * Update specific state property
     */
    updateStateProperty<K extends keyof WalletState>(key: K, value: WalletState[K]): void;
    /**
     * Reset state to initial values
     */
    resetState(): void;
    /**
     * Add state change listener
     */
    addStateChangeListener(handler: StateChangeHandler): void;
    /**
     * Remove state change listener
     */
    removeStateChangeListener(handler: StateChangeHandler): void;
    /**
     * Remove all state change listeners
     */
    removeAllStateChangeListeners(): void;
    /**
     * Account management methods
     */
    addAccount(account: Account): void;
    removeAccount(accountId: string): void;
    switchAccount(accountIndex: number): void;
    /**
     * Chain management methods
     */
    addChain(chain: SupportedChain): void;
    removeChain(chainId: string): void;
    switchChain(chainId: string): void;
    /**
     * Connection state management
     */
    setConnected(isConnected: boolean): void;
    setLocked(isLocked: boolean): void;
    setInitialized(isInitialized: boolean): void;
    /**
     * Clean up resources
     */
    destroy(): void;
    /**
     * Create initial state
     */
    private createInitialState;
    /**
     * Default state validator
     */
    private defaultStateValidator;
    /**
     * Notify all state change listeners
     */
    private notifyListeners;
    /**
     * Load persisted state from storage
     */
    private loadPersistedState;
    /**
     * Schedule state persistence
     */
    private schedulePersistence;
    /**
     * Persist current state to storage
     */
    private persistState;
    /**
     * Clear persisted state from storage
     */
    private clearPersistedState;
}
//# sourceMappingURL=state-manager.d.ts.map