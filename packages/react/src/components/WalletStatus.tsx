/**
 * React components for wallet status display
 */

import React from 'react';
import { useWallet } from '../hooks/useWallet.js';
import type { WalletStatusProps } from '../types.js';

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
export function WalletStatus({
  showConnection = true,
  showAccount = true,
  showChain = true,
  showBalance = false,
  className = '',
  renderStatus
}: WalletStatusProps) {
  const walletState = useWallet();

  const {
    isConnected,
    isConnecting,
    accounts,
    currentAccount,
    currentChain,
    error
  } = walletState;

  // Use custom renderer if provided
  if (renderStatus) {
    return <div className={className}>{renderStatus(walletState)}</div>;
  }

  return (
    <div className={className}>
      {/* Connection Status */}
      {showConnection && (
        <div style={{ marginBottom: '0.5rem' }}>
          {isConnecting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#ffa500',
                borderRadius: '50%'
              }} />
              <span>Connecting...</span>
            </div>
          ) : isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#00c851',
                borderRadius: '50%'
              }} />
              <span>Connected</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#dc3545',
                borderRadius: '50%'
              }} />
              <span>Disconnected</span>
            </div>
          )}

          {error && (
            <div style={{ fontSize: '0.75rem', color: '#dc3545', marginTop: '0.25rem' }}>
              {error.message}
            </div>
          )}
        </div>
      )}

      {/* Account Information */}
      {showAccount && isConnected && (
        <div style={{ marginBottom: '0.5rem' }}>
          {currentAccount ? (
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                Account
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: '#666'
              }}>
                {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
              </div>
              {accounts.length > 1 && (
                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                  ({accounts.length} accounts total)
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', color: '#888' }}>
              No account selected
            </div>
          )}

          {showBalance && currentAccount && (
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
              Balance: {currentAccount.chainType === 'evm' ? '1.23 ETH' : '4.56 SOL'} (Mock)
            </div>
          )}
        </div>
      )}

      {/* Chain Information */}
      {showChain && isConnected && currentChain && (
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
            Network
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            {currentChain.name} ({currentChain.type})
          </div>
        </div>
      )}
    </div>
  );
}

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
export function WalletStatusBadge({ className = '' }: { className?: string }) {
  const { isConnected, isConnecting, currentAccount, currentChain, error } = useWallet();

  if (isConnecting) {
    return (
      <div className={className} style={{
        padding: '0.25rem 0.5rem',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '1rem',
        fontSize: '0.75rem'
      }}>
        Connecting...
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={{
        padding: '0.25rem 0.5rem',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        color: '#721c24'
      }}>
        Error
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={className} style={{
        padding: '0.25rem 0.5rem',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        color: '#6c757d'
      }}>
        Not Connected
      </div>
    );
  }

  return (
    <div className={className} style={{
      padding: '0.25rem 0.5rem',
      backgroundColor: '#d1ecf1',
      border: '1px solid #b8daff',
      borderRadius: '1rem',
      fontSize: '0.75rem',
      color: '#0c5460'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '6px',
          height: '6px',
          backgroundColor: '#00c851',
          borderRadius: '50%'
        }} />
        <span>
          {currentAccount && (
            <>
              {currentAccount.address.slice(0, 4)}...{currentAccount.address.slice(-2)}
            </>
          )}
          {currentChain && (
            <span style={{ marginLeft: '0.25rem', opacity: 0.8 }}>
              • {currentChain.name}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

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
export function WalletConnectionIndicator({
  size = 'medium',
  showText = false,
  className = ''
}: {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}) {
  const { isConnected, isConnecting, error } = useWallet();

  const sizeMap = {
    small: '8px',
    medium: '12px',
    large: '16px'
  };

  const indicatorSize = sizeMap[size];

  const getStatus = () => {
    if (isConnecting) return { color: '#ffa500', text: 'Connecting' };
    if (error) return { color: '#dc3545', text: 'Error' };
    if (isConnected) return { color: '#00c851', text: 'Connected' };
    return { color: '#6c757d', text: 'Disconnected' };
  };

  const { color, text } = getStatus();

  return (
    <div className={className} style={{
      display: 'flex',
      alignItems: 'center',
      gap: showText ? '0.5rem' : '0'
    }}>
      <div style={{
        width: indicatorSize,
        height: indicatorSize,
        backgroundColor: color,
        borderRadius: '50%',
        transition: 'background-color 0.2s ease'
      }} />
      {showText && (
        <span style={{ fontSize: '0.875rem', color }}>
          {text}
        </span>
      )}
    </div>
  );
}