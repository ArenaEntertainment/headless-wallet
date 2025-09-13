import { ChainSelectorProps, Chain } from '../types.js';
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
export declare function ChainSelector({ renderChain, className, selectedClassName, placeholder, onChange, filterChains }: ChainSelectorProps): import("react/jsx-runtime").JSX.Element;
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
export declare function ChainList({ onSelect, groupByType, className }: {
    onSelect?: (chain: Chain) => void;
    groupByType?: boolean;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
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
export declare function ChainInfo({ showExplorer, className }: {
    showExplorer?: boolean;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ChainSelector.d.ts.map