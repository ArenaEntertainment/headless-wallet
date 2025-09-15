/**
 * Stream-based state synchronization for EVM provider
 * Implements observable state pattern similar to MetaMask
 */

import { EventEmitter } from 'events';

export interface StateUpdate<T = any> {
  property: string;
  value: T;
  oldValue?: T;
  timestamp: number;
}

export interface StreamState {
  accounts: string[];
  chainId: string;
  networkVersion: string;
  isConnected: boolean;
  isUnlocked: boolean;
  selectedAddress: string | null;
  permissions: Set<string>;
  pendingRequests: Map<string, any>;
  blockNumber: string | null;
  gasPrice: string | null;
}

/**
 * Observable state stream for EVM wallet
 * Provides efficient state updates and subscription management
 */
export class StateStream extends EventEmitter {
  private state: StreamState;
  private subscribers: Map<string, Set<(update: StateUpdate) => void>> = new Map();
  private stateHistory: StateUpdate[] = [];
  private maxHistorySize = 100;

  constructor(initialState?: Partial<StreamState>) {
    super();
    this.state = {
      accounts: [],
      chainId: '0x1',
      networkVersion: '1',
      isConnected: false,
      isUnlocked: false,
      selectedAddress: null,
      permissions: new Set(),
      pendingRequests: new Map(),
      blockNumber: null,
      gasPrice: null,
      ...initialState,
    };
  }

  /**
   * Get current state snapshot
   */
  getState(): Readonly<StreamState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Get specific state property
   */
  get<K extends keyof StreamState>(key: K): StreamState[K] {
    return this.state[key];
  }

  /**
   * Update state and notify subscribers
   */
  updateState<K extends keyof StreamState>(
    key: K,
    value: StreamState[K],
    options: { silent?: boolean } = {}
  ): void {
    const oldValue = this.state[key];

    // Check if value actually changed
    if (this.isEqual(oldValue, value)) {
      return;
    }

    // Update state
    this.state[key] = value;

    // Create update object
    const update: StateUpdate = {
      property: key,
      value,
      oldValue,
      timestamp: Date.now(),
    };

    // Add to history
    this.addToHistory(update);

    // Notify subscribers unless silent
    if (!options.silent) {
      this.notifySubscribers(key, update);
      this.emit('stateChange', update);
    }

    // Handle specific state changes
    this.handleStateChange(key, value, oldValue);
  }

  /**
   * Batch update multiple state properties
   */
  batchUpdate(updates: Partial<StreamState>, options: { silent?: boolean } = {}): void {
    const changes: StateUpdate[] = [];

    for (const [key, value] of Object.entries(updates)) {
      const typedKey = key as keyof StreamState;
      const oldValue = this.state[typedKey];

      if (!this.isEqual(oldValue, value)) {
        (this.state as any)[typedKey] = value;
        changes.push({
          property: key,
          value,
          oldValue,
          timestamp: Date.now(),
        });
      }
    }

    if (changes.length > 0 && !options.silent) {
      this.emit('batchStateChange', changes);
      changes.forEach(update => {
        this.notifySubscribers(update.property, update);
        this.addToHistory(update);
      });
    }
  }

  /**
   * Subscribe to specific state property changes
   */
  subscribe<K extends keyof StreamState>(
    key: K,
    callback: (update: StateUpdate<StreamState[K]>) => void
  ): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  /**
   * Subscribe to all state changes
   */
  subscribeToAll(callback: (update: StateUpdate) => void): () => void {
    const handler = (update: StateUpdate) => callback(update);
    this.on('stateChange', handler);

    return () => {
      this.off('stateChange', handler);
    };
  }

  /**
   * Get state history
   */
  getHistory(limit?: number): StateUpdate[] {
    if (limit) {
      return this.stateHistory.slice(-limit);
    }
    return [...this.stateHistory];
  }

  /**
   * Clear state history
   */
  clearHistory(): void {
    this.stateHistory = [];
  }

