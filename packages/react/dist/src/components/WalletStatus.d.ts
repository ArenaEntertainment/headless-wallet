import { WalletStatusProps } from '../types.js';
/**
 * Comprehensive wallet status component
 *
 * Displays current wallet connection status, account information, and chain details.
 * Highly customizable with various display options.
 *
 * @example
 * ```tsx
 * function Header() {
 *   return (
 *     <header>
 *       <h1>My dApp</h1>
 *       <WalletStatus
 *         showConnection
 *         showAccount
 *         showChain
 *         showBalance
 *       />
 *     </header>
 *   );
 * }
 * ```
 */
export declare function WalletStatus({ showConnection, showAccount, showChain, showBalance, className, renderStatus }: WalletStatusProps): import("react/jsx-runtime").JSX.Element;
/**
 * Compact wallet status badge
 *
 * Minimal wallet status display suitable for headers or toolbars.
 *
 * @example
 * ```tsx
 * function Toolbar() {
 *   return (
 *     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
 *       <h1>My App</h1>
 *       <WalletStatusBadge />
 *     </div>
 *   );
 * }
 * ```
 */
export declare function WalletStatusBadge({ className }: {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Wallet connection indicator
 *
 * Simple visual indicator of wallet connection status.
 * Perfect for minimal UI designs.
 *
 * @example
 * ```tsx
 * function SimpleHeader() {
 *   return (
 *     <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
 *       <h1>My App</h1>
 *       <WalletConnectionIndicator />
 *     </header>
 *   );
 * }
 * ```
 */
export declare function WalletConnectionIndicator({ size, showText, className }: {
    size?: 'small' | 'medium' | 'large';
    showText?: boolean;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=WalletStatus.d.ts.map