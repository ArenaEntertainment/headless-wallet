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
class EnhancedProductionGuard {
  constructor(config = {}) {
    __publicField(this, "config");
    __publicField(this, "activeOverrides", /* @__PURE__ */ new Map());
    __publicField(this, "detectionCache", /* @__PURE__ */ new Map());
    __publicField(this, "eventLog", []);
    this.config = {
      confidenceThreshold: 85,
      blockedDomains: [
        "*.com",
        "*.org",
        "*.net",
        "*prod*",
        "*production*",
        "*live*",
        "*staging*",
        "vercel.app",
        "netlify.app",
        "herokuapp.com",
        "railway.app",
        "render.com"
      ],
      allowedDomains: [
        "localhost",
        "127.0.0.1",
        "*.local",
        "*.dev",
        "*.test",
        "*.localhost",
        "dev-*",
        "test-*",
        "local-*"
      ],
      throwInProduction: true,
      overrideConfig: {
        allowOverrides: false,
        overrideTimeLimit: 30 * 60 * 1e3,
        // 30 minutes
        requireReason: true,
        auditOverrides: true
      },
      enableLogging: true,
      ...config
    };
    this.startCleanupTimer();
  }
  /**
   * Performs comprehensive production environment check
   */
  async checkProductionEnvironment() {
    const cacheKey = this.generateCacheKey();
    const cached = this.detectionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1e3) {
      return cached;
    }
    const environment = this.gatherEnvironmentInfo();
    const detectionMethods = [];
    detectionMethods.push(await this.checkDomainPatterns(environment));
    detectionMethods.push(await this.checkEnvironmentVariables(environment));
    detectionMethods.push(await this.checkNetworkConfiguration(environment));
    detectionMethods.push(await this.checkCIPlatforms(environment));
    detectionMethods.push(await this.checkContainerEnvironment(environment));
    detectionMethods.push(await this.checkDNSResolution(environment));
    detectionMethods.push(await this.checkSSLCertificate(environment));
    detectionMethods.push(await this.checkHttpHeaders(environment));
    let totalWeight = 0;
    let weightedScore = 0;
    for (const method of detectionMethods) {
      totalWeight += method.weight;
      if (method.result) {
        weightedScore += method.weight * (method.confidence / 100);
      }
    }
    const confidence = totalWeight > 0 ? Math.round(weightedScore / totalWeight * 100) : 0;
    const isProduction = confidence >= this.config.confidenceThreshold;
    const reasons = detectionMethods.filter((m) => m.result).map((m) => `${m.name}: ${m.details}`);
    const result = {
      isProduction,
      confidence,
      reasons,
      detectionMethods,
      timestamp: Date.now(),
      environment
    };
    this.detectionCache.set(cacheKey, result);
    this.logSecurityEvent({
      type: "production_detection",
      severity: isProduction ? "critical" : "info",
      message: `Production environment ${isProduction ? "detected" : "not detected"}`,
      details: { result },
      timestamp: Date.now(),
      source: "EnhancedProductionGuard"
    });
    return result;
  }
  /**
   * Domain pattern checking
   */
  async checkDomainPatterns(env) {
    const hostname = env.hostname.toLowerCase();
    const isBlocked = this.config.blockedDomains.some((pattern) => {
      const regex = this.patternToRegex(pattern);
      return regex.test(hostname);
    });
    const isAllowed = this.config.allowedDomains.some((pattern) => {
      const regex = this.patternToRegex(pattern);
      return regex.test(hostname);
    });
    let confidence = 0;
    let result = false;
    if (isBlocked && !isAllowed) {
      confidence = 90;
      result = true;
    } else if (isAllowed) {
      confidence = 5;
      result = false;
    }
    return {
      name: "Domain Pattern Check",
      weight: 30,
      result,
      confidence,
      details: `Hostname: ${hostname}, Blocked: ${isBlocked}, Allowed: ${isAllowed}`
    };
  }
  /**
   * Environment variables checking
   */
  async checkEnvironmentVariables(env) {
    var _a, _b, _c;
    const prodIndicators = [
      "production",
      "prod",
      "live",
      "staging",
      "stage"
    ];
    let confidence = 0;
    let result = false;
    if (typeof process !== "undefined" && process.env) {
      const nodeEnv = ((_a = process.env.NODE_ENV) == null ? void 0 : _a.toLowerCase()) || "";
      const appEnv = ((_b = process.env.APP_ENV) == null ? void 0 : _b.toLowerCase()) || "";
      const environment = ((_c = process.env.ENVIRONMENT) == null ? void 0 : _c.toLowerCase()) || "";
      const allEnvs = [nodeEnv, appEnv, environment].filter(Boolean);
      for (const envVar of allEnvs) {
        if (prodIndicators.includes(envVar)) {
          confidence = Math.max(confidence, 95);
          result = true;
        }
      }
    }
    return {
      name: "Environment Variables",
      weight: 25,
      result,
      confidence,
      details: `NODE_ENV: ${env.nodeEnv || "undefined"}`
    };
  }
  /**
   * Network configuration checking
   */
  async checkNetworkConfiguration(env) {
    let confidence = 0;
    let result = false;
    if (env.port === 80 || env.port === 443) {
      confidence += 20;
      result = true;
    }
    if (env.protocol === "https:" && !this.isLocalHost(env.hostname)) {
      confidence += 30;
      result = true;
    }
    const cdnPatterns = ["cdn", "static", "assets", "media"];
    if (cdnPatterns.some((pattern) => env.hostname.includes(pattern))) {
      confidence += 25;
      result = true;
    }
    return {
      name: "Network Configuration",
      weight: 20,
      result,
      confidence,
      details: `Port: ${env.port}, Protocol: ${env.protocol}, Host: ${env.hostname}`
    };
  }
  /**
   * CI/CD platform detection
   */
  async checkCIPlatforms(env) {
    const ciIndicators = [
      "CI",
      "CONTINUOUS_INTEGRATION",
      "GITHUB_ACTIONS",
      "GITLAB_CI",
      "JENKINS_URL",
      "BUILDKITE",
      "CIRCLECI",
      "TRAVIS",
      "VERCEL",
      "NETLIFY"
    ];
    let confidence = 0;
    let result = false;
    if (typeof process !== "undefined" && process.env) {
      for (const indicator of ciIndicators) {
        if (process.env[indicator]) {
          confidence = 60;
          result = true;
          break;
        }
      }
    }
    return {
      name: "CI/CD Platform Detection",
      weight: 15,
      result,
      confidence,
      details: `CI Platform: ${env.ciPlatform || "none detected"}`
    };
  }
  /**
   * Container environment detection
   */
  async checkContainerEnvironment(env) {
    let confidence = 0;
    let result = false;
    if (env.dockerized) {
      confidence += 40;
      result = true;
    }
    if (env.kubernetesDeployed) {
      confidence += 50;
      result = true;
    }
    return {
      name: "Container Environment",
      weight: 15,
      result,
      confidence,
      details: `Docker: ${env.dockerized}, Kubernetes: ${env.kubernetesDeployed}`
    };
  }
  /**
   * DNS resolution checking
   */
  async checkDNSResolution(env) {
    let confidence = 0;
    let result = false;
    if (this.isLocalHost(env.hostname) || this.isIPAddress(env.hostname)) {
      return {
        name: "DNS Resolution",
        weight: 10,
        result: false,
        confidence: 0,
        details: "Local host or IP address"
      };
    }
    if (env.hostname.includes(".")) {
      const parts = env.hostname.split(".");
      if (parts.length >= 2) {
        const tld = parts[parts.length - 1];
        if (["com", "org", "net", "io", "app"].includes(tld)) {
          confidence = 30;
          result = true;
        }
      }
    }
    return {
      name: "DNS Resolution",
      weight: 10,
      result,
      confidence,
      details: `Hostname analysis: ${env.hostname}`
    };
  }
  /**
   * SSL certificate checking
   */
  async checkSSLCertificate(env) {
    let confidence = 0;
    let result = false;
    if (env.protocol === "https:" && !this.isLocalHost(env.hostname)) {
      confidence = 40;
      result = true;
    }
    return {
      name: "SSL Certificate",
      weight: 15,
      result,
      confidence,
      details: `HTTPS: ${env.protocol === "https:"}, Host: ${env.hostname}`
    };
  }
  /**
   * HTTP headers checking
   */
  async checkHttpHeaders(env) {
    let confidence = 0;
    let result = false;
    const ua = env.userAgent.toLowerCase();
    const prodHeaders = ["bot", "crawler", "spider", "monitor"];
    if (prodHeaders.some((header) => ua.includes(header))) {
      confidence = 35;
      result = true;
    }
    return {
      name: "HTTP Headers",
      weight: 10,
      result,
      confidence,
      details: `User-Agent analysis complete`
    };
  }
  /**
   * Gather environment information
   */
  gatherEnvironmentInfo() {
    const location = typeof window !== "undefined" ? window.location : {};
    return {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      hostname: location.hostname || "localhost",
      protocol: location.protocol || "http:",
      port: location.port ? parseInt(location.port) : location.protocol === "https:" ? 443 : 80,
      origin: location.origin || "http://localhost",
      nodeEnv: typeof process !== "undefined" ? process.env.NODE_ENV : void 0,
      ciPlatform: this.detectCIPlatform(),
      dockerized: this.detectDocker(),
      kubernetesDeployed: this.detectKubernetes()
    };
  }
  /**
   * Detect CI platform
   */
  detectCIPlatform() {
    if (typeof process === "undefined" || !process.env) return void 0;
    const platforms = {
      "GITHUB_ACTIONS": "GitHub Actions",
      "GITLAB_CI": "GitLab CI",
      "JENKINS_URL": "Jenkins",
      "BUILDKITE": "Buildkite",
      "CIRCLECI": "CircleCI",
      "TRAVIS": "Travis CI",
      "VERCEL": "Vercel",
      "NETLIFY": "Netlify"
    };
    for (const [env, platform] of Object.entries(platforms)) {
      if (process.env[env]) return platform;
    }
    return void 0;
  }
  /**
   * Detect Docker environment
   */
  detectDocker() {
    var _a;
    if (typeof process === "undefined") return false;
    try {
      if (typeof require !== "undefined") {
        const fs = require("fs");
        return fs.existsSync("/.dockerenv");
      }
    } catch {
    }
    return !!(process.env.DOCKER_CONTAINER || ((_a = process.env.HOSTNAME) == null ? void 0 : _a.startsWith("docker-")));
  }
  /**
   * Detect Kubernetes environment
   */
  detectKubernetes() {
    if (typeof process === "undefined") return false;
    return !!(process.env.KUBERNETES_SERVICE_HOST || process.env.KUBERNETES_PORT || process.env.K8S_NODE_NAME);
  }
  /**
   * Convert pattern to regex
   */
  patternToRegex(pattern) {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`, "i");
  }
  /**
   * Check if hostname is localhost
   */
  isLocalHost(hostname) {
    const localHosts = ["localhost", "127.0.0.1", "::1", "0.0.0.0"];
    return localHosts.includes(hostname) || hostname.endsWith(".local");
  }
  /**
   * Check if string is IP address
   */
  isIPAddress(hostname) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(hostname) || ipv6Regex.test(hostname);
  }
  /**
   * Generate cache key for detection results
   */
  generateCacheKey() {
    const env = this.gatherEnvironmentInfo();
    return `${env.hostname}:${env.port}:${env.protocol}:${env.nodeEnv}`;
  }
  /**
   * Log security event
   */
  logSecurityEvent(event) {
    if (!this.config.enableLogging) return;
    this.eventLog.push(event);
    if (this.eventLog.length > 1e3) {
      this.eventLog.splice(0, 500);
    }
    if (this.config.onSecurityEvent) {
      this.config.onSecurityEvent(event);
    }
    if (event.severity === "critical" || event.severity === "error") {
      console.error(`[SECURITY] ${event.message}`, event.details);
    } else if (event.severity === "warning") {
      console.warn(`[SECURITY] ${event.message}`, event.details);
    } else if (this.config.enableLogging) {
      console.info(`[SECURITY] ${event.message}`, event.details);
    }
  }
  /**
   * Start cleanup timer for expired overrides
   */
  startCleanupTimer() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, override] of this.activeOverrides.entries()) {
        if (now > override.expiresAt) {
          this.activeOverrides.delete(key);
          this.logSecurityEvent({
            type: "override_usage",
            severity: "info",
            message: "Production override expired",
            details: { key, override },
            timestamp: now,
            source: "EnhancedProductionGuard"
          });
        }
      }
    }, 6e4);
  }
  /**
   * Create temporary production override (discouraged)
   */
  createOverride(reason, durationMs) {
    if (!this.config.overrideConfig.allowOverrides) {
      throw new Error("Production overrides are disabled");
    }
    if (this.config.overrideConfig.requireReason && !reason) {
      throw new Error("Override reason is required");
    }
    const overrideId = this.generateOverrideId();
    const duration = durationMs || this.config.overrideConfig.overrideTimeLimit;
    const override = {
      reason,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
      creator: this.getCreatorInfo(),
      audited: this.config.overrideConfig.auditOverrides
    };
    this.activeOverrides.set(overrideId, override);
    this.logSecurityEvent({
      type: "override_usage",
      severity: "warning",
      message: "Production override created",
      details: { overrideId, reason, duration },
      timestamp: Date.now(),
      source: "EnhancedProductionGuard"
    });
    return overrideId;
  }
  /**
   * Check if override is active
   */
  hasActiveOverride(overrideId) {
    const override = this.activeOverrides.get(overrideId);
    return override ? Date.now() < override.expiresAt : false;
  }
  /**
   * Get security event log
   */
  getEventLog() {
    return [...this.eventLog];
  }
  /**
   * Clear detection cache
   */
  clearCache() {
    this.detectionCache.clear();
  }
  /**
   * Generate unique override ID
   */
  generateOverrideId() {
    return `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Get creator information for audit trail
   */
  getCreatorInfo() {
    return `${Date.now()}_${typeof window !== "undefined" ? window.location.href : "server"}`;
  }
}
function createProductionGuard(config) {
  return new EnhancedProductionGuard(config);
}
function createStrictProductionGuard(config) {
  const strictConfig = {
    confidenceThreshold: 75,
    // Lower threshold for stricter detection
    throwInProduction: true,
    overrideConfig: {
      allowOverrides: false,
      overrideTimeLimit: 5 * 60 * 1e3,
      // 5 minutes max
      requireReason: true,
      auditOverrides: true
    },
    enableLogging: true,
    ...config
  };
  return new EnhancedProductionGuard(strictConfig);
}
var SecurityLevel$1 = /* @__PURE__ */ ((SecurityLevel2) => {
  SecurityLevel2["STRICT"] = "strict";
  SecurityLevel2["STANDARD"] = "standard";
  SecurityLevel2["PERMISSIVE"] = "permissive";
  return SecurityLevel2;
})(SecurityLevel$1 || {});
class SecurityManager {
  constructor(config = {}) {
    __publicField(this, "config");
    __publicField(this, "productionGuard");
    __publicField(this, "securityEvents", []);
    __publicField(this, "threatEvents", []);
    __publicField(this, "violations", []);
    __publicField(this, "operationCounters", /* @__PURE__ */ new Map());
    __publicField(this, "lastHealthCheck", null);
    this.config = this.mergeWithDefaults(config);
    this.productionGuard = new EnhancedProductionGuard({
      ...this.config.productionGuard,
      onSecurityEvent: this.handleSecurityEvent.bind(this)
    });
    this.initializeComponents();
    this.startPeriodicHealthChecks();
  }
  /**
   * Initialize all security components based on configuration
   */
  initializeComponents() {
    if (this.config.runtimeMonitor.enabled) {
      this.initializeRuntimeMonitor();
    }
    if (this.config.memoryProtection.enabled) {
      this.initializeMemoryProtection();
    }
    if (this.config.networkSecurity.enabled) {
      this.initializeNetworkSecurity();
    }
    if (this.config.keyManagement.enabled) {
      this.initializeKeyManagement();
    }
  }
  /**
   * Initialize runtime monitoring
   */
  initializeRuntimeMonitor() {
    if (typeof window === "undefined") return;
    if (this.config.runtimeMonitor.xssProtection) {
      this.setupXSSProtection();
    }
    if (this.config.runtimeMonitor.consoleProtection) {
      this.setupConsoleProtection();
    }
    if (this.config.runtimeMonitor.integrityChecks) {
      this.setupIntegrityChecks();
    }
  }
  /**
   * Setup XSS Protection
   */
  setupXSSProtection() {
    if (typeof window === "undefined") return;
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    if (originalInnerHTML) {
      Object.defineProperty(Element.prototype, "innerHTML", {
        set: function(value) {
          if (typeof value === "string" && SecurityManager.containsXSSPatterns(value)) {
            ({
              details: { value: value.substring(0, 100) }
            });
            console.error("[SECURITY] XSS attempt blocked:", value);
            return;
          }
          originalInnerHTML.set.call(this, value);
        },
        get: originalInnerHTML.get,
        configurable: true
      });
    }
  }
  /**
   * Setup Console Protection
   */
  setupConsoleProtection() {
    if (typeof console === "undefined") return;
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    console.log = (...args) => {
      if (this.containsSensitiveData(args)) {
        this.recordViolation({
          type: "sensitive_data_logging",
          severity: "warning",
          source: "console_protection",
          message: "Sensitive data detected in console.log",
          details: { args: args.map((arg) => typeof arg === "string" ? arg.substring(0, 50) : typeof arg) },
          timestamp: Date.now(),
          action: "filtered"
        });
        originalLog("[FILTERED SENSITIVE DATA]");
        return;
      }
      originalLog.apply(console, args);
    };
    console.warn = (...args) => {
      if (this.containsSensitiveData(args)) {
        originalWarn("[FILTERED SENSITIVE DATA]");
        return;
      }
      originalWarn.apply(console, args);
    };
    console.error = (...args) => {
      if (this.containsSensitiveData(args)) {
        originalError("[FILTERED SENSITIVE DATA]");
        return;
      }
      originalError.apply(console, args);
    };
  }
  /**
   * Setup Integrity Checks
   */
  setupIntegrityChecks() {
  }
  /**
   * Initialize Memory Protection
   */
  initializeMemoryProtection() {
    if (this.config.memoryProtection.leakDetection) {
      this.setupMemoryLeakDetection();
    }
  }
  /**
   * Setup Memory Leak Detection
   */
  setupMemoryLeakDetection() {
    setInterval(() => {
      if (typeof performance !== "undefined" && performance.memory) {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > memory.totalJSHeapSize * 0.9) {
          this.recordViolation({
            type: "memory_leak_detected",
            severity: "warning",
            source: "memory_monitor",
            message: "High memory usage detected",
            details: {
              usedHeapSize: memory.usedJSHeapSize,
              totalHeapSize: memory.totalJSHeapSize
            },
            timestamp: Date.now(),
            action: "logged"
          });
        }
      }
    }, 3e4);
  }
  /**
   * Initialize Network Security
   */
  initializeNetworkSecurity() {
    if (typeof window === "undefined") return;
    if (this.config.networkSecurity.ssrfProtection) {
      this.setupSSRFProtection();
    }
    if (this.config.networkSecurity.requestFiltering) {
      this.setupRequestFiltering();
    }
  }
  /**
   * Setup SSRF Protection
   */
  setupSSRFProtection() {
    if (typeof window === "undefined") return;
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (this.isSSRFAttempt(url)) {
        const threat = {
          type: "ssrf_attempt",
          severity: "high",
          source: "network_security",
          message: "SSRF attempt blocked",
          details: { url },
          timestamp: Date.now(),
          blocked: true
        };
        this.recordThreat(threat);
        throw new Error("Network request blocked by security policy");
      }
      return originalFetch(input, init);
    };
  }
  /**
   * Setup Request Filtering
   */
  setupRequestFiltering() {
    if (typeof XMLHttpRequest !== "undefined") {
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (SecurityManager.prototype.isSSRFAttempt(url)) {
          throw new Error("XMLHttpRequest blocked by security policy");
        }
        return originalOpen.apply(this, [method, url, ...args]);
      };
    }
  }
  /**
   * Initialize Key Management
   */
  initializeKeyManagement() {
    if (this.config.keyManagement.autoRotation) {
      this.startKeyRotation();
    }
  }
  /**
   * Start Key Rotation
   */
  startKeyRotation() {
    setInterval(() => {
      this.logInfo("Key rotation check performed");
    }, 24 * 60 * 60 * 1e3);
  }
  /**
   * Check if URL is SSRF attempt
   */
  isSSRFAttempt(url) {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      const privateRanges = [
        /^127\./,
        // 127.0.0.0/8
        /^192\.168\./,
        // 192.168.0.0/16
        /^10\./,
        // 10.0.0.0/8
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        // 172.16.0.0/12
        /^169\.254\./,
        // 169.254.0.0/16
        /^::1$/,
        // IPv6 loopback
        /^fe80::/i
        // IPv6 link-local
      ];
      return privateRanges.some((range) => range.test(hostname)) || hostname === "localhost";
    } catch {
      return true;
    }
  }
  /**
   * Check if content contains XSS patterns
   */
  static containsXSSPatterns(content) {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /eval\s*\(/gi,
      /document\.write/gi,
      /innerHTML/gi
    ];
    return xssPatterns.some((pattern) => pattern.test(content));
  }
  /**
   * Check if data contains sensitive information
   */
  containsSensitiveData(args) {
    const sensitivePatterns = [
      /private.*key/i,
      /mnemonic/i,
      /seed.*phrase/i,
      /password/i,
      /secret/i,
      /token.*[a-zA-Z0-9]{20,}/i,
      /0x[a-fA-F0-9]{40}/i,
      // Ethereum addresses
      /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/i
      // Bitcoin addresses
    ];
    const stringified = args.map(
      (arg) => typeof arg === "string" ? arg : JSON.stringify(arg)
    ).join(" ");
    return sensitivePatterns.some((pattern) => pattern.test(stringified));
  }
  /**
   * Record security threat
   */
  recordThreat(threat) {
    this.threatEvents.push(threat);
    if (this.threatEvents.length > 1e3) {
      this.threatEvents.splice(0, 500);
    }
    if (this.config.onThreatDetected) {
      this.config.onThreatDetected(threat);
    }
    this.logError(`Threat detected: ${threat.message}`, threat.details);
  }
  /**
   * Record security violation
   */
  recordViolation(violation) {
    this.violations.push(violation);
    if (this.violations.length > 1e3) {
      this.violations.splice(0, 500);
    }
    if (this.config.onSecurityViolation) {
      this.config.onSecurityViolation(violation);
    }
    if (violation.severity === "critical" || violation.severity === "error") {
      this.logError(`Security violation: ${violation.message}`, violation.details);
    } else {
      this.logWarning(`Security violation: ${violation.message}`, violation.details);
    }
  }
  /**
   * Handle security event from other components
   */
  handleSecurityEvent(event) {
    this.securityEvents.push(event);
    if (this.securityEvents.length > 1e3) {
      this.securityEvents.splice(0, 500);
    }
    if (this.config.onSecurityEvent) {
      this.config.onSecurityEvent(event);
    }
  }
  /**
   * Start periodic health checks
   */
  startPeriodicHealthChecks() {
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1e3);
    setTimeout(() => this.performHealthCheck(), 1e3);
  }
  /**
   * Perform security health check
   */
  async performHealthCheck() {
    const components = [];
    components.push({
      name: "Production Guard",
      status: this.config.productionGuard.enabled ? "healthy" : "disabled",
      message: this.config.productionGuard.enabled ? "Active" : "Disabled"
    });
    components.push({
      name: "Runtime Monitor",
      status: this.config.runtimeMonitor.enabled ? "healthy" : "disabled",
      message: this.config.runtimeMonitor.enabled ? "Monitoring active" : "Disabled"
    });
    let memoryStatus = "healthy";
    let memoryMessage = "Operating normally";
    if (typeof performance !== "undefined" && performance.memory) {
      const memory = performance.memory;
      const usageRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;
      if (usageRatio > 0.9) {
        memoryStatus = "warning";
        memoryMessage = "High memory usage detected";
      }
    }
    components.push({
      name: "Memory Protection",
      status: this.config.memoryProtection.enabled ? memoryStatus : "disabled",
      message: this.config.memoryProtection.enabled ? memoryMessage : "Disabled"
    });
    components.push({
      name: "Network Security",
      status: this.config.networkSecurity.enabled ? "healthy" : "disabled",
      message: this.config.networkSecurity.enabled ? "Protection active" : "Disabled"
    });
    const overall = this.assessOverallHealth(components);
    const recommendations = this.generateRecommendations(components);
    this.lastHealthCheck = {
      overall,
      components,
      recommendations,
      lastCheck: Date.now()
    };
    this.logInfo("Security health check completed", { overall, componentCount: components.length });
    return this.lastHealthCheck;
  }
  /**
   * Assess overall health
   */
  assessOverallHealth(components) {
    const activeComponents = components.filter((c) => c.status !== "disabled");
    const errorComponents = activeComponents.filter((c) => c.status === "error");
    const warningComponents = activeComponents.filter((c) => c.status === "warning");
    if (errorComponents.length > 0) return "critical";
    if (warningComponents.length > 0) return "warning";
    return "healthy";
  }
  /**
   * Generate security recommendations
   */
  generateRecommendations(components) {
    const recommendations = [];
    components.forEach((component) => {
      if (component.status === "error") {
        recommendations.push(`Fix ${component.name}: ${component.message}`);
      } else if (component.status === "warning") {
        recommendations.push(`Review ${component.name}: ${component.message}`);
      } else if (component.status === "disabled") {
        recommendations.push(`Consider enabling ${component.name} for enhanced security`);
      }
    });
    return recommendations;
  }
  /**
   * Get security metrics
   */
  getSecurityMetrics() {
    var _a, _b;
    return {
      securityEvents: this.securityEvents.length,
      threatEvents: this.threatEvents.length,
      violations: this.violations.length,
      lastHealthCheck: (_a = this.lastHealthCheck) == null ? void 0 : _a.lastCheck,
      overallHealth: (_b = this.lastHealthCheck) == null ? void 0 : _b.overall
    };
  }
  /**
   * Get event logs
   */
  getEventLogs() {
    return {
      securityEvents: [...this.securityEvents],
      threatEvents: [...this.threatEvents],
      violations: [...this.violations]
    };
  }
  /**
   * Logging methods
   */
  logInfo(message, details) {
    if (this.config.enableLogging && this.shouldLog("info")) {
      console.info(`[SECURITY] ${message}`, details || "");
    }
  }
  logWarning(message, details) {
    if (this.config.enableLogging && this.shouldLog("warning")) {
      console.warn(`[SECURITY] ${message}`, details || "");
    }
  }
  logError(message, details) {
    if (this.config.enableLogging && this.shouldLog("error")) {
      console.error(`[SECURITY] ${message}`, details || "");
    }
  }
  shouldLog(level) {
    const levels = ["info", "warning", "error", "critical"];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }
  /**
   * Merge configuration with defaults
   */
  mergeWithDefaults(config) {
    const defaults = {
      securityLevel: "standard",
      productionGuard: {
        enabled: true,
        confidenceThreshold: 85,
        blockedDomains: ["*.com", "*.org", "*.net"],
        allowedDomains: ["localhost", "*.local", "*.dev"],
        throwInProduction: true
      },
      runtimeMonitor: {
        enabled: true,
        xssProtection: true,
        rateLimiting: true,
        consoleProtection: true,
        integrityChecks: true
      },
      memoryProtection: {
        enabled: true,
        secureStorage: true,
        autoCleanup: true,
        leakDetection: true
      },
      networkSecurity: {
        enabled: true,
        ssrfProtection: true,
        originValidation: true,
        requestFiltering: true
      },
      keyManagement: {
        enabled: true,
        secureGeneration: true,
        autoRotation: false,
        testKeyMarking: true
      },
      enableLogging: true,
      logLevel: "info"
    };
    return {
      ...defaults,
      ...config,
      productionGuard: { ...defaults.productionGuard, ...config.productionGuard },
      runtimeMonitor: { ...defaults.runtimeMonitor, ...config.runtimeMonitor },
      memoryProtection: { ...defaults.memoryProtection, ...config.memoryProtection },
      networkSecurity: { ...defaults.networkSecurity, ...config.networkSecurity },
      keyManagement: { ...defaults.keyManagement, ...config.keyManagement }
    };
  }
}
function createSecurityManager$1(config) {
  return new SecurityManager(config);
}
function createStrictSecurityManager$1(config) {
  const strictConfig = {
    securityLevel: "strict",
    productionGuard: {
      enabled: true,
      confidenceThreshold: 75,
      throwInProduction: true,
      ...config == null ? void 0 : config.productionGuard
    },
    logLevel: "warning",
    ...config
  };
  return new SecurityManager(strictConfig);
}
function createPermissiveSecurityManager$1(config) {
  const permissiveConfig = {
    securityLevel: "permissive",
    productionGuard: {
      enabled: false,
      throwInProduction: false,
      ...config == null ? void 0 : config.productionGuard
    },
    logLevel: "error",
    ...config
  };
  return new SecurityManager(permissiveConfig);
}
function initializeDefaultSecurity$1() {
  return createSecurityManager$1({
    securityLevel: "standard",
    enableLogging: true,
    logLevel: "info"
  });
}
const DEVELOPMENT_SECURITY_CONFIG = {
  securityLevel: SecurityLevel.PERMISSIVE,
  productionGuard: {
    enabled: false,
    confidenceThreshold: 95,
    throwInProduction: false,
    blockedDomains: [],
    allowedDomains: ["*"]
  },
  runtimeMonitor: {
    enabled: false,
    xssProtection: false,
    rateLimiting: false,
    consoleProtection: false,
    integrityChecks: false
  },
  memoryProtection: {
    enabled: false,
    secureStorage: false,
    autoCleanup: true,
    leakDetection: false
  },
  networkSecurity: {
    enabled: false,
    ssrfProtection: false,
    originValidation: false,
    requestFiltering: false
  },
  keyManagement: {
    enabled: true,
    secureGeneration: false,
    autoRotation: false,
    testKeyMarking: true
  },
  enableLogging: true,
  logLevel: "error"
};
const TESTING_SECURITY_CONFIG = {
  securityLevel: SecurityLevel.STANDARD,
  productionGuard: {
    enabled: true,
    confidenceThreshold: 80,
    throwInProduction: true,
    blockedDomains: ["*.com", "*.org", "*.net", "*prod*", "*production*"],
    allowedDomains: ["localhost", "*.local", "*.dev", "*.test", "test-*"]
  },
  runtimeMonitor: {
    enabled: true,
    xssProtection: true,
    rateLimiting: false,
    consoleProtection: true,
    integrityChecks: false
  },
  memoryProtection: {
    enabled: true,
    secureStorage: true,
    autoCleanup: true,
    leakDetection: false
  },
  networkSecurity: {
    enabled: true,
    ssrfProtection: true,
    originValidation: true,
    requestFiltering: true
  },
  keyManagement: {
    enabled: true,
    secureGeneration: true,
    autoRotation: false,
    testKeyMarking: true
  },
  enableLogging: true,
  logLevel: "warning"
};
const PRODUCTION_ADJACENT_SECURITY_CONFIG = {
  securityLevel: SecurityLevel.STRICT,
  productionGuard: {
    enabled: true,
    confidenceThreshold: 70,
    throwInProduction: true,
    blockedDomains: [
      "*.com",
      "*.org",
      "*.net",
      "*.io",
      "*.app",
      "*prod*",
      "*production*",
      "*live*",
      "*staging*",
      "*stage*",
      "vercel.app",
      "netlify.app",
      "herokuapp.com",
      "railway.app",
      "render.com",
      "fly.io"
    ],
    allowedDomains: ["localhost", "127.0.0.1", "*.local", "*.dev", "dev-*"]
  },
  runtimeMonitor: {
    enabled: true,
    xssProtection: true,
    rateLimiting: true,
    consoleProtection: true,
    integrityChecks: true
  },
  memoryProtection: {
    enabled: true,
    secureStorage: true,
    autoCleanup: true,
    leakDetection: true
  },
  networkSecurity: {
    enabled: true,
    ssrfProtection: true,
    originValidation: true,
    requestFiltering: true
  },
  keyManagement: {
    enabled: true,
    secureGeneration: true,
    autoRotation: false,
    testKeyMarking: true
  },
  enableLogging: true,
  logLevel: "info"
};
class SecurityPresets {
  /**
   * Initialize security for development environment
   */
  static forDevelopment() {
    return createPermissiveSecurityManager(DEVELOPMENT_SECURITY_CONFIG);
  }
  /**
   * Initialize security for testing environment
   */
  static forTesting() {
    return createSecurityManager(TESTING_SECURITY_CONFIG);
  }
  /**
   * Initialize security for production-adjacent environments
   */
  static forProductionAdjacent() {
    return createStrictSecurityManager(PRODUCTION_ADJACENT_SECURITY_CONFIG);
  }
  /**
   * Auto-detect environment and initialize appropriate security
   */
  static autoDetect() {
    var _a;
    if (typeof process !== "undefined" && process.env) {
      const nodeEnv = (_a = process.env.NODE_ENV) == null ? void 0 : _a.toLowerCase();
      switch (nodeEnv) {
        case "development":
        case "dev":
          return this.forDevelopment();
        case "test":
        case "testing":
          return this.forTesting();
        case "production":
        case "prod":
        case "staging":
        case "stage":
          return this.forProductionAdjacent();
        default:
          return this.forTesting();
      }
    }
    if (typeof window !== "undefined" && window.location) {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".dev")) {
        return this.forDevelopment();
      }
      if (hostname.includes("test") || hostname.includes("staging")) {
        return this.forTesting();
      }
      return this.forProductionAdjacent();
    }
    return initializeDefaultSecurity();
  }
}
const SECURITY_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical"
};
const COMMON_THREAT_PATTERNS = {
  XSS_SCRIPT: /<script[^>]*>.*?<\/script>/gi,
  XSS_JAVASCRIPT: /javascript:/gi,
  XSS_EVENT_HANDLER: /on\w+\s*=/gi,
  SQL_INJECTION: /(union|select|insert|update|delete|drop|create|alter)\s+/gi,
  COMMAND_INJECTION: /(\||&|;|`|\$\()/g,
  PATH_TRAVERSAL: /\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c/gi,
  PRIVATE_KEY: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
  MNEMONIC_PHRASE: /\b\w+(\s+\w+){11,23}\b/g,
  ETHEREUM_ADDRESS: /0x[a-fA-F0-9]{40}/g,
  BITCOIN_ADDRESS: /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g
};
function validateSecurityConfig(config) {
  const errors = [];
  const warnings = [];
  if (config.securityLevel && !Object.values(SecurityLevel).includes(config.securityLevel)) {
    errors.push("Invalid security level");
  }
  if (config.productionGuard) {
    const pg = config.productionGuard;
    if (pg.confidenceThreshold !== void 0) {
      if (pg.confidenceThreshold < 0 || pg.confidenceThreshold > 100) {
        errors.push("Production guard confidence threshold must be between 0 and 100");
      }
      if (pg.confidenceThreshold < 50) {
        warnings.push("Low confidence threshold may cause false positives");
      }
    }
    if (pg.blockedDomains && pg.blockedDomains.length === 0) {
      warnings.push("No blocked domains configured - consider adding common production patterns");
    }
  }
  if (config.logLevel && !["info", "warning", "error", "critical"].includes(config.logLevel)) {
    errors.push("Invalid log level");
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
function getSecurityRecommendations(environment) {
  switch (environment) {
    case "development":
      return [
        "Use minimal security settings for development speed",
        "Enable test key marking to identify mock keys",
        "Consider enabling console protection for sensitive data",
        "Use error-level logging to reduce noise"
      ];
    case "testing":
      return [
        "Enable production detection to catch deployment issues",
        "Use XSS protection for frontend testing",
        "Enable memory leak detection for long-running tests",
        "Configure appropriate domain allowlists",
        "Use warning-level logging for test debugging"
      ];
    case "production":
      return [
        "NEVER use mock wallets in production",
        "Use strict security level with low confidence threshold",
        "Enable all protection mechanisms",
        "Set up comprehensive logging and monitoring",
        "Implement security event alerting",
        "Regular security health checks",
        "Use strong production detection patterns"
      ];
    default:
      return ["Use SecurityPresets.autoDetect() for automatic configuration"];
  }
}
function generateSecurityReport(securityManager) {
  const metrics = securityManager.getSecurityMetrics();
  const logs = securityManager.getEventLogs();
  const topThreats = logs.threatEvents.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
  }).slice(0, 5);
  const recentViolations = logs.violations.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  const recommendations = [];
  if (metrics.criticalEvents > 0) {
    recommendations.push("Review and address critical security events immediately");
  }
  if (metrics.threatEvents > 10) {
    recommendations.push("High number of threat events detected - review security posture");
  }
  if (metrics.healthStatus !== "healthy") {
    recommendations.push("Security health check indicates issues - perform system review");
  }
  return {
    timestamp: Date.now(),
    metrics: {
      totalEvents: metrics.securityEvents,
      criticalEvents: logs.securityEvents.filter((e) => e.severity === "critical").length,
      threatEvents: metrics.threatEvents,
      violations: metrics.violations,
      healthStatus: metrics.overallHealth || "healthy",
      lastHealthCheck: metrics.lastHealthCheck || 0,
      uptime: Date.now() - (metrics.lastHealthCheck || Date.now())
    },
    topThreats,
    recentViolations,
    recommendations,
    configurationHealth: validateSecurityConfig({})
    // Would pass actual config in real implementation
  };
}
function isSecurityError(error) {
  const securityKeywords = [
    "security",
    "production",
    "blocked",
    "threat",
    "violation",
    "xss",
    "injection",
    "unauthorized",
    "forbidden"
  ];
  const message = error.message.toLowerCase();
  return securityKeywords.some((keyword) => message.includes(keyword));
}
function sanitizeForLogging(data) {
  if (typeof data === "string") {
    return data.replace(/0x[a-fA-F0-9]{40}/g, "0x[ETHEREUM_ADDRESS]").replace(/[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g, "[BITCOIN_ADDRESS]").replace(/-----BEGIN\s+.*?-----[\s\S]*?-----END\s+.*?-----/gi, "[PRIVATE_KEY]").replace(/\b\w+(\s+\w+){11,23}\b/g, "[MNEMONIC_PHRASE]");
  }
  if (typeof data === "object" && data !== null) {
    const sanitized = Array.isArray(data) ? [] : {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof key === "string" && /private|secret|key|mnemonic|password/i.test(key)) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }
  return data;
}
const defaultSecurity = SecurityPresets.autoDetect();
export {
  AccountManager,
  CHAIN_PRESETS,
  COMMON_THREAT_PATTERNS,
  DEVELOPMENT_SECURITY_CONFIG,
  EnhancedProductionGuard,
  EthereumMethod,
  FeatureNames,
  MockEthereumProvider2 as MockEthereumProvider,
  MockSolanaTransaction,
  MockSolanaWallet2 as MockSolanaWallet,
  MockWalletFactory,
  PRODUCTION_ADJACENT_SECURITY_CONFIG,
  ProviderErrorCode,
  SECURITY_SEVERITY,
  SecurityLevel$1 as SecurityLevel,
  SecurityManager,
  SecurityPresets,
  SolanaChains,
  StateManager,
  TESTING_SECURITY_CONFIG,
  UnifiedWallet,
  WALLET_PRESETS,
  WalletConfigBuilder,
  createDevWallet,
  createEVMWallet,
  createMultiChainWallet,
  createPermissiveSecurityManager$1 as createPermissiveSecurityManager,
  createProductionGuard,
  createSecurityManager$1 as createSecurityManager,
  createSolanaWallet,
  createStrictProductionGuard,
  createStrictSecurityManager$1 as createStrictSecurityManager,
  createWallet,
  createWalletFromPreset,
  walletFactory as default,
  defaultSecurity,
  generateSecurityReport,
  getSecurityRecommendations,
  initializeDefaultSecurity$1 as initializeDefaultSecurity,
  isSecurityError,
  sanitizeForLogging,
  validateSecurityConfig,
  walletFactory
};
//# sourceMappingURL=index.js.map
