/**
 * Example test for useWallet composable
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useWallet } from '../src/composables/useWallet.js';

// Mock the wallet mock library
vi.mock('@arenaentertainment/wallet-mock', () => ({
  createWallet: vi.fn().mockResolvedValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    getState: vi.fn(() => ({
      isConnected: false,
      accounts: [],
      currentAccount: null,
      currentChain: null,
      supportedChains: []
    })),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn()
  })
}));

// Mock plugin
vi.mock('../src/plugin.js', () => ({
  getGlobalWalletInstance: vi.fn(() => ref(null)),
  WALLET_INJECTION_KEY: Symbol('wallet-mock')
}));

describe('useWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide reactive wallet state', () => {
    const { isConnected, accounts, isConnecting } = useWallet();

    expect(isConnected.value).toBe(false);
    expect(accounts.value).toEqual([]);
    expect(isConnecting.value).toBe(false);
  });

  it('should provide connect and disconnect functions', () => {
    const { connect, disconnect } = useWallet();

    expect(typeof connect).toBe('function');
    expect(typeof disconnect).toBe('function');
  });

  it('should handle auto-connect option', () => {
    const { isConnecting } = useWallet({ autoConnect: true });

    // Initially should not be connecting since wallet is mocked
    expect(isConnecting.value).toBe(false);
  });

  it('should handle throwOnError option', async () => {
    const { connect } = useWallet({ throwOnError: true });

    // Should not throw since wallet is mocked
    await expect(connect()).resolves.not.toThrow();
  });
});

// Component test example
describe('useWallet in component', () => {
  const TestComponent = {
    template: `
      <div>
        <span data-testid="connected">{{ isConnected }}</span>
        <span data-testid="accounts">{{ accounts.length }}</span>
        <button data-testid="connect" @click="connect">Connect</button>
      </div>
    `,
    setup() {
      return useWallet();
    }
  };

  it('should work in component context', () => {
    const wrapper = mount(TestComponent);

    expect(wrapper.find('[data-testid="connected"]').text()).toBe('false');
    expect(wrapper.find('[data-testid="accounts"]').text()).toBe('0');
    expect(wrapper.find('[data-testid="connect"]').exists()).toBe(true);
  });
});