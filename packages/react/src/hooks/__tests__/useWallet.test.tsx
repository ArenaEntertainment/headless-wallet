/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MockWalletProvider } from '../../provider.js';
import { useWallet } from '../useWallet.js';

// Test component that uses the hook
function TestComponent() {
  const {
    isConnected,
    isConnecting,
    accounts,
    connect,
    disconnect,
    error
  } = useWallet();

  return (
    <div>
      <div data-testid="connection-status">
        {isConnecting ? 'connecting' : isConnected ? 'connected' : 'disconnected'}
      </div>
      <div data-testid="accounts-count">{accounts.length}</div>
      <div data-testid="error">{error?.message || 'no-error'}</div>
      <button data-testid="connect-btn" onClick={connect}>
        Connect
      </button>
      <button data-testid="disconnect-btn" onClick={disconnect}>
        Disconnect
      </button>
    </div>
  );
}

// Wrapper component with provider
function TestWrapper({ children, ...providerProps }: any) {
  return (
    <MockWalletProvider
      accounts={[{ type: 'evm' }]}
      {...providerProps}
    >
      {children}
    </MockWalletProvider>
  );
}

describe('useWallet', () => {
  beforeEach(() => {
    // Clean up any existing state
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should provide initial disconnected state', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
    expect(screen.getByTestId('accounts-count')).toHaveTextContent('0');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should connect wallet when connect is called', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const connectBtn = screen.getByTestId('connect-btn');
    fireEvent.click(connectBtn);

    // Should show connecting state briefly
    expect(screen.getByTestId('connection-status')).toHaveTextContent('connecting');

    // Wait for connection to complete
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
    });

    // Should have accounts after connection
    expect(screen.getByTestId('accounts-count')).not.toHaveTextContent('0');
  });

  it('should auto-connect when autoConnect is enabled', async () => {
    render(
      <TestWrapper autoConnect>
        <TestComponent />
      </TestWrapper>
    );

    // Should automatically connect
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
    });

    expect(screen.getByTestId('accounts-count')).not.toHaveTextContent('0');
  });

  it('should disconnect wallet when disconnect is called', async () => {
    render(
      <TestWrapper autoConnect>
        <TestComponent />
      </TestWrapper>
    );

    // Wait for auto-connection
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
    });

    // Disconnect
    const disconnectBtn = screen.getByTestId('disconnect-btn');
    fireEvent.click(disconnectBtn);

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
    });

    expect(screen.getByTestId('accounts-count')).toHaveTextContent('0');
  });

  it('should throw error when used outside provider', () => {
    // Mock console.error to avoid noise in test output
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useWallet must be used within a MockWalletProvider');

    console.error = originalError;
  });
});