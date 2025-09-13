import { UseWalletReturn, WalletHookOptions } from '../types.js';
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
export declare function useWallet(options?: WalletHookOptions): UseWalletReturn;
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
export declare function useWalletConnection(): {
    isConnected: boolean;
    isConnecting: boolean;
    error: Error | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    clearError: () => void;
};
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
export declare function useWalletState(): {
    wallet: import('@arenaentertainment/wallet-mock-shared/src/types/wallet.js').MockWallet | null;
    state: import('@arenaentertainment/wallet-mock-shared/src/types/wallet.js').WalletState | null;
    isConnected: boolean;
    accounts: import('@arenaentertainment/wallet-mock-shared/src/types/account.js').Account[];
    currentAccount: import('@arenaentertainment/wallet-mock-shared/src/types/account.js').Account | null;
    currentChain: import('@arenaentertainment/wallet-mock-shared/src/types/chain.js').Chain | null;
    availableChains: import('@arenaentertainment/wallet-mock-shared/src/types/chain.js').Chain[];
    isConnecting: boolean;
    error: Error | null;
    isInitialised: boolean;
};
//# sourceMappingURL=useWallet.d.ts.map