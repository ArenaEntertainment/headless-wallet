/**
 * React provider component for wallet-mock
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import {
  createWallet,
  createProductionGuard,
  type MockWallet,
  type Account,
  type WalletState,
  type Chain,
  type AccountConfig
} from '@arenaentertainment/wallet-mock';
import { WalletContext } from './context.js';
import type {
  MockWalletProviderProps,
  WalletContext as WalletContextType
} from './types.js';

/**
 * Production environment warning
 */
const PRODUCTION_WARNING = `
🚨 MockWallet Warning: You are using a mock wallet implementation.
This should NEVER be used in production environments.
Mock wallets are for development, testing, and demonstration purposes only.
`;

/**
 * Mock Wallet Provider Component
 *
 * Provides wallet state and functionality to child components through React context.
 * Supports React 18+ concurrent features and SSR compatibility.
 */
export function MockWalletProvider({
  children,
  wallet: walletConfig,
  accounts: initialAccounts = [],
  initialChain,
  autoConnect = false,
  production,
  devMode = false,
  walletInstance: customWalletInstance
}: MockWalletProviderProps) {
  // Refs for stable references
  const walletRef = useRef<MockWallet | null>(null);
  const initalisedRef = useRef(false);
  const mountedRef = useRef(false);

  // State for wallet and connection status
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);

  // Production environment check
  useEffect(() => {
    if (typeof window !== 'undefined' && !devMode) {
      const guard = createProductionGuard(production);
      const result = guard.checkEnvironment();

      if (!result.isValid) {
        console.warn(PRODUCTION_WARNING);
        if (production?.throwInProduction) {
          throw new Error('Mock wallet cannot be used in production environment');
        }
      }
    }
  }, [production, devMode]);

  // Initialize wallet instance
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;

    async function initializeWallet() {
      try {
        // Use custom instance or create new one
        const wallet = customWalletInstance || await createWallet({
          accounts: initialAccounts,
          ...walletConfig
        });

        if (!mounted) return;

        walletRef.current = wallet;

        // Switch to initial chain if specified
        if (initialChain && wallet.isConnected()) {
          try {
            await wallet.switchChain(initialChain.toString());
          } catch (chainError) {
            console.warn('Failed to switch to initial chain:', chainError);
          }
        }

        // Auto-connect if requested
        if (autoConnect && !wallet.isConnected()) {
          setIsConnecting(true);
          try {
            await wallet.connect();
          } catch (connectError) {
            console.warn('Auto-connect failed:', connectError);
            setError(connectError instanceof Error ? connectError : new Error('Auto-connect failed'));
          } finally {
            setIsConnecting(false);
          }
        }

        initalisedRef.current = true;

        // Force re-render to update context
        forceUpdate({});
      } catch (initError) {
        if (mounted) {
          console.error('Failed to initialize wallet:', initError);
          setError(initError instanceof Error ? initError : new Error('Wallet initialization failed'));
        }
      }
    }

    initializeWallet();

    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, [customWalletInstance, walletConfig, initialAccounts, initialChain, autoConnect]);

  // Force component re-render utility
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  // Subscribe to wallet state changes using useSyncExternalStore for React 18 compatibility
  const walletState = useSyncExternalStore(
    useCallback((onStoreChange) => {
      const wallet = walletRef.current;
      if (!wallet) return () => {};

      // Set up event listeners
      const handleStateChange = () => {
        onStoreChange();
      };

      wallet.on('connect', handleStateChange);
      wallet.on('disconnect', handleStateChange);
      wallet.on('accountsChanged', handleStateChange);
      wallet.on('chainChanged', handleStateChange);

      return () => {
        wallet.off('connect', handleStateChange);
        wallet.off('disconnect', handleStateChange);
        wallet.off('accountsChanged', handleStateChange);
        wallet.off('chainChanged', handleStateChange);
      };
    }, []),
    () => walletRef.current?.getState() || null,
    () => null // Server-side snapshot
  );

  // Derived state from wallet
  const isConnected = walletState?.isConnected ?? false;
  const accounts = walletState?.accounts ?? [];
  const currentChain = walletState?.currentChain ?? null;
  const availableChains = walletState?.availableChains ?? [];

  // Current account logic
  const currentAccount = useMemo(() => {
    if (currentAccountId) {
      return accounts.find((acc: Account) => acc.id === currentAccountId) || null;
    }
    return accounts[0] || null;
  }, [accounts, currentAccountId]);

  // Context actions
  const connect = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) {
      const connectError = new Error('Wallet not initialised');
      setError(connectError);
      throw connectError;
    }

    try {
      setIsConnecting(true);
      setError(null);
      await wallet.connect();
    } catch (connectError) {
      const error = connectError instanceof Error ? connectError : new Error('Connection failed');
      setError(error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) return;

    try {
      setError(null);
      await wallet.disconnect();
      setCurrentAccountId(null);
    } catch (disconnectError) {
      const error = disconnectError instanceof Error ? disconnectError : new Error('Disconnection failed');
      setError(error);
      throw error;
    }
  }, []);

  const switchAccount = useCallback(async (accountId: string) => {
    const wallet = walletRef.current;
    if (!wallet) {
      throw new Error('Wallet not initialised');
    }

    const account = accounts.find((acc: Account) => acc.id === accountId);
    if (!account) {
      throw new Error(`Account with ID "${accountId}" not found`);
    }

    try {
      setError(null);
      await wallet.switchAccount(accountId);
      setCurrentAccountId(accountId);
    } catch (switchError) {
      const error = switchError instanceof Error ? switchError : new Error('Account switch failed');
      setError(error);
      throw error;
    }
  }, [accounts]);

  const switchChain = useCallback(async (chainId: string) => {
    const wallet = walletRef.current;
    if (!wallet) {
      throw new Error('Wallet not initialised');
    }

    try {
      setError(null);
      await wallet.switchChain(chainId);
    } catch (switchError) {
      const error = switchError instanceof Error ? switchError : new Error('Chain switch failed');
      setError(error);
      throw error;
    }
  }, []);

  const addAccount = useCallback(async (config: AccountConfig) => {
    const wallet = walletRef.current;
    if (!wallet) {
      throw new Error('Wallet not initialised');
    }

    try {
      setError(null);
      const account = await wallet.addAccount(config);
      return account;
    } catch (addError) {
      const error = addError instanceof Error ? addError : new Error('Failed to add account');
      setError(error);
      throw error;
    }
  }, []);

  const removeAccount = useCallback(async (accountId: string) => {
    const wallet = walletRef.current;
    if (!wallet) {
      throw new Error('Wallet not initialised');
    }

    try {
      setError(null);
      await wallet.removeAccount(accountId);

      // Clear current account if it was removed
      if (currentAccountId === accountId) {
        setCurrentAccountId(null);
      }
    } catch (removeError) {
      const error = removeError instanceof Error ? removeError : new Error('Failed to remove account');
      setError(error);
      throw error;
    }
  }, [currentAccountId]);

  const refresh = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) return;

    try {
      setError(null);
      // Force wallet to refresh its state
      await wallet.refresh?.() || Promise.resolve();
      triggerUpdate();
    } catch (refreshError) {
      const error = refreshError instanceof Error ? refreshError : new Error('Refresh failed');
      setError(error);
      throw error;
    }
  }, [triggerUpdate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const contextValue: WalletContextType = useMemo(() => ({
    // State
    wallet: walletRef.current,
    state: walletState,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    isInitialised: initalisedRef.current,

    // Actions
    connect,
    disconnect,
    switchAccount,
    switchChain,
    addAccount,
    removeAccount,
    refresh,
    clearError
  }), [
    walletState,
    isConnected,
    accounts,
    currentAccount,
    currentChain,
    availableChains,
    isConnecting,
    error,
    connect,
    disconnect,
    switchAccount,
    switchChain,
    addAccount,
    removeAccount,
    refresh,
    clearError
  ]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}