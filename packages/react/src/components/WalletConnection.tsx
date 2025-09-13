/**
 * React components for wallet connection functionality
 */

import React from 'react';
import { useWallet } from '../hooks/useWallet.js';
import type { WalletConnectionProps } from '../types.js';

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
export function WalletConnectionButton({
  connectText = 'Connect Wallet',
  disconnectText = 'Disconnect',
  connectingText = 'Connecting...',
  className = '',
  loadingClassName = '',
  disabledClassName = '',
  onConnect,
  onDisconnect,
  showStatus = false
}: WalletConnectionProps) {
  const {
    isConnected,
    isConnecting,
    error,
    accounts,
    connect,
    disconnect,
    clearError
  } = useWallet();

  const handleClick = async () => {
    clearError();

    if (isConnected) {
      await disconnect();
      onDisconnect?.();
    } else {
      await connect();
      if (isConnected) {
        onConnect?.();
      }
    }
  };

  const isDisabled = isConnecting;
  const buttonText = isConnecting
    ? connectingText
    : isConnected
    ? disconnectText
    : connectText;

  const buttonClassName = [
    className,
    isConnecting ? loadingClassName : '',
    isDisabled ? disabledClassName : ''
  ].filter(Boolean).join(' ');

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={buttonClassName}
        type="button"
      >
        {buttonText}
      </button>

      {showStatus && (
        <div>
          {error && (
            <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Error: {error.message}
            </p>
          )}

          {isConnected && accounts.length > 0 && (
            <p style={{ color: 'green', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Connected with {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

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
export function WalletConnectionStatus({ className = '' }: { className?: string }) {
  const { isConnected, isConnecting, accounts, currentAccount, error } = useWallet();

  if (isConnecting) {
    return (
      <div className={className}>
        <span>Connecting to wallet...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <span style={{ color: 'red' }}>
          Connection error: {error.message}
        </span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={className}>
        <span>Wallet not connected</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div>
        <span style={{ color: 'green' }}>
          ✓ Connected
        </span>
        {accounts.length > 0 && (
          <span style={{ marginLeft: '0.5rem' }}>
            ({accounts.length} account{accounts.length !== 1 ? 's' : ''})
          </span>
        )}
      </div>
      {currentAccount && (
        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
          {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
        </div>
      )}
    </div>
  );
}

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
export function WalletConnectionGuard({
  children,
  fallback = <WalletConnectionButton showStatus />,
  loading = <div>Connecting to wallet...</div>,
  error: errorFallback
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}) {
  const { isConnected, isConnecting, error } = useWallet();

  if (isConnecting) {
    return <>{loading}</>;
  }

  if (error && errorFallback) {
    return <>{errorFallback}</>;
  }

  if (!isConnected) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}