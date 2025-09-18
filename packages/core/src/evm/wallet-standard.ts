import { EVMWallet } from './wallet.js';
import type { Chain } from 'viem';
import * as chains from 'viem/chains';
import { StateStream, type StreamState } from './state-stream.js';
import { LegacyMethodProvider } from './legacy-methods.js';

/**
 * EIP-1193 Provider with full standard compliance
 * Implements all required methods for wallet connectors
 */
export class EVMWalletStandard {
  private wallet: EVMWallet;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnected = false;
  private currentChainId: string;
  private supportedChains: Map<string, any> = new Map();
  private permissions: Set<string> = new Set();
  private stateStream: StateStream;
  private legacyProvider: LegacyMethodProvider;

  // EIP-6963 Properties
  readonly uuid: string;
  readonly name: string;
  readonly icon: string;
  readonly rdns: string;

  constructor(
    wallet: EVMWallet,
    branding: {
      name?: string;
      icon?: string;
      rdns?: string;
      uuid?: string;
    } = {}
  ) {
    this.wallet = wallet;
    // Get the actual chain ID from the underlying wallet
    const currentChain = wallet.getCurrentChain();
    this.currentChainId = `0x${currentChain.id.toString(16)}`;

    // Set branding
    this.name = branding.name || 'Arena Headless Wallet';
    this.icon = branding.icon || this.#getDefaultIcon();
    this.rdns = branding.rdns || 'com.arenaentertainment.headless-wallet';
    this.uuid = branding.uuid || this.#generateUUID();

    // Initialize state stream with correct network version
    const networkVersion = currentChain.id.toString();
    this.stateStream = new StateStream({
      chainId: this.currentChainId,
      networkVersion,
      isConnected: false,
      isUnlocked: false,
      accounts: [],
      selectedAddress: null,
      permissions: new Set(),
    });

    // Initialize legacy method provider
    this.legacyProvider = new LegacyMethodProvider(this.wallet);

    // Initialize supported chains
    this.#initializeSupportedChains();

    // Set up stream-based state synchronization
    this.#setupStreamSync();

    // Set up internal wallet listeners
    this.wallet.on('accountsChanged', (accounts: string[]) => {
      this.stateStream.updateState('accounts', accounts);
      this.#emit('accountsChanged', accounts);
    });

    this.wallet.on('chainChanged', (chainId: string) => {
      this.currentChainId = chainId;
      this.stateStream.updateState('chainId', chainId);
      this.#emit('chainChanged', chainId);
    });

    this.wallet.on('connect', ({ chainId }: { chainId: string }) => {
      this.isConnected = true;
      this.currentChainId = chainId;
      this.stateStream.batchUpdate({
        isConnected: true,
        chainId,
      });
      this.#emit('connect', { chainId });
    });

    this.wallet.on('disconnect', (error?: any) => {
      this.isConnected = false;
      this.permissions.clear();
      this.stateStream.batchUpdate({
        isConnected: false,
        isUnlocked: false,
        accounts: [],
        selectedAddress: null,
        permissions: new Set(),
      });
      this.#emit('disconnect', error);
    });
  }

  /**
   * EIP-1193 request method - the main entry point for all RPC calls
   */
  async request(args: { method: string; params?: any[] }): Promise<any> {
    const { method, params = [] } = args;

    // Handle all standard methods
    switch (method) {
      // Account methods
      case 'eth_requestAccounts':
        return this.#requestAccounts();

      case 'eth_accounts':
        return this.#getAccounts();

      // Chain methods
      case 'eth_chainId':
        return this.currentChainId;

      case 'net_version':
        return String(parseInt(this.currentChainId, 16));

      // Signing methods
      case 'personal_sign':
        return this.wallet.request({ method, params });

      case 'eth_sign':
        return this.wallet.request({ method, params });

      case 'eth_signTypedData':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
        return this.wallet.request({ method, params });

      // Transaction methods
      case 'eth_sendTransaction':
        return this.#sendTransaction(params[0]);

      case 'eth_signTransaction':
        return this.#signTransaction(params[0]);

      case 'eth_sendRawTransaction':
        return this.wallet.request({ method, params });

      // Wallet methods
      case 'wallet_switchEthereumChain':
        return this.#switchChain(params[0]);

      case 'wallet_addEthereumChain':
        return this.#addChain(params[0]);

      case 'wallet_watchAsset':
        return this.#watchAsset(params[0]);

      case 'wallet_getCapabilities':
        return this.#getCapabilities(params[0]);

      case 'wallet_requestPermissions':
        return this.#requestPermissions(params[0]);

      case 'wallet_getPermissions':
        return this.#getPermissions();

      case 'wallet_revokePermissions':
        return this.#revokePermissions(params[0]);

      // Read methods
      case 'eth_getBalance':
      case 'eth_getCode':
      case 'eth_getTransactionCount':
      case 'eth_getStorageAt':
      case 'eth_call':
      case 'eth_estimateGas':
      case 'eth_gasPrice':
      case 'eth_getBlockByNumber':
      case 'eth_getBlockByHash':
      case 'eth_getTransactionByHash':
      case 'eth_getTransactionReceipt':
      case 'eth_getLogs':
        return this.wallet.request({ method, params });

      // Subscription methods
      case 'eth_subscribe':
      case 'eth_unsubscribe':
        return this.wallet.request({ method, params });

      // Other methods
      case 'web3_clientVersion':
        return 'Arena-Headless-Wallet/1.0.0';

      case 'web3_sha3':
        return this.wallet.request({ method, params });

      case 'net_listening':
        return true;

      case 'net_peerCount':
        return '0x1';

      case 'eth_protocolVersion':
        return '0x41'; // 65

      case 'eth_syncing':
        return false;

      case 'eth_coinbase':
        const accounts = await this.#getAccounts();
        return accounts[0] || null;

      case 'eth_mining':
        return false;

      case 'eth_hashrate':
        return '0x0';

      case 'eth_getWork':
        throw new Error('Mining not supported');

      // Deprecated but sometimes still used
      case 'eth_getEncryptionPublicKey':
        return this.#getEncryptionPublicKey(params[0]);

      case 'eth_decrypt':
        return this.#decrypt(params[0], params[1]);

      // MetaMask specific (for compatibility)
      case 'metamask_getProviderState':
        return {
          isUnlocked: this.isConnected,
          chainId: this.currentChainId,
          networkVersion: String(parseInt(this.currentChainId, 16)),
          accounts: await this.#getAccounts(),
        };

      case 'metamask_sendDomainMetadata':
        // Store domain metadata but don't need to do anything
        return true;

      default:
        // Check if it's a legacy method
        if (this.legacyProvider.isLegacyMethod(method)) {
          return await this.legacyProvider.handleLegacyMethod(method, params);
        }

        // Try to forward to underlying wallet
        try {
          return await this.wallet.request({ method, params });
        } catch {
          throw new Error(`Unsupported method: ${method}`);
        }
    }
  }

