/**
 * React hook for chain management functionality
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from './useWallet.js';
import type { UseChainOptions, UseChainReturn, Chain } from '../types.js';

/**
 * Hook for managing blockchain networks/chains
 *
 * Provides chain-specific state and operations, including chain switching
 * and chain information management.
 *
 * @param options - Configuration options for chain management
 * @returns Chain state and operations
 *
 * @example
 * ```tsx
 * function ChainSelector() {
 *   const {
 *     chain,
 *     chains,
 *     switchChain,
 *     isSwitching,
 *     isSupported
 *   } = useChain({
 *     autoSelect: true
 *   });
 *
 *   return (
 *     <div>
 *       <h3>Current Chain: {chain?.name || 'None'}</h3>
 *       <select
 *         value={chain?.id || ''}
 *         onChange={(e) => switchChain(e.target.value)}
 *         disabled={isSwitching}
 *       >
 *         <option value="">Select Chain</option>
 *         {chains.map(c => (
 *           <option key={c.id} value={c.id}>
 *             {c.name}
 *           </option>
 *         ))}
 *       </select>
 *       {chain && (
 *         <p>Supported: {isSupported(chain.id) ? 'Yes' : 'No'}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useChain(options: UseChainOptions = {}): UseChainReturn {
  const {
    initialChainId,
    autoSelect = false,
    throwOnError = false,
    onError,
    onConnect,
    onDisconnect
  } = options;

  const {
    currentChain,
    availableChains,
    switchChain: walletSwitchChain,
    isConnected,
    isInitialised
  } = useWallet({ throwOnError, onError, onConnect, onDisconnect });

  // Local state for chain operations
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(
    initialChainId || null
  );

  // Keep refs for stable callback references
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Determine current chain
  const chain = useMemo(() => {
    // If we have a selected chain ID, try to find it
    if (selectedChainId) {
      const foundChain = availableChains.find(c => c.id === selectedChainId);
      if (foundChain) {
        return foundChain;
      }
    }

    // Fall back to wallet's current chain or first chain if autoSelect
    if (currentChain) {
      return currentChain;
    }

    if (autoSelect && availableChains.length > 0) {
      return availableChains[0];
    }

    return null;
  }, [selectedChainId, availableChains, currentChain, autoSelect]);

  // Auto-select initial chain
  useEffect(() => {
    if (initialChainId && isInitialised && availableChains.length > 0) {
      const initialChain = availableChains.find(c => c.id === initialChainId);
      if (initialChain) {
        setSelectedChainId(initialChainId);
      }
    }
  }, [initialChainId, isInitialised, availableChains]);

  // Auto-select first chain if enabled
  useEffect(() => {
    if (
      autoSelect &&
      !selectedChainId &&
      availableChains.length > 0 &&
      isConnected &&
      !isSwitching
    ) {
      setSelectedChainId(availableChains[0].id);
    }
  }, [autoSelect, selectedChainId, availableChains, isConnected, isSwitching]);

  // Switch to a specific chain
  const switchChain = useCallback(async (chainId: string): Promise<void> => {
    const targetChain = availableChains.find(c => c.id === chainId);
    if (!targetChain) {
      const switchError = new Error(`Chain with ID "${chainId}" not found`);
      setError(switchError);

      if (optionsRef.current.throwOnError) {
        throw switchError;
      }
      return;
    }

    try {
      setIsSwitching(true);
      setError(null);

      // Switch chain in wallet
      await walletSwitchChain(chainId);

      // Update local state
      setSelectedChainId(chainId);
    } catch (switchError) {
      const error = switchError instanceof Error ? switchError : new Error('Chain switch failed');
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
  }, [availableChains, walletSwitchChain]);

  // Check if a chain is supported
  const isSupported = useCallback((chainId: string): boolean => {
    return availableChains.some(chain => chain.id === chainId);
  }, [availableChains]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    chain,
    chains: availableChains,
    switchChain,
    isSwitching,
    error,
    clearError,
    isSupported
  };
}

/**
 * Hook for accessing chain-specific information
 *
 * Provides read-only access to chain metadata and network information.
 * Useful for displaying chain information without chain management capabilities.
 *
 * @example
 * ```tsx
 * function ChainInfo() {
 *   const {
 *     chain,
 *     isMainnet,
 *     isTestnet,
 *     nativeCurrency,
 *     explorerUrl
 *   } = useChainInfo();
 *
 *   if (!chain) {
 *     return <div>No chain selected</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <h3>{chain.name}</h3>
 *       <p>Type: {chain.type}</p>
 *       <p>Network: {isMainnet ? 'Mainnet' : 'Testnet'}</p>
 *       <p>Currency: {nativeCurrency}</p>
 *       {explorerUrl && (
 *         <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
 *           Block Explorer
 *         </a>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useChainInfo() {
  const { chain } = useChain();

  // Derive chain information
  const isMainnet = useMemo(() => {
    if (!chain) return false;
    return chain.type === 'evm'
      ? chain.id === '1' // Ethereum mainnet
      : chain.id === 'mainnet-beta'; // Solana mainnet
  }, [chain]);

  const isTestnet = useMemo(() => {
    if (!chain) return false;
    return !isMainnet;
  }, [isMainnet]);

  const nativeCurrency = useMemo(() => {
    if (!chain) return null;

    // Mock native currency based on chain
    if (chain.type === 'evm') {
      switch (chain.id) {
        case '1':
          return 'ETH';
        case '137':
          return 'MATIC';
        case '56':
          return 'BNB';
        default:
          return 'ETH';
      }
    } else {
      return 'SOL';
    }
  }, [chain]);

  const explorerUrl = useMemo(() => {
    if (!chain) return null;

    // Mock explorer URLs based on chain
    if (chain.type === 'evm') {
      switch (chain.id) {
        case '1':
          return 'https://etherscan.io';
        case '137':
          return 'https://polygonscan.com';
        case '56':
          return 'https://bscscan.com';
        default:
          return null;
      }
    } else {
      switch (chain.id) {
        case 'mainnet-beta':
          return 'https://solscan.io';
        case 'devnet':
          return 'https://solscan.io?cluster=devnet';
        case 'testnet':
          return 'https://solscan.io?cluster=testnet';
        default:
          return null;
      }
    }
  }, [chain]);

  return {
    chain,
    isMainnet,
    isTestnet,
    nativeCurrency,
    explorerUrl
  };
}

/**
 * Hook for working with multiple chains
 *
 * Provides utilities for filtering and categorizing available chains.
 *
 * @example
 * ```tsx
 * function ChainList() {
 *   const {
 *     chains,
 *     evmChains,
 *     solanaChains,
 *     mainnetChains,
 *     testnetChains
 *   } = useChains();
 *
 *   return (
 *     <div>
 *       <h3>EVM Chains ({evmChains.length})</h3>
 *       {evmChains.map(chain => (
 *         <div key={chain.id}>{chain.name}</div>
 *       ))}
 *
 *       <h3>Solana Chains ({solanaChains.length})</h3>
 *       {solanaChains.map(chain => (
 *         <div key={chain.id}>{chain.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useChains() {
  const { chains } = useChain();

  // Filter chains by type
  const evmChains = useMemo(() =>
    chains.filter(chain => chain.type === 'evm'),
    [chains]
  );

  const solanaChains = useMemo(() =>
    chains.filter(chain => chain.type === 'solana'),
    [chains]
  );

  // Filter chains by network type
  const mainnetChains = useMemo(() =>
    chains.filter(chain => {
      if (chain.type === 'evm') {
        return chain.id === '1'; // Ethereum mainnet
      } else {
        return chain.id === 'mainnet-beta'; // Solana mainnet
      }
    }),
    [chains]
  );

  const testnetChains = useMemo(() =>
    chains.filter(chain => {
      if (chain.type === 'evm') {
        return chain.id !== '1'; // Non-mainnet EVM chains
      } else {
        return chain.id !== 'mainnet-beta'; // Non-mainnet Solana chains
      }
    }),
    [chains]
  );

  return {
    chains,
    evmChains,
    solanaChains,
    mainnetChains,
    testnetChains
  };
}