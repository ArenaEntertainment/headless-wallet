/**
 * React context definitions for wallet-mock
 */

import { createContext } from 'react';
import type { WalletContext } from './types.js';

/**
 * Default wallet context state
 */
const defaultContextValue: WalletContext = {
  // State
  wallet: null,
  state: null,
  isConnected: false,
  accounts: [],
  currentAccount: null,
  currentChain: null,
  availableChains: [],
  isConnecting: false,
  error: null,
  isInitialised: false,

  // Actions
  connect: async () => {
    throw new Error('MockWalletProvider not found. Wrap your app with <MockWalletProvider>');
  },
  disconnect: async () => {
    throw new Error('MockWalletProvider not found. Wrap your app with <MockWalletProvider>');
  },
  switchAccount: async () => {
    throw new Error('MockWalletProvider not found. Wrap your app with <MockWalletProvider>');
  },
  switchChain: async () => {
    throw new Error('MockWalletProvider not found. Wrap your app with <MockWalletProvider>');
  },
  addAccount: async () => {
    throw new Error('MockWalletProvider not found. Wrap your app with <MockWalletProvider>');
  },
  removeAccount: async () => {
    throw new Error('MockWalletProvider not found. Wrap your app with <MockWalletProvider>');
  },
  refresh: async () => {
    throw new Error('MockWalletProvider not found. Wrap your app with <MockWalletProvider>');
  },
  clearError: () => {
    throw new Error('MockWalletProvider not found. Wrap your app with <MockWalletProvider>');
  }
};

/**
 * React context for wallet functionality
 */
export const WalletContext = createContext<WalletContext>(defaultContextValue);

/**
 * Context display name for debugging
 */
WalletContext.displayName = 'MockWalletContext';