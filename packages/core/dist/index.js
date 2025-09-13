var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { MockEthereumProvider, MockSolanaWallet } from "@arenaentertainment/wallet-mock-standards";
import { EthereumMethod, FeatureNames, MockEthereumProvider as MockEthereumProvider2, MockSolanaTransaction, MockSolanaWallet as MockSolanaWallet2, ProviderErrorCode, SolanaChains } from "@arenaentertainment/wallet-mock-standards";
import { AccountType, generateRandomHex, generateRandomBytes } from "@arenaentertainment/wallet-mock-shared";
import { CHAIN_PRESETS } from "@arenaentertainment/wallet-mock-shared";
class ProductionGuard {
  constructor(config) {
    __publicField(this, "config");
    this.config = {
      enableProductionChecks: config.enableProductionChecks,
      customProductionDetector: config.customProductionDetector || this.defaultProductionDetector.bind(this),
      allowProductionOverride: config.allowProductionOverride ?? false,
      overrideEnvVar: config.overrideEnvVar || "WALLET_MOCK_ALLOW_PRODUCTION"
    };
  }
  /**
   * Check if current environment is production and validate if wallet mock should be allowed
   */
  checkEnvironment() {
    const reasons = [];
    let isProduction = false;
    if (!this.config.enableProductionChecks) {
      return {
        isProduction: false,
        reasons: ["Production checks disabled"],
        overrideActive: false
      };
    }
    const overrideActive = this.isOverrideActive();
    if (overrideActive && this.config.allowProductionOverride) {
      return {
        isProduction: false,
        reasons: ["Production environment detected but override active"],
        overrideActive: true
      };
    }
    try {
      isProduction = this.config.customProductionDetector();
      if (isProduction) {
        reasons.push("Custom production detector flagged environment");
      }
    } catch (error) {
      reasons.push(`Error in custom production detector: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    const defaultResult = this.runDefaultChecks();
    if (defaultResult.isProduction) {
      isProduction = true;
      reasons.push(...defaultResult.reasons);
    }
    return {
      isProduction,
      reasons,
      overrideActive
    };
  }
  /**
   * Validate environment and throw if production environment detected without override
   */
  validateEnvironment() {
    const result = this.checkEnvironment();
    if (result.isProduction && !result.overrideActive) {
      const reasonsStr = result.reasons.join(", ");
      throw new Error(
        `Wallet mock detected production environment and cannot be used for security reasons. Reasons: ${reasonsStr}. To override this check (NOT RECOMMENDED), set ${this.config.overrideEnvVar}=true`
      );
    }
  }
  /**
   * Default production environment detection logic
   */
  defaultProductionDetector() {
    const checks = this.runDefaultChecks();
    return checks.isProduction;
  }
  /**
   * Run default production environment checks
   */
  runDefaultChecks() {
    var _a, _b;
    const reasons = [];
    let isProduction = false;
    if (typeof process !== "undefined" && ((_a = process.env) == null ? void 0 : _a.NODE_ENV) === "production") {
      isProduction = true;
      reasons.push("NODE_ENV is set to production");
    }
    if (typeof process !== "undefined" && process.env) {
      const prodEnvVars = [
        "VERCEL",
        "NETLIFY",
        "AWS_LAMBDA_FUNCTION_NAME",
        "HEROKU_APP_NAME",
        "RAILWAY_ENVIRONMENT",
        "RENDER"
      ];
      for (const envVar of prodEnvVars) {
        if (process.env[envVar]) {
          isProduction = true;
          reasons.push(`Production platform detected: ${envVar}`);
        }
      }
    }
    if (typeof window !== "undefined" && window.location) {
      const hostname = window.location.hostname;
      const prodPatterns = [
        /^(?!localhost)(?!127\.0\.0\.1)(?!192\.168\.)(?!10\.)(?!172\.(1[6-9]|2\d|3[01])\.).*$/,
        /\.(com|org|net|io|co|app)$/
      ];
      for (const pattern of prodPatterns) {
        if (pattern.test(hostname)) {
          isProduction = true;
          reasons.push(`Production hostname detected: ${hostname}`);
          break;
        }
      }
    }
    if (typeof window !== "undefined" && ((_b = window.location) == null ? void 0 : _b.protocol) === "https:") {
      const hostname = window.location.hostname;
      if (hostname !== "localhost" && !hostname.startsWith("192.168.") && !hostname.startsWith("10.")) {
        isProduction = true;
        reasons.push("HTTPS detected on non-local domain");
      }
    }
    return { isProduction, reasons };
  }
  /**
   * Check if production override is active
   */
  isOverrideActive() {
    var _a;
    if (!this.config.allowProductionOverride) {
      return false;
    }
    if (typeof process !== "undefined" && ((_a = process.env) == null ? void 0 : _a[this.config.overrideEnvVar]) === "true") {
      return true;
    }
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        return window.localStorage.getItem(this.config.overrideEnvVar) === "true";
      } catch {
        return false;
      }
    }
    return false;
  }
}
function createProductionGuard(config = {}) {
  return new ProductionGuard({
    enableProductionChecks: config.enableProductionChecks ?? true,
    customProductionDetector: config.customProductionDetector,
    allowProductionOverride: config.allowProductionOverride ?? false,
    overrideEnvVar: config.overrideEnvVar
  });
}
class StateManager {
  constructor(config = {}) {
    __publicField(this, "state");
    __publicField(this, "config");
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    __publicField(this, "saveTimeout");
    this.config = {
      initialState: config.initialState || {},
      enablePersistence: config.enablePersistence ?? false,
      storageKey: config.storageKey || "wallet-mock-state",
      stateValidator: config.stateValidator || this.defaultStateValidator,
      autoSaveDelay: config.autoSaveDelay ?? 500
    };
    this.state = this.createInitialState();
    if (this.config.enablePersistence) {
      this.loadPersistedState();
    }
  }
  /**
   * Get current wallet state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Update wallet state
   */
  updateState(updates) {
    const newState = { ...this.state, ...updates };
    if (!this.config.stateValidator(newState)) {
      throw new Error("Invalid state update");
    }
    this.state;
    this.state = newState;
    this.notifyListeners(this.state);
    if (this.config.enablePersistence) {
      this.schedulePersistence();
    }
  }
  /**
   * Update specific state property
   */
  updateStateProperty(key, value) {
    this.updateState({ [key]: value });
  }
  /**
   * Reset state to initial values
   */
  resetState() {
    this.state = this.createInitialState();
    this.notifyListeners(this.state);
    if (this.config.enablePersistence) {
      this.clearPersistedState();
    }
  }
  /**
   * Add state change listener
   */
  addStateChangeListener(handler) {
    this.listeners.add(handler);
  }
  /**
   * Remove state change listener
   */
  removeStateChangeListener(handler) {
    this.listeners.delete(handler);
  }
  /**
   * Remove all state change listeners
   */
  removeAllStateChangeListeners() {
    this.listeners.clear();
  }
  /**
   * Account management methods
   */
  addAccount(account) {
    const accounts = [...this.state.accounts, account];
    const activeAccountIndex = this.state.accounts.length === 0 ? 0 : this.state.activeAccountIndex;
    const activeAccount = activeAccountIndex === accounts.length - 1 ? account : this.state.activeAccount;
    this.updateState({
      accounts,
      activeAccountIndex,
      activeAccount
    });
  }
  removeAccount(accountId) {
    const accountIndex = this.state.accounts.findIndex((account) => account.id === accountId);
    if (accountIndex === -1) {
      throw new Error(`Account with id ${accountId} not found`);
    }
    const accounts = this.state.accounts.filter((account) => account.id !== accountId);
    let activeAccountIndex = this.state.activeAccountIndex;
    let activeAccount = this.state.activeAccount;
    if (accountIndex === this.state.activeAccountIndex) {
      if (accounts.length === 0) {
        activeAccountIndex = 0;
        activeAccount = null;
      } else {
        activeAccountIndex = Math.min(activeAccountIndex, accounts.length - 1);
        activeAccount = accounts[activeAccountIndex];
      }
    } else if (accountIndex < this.state.activeAccountIndex) {
      activeAccountIndex = this.state.activeAccountIndex - 1;
    }
    this.updateState({
      accounts,
      activeAccountIndex,
      activeAccount
    });
  }
  switchAccount(accountIndex) {
    if (accountIndex < 0 || accountIndex >= this.state.accounts.length) {
      throw new Error(`Invalid account index: ${accountIndex}`);
    }
    const activeAccount = this.state.accounts[accountIndex];
    this.updateState({
      activeAccountIndex: accountIndex,
      activeAccount
    });
  }
  /**
   * Chain management methods
   */
  addChain(chain) {
    const chains = {
      ...this.state.chains,
      [chain.id]: chain
    };
    const updates = { chains };
    if (chain.type === "evm" && !this.state.activeChains.evm) {
      updates.activeChains = {
        ...this.state.activeChains,
        evm: chain
      };
    } else if (chain.type === "solana" && !this.state.activeChains.solana) {
      updates.activeChains = {
        ...this.state.activeChains,
        solana: chain
      };
    }
    this.updateState(updates);
  }
  removeChain(chainId) {
    var _a, _b;
    const { [chainId]: removedChain, ...chains } = this.state.chains;
    if (!removedChain) {
      throw new Error(`Chain with id ${chainId} not found`);
    }
    const updates = { chains };
    if (((_a = this.state.activeChains.evm) == null ? void 0 : _a.id) === chainId) {
      const alternativeChain = Object.values(chains).find((chain) => chain.type === "evm");
      updates.activeChains = {
        ...this.state.activeChains,
        evm: alternativeChain
      };
    }
    if (((_b = this.state.activeChains.solana) == null ? void 0 : _b.id) === chainId) {
      const alternativeChain = Object.values(chains).find((chain) => chain.type === "solana");
      updates.activeChains = {
        ...this.state.activeChains,
        solana: alternativeChain
      };
    }
    this.updateState(updates);
  }
  switchChain(chainId) {
    const chain = this.state.chains[chainId];
    if (!chain) {
      throw new Error(`Chain with id ${chainId} not found`);
    }
    const activeChains = {
      ...this.state.activeChains,
      [chain.type]: chain
    };
    this.updateState({ activeChains });
  }
  /**
   * Connection state management
   */
  setConnected(isConnected) {
    this.updateState({ isConnected });
  }
  setLocked(isLocked) {
    this.updateState({ isLocked });
  }
  setInitialized(isInitialized) {
    this.updateState({ isInitialized });
  }
  /**
   * Clean up resources
   */
  destroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.removeAllStateChangeListeners();
    if (this.config.enablePersistence) {
      this.clearPersistedState();
    }
  }
  /**
   * Create initial state
   */
  createInitialState() {
    const defaultState = {
      accounts: [],
      activeAccountIndex: 0,
      activeAccount: null,
      chains: {},
      activeChains: {},
      isConnected: false,
      isLocked: false,
      isInitialized: false
    };
    return {
      ...defaultState,
      ...this.config.initialState
    };
  }
  /**
   * Default state validator
   */
  defaultStateValidator(state) {
    var _a;
    try {
      if (typeof state.accounts === "undefined" || typeof state.activeAccountIndex !== "number" || typeof state.chains === "undefined" || typeof state.activeChains === "undefined" || typeof state.isConnected !== "boolean" || typeof state.isLocked !== "boolean" || typeof state.isInitialized !== "boolean") {
        return false;
      }
      if (!Array.isArray(state.accounts)) {
        return false;
      }
      if (state.activeAccountIndex < 0 || state.accounts.length > 0 && state.activeAccountIndex >= state.accounts.length) {
        return false;
      }
      if (state.accounts.length === 0 && state.activeAccount !== null) {
        return false;
      }
      if (state.accounts.length > 0) {
        const expectedActiveAccount = state.accounts[state.activeAccountIndex];
        if (((_a = state.activeAccount) == null ? void 0 : _a.id) !== (expectedActiveAccount == null ? void 0 : expectedActiveAccount.id)) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Notify all state change listeners
   */
  notifyListeners(state) {
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (error) {
        console.error("Error in state change listener:", error);
      }
    }
  }
  /**
   * Load persisted state from storage
   */
  loadPersistedState() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const persistedState = localStorage.getItem(this.config.storageKey);
        if (persistedState) {
          const parsedState = JSON.parse(persistedState);
          if (this.config.stateValidator(parsedState)) {
            this.state = parsedState;
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load persisted state:", error);
    }
  }
  /**
   * Schedule state persistence
   */
  schedulePersistence() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persistState();
    }, this.config.autoSaveDelay);
  }
  /**
   * Persist current state to storage
   */
  persistState() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.state));
      }
    } catch (error) {
      console.warn("Failed to persist state:", error);
    }
  }
  /**
   * Clear persisted state from storage
   */
  clearPersistedState() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(this.config.storageKey);
      }
    } catch (error) {
      console.warn("Failed to clear persisted state:", error);
    }
  }
}
class AccountManager {
  constructor(config = {}, eventEmitter) {
    __publicField(this, "accounts", /* @__PURE__ */ new Map());
    __publicField(this, "config");
    __publicField(this, "eventEmitter");
    this.config = {
      maxAccounts: config.maxAccounts ?? 10,
      enableKeyGeneration: config.enableKeyGeneration ?? true,
      defaultNamePrefix: config.defaultNamePrefix || "Account",
      accountIdGenerator: config.accountIdGenerator || this.defaultAccountIdGenerator
    };
    this.eventEmitter = eventEmitter;
  }
  /**
   * Create a new account
   */
  async createAccount(accountConfig) {
    var _a;
    if (this.accounts.size >= this.config.maxAccounts) {
      throw new Error(`Maximum number of accounts reached: ${this.config.maxAccounts}`);
    }
    this.validateAccountConfig(accountConfig);
    const accountId = this.config.accountIdGenerator();
    if (this.accounts.has(accountId)) {
      throw new Error(`Account ID already exists: ${accountId}`);
    }
    const accountName = accountConfig.name || `${this.config.defaultNamePrefix} ${this.accounts.size + 1}`;
    const generatedKeys = {};
    let account;
    switch (accountConfig.type) {
      case AccountType.EVM_ONLY:
        account = await this.createEVMAccount(accountId, accountName, accountConfig, generatedKeys);
        break;
      case AccountType.SOLANA_ONLY:
        account = await this.createSolanaAccount(accountId, accountName, accountConfig, generatedKeys);
        break;
      case AccountType.DUAL_CHAIN:
        account = await this.createDualChainAccount(accountId, accountName, accountConfig, generatedKeys);
        break;
      default:
        throw new Error(`Unsupported account type: ${accountConfig.type}`);
    }
    this.accounts.set(accountId, account);
    (_a = this.eventEmitter) == null ? void 0 : _a.emit("accountAdded", account);
    return {
      account,
      generatedKeys: Object.keys(generatedKeys).length > 0 ? generatedKeys : void 0
    };
  }
  /**
   * Remove an account
   */
  async removeAccount(accountId) {
    var _a;
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }
    this.accounts.delete(accountId);
    this.clearAccountData(account);
    (_a = this.eventEmitter) == null ? void 0 : _a.emit("accountRemoved", accountId);
  }
  /**
   * Get account by ID
   */
  getAccount(accountId) {
    return this.accounts.get(accountId) || null;
  }
  /**
   * Get all accounts
   */
  getAllAccounts() {
    return Array.from(this.accounts.values());
  }
  /**
   * Get accounts by type
   */
  getAccountsByType(type) {
    return this.getAllAccounts().filter((account) => account.type === type);
  }
  /**
   * Get accounts supporting specific chain type
   */
  getAccountsByChainType(chainType) {
    return this.getAllAccounts().filter((account) => {
      if (chainType === "evm") {
        return account.type === AccountType.EVM_ONLY || account.type === AccountType.DUAL_CHAIN;
      } else {
        return account.type === AccountType.SOLANA_ONLY || account.type === AccountType.DUAL_CHAIN;
      }
    });
  }
  /**
   * Update account metadata
   */
  async updateAccount(accountId, updates) {
    var _a;
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }
    const updatedAccount = {
      ...account,
      ...updates
    };
    this.accounts.set(accountId, updatedAccount);
    (_a = this.eventEmitter) == null ? void 0 : _a.emit("accountUpdated", updatedAccount);
    return updatedAccount;
  }
  /**
   * Check if account exists
   */
  hasAccount(accountId) {
    return this.accounts.has(accountId);
  }
  /**
   * Get account count
   */
  getAccountCount() {
    return this.accounts.size;
  }
  /**
   * Get EVM address for account
   */
  getEVMAddress(accountId) {
    const account = this.accounts.get(accountId);
    if (!account) {
      return null;
    }
    if (account.type === AccountType.EVM_ONLY || account.type === AccountType.DUAL_CHAIN) {
      return account.evm.address;
    }
    return null;
  }
  /**
   * Get Solana public key for account
   */
  getSolanaPublicKey(accountId) {
    const account = this.accounts.get(accountId);
    if (!account) {
      return null;
    }
    if (account.type === AccountType.SOLANA_ONLY || account.type === AccountType.DUAL_CHAIN) {
      return account.solana.publicKey;
    }
    return null;
  }
  /**
   * Clear all accounts and sensitive data
   */
  async clearAllAccounts() {
    for (const account of this.accounts.values()) {
      this.clearAccountData(account);
    }
    this.accounts.clear();
  }
  /**
   * Create EVM-only account
   */
  async createEVMAccount(accountId, accountName, config, generatedKeys) {
    if (!config.evm) {
      throw new Error("EVM configuration required for EVM account");
    }
    let privateKey = config.evm.privateKey || "";
    if (!privateKey) {
      if (!this.config.enableKeyGeneration) {
        throw new Error("Key generation is disabled and no private key provided");
      }
      privateKey = generateRandomHex(32);
      generatedKeys.evm = privateKey;
    }
    const address = this.deriveEVMAddress(privateKey);
    return {
      id: accountId,
      name: accountName,
      type: AccountType.EVM_ONLY,
      isActive: false,
      createdAt: Date.now(),
      evm: {
        privateKey,
        address,
        chainIds: config.evm.chainIds
      }
    };
  }
  /**
   * Create Solana-only account
   */
  async createSolanaAccount(accountId, accountName, config, generatedKeys) {
    if (!config.solana) {
      throw new Error("Solana configuration required for Solana account");
    }
    let secretKey = config.solana.secretKey;
    if (!secretKey) {
      if (!this.config.enableKeyGeneration) {
        throw new Error("Key generation is disabled and no secret key provided");
      }
      secretKey = generateRandomBytes(64);
      generatedKeys.solana = secretKey;
    }
    const finalSecretKey = secretKey;
    const publicKey = this.deriveSolanaPublicKey(finalSecretKey);
    return {
      id: accountId,
      name: accountName,
      type: AccountType.SOLANA_ONLY,
      isActive: false,
      createdAt: Date.now(),
      solana: {
        secretKey: finalSecretKey,
        publicKey,
        clusters: config.solana.clusters
      }
    };
  }
  /**
   * Create dual-chain account
   */
  async createDualChainAccount(accountId, accountName, config, generatedKeys) {
    if (!config.evm || !config.solana) {
      throw new Error("Both EVM and Solana configurations required for dual-chain account");
    }
    let evmPrivateKey = config.evm.privateKey || "";
    let solanaSecretKey = config.solana.secretKey;
    if (!evmPrivateKey) {
      if (!this.config.enableKeyGeneration) {
        throw new Error("Key generation is disabled and no EVM private key provided");
      }
      evmPrivateKey = generateRandomHex(32);
      generatedKeys.evm = evmPrivateKey;
    }
    if (!solanaSecretKey) {
      if (!this.config.enableKeyGeneration) {
        throw new Error("Key generation is disabled and no Solana secret key provided");
      }
      solanaSecretKey = generateRandomBytes(64);
      generatedKeys.solana = solanaSecretKey;
    }
    const finalSolanaSecretKey = solanaSecretKey;
    const evmAddress = this.deriveEVMAddress(evmPrivateKey);
    const solanaPublicKey = this.deriveSolanaPublicKey(finalSolanaSecretKey);
    return {
      id: accountId,
      name: accountName,
      type: AccountType.DUAL_CHAIN,
      isActive: false,
      createdAt: Date.now(),
      evm: {
        privateKey: evmPrivateKey,
        address: evmAddress,
        chainIds: config.evm.chainIds
      },
      solana: {
        secretKey: finalSolanaSecretKey,
        publicKey: solanaPublicKey,
        clusters: config.solana.clusters
      }
    };
  }
  /**
   * Validate account configuration
   */
  validateAccountConfig(config) {
    if (!Object.values(AccountType).includes(config.type)) {
      throw new Error(`Invalid account type: ${config.type}`);
    }
    switch (config.type) {
      case AccountType.EVM_ONLY:
        if (!config.evm) {
          throw new Error("EVM configuration required for EVM account");
        }
        if (!config.evm.chainIds || config.evm.chainIds.length === 0) {
          throw new Error("At least one chain ID required for EVM account");
        }
        break;
      case AccountType.SOLANA_ONLY:
        if (!config.solana) {
          throw new Error("Solana configuration required for Solana account");
        }
        if (!config.solana.clusters || config.solana.clusters.length === 0) {
          throw new Error("At least one cluster required for Solana account");
        }
        break;
      case AccountType.DUAL_CHAIN:
        if (!config.evm || !config.solana) {
          throw new Error("Both EVM and Solana configurations required for dual-chain account");
        }
        if (!config.evm.chainIds || config.evm.chainIds.length === 0) {
          throw new Error("At least one chain ID required for dual-chain account");
        }
        if (!config.solana.clusters || config.solana.clusters.length === 0) {
          throw new Error("At least one cluster required for dual-chain account");
        }
        break;
    }
  }
  /**
   * Clear sensitive account data
   */
  clearAccountData(account) {
    try {
      if (account.type === AccountType.EVM_ONLY || account.type === AccountType.DUAL_CHAIN) {
        if (account.evm.privateKey) {
          account.evm.privateKey = "0".repeat(account.evm.privateKey.length);
        }
      }
      if (account.type === AccountType.SOLANA_ONLY || account.type === AccountType.DUAL_CHAIN) {
        if (account.solana.secretKey) {
          account.solana.secretKey.fill(0);
        }
      }
    } catch (error) {
      console.warn("Error clearing account data:", error);
    }
  }
  /**
   * Generate default account ID
   */
  defaultAccountIdGenerator() {
    return `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Derive EVM address from private key (simplified implementation)
   */
  deriveEVMAddress(privateKey) {
    const hash = this.simpleHash(privateKey);
    return `0x${hash.slice(0, 40)}`;
  }
  /**
   * Derive Solana public key from secret key (simplified implementation)
   */
  deriveSolanaPublicKey(secretKey) {
    const hash = this.simpleHash(Array.from(secretKey).map((b) => b.toString(16).padStart(2, "0")).join(""));
    return hash.slice(0, 44);
  }
  /**
   * Simple hash function for mock key derivation
   */
  simpleHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, "0");
  }
}
class WalletEventEmitter {
  constructor() {
    __publicField(this, "listeners", /* @__PURE__ */ new Map());
  }
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(listener);
  }
  off(event, listener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
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
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${String(event)}:`, error);
          this.emit("error", error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  }
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
class UnifiedWallet {
  constructor(config = {}) {
    __publicField(this, "eventEmitter");
    __publicField(this, "productionGuard");
    __publicField(this, "stateManager");
    __publicField(this, "accountManager");
    __publicField(this, "ethereumProvider");
    __publicField(this, "solanaWallet");
    __publicField(this, "config");
    __publicField(this, "isDestroyed", false);
    var _a, _b;
    this.config = config;
    this.eventEmitter = new WalletEventEmitter();
    this.productionGuard = new ProductionGuard({
      enableProductionChecks: ((_a = config.security) == null ? void 0 : _a.enableProductionChecks) ?? true,
      allowProductionOverride: false,
      // Never allow production override for security
      overrideEnvVar: "WALLET_MOCK_ALLOW_PRODUCTION"
    });
    this.productionGuard.validateEnvironment();
    this.stateManager = new StateManager({
      enablePersistence: false,
      // Disable persistence for security
      stateValidator: this.validateWalletState.bind(this)
    });
    this.accountManager = new AccountManager({
      maxAccounts: 10,
      enableKeyGeneration: true,
      defaultNamePrefix: "Account"
    }, this.eventEmitter);
    this.stateManager.addStateChangeListener(this.handleStateChange.bind(this));
    if (((_b = config.security) == null ? void 0 : _b.autoCleanup) !== false && typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.handlePageUnload.bind(this));
      window.addEventListener("unload", this.handlePageUnload.bind(this));
    }
    this.initialize();
  }
  // Event emitter implementation
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }
  off(event, listener) {
    this.eventEmitter.off(event, listener);
  }
  once(event, listener) {
    this.eventEmitter.once(event, listener);
  }
  emit(event, ...args) {
    this.eventEmitter.emit(event, ...args);
  }
  removeAllListeners(event) {
    this.eventEmitter.removeAllListeners(event);
  }
  // State management
  getState() {
    this.ensureNotDestroyed();
    return this.stateManager.getState();
  }
  isConnected() {
    this.ensureNotDestroyed();
    return this.stateManager.getState().isConnected;
  }
  isLocked() {
    this.ensureNotDestroyed();
    return this.stateManager.getState().isLocked;
  }
  // Account management
  async addAccount(config) {
    this.ensureNotDestroyed();
    try {
      const result = await this.accountManager.createAccount(config);
      this.stateManager.addAccount(result.account);
      await this.updateProviderAccounts();
      return result.account.id;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit("error", err);
      throw err;
    }
  }
  async removeAccount(accountId) {
    this.ensureNotDestroyed();
    try {
      await this.accountManager.removeAccount(accountId);
      this.stateManager.removeAccount(accountId);
      await this.updateProviderAccounts();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit("error", err);
      throw err;
    }
  }
  async switchAccount(accountIndex) {
    this.ensureNotDestroyed();
    try {
      this.stateManager.switchAccount(accountIndex);
      await this.updateProviderAccounts();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit("error", err);
      throw err;
    }
  }
  getAccounts() {
    this.ensureNotDestroyed();
    return this.stateManager.getState().accounts;
  }
  getActiveAccount() {
    this.ensureNotDestroyed();
    return this.stateManager.getState().activeAccount;
  }
  // Chain management
  async addChain(chain) {
    this.ensureNotDestroyed();
    try {
      this.stateManager.addChain(chain);
      if (chain.type === "evm") {
        await this.initializeEthereumProvider();
      } else if (chain.type === "solana") {
        await this.initializeSolanaWallet();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit("error", err);
      throw err;
    }
  }
  async switchChain(chainId) {
    this.ensureNotDestroyed();
    try {
      this.stateManager.switchChain(chainId);
      const chain = this.stateManager.getState().chains[chainId];
      if (chain) {
        this.eventEmitter.emit("chainChanged", chain);
        if (chain.type === "evm" && this.ethereumProvider) {
          await this.updateEthereumProviderChain(chain);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit("error", err);
      throw err;
    }
  }
  getChains() {
    this.ensureNotDestroyed();
    return this.stateManager.getState().chains;
  }
  getActiveChain(type) {
    this.ensureNotDestroyed();
    const state = this.stateManager.getState();
    return state.activeChains[type] || null;
  }
  // Connection management
  async connect() {
    this.ensureNotDestroyed();
    try {
      if (this.getAccounts().length === 0) {
        throw new Error("No accounts available. Add an account before connecting.");
      }
      await this.initializeProviders();
      this.stateManager.setConnected(true);
      this.eventEmitter.emit("connect");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit("error", err);
      throw err;
    }
  }
  async disconnect() {
    this.ensureNotDestroyed();
    try {
      if (this.ethereumProvider) {
        this.ethereumProvider = void 0;
      }
      if (this.solanaWallet) {
        try {
          const disconnectFeature = this.solanaWallet.features["standard:disconnect"];
          if (disconnectFeature && "disconnect" in disconnectFeature) {
            await disconnectFeature.disconnect();
          }
        } catch {
        }
        this.solanaWallet = void 0;
      }
      this.stateManager.setConnected(false);
      this.eventEmitter.emit("disconnect");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit("error", err);
      throw err;
    }
  }
  async lock() {
    this.ensureNotDestroyed();
    try {
      await this.disconnect();
      this.stateManager.setLocked(true);
      this.eventEmitter.emit("lock");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit("error", err);
      throw err;
    }
  }
  async unlock() {
    this.ensureNotDestroyed();
    try {
      this.stateManager.setLocked(false);
      this.eventEmitter.emit("unlock");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit("error", err);
      throw err;
    }
  }
  // Cleanup
  async destroy() {
    if (this.isDestroyed) {
      return;
    }
    try {
      await this.disconnect();
      await this.accountManager.clearAllAccounts();
      this.stateManager.destroy();
      this.eventEmitter.removeAllListeners();
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", this.handlePageUnload.bind(this));
        window.removeEventListener("unload", this.handlePageUnload.bind(this));
      }
      this.isDestroyed = true;
    } catch (error) {
      console.error("Error during wallet destruction:", error);
    }
  }
  // Provider access methods
  getEthereumProvider() {
    this.ensureNotDestroyed();
    return this.ethereumProvider || null;
  }
  getSolanaWallet() {
    this.ensureNotDestroyed();
    return this.solanaWallet || null;
  }
  // Private methods
  initialize() {
    try {
      if (this.config.accounts) {
        Promise.all(
          this.config.accounts.map((accountConfig) => this.addAccount(accountConfig))
        ).catch((error) => {
          this.eventEmitter.emit("error", error);
        });
      }
      if (typeof this.config.defaultAccountIndex === "number") {
        this.stateManager.updateStateProperty("activeAccountIndex", this.config.defaultAccountIndex);
      }
      this.stateManager.setInitialized(true);
      if (this.config.autoConnect) {
        this.connect().catch((error) => {
          this.eventEmitter.emit("error", error);
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit("error", err);
    }
  }
  async initializeProviders() {
    const state = this.stateManager.getState();
    if (state.activeChains.evm) {
      await this.initializeEthereumProvider();
    }
    if (state.activeChains.solana) {
      await this.initializeSolanaWallet();
    }
  }
  async initializeEthereumProvider() {
    if (!this.ethereumProvider) {
      const evmAccounts = this.accountManager.getAccountsByChainType("evm");
      const activeChain = this.getActiveChain("evm");
      if (evmAccounts.length > 0 && activeChain && activeChain.type === "evm") {
        this.ethereumProvider = new MockEthereumProvider(activeChain.chainIdHex);
        const addresses = evmAccounts.map(
          (account) => account.type === "evm_only" || account.type === "dual_chain" ? account.evm.address : ""
        ).filter(Boolean);
        this.ethereumProvider._accounts = addresses;
      }
    }
  }
  async initializeSolanaWallet() {
    if (!this.solanaWallet) {
      const solanaAccounts = this.accountManager.getAccountsByChainType("solana");
      const activeChain = this.getActiveChain("solana");
      if (solanaAccounts.length > 0 && activeChain && activeChain.type === "solana") {
        this.solanaWallet = new MockSolanaWallet({
          name: "Mock Wallet",
          chains: [activeChain.cluster]
        });
        for (const account of solanaAccounts) {
          if (account.type === "solana_only" || account.type === "dual_chain") {
            const walletAccount = {
              publicKey: account.solana.publicKey,
              label: account.name || "Account",
              chains: [activeChain.cluster],
              features: ["solana:signTransaction", "solana:signMessage"]
            };
            this.solanaWallet.addAccount(walletAccount);
          }
        }
      }
    }
  }
  async updateProviderAccounts() {
    if (this.ethereumProvider) {
      const evmAccounts = this.accountManager.getAccountsByChainType("evm");
      evmAccounts.map(
        (account) => account.type === "evm_only" || account.type === "dual_chain" ? account.evm.address : ""
      ).filter(Boolean);
    }
    if (this.solanaWallet) ;
  }
  async updateEthereumProviderChain(chain) {
    if (this.ethereumProvider && chain.type === "evm") ;
  }
  handleStateChange(state) {
    this.eventEmitter.emit("stateChanged", state);
  }
  handlePageUnload() {
    this.destroy().catch(console.error);
  }
  validateWalletState(state) {
    try {
      return Array.isArray(state.accounts) && typeof state.activeAccountIndex === "number" && typeof state.chains === "object" && typeof state.activeChains === "object" && typeof state.isConnected === "boolean" && typeof state.isLocked === "boolean" && typeof state.isInitialized === "boolean";
    } catch {
      return false;
    }
  }
  ensureNotDestroyed() {
    if (this.isDestroyed) {
      throw new Error("Wallet has been destroyed");
    }
  }
}
class WalletConfigBuilder {
  constructor() {
    __publicField(this, "config", {});
  }
  /**
   * Set initial accounts
   */
  withAccounts(accounts) {
    this.config.accounts = accounts;
    return this;
  }
  /**
   * Add a single account
   */
  withAccount(account) {
    if (!this.config.accounts) {
      this.config.accounts = [];
    }
    this.config.accounts.push(account);
    return this;
  }
  /**
   * Add EVM-only account
   */
  withEVMAccount(name, chainIds = ["1", "137"]) {
    return this.withAccount({
      type: AccountType.EVM_ONLY,
      name,
      evm: { chainIds }
    });
  }
  /**
   * Add Solana-only account
   */
  withSolanaAccount(name, clusters = ["mainnet-beta", "devnet"]) {
    return this.withAccount({
      type: AccountType.SOLANA_ONLY,
      name,
      solana: { clusters }
    });
  }
  /**
   * Add dual-chain account
   */
  withDualChainAccount(name, chainIds = ["1", "137"], clusters = ["mainnet-beta", "devnet"]) {
    return this.withAccount({
      type: AccountType.DUAL_CHAIN,
      name,
      evm: { chainIds },
      solana: { clusters }
    });
  }
  /**
   * Set default active account index
   */
  withDefaultAccountIndex(index) {
    this.config.defaultAccountIndex = index;
    return this;
  }
  /**
   * Enable auto-connect
   */
  withAutoConnect(autoConnect = true) {
    this.config.autoConnect = autoConnect;
    return this;
  }
  /**
   * Configure security settings
   */
  withSecurity(security) {
    this.config.security = { ...this.config.security, ...security };
    return this;
  }
  /**
   * Enable production checks
   */
  withProductionChecks(enabled = true) {
    if (!this.config.security) {
      this.config.security = {};
    }
    this.config.security.enableProductionChecks = enabled;
    return this;
  }
  /**
   * Configure debug settings
   */
  withDebug(debug) {
    this.config.debug = { ...this.config.debug, ...debug };
    return this;
  }
  /**
   * Enable debug logging
   */
  withDebugLogging(enabled = true, logLevel = "debug") {
    if (!this.config.debug) {
      this.config.debug = {};
    }
    this.config.debug.enableLogging = enabled;
    this.config.debug.logLevel = logLevel;
    return this;
  }
  /**
   * Build the wallet configuration
   */
  build() {
    return { ...this.config };
  }
}
class MockWalletFactory {
  /**
   * Create a wallet with the given configuration
   */
  async create(config) {
    try {
      const wallet = new UnifiedWallet(config);
      return wallet;
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Create a wallet from configuration (alias for create)
   */
  async createFromConfig(config) {
    return this.create(config);
  }
  /**
   * Create a wallet using a builder pattern
   */
  async createWithBuilder(builderFn) {
    const builder = new WalletConfigBuilder();
    const config = builderFn(builder).build();
    return this.create(config);
  }
  /**
   * Create a wallet from a preset configuration
   */
  async createFromPreset(presetName) {
    const preset = WALLET_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Unknown wallet preset: ${presetName}`);
    }
    return this.create(preset.config);
  }
  /**
   * Create a minimal EVM-only wallet
   */
  async createEVMWallet(config = {}) {
    const walletConfig = {
      accounts: [{
        type: AccountType.EVM_ONLY,
        name: config.accountName,
        evm: {
          chainIds: config.chainIds || ["1", "137"]
          // Ethereum and Polygon by default
        }
      }],
      autoConnect: config.autoConnect ?? false,
      security: {
        enableProductionChecks: true
      }
    };
    return this.create(walletConfig);
  }
  /**
   * Create a minimal Solana-only wallet
   */
  async createSolanaWallet(config = {}) {
    const walletConfig = {
      accounts: [{
        type: AccountType.SOLANA_ONLY,
        name: config.accountName,
        solana: {
          clusters: config.clusters || ["mainnet-beta", "devnet"]
        }
      }],
      autoConnect: config.autoConnect ?? false,
      security: {
        enableProductionChecks: true
      }
    };
    return this.create(walletConfig);
  }
  /**
   * Create a multi-chain wallet supporting both EVM and Solana
   */
  async createMultiChainWallet(config = {}) {
    const walletConfig = {
      accounts: [{
        type: AccountType.DUAL_CHAIN,
        name: config.accountName,
        evm: {
          chainIds: config.evmChainIds || ["1", "137"]
        },
        solana: {
          clusters: config.solanaClusters || ["mainnet-beta", "devnet"]
        }
      }],
      autoConnect: config.autoConnect ?? false,
      security: {
        enableProductionChecks: true
      }
    };
    return this.create(walletConfig);
  }
  /**
   * Create a development wallet with relaxed security
   */
  async createDevWallet(config = {}) {
    const walletConfig = {
      accounts: config.accounts || [
        {
          type: AccountType.DUAL_CHAIN,
          name: "Development Account",
          evm: { chainIds: ["31337", "1337"] },
          // Local development chains
          solana: { clusters: ["devnet", "localnet"] }
        }
      ],
      autoConnect: config.autoConnect ?? true,
      security: {
        enableProductionChecks: true,
        // Keep production checks even in dev
        enableSecureMemory: false,
        autoCleanup: true
      },
      debug: {
        enableLogging: config.enableLogging ?? true,
        logLevel: "debug"
      }
    };
    return this.create(walletConfig);
  }
  /**
   * Get configuration builder
   */
  configBuilder() {
    return new WalletConfigBuilder();
  }
  /**
   * Get available presets
   */
  getPresets() {
    return WALLET_PRESETS;
  }
}
const WALLET_PRESETS = {
  minimal: {
    name: "Minimal Wallet",
    description: "Basic wallet with single EVM account",
    config: {
      accounts: [{
        type: AccountType.EVM_ONLY,
        name: "Main Account",
        evm: { chainIds: ["1"] }
      }],
      autoConnect: false
    }
  },
  development: {
    name: "Development Wallet",
    description: "Full-featured wallet for development with debug logging",
    config: {
      accounts: [
        {
          type: AccountType.DUAL_CHAIN,
          name: "Development Account 1",
          evm: { chainIds: ["31337", "1337", "1", "137"] },
          solana: { clusters: ["devnet", "localnet"] }
        },
        {
          type: AccountType.EVM_ONLY,
          name: "EVM Test Account",
          evm: { chainIds: ["31337", "1337"] }
        }
      ],
      autoConnect: true,
      security: {
        enableProductionChecks: true,
        autoCleanup: true
      },
      debug: {
        enableLogging: true,
        logLevel: "debug"
      }
    }
  },
  multiChain: {
    name: "Multi-Chain Wallet",
    description: "Production-ready wallet supporting both EVM and Solana",
    config: {
      accounts: [{
        type: AccountType.DUAL_CHAIN,
        name: "Multi-Chain Account",
        evm: { chainIds: ["1", "137", "42161", "10"] },
        // Ethereum, Polygon, Arbitrum, Optimism
        solana: { clusters: ["mainnet-beta", "devnet"] }
      }],
      autoConnect: false,
      security: {
        enableProductionChecks: true,
        enableSecureMemory: true,
        autoCleanup: true
      }
    }
  },
  testing: {
    name: "Testing Wallet",
    description: "Wallet configured for automated testing",
    config: {
      accounts: [
        {
          type: AccountType.EVM_ONLY,
          name: "Test Account EVM",
          evm: { chainIds: ["31337"] }
        },
        {
          type: AccountType.SOLANA_ONLY,
          name: "Test Account Solana",
          solana: { clusters: ["devnet"] }
        },
        {
          type: AccountType.DUAL_CHAIN,
          name: "Test Account Dual",
          evm: { chainIds: ["31337"] },
          solana: { clusters: ["devnet"] }
        }
      ],
      autoConnect: false,
      security: {
        enableProductionChecks: false,
        // Disable for testing
        autoCleanup: false
      },
      debug: {
        enableLogging: false
        // Reduce noise in tests
      }
    }
  }
};
const walletFactory = new MockWalletFactory();
const createWallet = walletFactory.create.bind(walletFactory);
const createEVMWallet = walletFactory.createEVMWallet.bind(walletFactory);
const createSolanaWallet = walletFactory.createSolanaWallet.bind(walletFactory);
const createMultiChainWallet = walletFactory.createMultiChainWallet.bind(walletFactory);
const createDevWallet = walletFactory.createDevWallet.bind(walletFactory);
const createWalletFromPreset = walletFactory.createFromPreset.bind(walletFactory);
export {
  AccountManager,
  CHAIN_PRESETS,
  EthereumMethod,
  FeatureNames,
  MockEthereumProvider2 as MockEthereumProvider,
  MockSolanaTransaction,
  MockSolanaWallet2 as MockSolanaWallet,
  MockWalletFactory,
  ProductionGuard,
  ProviderErrorCode,
  SolanaChains,
  StateManager,
  UnifiedWallet,
  WALLET_PRESETS,
  WalletConfigBuilder,
  createDevWallet,
  createEVMWallet,
  createMultiChainWallet,
  createProductionGuard,
  createSolanaWallet,
  createWallet,
  createWalletFromPreset,
  walletFactory as default,
  walletFactory
};
//# sourceMappingURL=index.js.map