  /**
   * Reset state to initial values
   */
  reset(keepConnection = false): void {
    const resetState: Partial<StreamState> = {
      accounts: [],
      selectedAddress: null,
      permissions: new Set(),
      pendingRequests: new Map(),
      blockNumber: null,
      gasPrice: null,
    };

    if (!keepConnection) {
      resetState.isConnected = false;
      resetState.isUnlocked = false;
    }

    this.batchUpdate(resetState);
  }

  /**
   * Create a derived state stream
   */
  derive<T>(
    selector: (state: StreamState) => T,
    compareFn?: (a: T, b: T) => boolean
  ): DerivedStream<T> {
    return new DerivedStream(this, selector, compareFn);
  }

  // Private methods

  private notifySubscribers(property: string, update: StateUpdate): void {
    const subscribers = this.subscribers.get(property);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error(`Error in state subscriber for ${property}:`, error);
        }
      });
    }
  }

  private addToHistory(update: StateUpdate): void {
    this.stateHistory.push(update);

    // Trim history if it exceeds max size
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
    }
  }

  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (const item of a) {
        if (!b.has(item)) return false;
      }
      return true;
    }
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (const [key, value] of a) {
        if (!b.has(key) || b.get(key) !== value) return false;
      }
      return true;
    }
    return false;
  }

  private handleStateChange<K extends keyof StreamState>(
    key: K,
    value: StreamState[K],
    oldValue: StreamState[K]
  ): void {
    // Emit specific events for important state changes
    switch (key) {
      case 'accounts':
        this.emit('accountsChanged', value);
        if ((value as string[]).length > 0 && (oldValue as string[]).length === 0) {
          this.updateState('selectedAddress', (value as string[])[0]);
        }
        break;

      case 'chainId':
        this.emit('chainChanged', value);
        this.updateState('networkVersion', String(parseInt(value as string, 16)));
        break;

      case 'isConnected':
        if (value && !oldValue) {
          this.emit('connect', { chainId: this.state.chainId });
        } else if (!value && oldValue) {
          this.emit('disconnect');
        }
        break;
    }
  }
}

/**
 * Derived stream that computes values from parent stream
 */
export class DerivedStream<T> extends EventEmitter {
  private value: T;
  private unsubscribe: () => void;

  constructor(
    parent: StateStream,
    selector: (state: StreamState) => T,
    compareFn: (a: T, b: T) => boolean = (a, b) => a === b
  ) {
    super();

    // Initialize with current value
    this.value = selector(parent.getState());

    // Subscribe to parent changes
    this.unsubscribe = parent.subscribeToAll((update) => {
      const newValue = selector(parent.getState());
      if (!compareFn(this.value, newValue)) {
        const oldValue = this.value;
        this.value = newValue;
        this.emit('change', { value: newValue, oldValue });
      }
    });
  }

  getValue(): T {
    return this.value;
  }

  subscribe(callback: (value: T) => void): () => void {
    const handler = ({ value }: { value: T }) => callback(value);
    this.on('change', handler);

    // Call immediately with current value
    callback(this.value);

    return () => {
      this.off('change', handler);
    };
  }

  destroy(): void {
    this.unsubscribe();
    this.removeAllListeners();
  }
}

/**
 * Create a stream middleware for request handling
 */
export function createStreamMiddleware(stream: StateStream) {
  return async (req: any, res: any, next: () => void) => {
    // Track pending requests
    const requestId = Math.random().toString(36).substring(7);
    stream.get('pendingRequests').set(requestId, {
      method: req.method,
      params: req.params,
      timestamp: Date.now(),
    });

    try {
      // Process request
      await next();

      // Update state based on successful requests
      if (req.method === 'eth_requestAccounts' && res.result?.length > 0) {
        stream.batchUpdate({
          accounts: res.result,
          isConnected: true,
          isUnlocked: true,
        });
      }
    } finally {
      // Remove from pending requests
      stream.get('pendingRequests').delete(requestId);
    }
  };
}