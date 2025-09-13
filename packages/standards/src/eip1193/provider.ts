import { EventEmitter } from '@arenaentertainment/wallet-mock-shared';
import {
  EthereumProvider,
  ProviderRequest,
  ProviderRpcError,
  ProviderEvents,
  EthereumMethod,
  ProviderErrorCode,
  TransactionObject,
  AddEthereumChainParameter,
  SwitchEthereumChainParameter,
  WatchAssetParameter,
  PermissionObject
} from './types.js';
import { logger } from '@arenaentertainment/wallet-mock-shared';

/**
 * EIP-1193 compliant Ethereum provider implementation
 */
export class MockEthereumProvider implements EthereumProvider, EventEmitter<ProviderEvents> {
  private eventListeners: Partial<Record<keyof ProviderEvents, Set<Function>>> = {};
  private _chainId: string;
  private _accounts: string[] = [];
  private _isConnected: boolean = false;
  private _networkVersion: string;

  // Provider identification
  readonly isMetaMask = false; // Set to true if mimicking MetaMask
  readonly isMockWallet = true;

  constructor(initialChainId: string = '0x1') {
    this._chainId = initialChainId;
    this._networkVersion = parseInt(initialChainId, 16).toString();
  }

  /**
   * Get current chain ID
   */
  get chainId(): string {
    return this._chainId;
  }

  /**
   * Get network version
   */
  get networkVersion(): string {
    return this._networkVersion;
  }

  /**
   * Get selected address (first account)
   */
  get selectedAddress(): string | null {
    return this._accounts[0] || null;
  }

  /**
   * Check if provider is connected
   */
  isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Make an RPC request
   */
  async request(args: ProviderRequest): Promise<unknown> {
    logger.debug(`EIP-1193 request: ${args.method}`, { method: args.method, params: args.params });

    try {
      switch (args.method) {
        case EthereumMethod.ETH_REQUEST_ACCOUNTS:
          return this.handleRequestAccounts();

        case EthereumMethod.ETH_ACCOUNTS:
          return this.handleAccounts();

        case EthereumMethod.ETH_CHAIN_ID:
          return this.handleChainId();

        case EthereumMethod.NET_VERSION:
          return this.handleNetVersion();

        case EthereumMethod.PERSONAL_SIGN:
          return this.handlePersonalSign(args.params as [string, string]);

        case EthereumMethod.ETH_SIGN_TYPED_DATA_V4:
          return this.handleSignTypedDataV4(args.params as [string, object]);

        case EthereumMethod.ETH_SEND_TRANSACTION:
          return this.handleSendTransaction(args.params as [TransactionObject]);

        case EthereumMethod.WALLET_SWITCH_ETHEREUM_CHAIN:
          return this.handleSwitchChain(args.params as [SwitchEthereumChainParameter]);

        case EthereumMethod.WALLET_ADD_ETHEREUM_CHAIN:
          return this.handleAddChain(args.params as [AddEthereumChainParameter]);

        case EthereumMethod.WALLET_WATCH_ASSET:
          return this.handleWatchAsset(args.params as [WatchAssetParameter]);

        case EthereumMethod.WALLET_REQUEST_PERMISSIONS:
        case EthereumMethod.WALLET_GET_PERMISSIONS:
          return this.handlePermissions(args.method);

        default:
          throw this.createError(
            ProviderErrorCode.UNSUPPORTED_METHOD,
            `Method ${args.method} is not supported`,
            { method: args.method }
          );
      }
    } catch (error) {
      logger.error(`EIP-1193 request failed: ${args.method}`, error);
      throw error;
    }
  }

