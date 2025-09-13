/**
 * Vue composable for wallet functionality
 */

import {
  ref,
  computed,
  inject,
  onMounted,
  onUnmounted,
  type Ref,
  type ComputedRef
} from 'vue';
import type { MockWallet, Account, WalletState } from '@arenaentertainment/wallet-mock';
import type {
  ReactiveWalletState,
  WalletComposableOptions,
  WalletEventHandler
} from '../types.js';
import { WALLET_INJECTION_KEY, getGlobalWalletInstance } from '../plugin.js';

/**
 * Composable for reactive wallet state and operations
 */
export function useWallet(options: WalletComposableOptions = {}): ReactiveWalletState {
  const {
    autoConnect = false,
    throwOnError = false
  } = options;

  // Try to get wallet from injection first, fallback to global instance
  const injectedWallet = inject(WALLET_INJECTION_KEY, null);
  const wallet = injectedWallet || getGlobalWalletInstance();

  // Reactive state
  const isConnecting = ref(false);
  const connectionError = ref<Error | null>(null);
  const walletState = ref<WalletState | null>(null);

  // Event listeners cleanup
  const eventCleanupFunctions: Array<() => void> = [];

  // Computed values
  const isConnected = computed(() => {
    return wallet.value?.getState().isConnected ?? false;
  });

  const accounts = computed(() => {
    return walletState.value?.accounts ?? [];
  });

  const state = computed(() => walletState.value);

  /**
   * Update internal state from wallet
   */
  const updateState = () => {
    if (wallet.value) {
      walletState.value = wallet.value.getState();
    } else {
      walletState.value = null;
    }
  };

  /**
   * Setup wallet event listeners
   */
  const setupEventListeners = (walletInstance: MockWallet) => {
    // Connect event
    const onConnect = (data: { accounts: Account[] }) => {
      updateState();
      connectionError.value = null;
      isConnecting.value = false;
    };
    walletInstance.on('connect', onConnect);
    eventCleanupFunctions.push(() => walletInstance.off('connect', onConnect));

    // Disconnect event
    const onDisconnect = () => {
      updateState();
      isConnecting.value = false;
    };
    walletInstance.on('disconnect', onDisconnect);
    eventCleanupFunctions.push(() => walletInstance.off('disconnect', onDisconnect));

    // Accounts changed
    const onAccountsChanged = (data: { accounts: Account[] }) => {
      updateState();
    };
    walletInstance.on('accountsChanged', onAccountsChanged);
    eventCleanupFunctions.push(() => walletInstance.off('accountsChanged', onAccountsChanged));

    // Chain changed
    const onChainChanged = (data: { chainId: string }) => {
      updateState();
    };
    walletInstance.on('chainChanged', onChainChanged);
    eventCleanupFunctions.push(() => walletInstance.off('chainChanged', onChainChanged));

    // Error event
    const onError = (error: Error) => {
      connectionError.value = error;
      isConnecting.value = false;

      if (throwOnError) {
        throw error;
      }
    };
    walletInstance.on('error', onError);
    eventCleanupFunctions.push(() => walletInstance.off('error', onError));
  };

  /**
   * Connect to the wallet
   */
  const connect = async (): Promise<void> => {
    if (!wallet.value) {
      const error = new Error('Wallet instance not available');
      connectionError.value = error;

      if (throwOnError) {
        throw error;
      }
      return;
    }

    try {
      isConnecting.value = true;
      connectionError.value = null;

      await wallet.value.connect();
      updateState();
    } catch (error) {
      const walletError = error instanceof Error ? error : new Error('Connection failed');
      connectionError.value = walletError;
      isConnecting.value = false;

      if (throwOnError) {
        throw walletError;
      }
    }
  };

  /**
   * Disconnect from the wallet
   */
  const disconnect = async (): Promise<void> => {
    if (!wallet.value) {
      return;
    }

    try {
      await wallet.value.disconnect();
      updateState();
    } catch (error) {
      const walletError = error instanceof Error ? error : new Error('Disconnection failed');
      connectionError.value = walletError;

      if (throwOnError) {
        throw walletError;
      }
    }
  };

  /**
   * Refresh wallet state
   */
  const refresh = async (): Promise<void> => {
    updateState();
  };

  /**
   * Setup wallet when available
   */
  const initializeWallet = () => {
    if (wallet.value) {
      setupEventListeners(wallet.value);
      updateState();

      // Auto-connect if requested
      if (autoConnect && !isConnected.value) {
        connect().catch((error) => {
          console.warn('[useWallet] Auto-connect failed:', error);
        });
      }
    }
  };

  // Watch for wallet changes
  const stopWalletWatcher = computed(() => wallet.value, (newWallet, oldWallet) => {
    // Cleanup old listeners
    eventCleanupFunctions.forEach(cleanup => cleanup());
    eventCleanupFunctions.length = 0;

    // Setup new wallet
    if (newWallet) {
      setupEventListeners(newWallet);
      updateState();
    }
  }, { immediate: true });

  // Lifecycle hooks
  onMounted(() => {
    initializeWallet();
  });

  onUnmounted(() => {
    // Cleanup event listeners
    eventCleanupFunctions.forEach(cleanup => cleanup());
    eventCleanupFunctions.length = 0;
    stopWalletWatcher();
  });

  return {
    wallet: wallet as Ref<MockWallet | null>,
    isConnected,
    accounts,
    state,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    refresh
  };
}

/**
 * Composable for listening to wallet events
 */
export function useWalletEvents() {
  const { wallet } = useWallet();
  const eventCleanupFunctions: Array<() => void> = [];

  /**
   * Listen to a wallet event
   */
  const on = <T = any>(
    event: string,
    handler: WalletEventHandler<T>,
    options: { immediate?: boolean } = {}
  ) => {
    if (!wallet.value) {
      console.warn('[useWalletEvents] Wallet not available for event:', event);
      return () => {}; // Return empty cleanup function
    }

    wallet.value.on(event, handler as any);

    // Store cleanup function
    const cleanup = () => {
      if (wallet.value) {
        wallet.value.off(event, handler as any);
      }
    };
    eventCleanupFunctions.push(cleanup);

    // Immediate execution for certain events
    if (options.immediate) {
      const currentState = wallet.value.getState();
      switch (event) {
        case 'connect':
          if (currentState.isConnected) {
            handler({ accounts: currentState.accounts } as T);
          }
          break;
        case 'accountsChanged':
          handler({ accounts: currentState.accounts } as T);
          break;
        case 'chainChanged':
          if (currentState.currentChain) {
            handler({ chainId: currentState.currentChain.id } as T);
          }
          break;
      }
    }

    return cleanup;
  };

  /**
   * Remove event listener
   */
  const off = (event: string, handler: WalletEventHandler) => {
    if (wallet.value) {
      wallet.value.off(event, handler as any);
    }
  };

  /**
   * Listen to event once
   */
  const once = <T = any>(event: string, handler: WalletEventHandler<T>) => {
    if (!wallet.value) {
      console.warn('[useWalletEvents] Wallet not available for event:', event);
      return;
    }

    const onceHandler = (data: T) => {
      handler(data);
      off(event, onceHandler);
    };

    return on(event, onceHandler);
  };

  // Cleanup on unmount
  onUnmounted(() => {
    eventCleanupFunctions.forEach(cleanup => cleanup());
    eventCleanupFunctions.length = 0;
  });

  return {
    on,
    off,
    once
  };
}