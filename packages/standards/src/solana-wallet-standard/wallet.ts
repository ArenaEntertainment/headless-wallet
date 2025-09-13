import { EventEmitter } from '@arenaentertainment/wallet-mock-shared';
import { logger } from '@arenaentertainment/wallet-mock-shared';
import type {
  WalletAccount,
  WalletProperties,
  SolanaConnect,
  SolanaDisconnect,
  SolanaEvents,
  SolanaSignTransaction,
  SolanaSignMessage,
  SolanaSignAndSendTransaction,
  SolanaWallet,
  SolanaWalletEvents,
  SolanaTransaction,
  SolanaChain
} from './types.js';
import { SolanaChains, FeatureNames, MockSolanaTransaction } from './types.js';

/**
 * Mock implementation of Solana Wallet Standard
 */
export class MockSolanaWallet implements SolanaWallet, EventEmitter<SolanaWalletEvents> {
  private _accounts: WalletAccount[] = [];
  private _isConnected = false;
  private eventListeners: Partial<Record<keyof SolanaWalletEvents, Set<Function>>> = {};

  private readonly _properties: WalletProperties;
  private readonly _features: SolanaWallet['features'];

  constructor(config: {
    name?: string;
    icon?: string;
    version?: string;
    chains?: SolanaChain[];
  } = {}) {
    this._properties = {
      name: config.name || 'Mock Solana Wallet',
      icon: config.icon || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM5OTQ1RkYiLz4KPHBhdGggZD0iTTggMTJIMjRWMjBIOFYxMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
      version: config.version || '1.0.0',
      chains: config.chains || [SolanaChains.DEVNET],
      features: {
        [FeatureNames.STANDARD_CONNECT]: this.createConnectFeature(),
        [FeatureNames.STANDARD_DISCONNECT]: this.createDisconnectFeature(),
        [FeatureNames.STANDARD_EVENTS]: this.createEventsFeature(),
        [FeatureNames.SOLANA_SIGN_TRANSACTION]: this.createSignTransactionFeature(),
        [FeatureNames.SOLANA_SIGN_MESSAGE]: this.createSignMessageFeature(),
        [FeatureNames.SOLANA_SIGN_AND_SEND_TRANSACTION]: this.createSignAndSendTransactionFeature()
      }
    };

    this._features = {
      'standard:connect': this.createConnectFeature(),
      'standard:disconnect': this.createDisconnectFeature(),
      'standard:events': this.createEventsFeature(),
      'solana:signTransaction': this.createSignTransactionFeature(),
      'solana:signMessage': this.createSignMessageFeature(),
      'solana:signAndSendTransaction': this.createSignAndSendTransactionFeature()
    };
  }

  get properties(): WalletProperties {
    return { ...this._properties };
  }

  get accounts(): readonly WalletAccount[] {
    return [...this._accounts];
  }

  get features(): SolanaWallet['features'] {
    return this._features;
  }

