import type {
  MockWallet,
  WalletState,
  WalletConfig,
  WalletEvents,
  Account,
  AccountConfig,
  SupportedChain,
  EventEmitter
} from '@arenaentertainment/wallet-mock-shared';
import {
  MockEthereumProvider,
  type EthereumProvider
} from '@arenaentertainment/wallet-mock-standards';
import {
  MockSolanaWallet,
  type SolanaWallet
} from '@arenaentertainment/wallet-mock-standards';

import { ProductionGuard, type ProductionGuardConfig } from '../security/production-guard.js';
import { StateManager, type StateManagerConfig } from '../state/state-manager.js';
import { AccountManager, type AccountManagerConfig } from '../accounts/account-manager.js';

/**
 * Event emitter implementation for the wallet
 */
class WalletEventEmitter implements EventEmitter<WalletEvents> {
  private listeners: Map<keyof WalletEvents, Set<Function>> = new Map();

  on<K extends keyof WalletEvents>(event: K, listener: WalletEvents[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off<K extends keyof WalletEvents>(event: K, listener: WalletEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  once<K extends keyof WalletEvents>(event: K, listener: WalletEvents[K]): void {
    const onceWrapper = (...args: Parameters<WalletEvents[K]>) => {
      this.off(event, onceWrapper as WalletEvents[K]);
      (listener as any)(...args);
    };
    this.on(event, onceWrapper as WalletEvents[K]);
  }

  emit<K extends keyof WalletEvents>(event: K, ...args: Parameters<WalletEvents[K]>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          (listener as any)(...args);
        } catch (error) {
          console.error(`Error in event listener for ${String(event)}:`, error);
          this.emit('error', error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  }

  removeAllListeners<K extends keyof WalletEvents>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/**
 * Unified multi-chain wallet implementation
 */
export class UnifiedWallet implements MockWallet {
  private eventEmitter: WalletEventEmitter;
  private productionGuard: ProductionGuard;
  private stateManager: StateManager;
  private accountManager: AccountManager;
  private ethereumProvider?: MockEthereumProvider;
  private solanaWallet?: MockSolanaWallet;
  private config: WalletConfig;
  private isDestroyed = false;

  constructor(config: WalletConfig = {}) {
    this.config = config;
    this.eventEmitter = new WalletEventEmitter();

    // Initialize production guard
    this.productionGuard = new ProductionGuard({
      enableProductionChecks: config.security?.enableProductionChecks ?? true,
      allowProductionOverride: false, // Never allow production override for security
      overrideEnvVar: 'WALLET_MOCK_ALLOW_PRODUCTION'
    });

    // Validate environment before proceeding
    this.productionGuard.validateEnvironment();

    // Initialize state manager
    this.stateManager = new StateManager({
      enablePersistence: false, // Disable persistence for security
      stateValidator: this.validateWalletState.bind(this)
    });

    // Initialize account manager
    this.accountManager = new AccountManager({
      maxAccounts: 10,
      enableKeyGeneration: true,
      defaultNamePrefix: 'Account'
    }, this.eventEmitter);

    // Set up state change listeners
    this.stateManager.addStateChangeListener(this.handleStateChange.bind(this));

    // Set up cleanup on page unload
    if (config.security?.autoCleanup !== false && typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
      window.addEventListener('unload', this.handlePageUnload.bind(this));
    }

    // Initialize with default configuration
    this.initialize();
  }

  // Event emitter implementation
  on<K extends keyof WalletEvents>(event: K, listener: WalletEvents[K]): void {
    this.eventEmitter.on(event, listener);
  }

  off<K extends keyof WalletEvents>(event: K, listener: WalletEvents[K]): void {
    this.eventEmitter.off(event, listener);
  }

  once<K extends keyof WalletEvents>(event: K, listener: WalletEvents[K]): void {
    this.eventEmitter.once(event, listener);
  }

  emit<K extends keyof WalletEvents>(event: K, ...args: Parameters<WalletEvents[K]>): void {
    this.eventEmitter.emit(event, ...args);
  }

  removeAllListeners<K extends keyof WalletEvents>(event?: K): void {
    this.eventEmitter.removeAllListeners(event);
  }

  // State management
  getState(): WalletState {
    this.ensureNotDestroyed();
    return this.stateManager.getState();
  }

  isConnected(): boolean {
    this.ensureNotDestroyed();
    return this.stateManager.getState().isConnected;
  }

  isLocked(): boolean {
    this.ensureNotDestroyed();
    return this.stateManager.getState().isLocked;
  }

  // Account management
  async addAccount(config: AccountConfig): Promise<string> {
    this.ensureNotDestroyed();

    try {
      const result = await this.accountManager.createAccount(config);
      this.stateManager.addAccount(result.account);

      // Update provider accounts if necessary
      await this.updateProviderAccounts();

      return result.account.id;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit('error', err);
      throw err;
    }
  }

  async removeAccount(accountId: string): Promise<void> {
    this.ensureNotDestroyed();

    try {
      await this.accountManager.removeAccount(accountId);
      this.stateManager.removeAccount(accountId);

      // Update provider accounts if necessary
      await this.updateProviderAccounts();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit('error', err);
      throw err;
    }
  }

  async switchAccount(accountIndex: number): Promise<void> {
    this.ensureNotDestroyed();

    try {
      this.stateManager.switchAccount(accountIndex);

      // Update provider accounts if necessary
      await this.updateProviderAccounts();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit('error', err);
      throw err;
    }
  }

  getAccounts(): Account[] {
    this.ensureNotDestroyed();
    return this.stateManager.getState().accounts;
  }

  getActiveAccount(): Account | null {
    this.ensureNotDestroyed();
    return this.stateManager.getState().activeAccount;
  }

  // Chain management
  async addChain(chain: SupportedChain): Promise<void> {
    this.ensureNotDestroyed();

    try {
      this.stateManager.addChain(chain);

      // Initialize or update providers if necessary
      if (chain.type === 'evm') {
        await this.initializeEthereumProvider();
      } else if (chain.type === 'solana') {
        await this.initializeSolanaWallet();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit('error', err);
      throw err;
    }
  }

  async switchChain(chainId: string): Promise<void> {
    this.ensureNotDestroyed();

    try {
      this.stateManager.switchChain(chainId);

      // Notify providers of chain change
      const chain = this.stateManager.getState().chains[chainId];
      if (chain) {
        this.eventEmitter.emit('chainChanged', chain);

        if (chain.type === 'evm' && this.ethereumProvider) {
          // Update Ethereum provider chain
          await this.updateEthereumProviderChain(chain);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit('error', err);
      throw err;
    }
  }

  getChains(): Record<string, SupportedChain> {
    this.ensureNotDestroyed();
    return this.stateManager.getState().chains;
  }

  getActiveChain(type: 'evm' | 'solana'): SupportedChain | null {
    this.ensureNotDestroyed();
    const state = this.stateManager.getState();
    return state.activeChains[type] || null;
  }

  // Connection management
  async connect(): Promise<void> {
    this.ensureNotDestroyed();

    try {
      // Ensure we have at least one account
      if (this.getAccounts().length === 0) {
        throw new Error('No accounts available. Add an account before connecting.');
      }

      // Initialize providers
      await this.initializeProviders();

      // Update connection state
      this.stateManager.setConnected(true);
      this.eventEmitter.emit('connect');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit('error', err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.ensureNotDestroyed();

    try {
      // Disconnect providers
      if (this.ethereumProvider) {
        // Ethereum provider doesn't have explicit disconnect in EIP-1193
        this.ethereumProvider = undefined;
      }

      if (this.solanaWallet) {
        try {
          // Use the disconnect feature if available
          const disconnectFeature = this.solanaWallet.features['standard:disconnect'];
          if (disconnectFeature && 'disconnect' in disconnectFeature) {
            await (disconnectFeature as any).disconnect();
          }
        } catch {
          // Ignore disconnect errors
        }
        this.solanaWallet = undefined;
      }

      // Update connection state
      this.stateManager.setConnected(false);
      this.eventEmitter.emit('disconnect');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit('error', err);
      throw err;
    }
  }

  async lock(): Promise<void> {
    this.ensureNotDestroyed();

    try {
      // Disconnect first
      await this.disconnect();

      // Update lock state
      this.stateManager.setLocked(true);
      this.eventEmitter.emit('lock');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit('error', err);
      throw err;
    }
  }

  async unlock(): Promise<void> {
    this.ensureNotDestroyed();

    try {
      // Update lock state
      this.stateManager.setLocked(false);
      this.eventEmitter.emit('unlock');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit('error', err);
      throw err;
    }
  }

  // Cleanup
  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    try {
      // Disconnect from all chains
      await this.disconnect();

      // Clear all accounts
      await this.accountManager.clearAllAccounts();

      // Clean up state manager
      this.stateManager.destroy();

      // Remove all event listeners
      this.eventEmitter.removeAllListeners();

      // Remove page unload listeners
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', this.handlePageUnload.bind(this));
        window.removeEventListener('unload', this.handlePageUnload.bind(this));
      }

      this.isDestroyed = true;
    } catch (error) {
      console.error('Error during wallet destruction:', error);
    }
  }

  // Provider access methods
  getEthereumProvider(): EthereumProvider | null {
    this.ensureNotDestroyed();
    return this.ethereumProvider || null;
  }

  getSolanaWallet(): SolanaWallet | null {
    this.ensureNotDestroyed();
    return this.solanaWallet || null;
  }

  // Private methods

  private initialize(): void {
    try {
      // Initialize default chains if provided
      if (this.config.accounts) {
        // Process initial accounts asynchronously
        Promise.all(
          this.config.accounts.map((accountConfig: AccountConfig) => this.addAccount(accountConfig))
        ).catch((error: Error) => {
          this.eventEmitter.emit('error', error);
        });
      }

      // Set default active account index
      if (typeof this.config.defaultAccountIndex === 'number') {
        this.stateManager.updateStateProperty('activeAccountIndex', this.config.defaultAccountIndex);
      }

      // Mark as initialized
      this.stateManager.setInitialized(true);

      // Auto-connect if enabled
      if (this.config.autoConnect) {
        this.connect().catch(error => {
          this.eventEmitter.emit('error', error);
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit('error', err);
    }
  }

  private async initializeProviders(): Promise<void> {
    const state = this.stateManager.getState();

    // Initialize Ethereum provider if we have EVM chains
    if (state.activeChains.evm) {
      await this.initializeEthereumProvider();
    }

    // Initialize Solana wallet if we have Solana chains
    if (state.activeChains.solana) {
      await this.initializeSolanaWallet();
    }
  }

  private async initializeEthereumProvider(): Promise<void> {
    if (!this.ethereumProvider) {
      const evmAccounts = this.accountManager.getAccountsByChainType('evm');
      const activeChain = this.getActiveChain('evm');

      if (evmAccounts.length > 0 && activeChain && activeChain.type === 'evm') {
        this.ethereumProvider = new MockEthereumProvider(activeChain.chainIdHex);

        // Set accounts after initialization
        const addresses = evmAccounts.map(account =>
          account.type === 'evm_only' || account.type === 'dual_chain'
            ? account.evm.address
            : ''
        ).filter(Boolean);

        // MockEthereumProvider should have a method to set accounts
        // For now, we'll access the private property (not ideal but works)
        (this.ethereumProvider as any)._accounts = addresses;
      }
    }
  }

  private async initializeSolanaWallet(): Promise<void> {
    if (!this.solanaWallet) {
      const solanaAccounts = this.accountManager.getAccountsByChainType('solana');
      const activeChain = this.getActiveChain('solana');

      if (solanaAccounts.length > 0 && activeChain && activeChain.type === 'solana') {
        this.solanaWallet = new MockSolanaWallet({
          name: 'Mock Wallet',
          chains: [activeChain.cluster] as any[]
        });

        // Add accounts after initialization
        for (const account of solanaAccounts) {
          if (account.type === 'solana_only' || account.type === 'dual_chain') {
            const walletAccount = {
              publicKey: account.solana.publicKey,
              label: account.name || 'Account',
              chains: [activeChain.cluster],
              features: ['solana:signTransaction', 'solana:signMessage']
            };
            this.solanaWallet.addAccount(walletAccount as any);
          }
        }
      }
    }
  }

  private async updateProviderAccounts(): Promise<void> {
    // Update Ethereum provider accounts
    if (this.ethereumProvider) {
      const evmAccounts = this.accountManager.getAccountsByChainType('evm');
      const addresses = evmAccounts.map(account =>
        account.type === 'evm_only' || account.type === 'dual_chain'
          ? account.evm.address
          : ''
      ).filter(Boolean);

      // Update provider with new accounts (would need provider method)
      // this.ethereumProvider.updateAccounts(addresses);
    }

    // Update Solana wallet accounts
    if (this.solanaWallet) {
      // Similar update for Solana wallet
    }
  }

  private async updateEthereumProviderChain(chain: SupportedChain): Promise<void> {
    if (this.ethereumProvider && chain.type === 'evm') {
      // Update provider chain (would need provider method)
      // this.ethereumProvider.updateChain(chain.chainId);
    }
  }

  private handleStateChange(state: WalletState): void {
    this.eventEmitter.emit('stateChanged', state);
  }

  private handlePageUnload(): void {
    // Perform immediate cleanup
    this.destroy().catch(console.error);
  }

  private validateWalletState(state: WalletState): boolean {
    try {
      // Basic validation - ensure required properties exist
      return (
        Array.isArray(state.accounts) &&
        typeof state.activeAccountIndex === 'number' &&
        typeof state.chains === 'object' &&
        typeof state.activeChains === 'object' &&
        typeof state.isConnected === 'boolean' &&
        typeof state.isLocked === 'boolean' &&
        typeof state.isInitialized === 'boolean'
      );
    } catch {
      return false;
    }
  }

  private ensureNotDestroyed(): void {
    if (this.isDestroyed) {
      throw new Error('Wallet has been destroyed');
    }
  }
}