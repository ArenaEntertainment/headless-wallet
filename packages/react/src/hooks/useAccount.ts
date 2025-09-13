/**
 * React hook for account management functionality
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from './useWallet.js';
import type { UseAccountOptions, UseAccountReturn, AccountConfig } from '../types.js';

/**
 * Hook for managing wallet accounts
 *
 * Provides account-specific state and operations, including account switching,
 * adding new accounts, and removing existing accounts.
 *
 * @param options - Configuration options for account management
 * @returns Account state and operations
 *
 * @example
 * ```tsx
 * function AccountManager() {
 *   const {
 *     account,
 *     accounts,
 *     switchAccount,
 *     addAccount,
 *     isSwitching
 *   } = useAccount({
 *     autoSelect: true
 *   });
 *
 *   return (
 *     <div>
 *       <h3>Current Account: {account?.address || 'None'}</h3>
 *       <div>
 *         {accounts.map(acc => (
 *           <button
 *             key={acc.id}
 *             onClick={() => switchAccount(acc.id)}
 *             disabled={isSwitching}
 *           >
 *             {acc.address}
 *           </button>
 *         ))}
 *       </div>
 *       <button
 *         onClick={() => addAccount({ type: 'evm' })}
 *         disabled={isSwitching}
 *       >
 *         Add Account
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccount(options: UseAccountOptions = {}): UseAccountReturn {
  const {
    initialAccountId,
    autoSelect = false,
    throwOnError = false,
    onError,
    onConnect,
    onDisconnect
  } = options;

  const {
    accounts,
    currentAccount,
    switchAccount: walletSwitchAccount,
    addAccount: walletAddAccount,
    removeAccount: walletRemoveAccount,
    isConnected,
    isInitialised
  } = useWallet({ throwOnError, onError, onConnect, onDisconnect });

  // Local state for account operations
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    initialAccountId || null
  );

  // Keep refs for stable callback references
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Determine current account
  const account = useMemo(() => {
    // If we have a selected account ID, try to find it
    if (selectedAccountId) {
      const foundAccount = accounts.find(acc => acc.id === selectedAccountId);
      if (foundAccount) {
        return foundAccount;
      }
    }

    // Fall back to wallet's current account or first account if autoSelect
    if (currentAccount) {
      return currentAccount;
    }

    if (autoSelect && accounts.length > 0) {
      return accounts[0];
    }

    return null;
  }, [selectedAccountId, accounts, currentAccount, autoSelect]);

  // Auto-select initial account
  useEffect(() => {
    if (initialAccountId && isInitialised && accounts.length > 0) {
      const initialAccount = accounts.find(acc => acc.id === initialAccountId);
      if (initialAccount) {
        setSelectedAccountId(initialAccountId);
      }
    }
  }, [initialAccountId, isInitialised, accounts]);

  // Auto-select first account if enabled
  useEffect(() => {
    if (
      autoSelect &&
      !selectedAccountId &&
      accounts.length > 0 &&
      isConnected &&
      !isSwitching
    ) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [autoSelect, selectedAccountId, accounts, isConnected, isSwitching]);

  // Switch to a specific account
  const switchAccount = useCallback(async (accountId: string): Promise<void> => {
    const targetAccount = accounts.find(acc => acc.id === accountId);
    if (!targetAccount) {
      const switchError = new Error(`Account with ID "${accountId}" not found`);
      setError(switchError);

      if (optionsRef.current.throwOnError) {
        throw switchError;
      }
      return;
    }

    try {
      setIsSwitching(true);
      setError(null);

      // Switch account in wallet
      await walletSwitchAccount(accountId);

      // Update local state
      setSelectedAccountId(accountId);
    } catch (switchError) {
      const error = switchError instanceof Error ? switchError : new Error('Account switch failed');
      setError(error);

      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;

      if (errorHandler) {
        errorHandler(error);
      }

      if (shouldThrow) {
        throw error;
      }
    } finally {
      setIsSwitching(false);
    }
  }, [accounts, walletSwitchAccount]);

  // Add a new account
  const addAccount = useCallback(async (config: AccountConfig) => {
    try {
      setError(null);
      const newAccount = await walletAddAccount(config);

      // Auto-select the new account if no account is currently selected
      if (!selectedAccountId && autoSelect) {
        setSelectedAccountId(newAccount.id);
      }

      return newAccount;
    } catch (addError) {
      const error = addError instanceof Error ? addError : new Error('Failed to add account');
      setError(error);

      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;

      if (errorHandler) {
        errorHandler(error);
      }

      if (shouldThrow) {
        throw error;
      }

      // Re-throw to maintain the same interface
      throw error;
    }
  }, [walletAddAccount, selectedAccountId, autoSelect]);

  // Remove an account
  const removeAccount = useCallback(async (accountId: string): Promise<void> => {
    try {
      setError(null);
      await walletRemoveAccount(accountId);

      // Clear selected account if it was removed
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);

        // Auto-select first remaining account if enabled
        if (autoSelect) {
          const remainingAccounts = accounts.filter(acc => acc.id !== accountId);
          if (remainingAccounts.length > 0) {
            setSelectedAccountId(remainingAccounts[0].id);
          }
        }
      }
    } catch (removeError) {
      const error = removeError instanceof Error ? removeError : new Error('Failed to remove account');
      setError(error);

      const { onError: errorHandler, throwOnError: shouldThrow } = optionsRef.current;

      if (errorHandler) {
        errorHandler(error);
      }

      if (shouldThrow) {
        throw error;
      }
    }
  }, [walletRemoveAccount, selectedAccountId, autoSelect, accounts]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    account,
    accounts,
    switchAccount,
    addAccount,
    removeAccount,
    isSwitching,
    error,
    clearError
  };
}

/**
 * Hook for accessing account balances and information
 *
 * Provides read-only access to account balances and metadata.
 * Useful for displaying account information without account management capabilities.
 *
 * @example
 * ```tsx
 * function AccountBalance() {
 *   const { account, balance, isLoading } = useAccountInfo();
 *
 *   if (!account) {
 *     return <div>No account selected</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Address: {account.address}</p>
 *       <p>Chain: {account.chainType}</p>
 *       {isLoading ? (
 *         <p>Loading balance...</p>
 *       ) : (
 *         <p>Balance: {balance || 'N/A'}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccountInfo() {
  const { account } = useAccount();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock balance loading (in a real implementation, this would fetch from blockchain)
  useEffect(() => {
    if (!account) {
      setBalance(null);
      return;
    }

    setIsLoading(true);

    // Simulate balance fetching
    const timer = setTimeout(() => {
      // Mock balance based on account type
      const mockBalance = account.chainType === 'evm'
        ? '1.23 ETH'
        : '4.56 SOL';

      setBalance(mockBalance);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [account]);

  return {
    account,
    balance,
    isLoading
  };
}

/**
 * Hook for accessing multiple accounts
 *
 * Provides utilities for working with multiple accounts simultaneously.
 *
 * @example
 * ```tsx
 * function MultiAccountManager() {
 *   const {
 *     accounts,
 *     evmAccounts,
 *     solanaAccounts,
 *     accountsByChain
 *   } = useAccounts();
 *
 *   return (
 *     <div>
 *       <h3>EVM Accounts ({evmAccounts.length})</h3>
 *       {evmAccounts.map(acc => (
 *         <div key={acc.id}>{acc.address}</div>
 *       ))}
 *
 *       <h3>Solana Accounts ({solanaAccounts.length})</h3>
 *       {solanaAccounts.map(acc => (
 *         <div key={acc.id}>{acc.address}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccounts() {
  const { accounts } = useAccount();

  // Filter accounts by type
  const evmAccounts = useMemo(() =>
    accounts.filter(account => account.chainType === 'evm'),
    [accounts]
  );

  const solanaAccounts = useMemo(() =>
    accounts.filter(account => account.chainType === 'solana'),
    [accounts]
  );

  const dualChainAccounts = useMemo(() =>
    accounts.filter(account => account.type === 'dual_chain'),
    [accounts]
  );

  // Group accounts by chain
  const accountsByChain = useMemo(() => {
    const grouped: Record<string, typeof accounts> = {};

    accounts.forEach(account => {
      const chainKey = account.chainType;
      if (!grouped[chainKey]) {
        grouped[chainKey] = [];
      }
      grouped[chainKey].push(account);
    });

    return grouped;
  }, [accounts]);

  return {
    accounts,
    evmAccounts,
    solanaAccounts,
    dualChainAccounts,
    accountsByChain
  };
}