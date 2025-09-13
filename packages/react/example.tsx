/**
 * Example usage of @arenaentertainment/wallet-mock-react
 *
 * This file demonstrates various ways to use the React wallet-mock package
 * in your applications.
 */

import React from 'react';
import {
  MockWalletProvider,
  useWallet,
  useAccount,
  useChain,
  WalletConnectionButton,
  WalletStatus,
  AccountSelector,
  ChainSelector,
  WalletConnectionGuard
} from './src/index.js';

/**
 * Basic usage example
 */
function BasicExample() {
  return (
    <MockWalletProvider
      accounts={[{ type: 'dual_chain' }]}
      autoConnect
    >
      <div>
        <h2>Basic Wallet Integration</h2>
        <WalletConnectionButton showStatus />
        <WalletStatus
          showConnection
          showAccount
          showChain
        />
      </div>
    </MockWalletProvider>
  );
}

/**
 * Advanced usage with hooks
 */
function AdvancedExample() {
  return (
    <MockWalletProvider
      accounts={[
        { type: 'evm' },
        { type: 'solana' },
        { type: 'dual_chain' }
      ]}
      initialChain="1" // Ethereum mainnet
      production={{
        allowedHosts: ['localhost', '127.0.0.1'],
        throwInProduction: false
      }}
    >
      <WalletDashboard />
    </MockWalletProvider>
  );
}

function WalletDashboard() {
  const {
    isConnected,
    isConnecting,
    accounts,
    connect,
    disconnect,
    error
  } = useWallet({
    onConnect: (accounts) => {
      console.log('Wallet connected with accounts:', accounts);
    },
    onError: (error) => {
      console.error('Wallet error:', error);
    }
  });

  const {
    account: currentAccount,
    switchAccount,
    addAccount,
    removeAccount
  } = useAccount({
    autoSelect: true
  });

  const {
    chain: currentChain,
    chains,
    switchChain
  } = useChain();

  if (isConnecting) {
    return <div>Connecting to wallet...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        <h3>Wallet Error</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div>
        <h2>Connect Your Wallet</h2>
        <button onClick={connect}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Wallet Dashboard</h1>
        <button onClick={disconnect} style={{ float: 'right' }}>
          Disconnect
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Account Management */}
        <div>
          <h3>Account Management</h3>
          <div style={{ marginBottom: '1rem' }}>
            <AccountSelector showAddAccount />
          </div>

          {currentAccount && (
            <div style={{
              padding: '1rem',
              border: '1px solid #ccc',
              borderRadius: '0.5rem',
              backgroundColor: '#f9f9f9'
            }}>
              <h4>Current Account</h4>
              <p><strong>Address:</strong> {currentAccount.address}</p>
              <p><strong>Type:</strong> {currentAccount.type}</p>
              <p><strong>Chain:</strong> {currentAccount.chainType}</p>
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => addAccount({ type: 'evm' })}
              style={{ marginRight: '0.5rem' }}
            >
              Add EVM Account
            </button>
            <button onClick={() => addAccount({ type: 'solana' })}>
              Add Solana Account
            </button>
          </div>
        </div>

        {/* Chain Management */}
        <div>
          <h3>Chain Management</h3>
          <div style={{ marginBottom: '1rem' }}>
            <ChainSelector />
          </div>

          {currentChain && (
            <div style={{
              padding: '1rem',
              border: '1px solid #ccc',
              borderRadius: '0.5rem',
              backgroundColor: '#f9f9f9'
            }}>
              <h4>Current Chain</h4>
              <p><strong>Name:</strong> {currentChain.name}</p>
              <p><strong>ID:</strong> {currentChain.id}</p>
              <p><strong>Type:</strong> {currentChain.type}</p>
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            <h4>Available Chains</h4>
            <ul>
              {chains.map(chain => (
                <li key={chain.id}>
                  <button
                    onClick={() => switchChain(chain.id)}
                    disabled={currentChain?.id === chain.id}
                    style={{
                      background: currentChain?.id === chain.id ? '#e0e0e0' : 'white',
                      border: '1px solid #ccc',
                      padding: '0.25rem 0.5rem',
                      margin: '0.25rem',
                      borderRadius: '0.25rem',
                      cursor: currentChain?.id === chain.id ? 'default' : 'pointer'
                    }}
                  >
                    {chain.name} {currentChain?.id === chain.id && '(Current)'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* All Accounts List */}
      <div style={{ marginTop: '2rem' }}>
        <h3>All Accounts ({accounts.length})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {accounts.map(account => (
            <div
              key={account.id}
              style={{
                padding: '1rem',
                border: currentAccount?.id === account.id ? '2px solid #007bff' : '1px solid #ccc',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
              onClick={() => switchAccount(account.id)}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {account.address}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                {account.type} • {account.chainType}
                {currentAccount?.id === account.id && ' • Current'}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (accounts.length > 1) {
                    removeAccount(account.id);
                  } else {
                    alert('Cannot remove the last account');
                  }
                }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  color: 'red',
                  background: 'white',
                  border: '1px solid red',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Protected content example
 */
function ProtectedContentExample() {
  return (
    <MockWalletProvider accounts={[{ type: 'evm' }]}>
      <div>
        <h2>Protected Content</h2>
        <WalletConnectionGuard
          fallback={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h3>Wallet Required</h3>
              <p>Please connect your wallet to access this content.</p>
              <WalletConnectionButton />
            </div>
          }
          loading={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h3>Connecting...</h3>
              <p>Please wait while we connect to your wallet.</p>
            </div>
          }
        >
          <div style={{ padding: '2rem' }}>
            <h3>🎉 Welcome to the Protected Area!</h3>
            <p>This content is only visible to connected wallets.</p>
            <WalletStatus showAccount showChain />
          </div>
        </WalletConnectionGuard>
      </div>
    </MockWalletProvider>
  );
}

/**
 * Complete app example
 */
export function App() {
  const [example, setExample] = React.useState<'basic' | 'advanced' | 'protected'>('basic');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{
        padding: '1rem',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0, marginBottom: '1rem' }}>
          Wallet Mock React Examples
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setExample('basic')}
            style={{
              padding: '0.5rem 1rem',
              background: example === 'basic' ? '#007bff' : 'white',
              color: example === 'basic' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Basic
          </button>
          <button
            onClick={() => setExample('advanced')}
            style={{
              padding: '0.5rem 1rem',
              background: example === 'advanced' ? '#007bff' : 'white',
              color: example === 'advanced' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Advanced
          </button>
          <button
            onClick={() => setExample('protected')}
            style={{
              padding: '0.5rem 1rem',
              background: example === 'protected' ? '#007bff' : 'white',
              color: example === 'protected' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Protected
          </button>
        </div>
      </nav>

      <main>
        {example === 'basic' && <BasicExample />}
        {example === 'advanced' && <AdvancedExample />}
        {example === 'protected' && <ProtectedContentExample />}
      </main>
    </div>
  );
}

export default App;