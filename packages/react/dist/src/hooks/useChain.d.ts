import { UseChainOptions, UseChainReturn, Chain } from '../types.js';
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
export declare function useChain(options?: UseChainOptions): UseChainReturn;
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
export declare function useChainInfo(): {
    chain: Chain | null;
    isMainnet: boolean;
    isTestnet: boolean;
    nativeCurrency: string | null;
    explorerUrl: string | null;
};
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
export declare function useChains(): {
    chains: Chain[];
    evmChains: Chain[];
    solanaChains: Chain[];
    mainnetChains: Chain[];
    testnetChains: Chain[];
};
//# sourceMappingURL=useChain.d.ts.map