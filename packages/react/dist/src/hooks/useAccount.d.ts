import { UseAccountOptions, UseAccountReturn } from '../types.js';
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
export declare function useAccount(options?: UseAccountOptions): UseAccountReturn;
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
export declare function useAccountInfo(): {
    account: import('@arenaentertainment/wallet-mock-shared/src/types/account.js').Account | null;
    balance: string | null;
    isLoading: boolean;
};
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
export declare function useAccounts(): {
    accounts: import('@arenaentertainment/wallet-mock-shared/src/types/account.js').Account[];
    evmAccounts: import('@arenaentertainment/wallet-mock-shared/src/types/account.js').Account[];
    solanaAccounts: import('@arenaentertainment/wallet-mock-shared/src/types/account.js').Account[];
    dualChainAccounts: import('@arenaentertainment/wallet-mock').DualChainAccount[];
    accountsByChain: Record<string, import('@arenaentertainment/wallet-mock-shared/src/types/account.js').Account[]>;
};
//# sourceMappingURL=useAccount.d.ts.map