  /**
   * Add event listener
   */
  on<T extends keyof ProviderEvents>(event: T, listener: ProviderEvents[T]): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = new Set();
    }
    this.eventListeners[event]!.add(listener);
  }

  /**
   * Remove event listener
   */
  removeListener<T extends keyof ProviderEvents>(event: T, listener: ProviderEvents[T]): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: keyof ProviderEvents): void {
    if (event) {
      delete this.eventListeners[event];
    } else {
      this.eventListeners = {};
    }
  }

  /**
   * Remove event listener (alias for removeListener)
   */
  off<T extends keyof ProviderEvents>(event: T, listener: ProviderEvents[T]): void {
    this.removeListener(event, listener);
  }

  /**
   * Add one-time event listener
   */
  once<T extends keyof ProviderEvents>(event: T, listener: ProviderEvents[T]): void {
    const onceWrapper = (...args: Parameters<ProviderEvents[T]>) => {
      this.removeListener(event, onceWrapper as ProviderEvents[T]);
      (listener as any)(...args);
    };
    this.on(event, onceWrapper as ProviderEvents[T]);
  }

  /**
   * Emit an event
   */
  emit<T extends keyof ProviderEvents>(event: T, ...args: Parameters<ProviderEvents[T]>): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as any)(...args);
        } catch (error) {
          logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Provider management methods

  /**
   * Set accounts and emit accountsChanged event
   */
  setAccounts(accounts: string[]): void {
    const oldAccounts = [...this._accounts];
    this._accounts = accounts;

    if (JSON.stringify(oldAccounts) !== JSON.stringify(accounts)) {
      logger.info('Accounts changed', { from: oldAccounts, to: accounts });
      this.emit('accountsChanged', accounts);
    }
  }

  /**
   * Set chain ID and emit chainChanged event
   */
  setChainId(chainId: string): void {
    const oldChainId = this._chainId;
    this._chainId = chainId;
    this._networkVersion = parseInt(chainId, 16).toString();

    if (oldChainId !== chainId) {
      logger.info('Chain changed', { from: oldChainId, to: chainId });
      this.emit('chainChanged', chainId);
    }
  }

  /**
   * Connect the provider
   */
  connect(): void {
    if (!this._isConnected) {
      this._isConnected = true;
      logger.info('Provider connected', { chainId: this._chainId });
      this.emit('connect', { chainId: this._chainId });
    }
  }

  /**
   * Disconnect the provider
   */
  disconnect(error?: ProviderRpcError): void {
    if (this._isConnected) {
      this._isConnected = false;
      const disconnectError = error || this.createError(
        ProviderErrorCode.DISCONNECTED,
        'Provider disconnected'
      );
      logger.info('Provider disconnected', { error: disconnectError.message });
      this.emit('disconnect', disconnectError);
    }
  }

  // Request handlers

  private async handleRequestAccounts(): Promise<string[]> {
    if (!this._isConnected) {
      this.connect();
    }
    return this._accounts;
  }

  private async handleAccounts(): Promise<string[]> {
    return this._accounts;
  }

  private async handleChainId(): Promise<string> {
    return this._chainId;
  }

  private async handleNetVersion(): Promise<string> {
    return this._networkVersion;
  }

  private async handlePersonalSign([message, address]: [string, string]): Promise<string> {
    logger.debug('Personal sign request', { message, address });

    if (!this._accounts.includes(address)) {
      throw this.createError(
        ProviderErrorCode.UNAUTHORIZED,
        `Address ${address} not found in wallet`,
        { address }
      );
    }

    // Mock signature - in real implementation, this would use the private key
    const mockSignature = '0x' + '0'.repeat(130); // 65 bytes = 130 hex chars

    logger.info('Message signed', { address, message });
    return mockSignature;
  }

  private async handleSignTypedDataV4([address, typedData]: [string, object]): Promise<string> {
    logger.debug('Sign typed data v4 request', { address, typedData });

    if (!this._accounts.includes(address)) {
      throw this.createError(
        ProviderErrorCode.UNAUTHORIZED,
        `Address ${address} not found in wallet`,
        { address }
      );
    }

    // Mock signature - in real implementation, this would use the private key
    const mockSignature = '0x' + '1'.repeat(130); // Different from personal_sign

    logger.info('Typed data signed', { address });
    return mockSignature;
  }

  private async handleSendTransaction([tx]: [TransactionObject]): Promise<string> {
    logger.debug('Send transaction request', { transaction: tx });

    if (!this._accounts.includes(tx.from)) {
      throw this.createError(
        ProviderErrorCode.UNAUTHORIZED,
        `From address ${tx.from} not found in wallet`,
        { from: tx.from }
      );
    }

    // Mock transaction hash
    const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64).padStart(64, '0');

    logger.info('Transaction sent', { hash: mockTxHash, from: tx.from, to: tx.to });
    return mockTxHash;
  }

  private async handleSwitchChain([{ chainId }]: [SwitchEthereumChainParameter]): Promise<null> {
    logger.debug('Switch chain request', { chainId });

    // Simulate chain switch
    this.setChainId(chainId);

    logger.info('Chain switched', { chainId });
    return null;
  }

  private async handleAddChain([chainConfig]: [AddEthereumChainParameter]): Promise<null> {
    logger.debug('Add chain request', { chainConfig });

    // Mock adding chain - in real implementation, this would validate and store the chain
    logger.info('Chain added', { chainId: chainConfig.chainId, name: chainConfig.chainName });
    return null;
  }

  private async handleWatchAsset([asset]: [WatchAssetParameter]): Promise<boolean> {
    logger.debug('Watch asset request', { asset });

    // Mock watching asset - always return true for success
    logger.info('Asset watched', { address: asset.options.address, symbol: asset.options.symbol });
    return true;
  }

  private async handlePermissions(method: string): Promise<PermissionObject[]> {
    logger.debug('Permissions request', { method });

    // Mock permissions
    const permissions: PermissionObject[] = [
      {
        invoker: window.location.origin,
        parentCapability: 'eth_accounts',
        id: Math.random().toString(36),
        date: Date.now()
      }
    ];

    return permissions;
  }

  /**
   * Create a properly formatted provider error
   */
  private createError(code: ProviderErrorCode, message: string, data?: unknown): ProviderRpcError {
    const error = new Error(message) as ProviderRpcError;
    error.code = code;
    error.data = data;
    return error;
  }
}