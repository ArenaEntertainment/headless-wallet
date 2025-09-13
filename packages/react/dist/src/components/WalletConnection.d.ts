import { default as React } from 'react';
import { WalletConnectionProps } from '../types.js';
/**
 * Wallet connection button component
 *
 * Provides a simple button interface for connecting and disconnecting the wallet.
 * Handles loading states and displays appropriate text based on connection status.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <div>
 *       <WalletConnectionButton
 *         connectText="Connect Wallet"
 *         disconnectText="Disconnect"
 *         connectingText="Connecting..."
 *         onConnect={() => console.log('Connected!')}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export declare function WalletConnectionButton({ connectText, disconnectText, connectingText, className, loadingClassName, disabledClassName, onConnect, onDisconnect, showStatus }: WalletConnectionProps): import("react/jsx-runtime").JSX.Element;
/**
 * Wallet connection status component
 *
 * Displays the current connection status and account information.
 * Useful for showing wallet state without action buttons.
 *
 * @example
 * ```tsx
 * function Header() {
 *   return (
 *     <header>
 *       <h1>My App</h1>
 *       <WalletConnectionStatus />
 *     </header>
 *   );
 * }
 * ```
 */
export declare function WalletConnectionStatus({ className }: {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Wallet connection guard component
 *
 * Conditionally renders children based on wallet connection status.
 * Useful for protecting content that requires a connected wallet.
 *
 * @example
 * ```tsx
 * function ProtectedContent() {
 *   return (
 *     <WalletConnectionGuard
 *       fallback={<div>Please connect your wallet to continue</div>}
 *       loading={<div>Connecting...</div>}
 *     >
 *       <div>This content is only visible when wallet is connected</div>
 *     </WalletConnectionGuard>
 *   );
 * }
 * ```
 */
export declare function WalletConnectionGuard({ children, fallback, loading, error: errorFallback }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    loading?: React.ReactNode;
    error?: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=WalletConnection.d.ts.map