/**
 * React hook for wallet functionality
 */

import { useCallback, useContext, useEffect, useRef } from 'react';
import { WalletContext } from '../context.js';
import type { UseWalletReturn, WalletHookOptions } from '../types.js';

/**
 * Main hook for accessing wallet functionality
 *
 * Provides access to wallet state and operations with React 18 compatibility.
 * Uses React context for state management and includes event subscription capabilities.
 *
 * @param options - Configuration options for the hook
 * @returns Wallet state and operations
 *
 * @example
 * ```tsx
 * function WalletComponent() {
 *   const { wallet, isConnected, connect, accounts } = useWallet({
 *     autoConnect: true,
 *     onConnect: (accounts) => console.log('Connected with accounts:', accounts)
 *   });
 *
 *   return (
 *     <div>
 *       {isConnected ? (
 *         <p>Connected with {accounts.length} accounts</p>
 *       ) : (
 *         <button onClick={connect}>Connect Wallet</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWallet(options: WalletHookOptions = {}): UseWalletReturn {
  const {
    throwOnError = false,
    autoConnect = false,
    onError,
    onConnect,
    onDisconnect
  } = options;

  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('useWallet must be used within a MockWalletProvider');
  }

  const {
    wallet,
    state,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    isInitialised,
    connect: contextConnect,
    disconnect: contextDisconnect,
    switchAccount,
    switchChain,
    addAccount,
    removeAccount,
    refresh,
    clearError
  } = context;

  // Keep refs for stable callback references
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && isInitialised && !isConnected && !isConnecting && !error) {
      contextConnect().catch((connectError) => {
        console.warn('[useWallet] Auto-connect failed:', connectError);
      });
    }
  }, [autoConnect, isInitialised, isConnected, isConnecting, error, contextConnect]);

  // Error handling effect
  useEffect(() => {
    if (error) {
      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;

      if (errorHandler) {
        errorHandler(error);
      }

      if (shouldThrow) {
        throw error;
      }
    }
  }, [error]);

  // Event handlers effects
  useEffect(() => {
    const { onConnect: connectHandler } = optionsRef.current;
    if (isConnected && connectHandler && accounts.length > 0) {
      connectHandler(accounts);
    }
  }, [isConnected, accounts]);

  useEffect(() => {
    const { onDisconnect: disconnectHandler } = optionsRef.current;
    if (!isConnected && disconnectHandler) {
      disconnectHandler();
    }
  }, [isConnected]);

  // Wrapped operations with error handling
  const connect = useCallback(async () => {
    try {
      await contextConnect();
    } catch (connectError) {
      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;
      const error = connectError instanceof Error ? connectError : new Error('Connection failed');

      if (errorHandler) {
        errorHandler(error);
      }

      if (shouldThrow) {
        throw error;
      }
    }
  }, [contextConnect]);

  const disconnect = useCallback(async () => {
    try {
      await contextDisconnect();
    } catch (disconnectError) {
      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;
      const error = disconnectError instanceof Error ? disconnectError : new Error('Disconnection failed');

      if (errorHandler) {
        errorHandler(error);
      }

      if (shouldThrow) {
        throw error;
      }
    }
  }, [contextDisconnect]);

  // Event subscription utilities
  const subscribe = useCallback(<T = any>(
    event: string,
    handler: (data: T) => void
  ) => {
    if (!wallet) {
      console.warn('[useWallet] Wallet not available for event subscription:', event);
      return () => {}; // Return empty cleanup function
    }

    // Add event listener
    wallet.on(event, handler as any);

    // Return cleanup function
    return () => {
      if (wallet) {
        wallet.off(event, handler as any);
      }
    };
  }, [wallet]);

  const once = useCallback(<T = any>(
    event: string,
    handler: (data: T) => void
  ) => {
    if (!wallet) {
      console.warn('[useWallet] Wallet not available for one-time event:', event);
      return () => {};
    }

    // Create wrapper that removes itself after execution
    const onceHandler = (data: T) => {
      handler(data);
      wallet.off(event, onceHandler as any);
    };

    wallet.on(event, onceHandler as any);

    // Return cleanup function
    return () => {
      if (wallet) {
        wallet.off(event, onceHandler as any);
      }
    };
  }, [wallet]);

  return {
    // State
    wallet,
    state,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    isInitialised,

    // Actions
    connect,
    disconnect,
    switchAccount,
    switchChain,
    addAccount,
    removeAccount,
    refresh,
    clearError,

    // Event utilities
    subscribe,
    once
  };
}

/**
 * Hook for accessing wallet connection status
 *
 * Simplified hook that only provides connection-related state and actions.
 *
 * @example
 * ```tsx
 * function ConnectionStatus() {
 *   const { isConnected, isConnecting, connect, disconnect } = useWalletConnection();
 *
 *   if (isConnecting) {
 *     return <div>Connecting...</div>;
 *   }
 *
 *   return (
 *     <button onClick={isConnected ? disconnect : connect}>
 *       {isConnected ? 'Disconnect' : 'Connect'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useWalletConnection() {
  const { isConnected, isConnecting, error, connect, disconnect, clearError } = useWallet();

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    clearError
  };
}

/**
 * Hook for accessing wallet state only (no actions)
 *
 * Useful for components that only need to display wallet information
 * without triggering any wallet operations.
 *
 * @example
 * ```tsx
 * function WalletInfo() {
 *   const { accounts, currentChain, isConnected } = useWalletState();
 *
 *   if (!isConnected) {
 *     return <div>Wallet not connected</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Accounts: {accounts.length}</p>
 *       <p>Chain: {currentChain?.name}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useWalletState() {
  const {
    wallet,
    state,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    isInitialised
  } = useWallet();

  return {
    wallet,
    state,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    isInitialised
  };
}