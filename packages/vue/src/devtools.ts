/**
 * Vue DevTools integration for wallet-mock
 */

import type { App } from 'vue';
import type { DevtoolsPluginApi } from '@vue/devtools-api';
import type { MockWallet, Account, SupportedChain } from '@arenaentertainment/wallet-mock';
import type { DevToolsState } from './types.js';

/**
 * DevTools plugin ID
 */
const DEVTOOLS_PLUGIN_ID = 'wallet-mock-vue';

/**
 * DevTools component state manager
 */
class WalletDevTools {
  private api: DevtoolsPluginApi | null = null;
  private wallet: MockWallet | null = null;
  private state: DevToolsState = {
    wallet: null,
    accounts: [],
    currentAccount: null,
    currentChain: null,
    isConnected: false,
    connectionHistory: []
  };

  /**
   * Initialize DevTools integration
   */
  async initialize(app: App, wallet: MockWallet | null) {
    if (typeof window === 'undefined') {
      return; // Skip in SSR
    }

    try {
      // Dynamic import to avoid bundling issues
      const { setupDevtoolsPlugin } = await import('@vue/devtools-api');

      this.wallet = wallet;
      this.updateState();

      setupDevtoolsPlugin({
        id: DEVTOOLS_PLUGIN_ID,
        label: 'Wallet Mock',
        packageName: '@arenaentertainment/wallet-mock-vue',
        homepage: 'https://github.com/arenaentertainment/wallet-mock',
        componentStateTypes: ['Wallet State', 'Accounts', 'Chains', 'Connection History'],
        app
      }, (api) => {
        this.api = api;
        this.setupDevTools();

        if (wallet) {
          this.attachWalletListeners();
        }
      });
    } catch (error) {
      // DevTools not available, silently fail
      console.debug('Vue DevTools not available:', error);
    }
  }

  /**
   * Update the wallet instance
   */
  updateWallet(wallet: MockWallet | null) {
    this.wallet = wallet;
    this.updateState();

    if (this.api && wallet) {
      this.attachWalletListeners();
    }
  }

  /**
   * Setup DevTools panels and inspectors
   */
  private setupDevTools() {
    if (!this.api) return;

    // Add custom inspector for wallet state
    this.api.addInspector({
      id: 'wallet-state',
      label: 'Wallet State',
      icon: 'account_balance_wallet'
    });

    // Add timeline layer for wallet events
    this.api.addTimelineLayer({
      id: 'wallet-events',
      label: 'Wallet Events',
      color: 0x42b883
    });

    // Initial state inspection
    this.inspectState();
  }

  /**
   * Attach event listeners to wallet
   */
  private attachWalletListeners() {
    if (!this.wallet) return;

    // Listen for connection events
    this.wallet.on('connect', (data) => {
      this.logEvent('connect', 'Connected to wallet', data);
      this.updateState();
    });

    this.wallet.on('disconnect', () => {
      this.logEvent('disconnect', 'Disconnected from wallet');
      this.updateState();
    });

    this.wallet.on('accountsChanged', (data) => {
      this.logEvent('accountsChanged', 'Accounts changed', data);
      this.updateState();
    });

    this.wallet.on('chainChanged', (data) => {
      this.logEvent('chainChanged', 'Chain changed', data);
      this.updateState();
    });

    this.wallet.on('error', (error) => {
      this.logEvent('error', 'Wallet error', error, 'error');
    });
  }

  /**
   * Update internal state from wallet
   */
  private updateState() {
    if (!this.wallet) {
      this.state = {
        wallet: null,
        accounts: [],
        currentAccount: null,
        currentChain: null,
        isConnected: false,
        connectionHistory: this.state.connectionHistory
      };
      return;
    }

    const walletState = this.wallet.getState();

    this.state = {
      ...this.state,
      wallet: this.wallet,
      accounts: walletState.accounts,
      currentAccount: walletState.currentAccount,
      currentChain: walletState.currentChain,
      isConnected: walletState.isConnected
    };

    this.inspectState();
  }

  /**
   * Send state to DevTools inspector
   */
  private inspectState() {
    if (!this.api) return;

    this.api.sendInspectorState('wallet-state', {
      'Wallet State': [
        {
          key: 'connected',
          value: this.state.isConnected,
          editable: false
        },
        {
          key: 'currentAccount',
          value: this.state.currentAccount ? {
            address: this.state.currentAccount.address,
            type: this.state.currentAccount.type,
            chainType: this.state.currentAccount.chainType
          } : null,
          editable: false
        },
        {
          key: 'currentChain',
          value: this.state.currentChain ? {
            id: this.state.currentChain.id,
            name: this.state.currentChain.name,
            type: this.state.currentChain.type
          } : null,
          editable: false
        }
      ],
      'Accounts': this.state.accounts.map((account, index) => ({
        key: index,
        value: {
          address: account.address,
          type: account.type,
          chainType: account.chainType,
          balance: account.balance || 'N/A'
        },
        editable: false
      })),
      'Connection History': this.state.connectionHistory.map((entry, index) => ({
        key: index,
        value: {
          timestamp: entry.timestamp.toISOString(),
          action: entry.action,
          data: entry.data
        },
        editable: false
      }))
    });
  }

  /**
   * Log event to DevTools timeline
   */
  private logEvent(
    type: string,
    title: string,
    data?: any,
    logType: 'default' | 'warning' | 'error' = 'default'
  ) {
    if (!this.api) return;

    const event = {
      timestamp: new Date(),
      action: type as any,
      data
    };

    // Add to history
    this.state.connectionHistory.unshift(event);

    // Keep only last 50 events
    if (this.state.connectionHistory.length > 50) {
      this.state.connectionHistory = this.state.connectionHistory.slice(0, 50);
    }

    // Send to timeline
    this.api.addTimelineEvent({
      layerId: 'wallet-events',
      event: {
        time: Date.now(),
        data: {
          type,
          title,
          data
        },
        logType
      }
    });

    // Update inspector
    this.inspectState();
  }

  /**
   * Add custom DevTools commands
   */
  addCustomCommands() {
    if (!this.api) return;

    // Command to refresh wallet state
    this.api.on.inspectorActionPerformed((payload) => {
      if (payload.inspectorId === 'wallet-state' && payload.actionType === 'refresh') {
        this.updateState();
      }
    });
  }
}

/**
 * Global DevTools instance
 */
let devToolsInstance: WalletDevTools | null = null;

/**
 * Initialize Vue DevTools integration
 */
export function setupDevTools(app: App, wallet: MockWallet | null) {
  if (!devToolsInstance) {
    devToolsInstance = new WalletDevTools();
  }

  devToolsInstance.initialize(app, wallet);
  return devToolsInstance;
}

/**
 * Update wallet instance in DevTools
 */
export function updateDevToolsWallet(wallet: MockWallet | null) {
  if (devToolsInstance) {
    devToolsInstance.updateWallet(wallet);
  }
}

/**
 * Check if DevTools is available
 */
export function isDevToolsAvailable(): boolean {
  return typeof window !== 'undefined' &&
         (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__ !== undefined;
}