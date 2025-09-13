import { AccountSelectorProps, Account } from '../types.js';
/**
 * Account selector dropdown component
 *
 * Provides a dropdown interface for selecting between available accounts.
 * Supports custom rendering and account creation.
 *
 * @example
 * ```tsx
 * function AccountManager() {
 *   return (
 *     <div>
 *       <h3>Select Account:</h3>
 *       <AccountSelector
 *         placeholder="Choose an account..."
 *         showAddAccount
 *         onChange={(account) => console.log('Selected:', account)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export declare function AccountSelector({ renderAccount, className, selectedClassName, placeholder, onChange, showAddAccount }: AccountSelectorProps): import("react/jsx-runtime").JSX.Element;
/**
 * Account list component
 *
 * Displays all available accounts in a list format.
 * Useful for showing account information with management actions.
 *
 * @example
 * ```tsx
 * function AccountsPage() {
 *   return (
 *     <div>
 *       <h2>Your Accounts</h2>
 *       <AccountList
 *         onSelect={(account) => console.log('Selected:', account)}
 *         showActions
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export declare function AccountList({ onSelect, showActions, className }: {
    onSelect?: (account: Account) => void;
    showActions?: boolean;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Account info display component
 *
 * Shows detailed information about the current account.
 * Useful for dashboards and account overview pages.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   return (
 *     <div>
 *       <h2>Account Overview</h2>
 *       <AccountInfo showBalance />
 *     </div>
 *   );
 * }
 * ```
 */
export declare function AccountInfo({ showBalance, className }: {
    showBalance?: boolean;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AccountSelector.d.ts.map