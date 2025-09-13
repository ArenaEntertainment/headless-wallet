/**
 * React components for account selection and management
 */

import React from 'react';
import { useAccount } from '../hooks/useAccount.js';
import type { AccountSelectorProps, Account, AccountConfig } from '../types.js';

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
export function AccountSelector({
  renderAccount,
  className = '',
  selectedClassName = '',
  placeholder = 'Select account...',
  onChange,
  showAddAccount = false
}: AccountSelectorProps) {
  const {
    account: currentAccount,
    accounts,
    switchAccount,
    addAccount,
    isSwitching,
    error
  } = useAccount();

  const handleAccountChange = async (accountId: string) => {
    if (accountId === '__add_new__') {
      try {
        const newAccount = await addAccount({ type: 'evm' }); // Default to EVM
        onChange?.(newAccount);
      } catch (addError) {
        console.error('Failed to add account:', addError);
      }
      return;
    }

    const selectedAccount = accounts.find(acc => acc.id === accountId);
    if (selectedAccount) {
      try {
        await switchAccount(accountId);
        onChange?.(selectedAccount);
      } catch (switchError) {
        console.error('Failed to switch account:', switchError);
      }
    }
  };

  const defaultRenderAccount = (account: Account, isSelected: boolean) => (
    <span className={isSelected ? selectedClassName : ''}>
      <span style={{ fontFamily: 'monospace' }}>
        {account.address.slice(0, 6)}...{account.address.slice(-4)}
      </span>
      <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
        ({account.chainType})
      </span>
    </span>
  );

  const renderAccountOption = renderAccount || defaultRenderAccount;

  return (
    <div className={className}>
      <select
        value={currentAccount?.id || ''}
        onChange={(e) => handleAccountChange(e.target.value)}
        disabled={isSwitching}
        style={{ minWidth: '200px' }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.address.slice(0, 6)}...{account.address.slice(-4)} ({account.chainType})
          </option>
        ))}
        {showAddAccount && (
          <option value="__add_new__">
            + Add New Account
          </option>
        )}
      </select>

      {error && (
        <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Error: {error.message}
        </p>
      )}

      {isSwitching && (
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Switching account...
        </p>
      )}
    </div>
  );
}

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
export function AccountList({
  onSelect,
  showActions = true,
  className = ''
}: {
  onSelect?: (account: Account) => void;
  showActions?: boolean;
  className?: string;
}) {
  const {
    account: currentAccount,
    accounts,
    switchAccount,
    removeAccount,
    addAccount,
    isSwitching,
    error
  } = useAccount();

  const handleAddAccount = async (type: 'evm' | 'solana') => {
    try {
      await addAccount({ type });
    } catch (addError) {
      console.error('Failed to add account:', addError);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (accounts.length <= 1) {
      alert('Cannot remove the last account');
      return;
    }

    if (confirm('Are you sure you want to remove this account?')) {
      try {
        await removeAccount(accountId);
      } catch (removeError) {
        console.error('Failed to remove account:', removeError);
      }
    }
  };

  return (
    <div className={className}>
      {accounts.length === 0 ? (
        <p>No accounts available</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {accounts.map((account) => {
            const isCurrent = currentAccount?.id === account.id;

            return (
              <div
                key={account.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #ccc',
                  borderRadius: '0.5rem',
                  backgroundColor: isCurrent ? '#f0f8ff' : 'transparent',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (!isCurrent && !isSwitching) {
                    switchAccount(account.id);
                    onSelect?.(account);
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {account.address}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      Chain: {account.chainType} • Type: {account.type}
                      {isCurrent && ' • Current'}
                    </div>
                  </div>

                  {showActions && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!isCurrent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            switchAccount(account.id);
                          }}
                          disabled={isSwitching}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Select
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAccount(account.id);
                        }}
                        disabled={isSwitching || accounts.length <= 1}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          color: 'red'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showActions && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleAddAccount('evm')}
            disabled={isSwitching}
            style={{ padding: '0.5rem 1rem' }}
          >
            + Add EVM Account
          </button>
          <button
            onClick={() => handleAddAccount('solana')}
            disabled={isSwitching}
            style={{ padding: '0.5rem 1rem' }}
          >
            + Add Solana Account
          </button>
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
export function AccountInfo({
  showBalance = false,
  className = ''
}: {
  showBalance?: boolean;
  className?: string;
}) {
  const { account } = useAccount();

  if (!account) {
    return (
      <div className={className}>
        <p>No account selected</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div>
          <strong>Address:</strong>
          <br />
          <code style={{ fontSize: '0.875rem' }}>{account.address}</code>
        </div>

        <div>
          <strong>Chain Type:</strong> {account.chainType}
        </div>

        <div>
          <strong>Account Type:</strong> {account.type}
        </div>

        {account.publicKey && (
          <div>
            <strong>Public Key:</strong>
            <br />
            <code style={{ fontSize: '0.875rem' }}>{account.publicKey}</code>
          </div>
        )}

        {showBalance && (
          <div>
            <strong>Balance:</strong>
            <br />
            <span style={{ fontSize: '0.875rem' }}>
              {account.chainType === 'evm' ? '1.23 ETH' : '4.56 SOL'} (Mock)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}