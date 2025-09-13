/**
 * Vue composable for account management
 */

import {
  ref,
  computed,
  onUnmounted,
  type Ref,
  type ComputedRef
} from 'vue';
import type { Account } from '@arenaentertainment/wallet-mock';
import type { ReactiveAccountState, WalletComposableOptions } from '../types.js';
import { useWallet } from './useWallet.js';

/**
 * Composable for reactive account management
 */
export function useAccount(options: WalletComposableOptions = {}): ReactiveAccountState {
  const { throwOnError = false } = options;
  const { wallet, accounts, isConnected } = useWallet(options);

  // Reactive state
  const currentAccountIndex = ref(0);
  const isSwitching = ref(false);
  const switchError = ref<Error | null>(null);

  // Computed values
  const currentAccount = computed(() => {
    if (!wallet.value || accounts.value.length === 0) {
      return null;
    }

    const walletState = wallet.value.getState();
    return walletState.currentAccount || accounts.value[0] || null;
  });

  /**
   * Switch to a specific account
   */
  const switchAccount = async (accountOrIndex: Account | number): Promise<void> => {
    if (!wallet.value) {
      const error = new Error('Wallet not available');
      switchError.value = error;
      if (throwOnError) throw error;
      return;
    }

    if (!isConnected.value) {
      const error = new Error('Wallet not connected');
      switchError.value = error;
      if (throwOnError) throw error;
      return;
    }

    try {
      isSwitching.value = true;
      switchError.value = null;

      let targetAccount: Account;

      if (typeof accountOrIndex === 'number') {
        const index = accountOrIndex;
        if (index < 0 || index >= accounts.value.length) {
          throw new Error(`Account index ${index} out of range`);
        }
        targetAccount = accounts.value[index];
        currentAccountIndex.value = index;
      } else {
        targetAccount = accountOrIndex;
        const index = accounts.value.findIndex(acc =>
          acc.address === targetAccount.address
        );
        if (index === -1) {
          throw new Error('Account not found in wallet');
        }
        currentAccountIndex.value = index;
      }

      // Use the wallet's account switching method
      const accountManager = (wallet.value as any).getAccountManager();
      if (accountManager && typeof accountManager.switchAccount === 'function') {
        await accountManager.switchAccount(targetAccount.address);
      } else {
        // Fallback: emit accountsChanged event
        wallet.value.emit('accountsChanged', {
          accounts: accounts.value.map(acc => ({
            ...acc,
            isActive: acc.address === targetAccount.address
          }))
        });
      }

      isSwitching.value = false;
    } catch (error) {
      const accountError = error instanceof Error ? error : new Error('Account switch failed');
      switchError.value = accountError;
      isSwitching.value = false;

      if (throwOnError) {
        throw accountError;
      }
    }
  };

  /**
   * Get account by address
   */
  const getAccount = (address: string): Account | undefined => {
    return accounts.value.find(account =>
      account.address.toLowerCase() === address.toLowerCase()
    );
  };

  /**
   * Get account by index
   */
  const getAccountByIndex = (index: number): Account | undefined => {
    if (index < 0 || index >= accounts.value.length) {
      return undefined;
    }
    return accounts.value[index];
  };

  /**
   * Check if account exists
   */
  const hasAccount = (address: string): boolean => {
    return getAccount(address) !== undefined;
  };

  /**
   * Get account balance
   */
  const getAccountBalance = async (address?: string): Promise<string | null> => {
    if (!wallet.value) return null;

    const targetAddress = address || currentAccount.value?.address;
    if (!targetAddress) return null;

    const account = getAccount(targetAddress);
    if (!account) return null;

    // Return cached balance if available
    if (account.balance) {
      return account.balance;
    }

    // For mock wallet, return a mock balance
    return '1000.0';
  };

  /**
   * Format account address for display
   */
  const formatAddress = (address?: string, length = 8): string => {
    const addr = address || currentAccount.value?.address;
    if (!addr) return '';

    if (addr.length <= length) return addr;

    const start = Math.floor(length / 2);
    const end = length - start;

    return `${addr.slice(0, start)}...${addr.slice(-end)}`;
  };

  /**
   * Check if account supports a specific chain
   */
  const supportsChain = (chainId: string, accountAddress?: string): boolean => {
    const account = accountAddress ?
      getAccount(accountAddress) :
      currentAccount.value;

    if (!account) return false;

    switch (account.type) {
      case 'evm_only':
        return chainId.includes('evm') ||
               ['ethereum', 'polygon', 'bsc'].includes(chainId);
      case 'solana_only':
        return chainId.includes('solana') ||
               ['mainnet-beta', 'testnet', 'devnet'].includes(chainId);
      case 'dual_chain':
        return true;
      default:
        return false;
    }
  };

  /**
   * Get account type display name
   */
  const getAccountTypeDisplay = (account?: Account): string => {
    const acc = account || currentAccount.value;
    if (!acc) return 'Unknown';

    switch (acc.type) {
      case 'evm_only':
        return 'EVM Only';
      case 'solana_only':
        return 'Solana Only';
      case 'dual_chain':
        return 'Multi-Chain';
      default:
        return 'Unknown';
    }
  };

  // Watch for account changes and update index
  const stopAccountWatcher = computed(() => currentAccount.value, (newAccount) => {
    if (newAccount) {
      const index = accounts.value.findIndex(acc =>
        acc.address === newAccount.address
      );
      if (index !== -1) {
        currentAccountIndex.value = index;
      }
    }
  });

  onUnmounted(() => {
    stopAccountWatcher();
  });

  return {
    currentAccount,
    accounts,
    currentAccountIndex,
    switchAccount,
    getAccount,
    isSwitching,
    switchError,
    // Additional utility methods
    getAccountByIndex,
    hasAccount,
    getAccountBalance,
    formatAddress,
    supportsChain,
    getAccountTypeDisplay
  };
}

/**
 * Composable for account-specific operations
 */
export function useAccountOperations() {
  const { wallet, isConnected } = useWallet();
  const { currentAccount } = useAccount();

  /**
   * Sign a message with current account
   */
  const signMessage = async (message: string): Promise<string> => {
    if (!wallet.value || !isConnected.value || !currentAccount.value) {
      throw new Error('Wallet not connected or no active account');
    }

    // For EVM accounts
    if (currentAccount.value.chainType === 'evm') {
      const provider = (wallet.value as any).getEthereumProvider();
      if (provider) {
        return await provider.request({
          method: 'personal_sign',
          params: [message, currentAccount.value.address]
        });
      }
    }

    // For Solana accounts
    if (currentAccount.value.chainType === 'solana') {
      const solanaWallet = (wallet.value as any).getSolanaWallet();
      if (solanaWallet && solanaWallet.features['solana:signMessage']) {
        const result = await solanaWallet.features['solana:signMessage'].signMessage({
          account: currentAccount.value,
          message: new TextEncoder().encode(message)
        });
        return Array.from(result.signature).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    }

    throw new Error('Message signing not supported for current account type');
  };

  /**
   * Get account's public key
   */
  const getPublicKey = (): string | null => {
    if (!currentAccount.value) return null;

    // Return the address as public key for simplicity in mock
    return currentAccount.value.address;
  };

  /**
   * Check if account can sign transactions
   */
  const canSignTransactions = (): boolean => {
    return wallet.value !== null &&
           isConnected.value &&
           currentAccount.value !== null;
  };

  return {
    signMessage,
    getPublicKey,
    canSignTransactions
  };
}