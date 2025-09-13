/**
 * React components for chain selection and management
 */

import React from 'react';
import { useChain } from '../hooks/useChain.js';
import type { ChainSelectorProps, Chain } from '../types.js';

/**
 * Chain selector dropdown component
 *
 * Provides a dropdown interface for selecting between available chains.
 * Supports custom rendering and chain filtering.
 *
 * @example
 * ```tsx
 * function ChainManager() {
 *   return (
 *     <div>
 *       <h3>Select Network:</h3>
 *       <ChainSelector
 *         placeholder="Choose a network..."
 *         onChange={(chain) => console.log('Selected:', chain)}
 *         filterChains={(chains) => chains.filter(c => c.type === 'evm')}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function ChainSelector({
  renderChain,
  className = '',
  selectedClassName = '',
  placeholder = 'Select chain...',
  onChange,
  filterChains
}: ChainSelectorProps) {
  const {
    chain: currentChain,
    chains: allChains,
    switchChain,
    isSwitching,
    error
  } = useChain();

  // Apply chain filtering if provided
  const chains = filterChains ? filterChains(allChains) : allChains;

  const handleChainChange = async (chainId: string) => {
    const selectedChain = chains.find(chain => chain.id === chainId);
    if (selectedChain) {
      try {
        await switchChain(chainId);
        onChange?.(selectedChain);
      } catch (switchError) {
        console.error('Failed to switch chain:', switchError);
      }
    }
  };

  const defaultRenderChain = (chain: Chain, isSelected: boolean) => (
    <span className={isSelected ? selectedClassName : ''}>
      <span>{chain.name}</span>
      <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
        ({chain.type})
      </span>
    </span>
  );

  const renderChainOption = renderChain || defaultRenderChain;

  return (
    <div className={className}>
      <select
        value={currentChain?.id || ''}
        onChange={(e) => handleChainChange(e.target.value)}
        disabled={isSwitching}
        style={{ minWidth: '200px' }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {chains.map((chain) => (
          <option key={chain.id} value={chain.id}>
            {chain.name} ({chain.type})
          </option>
        ))}
      </select>

      {error && (
        <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Error: {error.message}
        </p>
      )}

      {isSwitching && (
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Switching chain...
        </p>
      )}
    </div>
  );
}

/**
 * Chain list component
 *
 * Displays all available chains in a list format.
 * Useful for showing chain information with selection actions.
 *
 * @example
 * ```tsx
 * function NetworksPage() {
 *   return (
 *     <div>
 *       <h2>Available Networks</h2>
 *       <ChainList
 *         onSelect={(chain) => console.log('Selected:', chain)}
 *         groupByType
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function ChainList({
  onSelect,
  groupByType = false,
  className = ''
}: {
  onSelect?: (chain: Chain) => void;
  groupByType?: boolean;
  className?: string;
}) {
  const {
    chain: currentChain,
    chains,
    switchChain,
    isSwitching,
    error
  } = useChain();

  const handleChainSelect = async (chainId: string) => {
    const selectedChain = chains.find(chain => chain.id === chainId);
    if (selectedChain && currentChain?.id !== chainId) {
      try {
        await switchChain(chainId);
        onSelect?.(selectedChain);
      } catch (switchError) {
        console.error('Failed to switch chain:', switchError);
      }
    }
  };

  const renderChainItem = (chain: Chain) => {
    const isCurrent = currentChain?.id === chain.id;

    return (
      <div
        key={chain.id}
        style={{
          padding: '1rem',
          border: '1px solid #ccc',
          borderRadius: '0.5rem',
          backgroundColor: isCurrent ? '#f0f8ff' : 'transparent',
          cursor: isCurrent ? 'default' : 'pointer'
        }}
        onClick={() => {
          if (!isCurrent && !isSwitching) {
            handleChainSelect(chain.id);
          }
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {chain.name}
              {isCurrent && ' • Current'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              Chain ID: {chain.id} • Type: {chain.type}
            </div>
          </div>

          {!isCurrent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleChainSelect(chain.id);
              }}
              disabled={isSwitching}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            >
              Select
            </button>
          )}
        </div>
      </div>
    );
  };

  if (chains.length === 0) {
    return (
      <div className={className}>
        <p>No chains available</p>
      </div>
    );
  }

  if (groupByType) {
    const evmChains = chains.filter(chain => chain.type === 'evm');
    const solanaChains = chains.filter(chain => chain.type === 'solana');

    return (
      <div className={className}>
        {evmChains.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>EVM Chains</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {evmChains.map(renderChainItem)}
            </div>
          </div>
        )}

        {solanaChains.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Solana Chains</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {solanaChains.map(renderChainItem)}
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Error: {error.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {chains.map(renderChainItem)}
      </div>

      {error && (
        <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Error: {error.message}
        </p>
      )}
    </div>
  );
}

/**
 * Chain info display component
 *
 * Shows detailed information about the current chain.
 * Useful for dashboards and network overview pages.
 *
 * @example
 * ```tsx
 * function NetworkInfo() {
 *   return (
 *     <div>
 *       <h2>Current Network</h2>
 *       <ChainInfo showExplorer />
 *     </div>
 *   );
 * }
 * ```
 */
export function ChainInfo({
  showExplorer = false,
  className = ''
}: {
  showExplorer?: boolean;
  className?: string;
}) {
  const { chain } = useChain();

  if (!chain) {
    return (
      <div className={className}>
        <p>No chain selected</p>
      </div>
    );
  }

  // Mock additional chain information
  const getChainDetails = (chain: Chain) => {
    const isMainnet = chain.type === 'evm'
      ? chain.id === '1'
      : chain.id === 'mainnet-beta';

    const nativeCurrency = chain.type === 'evm'
      ? (chain.id === '1' ? 'ETH' : chain.id === '137' ? 'MATIC' : 'ETH')
      : 'SOL';

    const explorerUrl = chain.type === 'evm'
      ? (chain.id === '1' ? 'https://etherscan.io' : chain.id === '137' ? 'https://polygonscan.com' : null)
      : (chain.id === 'mainnet-beta' ? 'https://solscan.io' : `https://solscan.io?cluster=${chain.id}`);

    return { isMainnet, nativeCurrency, explorerUrl };
  };

  const { isMainnet, nativeCurrency, explorerUrl } = getChainDetails(chain);

  return (
    <div className={className}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div>
          <strong>Name:</strong> {chain.name}
        </div>

        <div>
          <strong>Chain ID:</strong> {chain.id}
        </div>

        <div>
          <strong>Type:</strong> {chain.type}
        </div>

        <div>
          <strong>Network:</strong> {isMainnet ? 'Mainnet' : 'Testnet'}
        </div>

        <div>
          <strong>Native Currency:</strong> {nativeCurrency}
        </div>

        {showExplorer && explorerUrl && (
          <div>
            <strong>Block Explorer:</strong>
            <br />
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0066cc', textDecoration: 'underline' }}
            >
              {explorerUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}