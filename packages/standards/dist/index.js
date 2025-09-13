var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { logger } from "@arenaentertainment/wallet-mock-shared";
var EthereumMethod = /* @__PURE__ */ ((EthereumMethod2) => {
  EthereumMethod2["ETH_REQUEST_ACCOUNTS"] = "eth_requestAccounts";
  EthereumMethod2["ETH_ACCOUNTS"] = "eth_accounts";
  EthereumMethod2["ETH_CHAIN_ID"] = "eth_chainId";
  EthereumMethod2["NET_VERSION"] = "net_version";
  EthereumMethod2["PERSONAL_SIGN"] = "personal_sign";
  EthereumMethod2["ETH_SIGN"] = "eth_sign";
  EthereumMethod2["ETH_SIGN_TYPED_DATA"] = "eth_signTypedData";
  EthereumMethod2["ETH_SIGN_TYPED_DATA_V3"] = "eth_signTypedData_v3";
  EthereumMethod2["ETH_SIGN_TYPED_DATA_V4"] = "eth_signTypedData_v4";
  EthereumMethod2["ETH_SEND_TRANSACTION"] = "eth_sendTransaction";
  EthereumMethod2["ETH_SEND_RAW_TRANSACTION"] = "eth_sendRawTransaction";
  EthereumMethod2["WALLET_SWITCH_ETHEREUM_CHAIN"] = "wallet_switchEthereumChain";
  EthereumMethod2["WALLET_ADD_ETHEREUM_CHAIN"] = "wallet_addEthereumChain";
  EthereumMethod2["WALLET_REQUEST_PERMISSIONS"] = "wallet_requestPermissions";
  EthereumMethod2["WALLET_GET_PERMISSIONS"] = "wallet_getPermissions";
  EthereumMethod2["WALLET_WATCH_ASSET"] = "wallet_watchAsset";
  return EthereumMethod2;
})(EthereumMethod || {});
var ProviderErrorCode = /* @__PURE__ */ ((ProviderErrorCode2) => {
  ProviderErrorCode2[ProviderErrorCode2["PARSE_ERROR"] = -32700] = "PARSE_ERROR";
  ProviderErrorCode2[ProviderErrorCode2["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
  ProviderErrorCode2[ProviderErrorCode2["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
  ProviderErrorCode2[ProviderErrorCode2["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
  ProviderErrorCode2[ProviderErrorCode2["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
  ProviderErrorCode2[ProviderErrorCode2["USER_REJECTED_REQUEST"] = 4001] = "USER_REJECTED_REQUEST";
  ProviderErrorCode2[ProviderErrorCode2["UNAUTHORIZED"] = 4100] = "UNAUTHORIZED";
  ProviderErrorCode2[ProviderErrorCode2["UNSUPPORTED_METHOD"] = 4200] = "UNSUPPORTED_METHOD";
  ProviderErrorCode2[ProviderErrorCode2["DISCONNECTED"] = 4900] = "DISCONNECTED";
  ProviderErrorCode2[ProviderErrorCode2["CHAIN_DISCONNECTED"] = 4901] = "CHAIN_DISCONNECTED";
  ProviderErrorCode2[ProviderErrorCode2["UNSUPPORTED_CHAIN"] = 4902] = "UNSUPPORTED_CHAIN";
  ProviderErrorCode2[ProviderErrorCode2["RESOURCE_UNAVAILABLE"] = -32002] = "RESOURCE_UNAVAILABLE";
  ProviderErrorCode2[ProviderErrorCode2["RESOURCE_NOT_FOUND"] = -32001] = "RESOURCE_NOT_FOUND";
  ProviderErrorCode2[ProviderErrorCode2["TRANSACTION_REJECTED"] = -32003] = "TRANSACTION_REJECTED";
  return ProviderErrorCode2;
})(ProviderErrorCode || {});
class MockEthereumProvider {
  constructor(initialChainId = "0x1") {
    __publicField(this, "eventListeners", {});
    __publicField(this, "_chainId");
    __publicField(this, "_accounts", []);
    __publicField(this, "_isConnected", false);
    __publicField(this, "_networkVersion");
    // Provider identification
    __publicField(this, "isMetaMask", false);
    // Set to true if mimicking MetaMask
    __publicField(this, "isMockWallet", true);
    this._chainId = initialChainId;
    this._networkVersion = parseInt(initialChainId, 16).toString();
  }
  /**
   * Get current chain ID
   */
  get chainId() {
    return this._chainId;
  }
  /**
   * Get network version
   */
  get networkVersion() {
    return this._networkVersion;
  }
  /**
   * Get selected address (first account)
   */
  get selectedAddress() {
    return this._accounts[0] || null;
  }
  /**
   * Check if provider is connected
   */
  isConnected() {
    return this._isConnected;
  }
  /**
   * Make an RPC request
   */
  async request(args) {
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
          return this.handlePersonalSign(args.params);
        case EthereumMethod.ETH_SIGN_TYPED_DATA_V4:
          return this.handleSignTypedDataV4(args.params);
        case EthereumMethod.ETH_SEND_TRANSACTION:
          return this.handleSendTransaction(args.params);
        case EthereumMethod.WALLET_SWITCH_ETHEREUM_CHAIN:
          return this.handleSwitchChain(args.params);
        case EthereumMethod.WALLET_ADD_ETHEREUM_CHAIN:
          return this.handleAddChain(args.params);
        case EthereumMethod.WALLET_WATCH_ASSET:
          return this.handleWatchAsset(args.params);
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
  on(event, listener) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = /* @__PURE__ */ new Set();
    }
    this.eventListeners[event].add(listener);
  }
  /**
   * Remove event listener
   */
  removeListener(event, listener) {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.delete(listener);
    }
  }
  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event) {
    if (event) {
      delete this.eventListeners[event];
    } else {
      this.eventListeners = {};
    }
  }
  /**
   * Remove event listener (alias for removeListener)
   */
  off(event, listener) {
    this.removeListener(event, listener);
  }
  /**
   * Add one-time event listener
   */
  once(event, listener) {
    const onceWrapper = (...args) => {
      this.removeListener(event, onceWrapper);
      listener(...args);
    };
    this.on(event, onceWrapper);
  }
  /**
   * Emit an event
   */
  emit(event, ...args) {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
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
  setAccounts(accounts) {
    const oldAccounts = [...this._accounts];
    this._accounts = accounts;
    if (JSON.stringify(oldAccounts) !== JSON.stringify(accounts)) {
      logger.info("Accounts changed", { from: oldAccounts, to: accounts });
      this.emit("accountsChanged", accounts);
    }
  }
  /**
   * Set chain ID and emit chainChanged event
   */
  setChainId(chainId) {
    const oldChainId = this._chainId;
    this._chainId = chainId;
    this._networkVersion = parseInt(chainId, 16).toString();
    if (oldChainId !== chainId) {
      logger.info("Chain changed", { from: oldChainId, to: chainId });
      this.emit("chainChanged", chainId);
    }
  }
  /**
   * Connect the provider
   */
  connect() {
    if (!this._isConnected) {
      this._isConnected = true;
      logger.info("Provider connected", { chainId: this._chainId });
      this.emit("connect", { chainId: this._chainId });
    }
  }
  /**
   * Disconnect the provider
   */
  disconnect(error) {
    if (this._isConnected) {
      this._isConnected = false;
      const disconnectError = error || this.createError(
        ProviderErrorCode.DISCONNECTED,
        "Provider disconnected"
      );
      logger.info("Provider disconnected", { error: disconnectError.message });
      this.emit("disconnect", disconnectError);
    }
  }
  // Request handlers
  async handleRequestAccounts() {
    if (!this._isConnected) {
      this.connect();
    }
    return this._accounts;
  }
  async handleAccounts() {
    return this._accounts;
  }
  async handleChainId() {
    return this._chainId;
  }
  async handleNetVersion() {
    return this._networkVersion;
  }
  async handlePersonalSign([message, address]) {
    logger.debug("Personal sign request", { message, address });
    if (!this._accounts.includes(address)) {
      throw this.createError(
        ProviderErrorCode.UNAUTHORIZED,
        `Address ${address} not found in wallet`,
        { address }
      );
    }
    const mockSignature = "0x" + "0".repeat(130);
    logger.info("Message signed", { address, message });
    return mockSignature;
  }
  async handleSignTypedDataV4([address, typedData]) {
    logger.debug("Sign typed data v4 request", { address, typedData });
    if (!this._accounts.includes(address)) {
      throw this.createError(
        ProviderErrorCode.UNAUTHORIZED,
        `Address ${address} not found in wallet`,
        { address }
      );
    }
    const mockSignature = "0x" + "1".repeat(130);
    logger.info("Typed data signed", { address });
    return mockSignature;
  }
  async handleSendTransaction([tx]) {
    logger.debug("Send transaction request", { transaction: tx });
    if (!this._accounts.includes(tx.from)) {
      throw this.createError(
        ProviderErrorCode.UNAUTHORIZED,
        `From address ${tx.from} not found in wallet`,
        { from: tx.from }
      );
    }
    const mockTxHash = "0x" + Math.random().toString(16).substr(2, 64).padStart(64, "0");
    logger.info("Transaction sent", { hash: mockTxHash, from: tx.from, to: tx.to });
    return mockTxHash;
  }
  async handleSwitchChain([{ chainId }]) {
    logger.debug("Switch chain request", { chainId });
    this.setChainId(chainId);
    logger.info("Chain switched", { chainId });
    return null;
  }
  async handleAddChain([chainConfig]) {
    logger.debug("Add chain request", { chainConfig });
    logger.info("Chain added", { chainId: chainConfig.chainId, name: chainConfig.chainName });
    return null;
  }
  async handleWatchAsset([asset]) {
    logger.debug("Watch asset request", { asset });
    logger.info("Asset watched", { address: asset.options.address, symbol: asset.options.symbol });
    return true;
  }
  async handlePermissions(method) {
    logger.debug("Permissions request", { method });
    const permissions = [
      {
        invoker: window.location.origin,
        parentCapability: "eth_accounts",
        id: Math.random().toString(36),
        date: Date.now()
      }
    ];
    return permissions;
  }
  /**
   * Create a properly formatted provider error
   */
  createError(code, message, data) {
    const error = new Error(message);
    error.code = code;
    error.data = data;
    return error;
  }
}
class EIP6963WalletAnnouncer {
  constructor(config) {
    __publicField(this, "config");
    __publicField(this, "eventTarget");
    __publicField(this, "isAnnouncing", false);
    this.config = config;
    this.eventTarget = config.eventTarget || (typeof window !== "undefined" ? window : global);
    if (config.autoRespond !== false) {
      this.startListening();
    }
  }
  /**
   * Start listening for provider requests
   */
  startListening() {
    if (this.isAnnouncing) return;
    this.isAnnouncing = true;
    this.eventTarget.addEventListener(
      "eip6963:requestProvider",
      this.handleProviderRequest.bind(this)
    );
    this.announce();
    logger.info("EIP-6963 wallet announcer started", {
      name: this.config.info.name,
      uuid: this.config.info.uuid
    });
  }
  /**
   * Stop listening for provider requests
   */
  stopListening() {
    if (!this.isAnnouncing) return;
    this.isAnnouncing = false;
    this.eventTarget.removeEventListener(
      "eip6963:requestProvider",
      this.handleProviderRequest.bind(this)
    );
    logger.info("EIP-6963 wallet announcer stopped", {
      name: this.config.info.name
    });
  }
  /**
   * Announce the wallet provider
   */
  announce() {
    const detail = {
      info: { ...this.config.info },
      provider: this.config.provider
    };
    const announceEvent = new CustomEvent("eip6963:announceProvider", {
      detail
    });
    this.eventTarget.dispatchEvent(announceEvent);
    logger.debug("EIP-6963 wallet announced", {
      name: this.config.info.name,
      uuid: this.config.info.uuid
    });
  }
  /**
   * Update provider info
   */
  updateInfo(info) {
    this.config.info = { ...this.config.info, ...info };
    if (this.isAnnouncing) {
      this.announce();
    }
    logger.info("EIP-6963 provider info updated", { info: this.config.info });
  }
  /**
   * Update the provider instance
   */
  updateProvider(provider) {
    this.config.provider = provider;
    if (this.isAnnouncing) {
      this.announce();
    }
    logger.info("EIP-6963 provider instance updated");
  }
  /**
   * Get current provider detail
   */
  getProviderDetail() {
    return {
      info: { ...this.config.info },
      provider: this.config.provider
    };
  }
  /**
   * Handle provider request events
   */
  handleProviderRequest(event) {
    logger.debug("EIP-6963 provider request received");
    this.announce();
  }
  /**
   * Cleanup resources
   */
  destroy() {
    this.stopListening();
    logger.info("EIP-6963 wallet announcer destroyed");
  }
}
function createWalletAnnouncer(info, provider, options = {}) {
  return new EIP6963WalletAnnouncer({
    info,
    provider,
    autoRespond: true,
    ...options
  });
}
function generateWalletUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
const WalletInfoTemplates = {
  mockWallet: (uuid) => ({
    uuid: uuid || generateWalletUUID(),
    name: "Mock Wallet",
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwN0FGRiIvPgo8cGF0aCBkPSJNOCAxMkgyNFYyMEg4VjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==",
    rdns: "com.arenaentertainment.wallet-mock"
  }),
  metamaskMock: (uuid) => ({
    uuid: uuid || generateWalletUUID(),
    name: "MetaMask Mock",
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGNjY1MkEiLz4KPHBhdGggZD0iTTggMTJIMjRWMjBIOFYxMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=",
    rdns: "io.metamask.mock"
  })
};
class EIP6963WalletDiscovery {
  constructor(eventTarget) {
    __publicField(this, "eventTarget");
    __publicField(this, "discoveredWallets", /* @__PURE__ */ new Map());
    __publicField(this, "isListening", false);
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    this.eventTarget = eventTarget || (typeof window !== "undefined" ? window : global);
  }
  /**
   * Start discovering wallets
   */
  startDiscovery() {
    if (this.isListening) return;
    this.isListening = true;
    this.eventTarget.addEventListener(
      "eip6963:announceProvider",
      this.handleWalletAnnouncement.bind(this)
    );
    this.requestProviders();
    logger.info("EIP-6963 wallet discovery started");
  }
  /**
   * Stop discovering wallets
   */
  stopDiscovery() {
    if (!this.isListening) return;
    this.isListening = false;
    this.eventTarget.removeEventListener(
      "eip6963:announceProvider",
      this.handleWalletAnnouncement.bind(this)
    );
    logger.info("EIP-6963 wallet discovery stopped");
  }
  /**
   * Request providers to announce themselves
   */
  requestProviders() {
    const requestEvent = new Event("eip6963:requestProvider");
    this.eventTarget.dispatchEvent(requestEvent);
    logger.debug("EIP-6963 provider request dispatched");
  }
  /**
   * Get all discovered wallets
   */
  getDiscoveredWallets() {
    return Array.from(this.discoveredWallets.values());
  }
  /**
   * Get a specific wallet by UUID
   */
  getWallet(uuid) {
    return this.discoveredWallets.get(uuid);
  }
  /**
   * Get a wallet by name
   */
  getWalletByName(name) {
    for (const wallet of this.discoveredWallets.values()) {
      if (wallet.info.name === name) {
        return wallet;
      }
    }
    return void 0;
  }
  /**
   * Get a wallet by RDNS
   */
  getWalletByRDNS(rdns) {
    for (const wallet of this.discoveredWallets.values()) {
      if (wallet.info.rdns === rdns) {
        return wallet;
      }
    }
    return void 0;
  }
  /**
   * Add a listener for wallet discoveries
   */
  onWalletsChanged(listener) {
    this.listeners.add(listener);
  }
  /**
   * Remove a wallet discovery listener
   */
  removeWalletsListener(listener) {
    this.listeners.delete(listener);
  }
  /**
   * Clear all discovered wallets
   */
  clearWallets() {
    this.discoveredWallets.clear();
    this.notifyListeners();
    logger.info("Discovered wallets cleared");
  }
  /**
   * Handle wallet announcement events
   */
  handleWalletAnnouncement(event) {
    const { detail } = event;
    const { info } = detail;
    logger.debug("Wallet announced", {
      name: info.name,
      uuid: info.uuid,
      rdns: info.rdns
    });
    const existingWallet = this.discoveredWallets.get(info.uuid);
    if (!existingWallet || JSON.stringify(existingWallet.info) !== JSON.stringify(info)) {
      this.discoveredWallets.set(info.uuid, detail);
      this.notifyListeners();
      logger.info("Wallet discovered", {
        name: info.name,
        uuid: info.uuid,
        isUpdate: !!existingWallet
      });
    }
  }
  /**
   * Notify all listeners of wallet changes
   */
  notifyListeners() {
    const wallets = this.getDiscoveredWallets();
    this.listeners.forEach((listener) => {
      try {
        listener(wallets);
      } catch (error) {
        logger.error("Error in wallet discovery listener:", error);
      }
    });
  }
  /**
   * Cleanup resources
   */
  destroy() {
    this.stopDiscovery();
    this.clearWallets();
    this.listeners.clear();
    logger.info("EIP-6963 wallet discovery destroyed");
  }
}
async function discoverWallets(timeout = 1e3, eventTarget) {
  const discovery = new EIP6963WalletDiscovery(eventTarget);
  return new Promise((resolve) => {
    let timeoutId;
    const cleanup = () => {
      discovery.destroy();
      if (timeoutId) clearTimeout(timeoutId);
    };
    discovery.startDiscovery();
    timeoutId = setTimeout(() => {
      const wallets = discovery.getDiscoveredWallets();
      cleanup();
      resolve(wallets);
    }, timeout);
    discovery.onWalletsChanged((wallets) => {
      if (wallets.length > 0) {
        cleanup();
        resolve(wallets);
      }
    });
  });
}
async function findWallet(name, timeout = 1e3, eventTarget) {
  const wallets = await discoverWallets(timeout, eventTarget);
  return wallets.find((wallet) => wallet.info.name === name) || null;
}
class MockSolanaTransaction {
  constructor(data = new Uint8Array(0)) {
    __publicField(this, "signatures", /* @__PURE__ */ new Map());
    this.data = data;
  }
  serialize() {
    return this.data;
  }
  addSignature(publicKey, signature) {
    this.signatures.set(publicKey, signature);
  }
  getSignature(publicKey) {
    return this.signatures.get(publicKey);
  }
}
const SolanaChains = {
  MAINNET: "solana:mainnet",
  TESTNET: "solana:testnet",
  DEVNET: "solana:devnet",
  LOCALNET: "solana:localnet"
};
const FeatureNames = {
  STANDARD_CONNECT: "standard:connect",
  STANDARD_DISCONNECT: "standard:disconnect",
  STANDARD_EVENTS: "standard:events",
  SOLANA_SIGN_TRANSACTION: "solana:signTransaction",
  SOLANA_SIGN_MESSAGE: "solana:signMessage",
  SOLANA_SIGN_AND_SEND_TRANSACTION: "solana:signAndSendTransaction"
};
class MockSolanaWallet {
  constructor(config = {}) {
    __publicField(this, "_accounts", []);
    __publicField(this, "_isConnected", false);
    __publicField(this, "eventListeners", {});
    __publicField(this, "_properties");
    __publicField(this, "_features");
    this._properties = {
      name: config.name || "Mock Solana Wallet",
      icon: config.icon || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM5OTQ1RkYiLz4KPHBhdGggZD0iTTggMTJIMjRWMjBIOFYxMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=",
      version: config.version || "1.0.0",
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
      "standard:connect": this.createConnectFeature(),
      "standard:disconnect": this.createDisconnectFeature(),
      "standard:events": this.createEventsFeature(),
      "solana:signTransaction": this.createSignTransactionFeature(),
      "solana:signMessage": this.createSignMessageFeature(),
      "solana:signAndSendTransaction": this.createSignAndSendTransactionFeature()
    };
  }
  get properties() {
    return { ...this._properties };
  }
  get accounts() {
    return [...this._accounts];
  }
  get features() {
    return this._features;
  }
  // Event emitter implementation
  on(event, listener) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = /* @__PURE__ */ new Set();
    }
    this.eventListeners[event].add(listener);
  }
  off(event, listener) {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.delete(listener);
    }
  }
  once(event, listener) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    this.on(event, onceWrapper);
  }
  emit(event, ...args) {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          logger.error(`Error in Solana wallet event listener for ${event}:`, error);
        }
      });
    }
  }
  removeAllListeners(event) {
    if (event) {
      delete this.eventListeners[event];
    } else {
      this.eventListeners = {};
    }
  }
  // Wallet management methods
  setAccounts(accounts) {
    const oldAccounts = [...this._accounts];
    this._accounts = accounts;
    if (JSON.stringify(oldAccounts) !== JSON.stringify(accounts)) {
      logger.info("Solana accounts changed", { from: oldAccounts.length, to: accounts.length });
      this.emit("change", { accounts });
    }
  }
  addAccount(account) {
    if (!this._accounts.find((acc) => acc.publicKey === account.publicKey)) {
      this._accounts.push(account);
      this.emit("change", { accounts: [...this.accounts] });
      logger.info("Solana account added", { publicKey: account.publicKey });
    }
  }
  removeAccount(publicKey) {
    const index = this._accounts.findIndex((acc) => acc.publicKey === publicKey);
    if (index !== -1) {
      this._accounts.splice(index, 1);
      this.emit("change", { accounts: [...this.accounts] });
      logger.info("Solana account removed", { publicKey });
    }
  }
  // Feature implementations
  createConnectFeature() {
    return {
      name: "standard:connect",
      connect: async (properties) => {
        logger.debug("Solana connect requested", { onlyIfTrusted: properties == null ? void 0 : properties.onlyIfTrusted });
        if ((properties == null ? void 0 : properties.onlyIfTrusted) && !this._isConnected) {
          throw new Error("Wallet not trusted, cannot auto-connect");
        }
        this._isConnected = true;
        if (this._accounts.length === 0) {
          const mockAccount = {
            publicKey: this.generateMockPublicKey(),
            label: "Account 1",
            chains: [SolanaChains.DEVNET],
            features: [
              FeatureNames.SOLANA_SIGN_TRANSACTION,
              FeatureNames.SOLANA_SIGN_MESSAGE
            ]
          };
          this._accounts.push(mockAccount);
        }
        logger.info("Solana wallet connected", { accountCount: this._accounts.length });
        return { accounts: [...this._accounts] };
      }
    };
  }
  createDisconnectFeature() {
    return {
      name: "standard:disconnect",
      disconnect: async () => {
        logger.debug("Solana disconnect requested");
        this._isConnected = false;
        this._accounts = [];
        this.emit("change", { accounts: [] });
        logger.info("Solana wallet disconnected");
      }
    };
  }
  createEventsFeature() {
    return {
      name: "standard:events",
      on: (event, listener, options) => {
        if (options == null ? void 0 : options.once) {
          this.once(event, listener);
        } else {
          this.on(event, listener);
        }
        return () => this.off(event, listener);
      }
    };
  }
  createSignTransactionFeature() {
    return {
      name: "solana:signTransaction",
      signTransaction: async (inputs) => {
        logger.debug("Solana sign transaction requested", { inputCount: inputs.length });
        const results = await Promise.all(
          inputs.map(async ({ account, transaction, chain }) => {
            if (!this._accounts.find((acc) => acc.publicKey === account.publicKey)) {
              throw new Error(`Account ${account.publicKey} not found`);
            }
            const mockSignature = new Uint8Array(64);
            for (let i = 0; i < 64; i++) {
              mockSignature[i] = Math.floor(Math.random() * 256);
            }
            if (transaction instanceof MockSolanaTransaction) {
              transaction.addSignature(account.publicKey, mockSignature);
            }
            logger.info("Solana transaction signed", {
              account: account.publicKey,
              chain: chain || "default"
            });
            return { signedTransaction: transaction };
          })
        );
        return results;
      }
    };
  }
  createSignMessageFeature() {
    return {
      name: "solana:signMessage",
      signMessage: async (inputs) => {
        logger.debug("Solana sign message requested", { inputCount: inputs.length });
        const results = await Promise.all(
          inputs.map(async ({ account, message }) => {
            if (!this._accounts.find((acc) => acc.publicKey === account.publicKey)) {
              throw new Error(`Account ${account.publicKey} not found`);
            }
            const signature = new Uint8Array(64);
            for (let i = 0; i < 64; i++) {
              signature[i] = Math.floor(Math.random() * 256);
            }
            logger.info("Solana message signed", {
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
  createSignAndSendTransactionFeature() {
    return {
      name: "solana:signAndSendTransaction",
      signAndSendTransaction: async (inputs) => {
        logger.debug("Solana sign and send transaction requested", { inputCount: inputs.length });
        const results = await Promise.all(
          inputs.map(async ({ account, transaction, chain, options }) => {
            if (!this._accounts.find((acc) => acc.publicKey === account.publicKey)) {
              throw new Error(`Account ${account.publicKey} not found`);
            }
            const signature = this.generateMockTransactionSignature();
            logger.info("Solana transaction signed and sent", {
              account: account.publicKey,
              chain: chain || "default",
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
  generateMockPublicKey() {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 44; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
  generateMockTransactionSignature() {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 88; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
  // Cleanup
  destroy() {
    this.removeAllListeners();
    this._accounts = [];
    this._isConnected = false;
    logger.info("Solana wallet destroyed");
  }
}
export {
  EIP6963WalletAnnouncer,
  EIP6963WalletDiscovery,
  EthereumMethod,
  FeatureNames,
  MockEthereumProvider,
  MockSolanaTransaction,
  MockSolanaWallet,
  ProviderErrorCode,
  SolanaChains,
  WalletInfoTemplates,
  createWalletAnnouncer,
  discoverWallets,
  findWallet,
  generateWalletUUID
};
//# sourceMappingURL=index.js.map