  // Event emitter implementation
  on<T extends keyof SolanaWalletEvents>(event: T, listener: SolanaWalletEvents[T]): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = new Set();
    }
    this.eventListeners[event]!.add(listener);
  }

  off<T extends keyof SolanaWalletEvents>(event: T, listener: SolanaWalletEvents[T]): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.delete(listener);
    }
  }

  once<T extends keyof SolanaWalletEvents>(event: T, listener: SolanaWalletEvents[T]): void {
    const onceWrapper = (...args: Parameters<SolanaWalletEvents[T]>) => {
      this.off(event, onceWrapper as SolanaWalletEvents[T]);
      (listener as any)(...args);
    };
    this.on(event, onceWrapper as SolanaWalletEvents[T]);
  }

  emit<T extends keyof SolanaWalletEvents>(event: T, ...args: Parameters<SolanaWalletEvents[T]>): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as any)(...args);
        } catch (error) {
          logger.error(`Error in Solana wallet event listener for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners<T extends keyof SolanaWalletEvents>(event?: T): void {
    if (event) {
      delete this.eventListeners[event];
    } else {
      this.eventListeners = {};
    }
  }

  // Wallet management methods
  setAccounts(accounts: WalletAccount[]): void {
    const oldAccounts = [...this._accounts];
    this._accounts = accounts;

    if (JSON.stringify(oldAccounts) !== JSON.stringify(accounts)) {
      logger.info('Solana accounts changed', { from: oldAccounts.length, to: accounts.length });
      this.emit('change', { accounts });
    }
  }

  addAccount(account: WalletAccount): void {
    if (!this._accounts.find(acc => acc.publicKey === account.publicKey)) {
      this._accounts.push(account);
      this.emit('change', { accounts: [...this.accounts] });
      logger.info('Solana account added', { publicKey: account.publicKey });
    }
  }

  removeAccount(publicKey: string): void {
    const index = this._accounts.findIndex(acc => acc.publicKey === publicKey);
    if (index !== -1) {
      this._accounts.splice(index, 1);
      this.emit('change', { accounts: [...this.accounts] });
      logger.info('Solana account removed', { publicKey });
    }
  }

  // Feature implementations
  private createConnectFeature(): SolanaConnect {
    return {
      name: 'standard:connect',
      connect: async (properties?: { onlyIfTrusted?: boolean }) => {
        logger.debug('Solana connect requested', { onlyIfTrusted: properties?.onlyIfTrusted });

        if (properties?.onlyIfTrusted && !this._isConnected) {
          throw new Error('Wallet not trusted, cannot auto-connect');
        }

        // Simulate connection
        this._isConnected = true;

        // If no accounts, create a mock one
        if (this._accounts.length === 0) {
          const mockAccount: WalletAccount = {
            publicKey: this.generateMockPublicKey(),
            label: 'Account 1',
            chains: [SolanaChains.DEVNET],
            features: [
              FeatureNames.SOLANA_SIGN_TRANSACTION,
              FeatureNames.SOLANA_SIGN_MESSAGE
            ]
          };
          this._accounts.push(mockAccount);
        }

        logger.info('Solana wallet connected', { accountCount: this._accounts.length });
        return { accounts: [...this._accounts] };
      }
    };
  }

  private createDisconnectFeature(): SolanaDisconnect {
    return {
      name: 'standard:disconnect',
      disconnect: async () => {
        logger.debug('Solana disconnect requested');

        this._isConnected = false;
        this._accounts = [];

        this.emit('change', { accounts: [] });
        logger.info('Solana wallet disconnected');
      }
    };
  }

  private createEventsFeature(): SolanaEvents {
    return {
      name: 'standard:events',
      on: <T extends keyof SolanaWalletEvents>(
        event: T,
        listener: SolanaWalletEvents[T],
        options?: { once?: boolean }
      ) => {
        if (options?.once) {
          this.once(event, listener);
        } else {
          this.on(event, listener);
        }

        return () => this.off(event, listener);
      }
    };
  }

  private createSignTransactionFeature(): SolanaSignTransaction {
    return {
      name: 'solana:signTransaction',
      signTransaction: async <T extends SolanaTransaction>(
        inputs: Array<{
          account: WalletAccount;
          transaction: T;
          chain?: string;
        }>
      ) => {
        logger.debug('Solana sign transaction requested', { inputCount: inputs.length });

        const results = await Promise.all(
          inputs.map(async ({ account, transaction, chain }) => {
            // Verify account exists
            if (!this._accounts.find(acc => acc.publicKey === account.publicKey)) {
              throw new Error(`Account ${account.publicKey} not found`);
            }

            // Mock signature - 64 bytes
            const mockSignature = new Uint8Array(64);
            for (let i = 0; i < 64; i++) {
              mockSignature[i] = Math.floor(Math.random() * 256);
            }

            // Add signature to transaction if it's our mock type
            if (transaction instanceof MockSolanaTransaction) {
              transaction.addSignature(account.publicKey, mockSignature);
            }

            logger.info('Solana transaction signed', {
              account: account.publicKey,
              chain: chain || 'default'
            });

            return { signedTransaction: transaction };
          })
        );

        return results;
      }
    };
  }

  private createSignMessageFeature(): SolanaSignMessage {
    return {
      name: 'solana:signMessage',
      signMessage: async (
        inputs: Array<{
          account: WalletAccount;
          message: Uint8Array;
        }>
      ) => {
        logger.debug('Solana sign message requested', { inputCount: inputs.length });

        const results = await Promise.all(
          inputs.map(async ({ account, message }) => {
            // Verify account exists
            if (!this._accounts.find(acc => acc.publicKey === account.publicKey)) {
              throw new Error(`Account ${account.publicKey} not found`);
            }

            // Mock signature - 64 bytes
            const signature = new Uint8Array(64);
            for (let i = 0; i < 64; i++) {
              signature[i] = Math.floor(Math.random() * 256);
            }

            logger.info('Solana message signed', {
              account: account.publicKey,
              messageLength: message.length
            });

            return { signature };
          })
        );

        return results;
      }
    };
  }

  private createSignAndSendTransactionFeature(): SolanaSignAndSendTransaction {
    return {
      name: 'solana:signAndSendTransaction',
      signAndSendTransaction: async <T extends SolanaTransaction>(
        inputs: Array<{
          account: WalletAccount;
          transaction: T;
          chain?: string;
          options?: {
            skipPreflight?: boolean;
            preflightCommitment?: string;
            maxRetries?: number;
          };
        }>
      ) => {
        logger.debug('Solana sign and send transaction requested', { inputCount: inputs.length });

        const results = await Promise.all(
          inputs.map(async ({ account, transaction, chain, options }) => {
            // Verify account exists
            if (!this._accounts.find(acc => acc.publicKey === account.publicKey)) {
              throw new Error(`Account ${account.publicKey} not found`);
            }

            // Mock transaction signature (base58-like)
            const signature = this.generateMockTransactionSignature();

            logger.info('Solana transaction signed and sent', {
              account: account.publicKey,
              chain: chain || 'default',
              signature,
              options
            });

            return { signature };
          })
        );

        return results;
      }
    };
  }

  // Utility methods
  private generateMockPublicKey(): string {
    // Generate a Base58-like string (44 characters)
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private generateMockTransactionSignature(): string {
    // Generate a Base58-like transaction signature (88 characters)
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 88; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  // Cleanup
  destroy(): void {
    this.removeAllListeners();
    this._accounts = [];
    this._isConnected = false;
    logger.info('Solana wallet destroyed');
  }
}