  /**
   * EIP-1193 event methods
   */
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  removeListener(event: string, listener: Function): void {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * Additional convenience methods
   */
  isMetaMask = true; // For compatibility

  /**
   * Get the state stream for subscribing to state changes
   */
  getStateStream(): StateStream {
    return this.stateStream;
  }

  /**
   * Get current state snapshot
   */
  getState(): Readonly<StreamState> {
    return this.stateStream.getState();
  }

  /**
   * Subscribe to specific state changes
   */
  subscribeToState<K extends keyof StreamState>(
    key: K,
    callback: (value: StreamState[K]) => void
  ): () => void {
    return this.stateStream.subscribe(key, (update) => {
      callback(update.value);
    });
  }

  // Private helper methods

  #emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  async #requestAccounts(): Promise<string[]> {
    const accounts = await this.wallet.request({
      method: 'eth_requestAccounts'
    });

    if (accounts.length > 0) {
      this.isConnected = true;
      this.permissions.add('eth_accounts');
      this.stateStream.batchUpdate({
        accounts,
        isConnected: true,
        isUnlocked: true,
        selectedAddress: accounts[0],
        permissions: new Set(this.permissions),
      });
      this.#emit('connect', { chainId: this.currentChainId });
    }

    return accounts;
  }

  async #getAccounts(): Promise<string[]> {
    if (!this.permissions.has('eth_accounts')) {
      return [];
    }
    return this.wallet.request({ method: 'eth_accounts' });
  }

  #setupStreamSync(): void {
    // Subscribe to stream state changes for efficient updates
    this.stateStream.subscribe('accounts', (update) => {
      // Additional processing if needed
    });

    this.stateStream.subscribe('chainId', (update) => {
      // Additional processing if needed
    });

    // Create derived streams for computed values
    const hasAccounts = this.stateStream.derive(
      state => state.accounts.length > 0
    );

    const connectionStatus = this.stateStream.derive(
      state => ({
        isConnected: state.isConnected,
        hasAccounts: state.accounts.length > 0,
        chainId: state.chainId,
      })
    );

    // Subscribe to derived streams if needed
    connectionStatus.subscribe((status) => {
      // Handle connection status changes
    });
  }

  async #sendTransaction(tx: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }
    return this.wallet.request({
      method: 'eth_sendTransaction',
      params: [tx]
    });
  }

  async #signTransaction(tx: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }
    return this.wallet.request({
      method: 'eth_signTransaction',
      params: [tx]
    });
  }

  async #switchChain(params: { chainId: string }): Promise<null> {
    const { chainId } = params;

    if (!this.supportedChains.has(chainId)) {
      throw {
        code: 4902,
        message: 'Unrecognized chain ID. Try adding the chain first.',
      };
    }

    // Call the underlying wallet's chain switching logic directly to avoid recursion
    // This mimics what happens in wallet.ts lines 413-434
    const newChain = (this.wallet as any).getChainById(chainId);
    if (!newChain) {
      throw {
        code: 4902,
        message: 'Unrecognized chain ID. Try adding the chain first.',
      };
    }

    // Update the wallet's current chain and clear cached clients
    const walletCurrentChain = (this.wallet as any).currentChain;
    if (walletCurrentChain.id !== newChain.id) {
      (this.wallet as any).publicClient = null;
      (this.wallet as any).walletClientCache.clear();
    }

    (this.wallet as any).currentChain = newChain;

    // Set up transport for new chain if not exists
    const transports = (this.wallet as any).transports;
    if (!transports[newChain.id]) {
      const { http } = await import('viem');
      console.warn(`⚠️  No explicit transport for chain ${newChain.id}, using default RPC`);
      transports[newChain.id] = http(newChain.rpcUrls.default.http[0]);
    }

    this.currentChainId = chainId;
    this.stateStream.updateState('chainId', chainId);
    this.#emit('chainChanged', chainId);

    return null;
  }

  async #addChain(params: {
    chainId: string;
    chainName?: string;
    nativeCurrency?: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls?: string[];
    blockExplorerUrls?: string[];
    iconUrls?: string[];
  }): Promise<null> {
    const { chainId, chainName, nativeCurrency, rpcUrls } = params;

    // Validate required parameters
    if (!chainId || !chainName || !rpcUrls?.length) {
      throw new Error('Invalid chain parameters');
    }

    // Add to supported chains
    this.supportedChains.set(chainId, {
      id: chainId,
      name: chainName,
      nativeCurrency,
      rpcUrl: rpcUrls[0],
      blockExplorer: params.blockExplorerUrls?.[0],
    });

    return null;
  }

  async #watchAsset(params: {
    type: string;
    options: {
      address: string;
      symbol?: string;
      decimals?: number;
      image?: string;
    };
  }): Promise<boolean> {
    // Delegate to the underlying wallet's implementation for proper validation
    return this.wallet.request({ method: 'wallet_watchAsset', params: [params] });
  }

  async #getCapabilities(address?: string): Promise<any> {
    // Delegate to the underlying wallet's implementation
    return this.wallet.request({ method: 'wallet_getCapabilities', params: [] });
  }

  async #requestPermissions(permissions: any): Promise<any> {
    // Handle permission requests
    if (permissions?.eth_accounts) {
      await this.#requestAccounts();
    }

    return this.#getPermissions();
  }

  #getPermissions(): any {
    const perms = [];

    if (this.permissions.has('eth_accounts')) {
      perms.push({
        parentCapability: 'eth_accounts',
        invoker: window.location.origin,
        caveats: [],
      });
    }

    return perms;
  }

  async #revokePermissions(params: any): Promise<null> {
    this.permissions.clear();
    await this.wallet.disconnect();
    return null;
  }

  async #getEncryptionPublicKey(address: string): Promise<string> {
    // This is deprecated but some dApps still use it
    console.warn('eth_getEncryptionPublicKey is deprecated');
    // Return a dummy public key for compatibility
    return '0x' + '0'.repeat(64);
  }

  async #decrypt(message: string, address: string): Promise<string> {
    // This is deprecated but some dApps still use it
    console.warn('eth_decrypt is deprecated');
    throw new Error('Decryption not supported');
  }

  #initializeSupportedChains(): void {
    // Get all supported chain IDs from the underlying wallet
    const supportedChainIds = this.wallet.getSupportedChainIds();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔧 EVMWalletStandard: Initializing ${supportedChainIds.length} supported chains:`, supportedChainIds);
    }

    // Create a reverse lookup map from chain ID to chain object
    const chainLookup = new Map<number, Chain>();
    Object.values(chains).forEach((chain: any) => {
      if (chain && typeof chain === 'object' && chain.id) {
        chainLookup.set(chain.id, chain);
      }
    });

    // Add all actually supported chains instead of hardcoded list
    supportedChainIds.forEach((hexChainId) => {
      const chainId = parseInt(hexChainId, 16);
      const chain = chainLookup.get(chainId);

      if (chain) {
        this.supportedChains.set(hexChainId, {
          id: hexChainId,
          name: chain.name,
          nativeCurrency: chain.nativeCurrency,
        });
      } else {
        // Fallback for unknown chains
        this.supportedChains.set(hexChainId, {
          id: hexChainId,
          name: `Chain ${chainId}`,
        });
      }
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ EVMWalletStandard: Registered ${this.supportedChains.size} chains`);
    }
  }

  #getDefaultIcon(): string {
    const svg = `<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1080" fill="black"/>
      <path d="M203 830.128L470.486 230H607.658L876.001 830.128H730.255L510.78 300.301H565.649L345.316 830.128H203ZM336.743 701.529L373.608 596.078H682.245L719.968 701.529H336.743Z" fill="url(#paint0_linear_436_3860)"/>
      <defs>
        <linearGradient id="paint0_linear_436_3860" x1="539.5" y1="830.128" x2="539.5" y2="230" gradientUnits="userSpaceOnUse">
          <stop stop-color="#07D102"/>
          <stop offset="1" stop-color="#046B01"/>
        </linearGradient>
      </defs>
    </svg>`;

    // Use browser-compatible base64 encoding
    if (typeof btoa !== 'undefined') {
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    } else if (typeof Buffer !== 'undefined') {
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    }

    // Fallback to URL-encoded SVG if base64 encoding is not available
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  #generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}