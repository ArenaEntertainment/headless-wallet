var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { SecureCrypto } from "@arenaentertainment/wallet-mock-shared";
import { AccountType, CHAIN_PRESETS } from "@arenaentertainment/wallet-mock-shared";
import { test as test$1, expect } from "@playwright/test";
const DEFAULT_SECURITY_CONFIG$1 = {
  level: SecurityLevel.TESTING,
  checkProduction: true,
  validateContext: true,
  secureCleanup: true,
  maxInstances: 10,
  sessionTimeout: 30 * 60 * 1e3
  // 30 minutes
};
const PRODUCTION_INDICATORS = [
  "production",
  "prod",
  "live",
  "deploy",
  "staging",
  "release"
];
const TEST_INDICATORS = [
  "test",
  "testing",
  "spec",
  "jest",
  "mocha",
  "vitest",
  "playwright",
  "cypress",
  "dev",
  "development",
  "local"
];
function detectEnvironment$1() {
  const env = process.env;
  const nodeVersion = process.version;
  const isCI = !!(env.CI || env.GITHUB_ACTIONS || env.JENKINS_URL || env.BUILDKITE || env.CIRCLECI || env.TRAVIS || env.GITLAB_CI);
  const nodeEnv = (env.NODE_ENV || "").toLowerCase();
  const isProduction = PRODUCTION_INDICATORS.some(
    (indicator) => nodeEnv.includes(indicator) || (env.ENVIRONMENT || "").toLowerCase().includes(indicator)
  );
  const isTest = TEST_INDICATORS.some(
    (indicator) => nodeEnv.includes(indicator) || (env.ENVIRONMENT || "").toLowerCase().includes(indicator)
  ) || isCI;
  const isDevelopment = nodeEnv === "development" || !isProduction && !isTest;
  let playwrightVersion;
  try {
    const pkg = require("@playwright/test/package.json");
    playwrightVersion = pkg.version;
  } catch {
  }
  return {
    isTest,
    isCI,
    isDevelopment,
    isProduction,
    nodeVersion,
    playwrightVersion
  };
}
function validateEnvironment(config) {
  if (!config.checkProduction) return;
  const env = detectEnvironment$1();
  if (env.isProduction) {
    throw new SecurityViolationError(
      "Wallet mock cannot be used in production environment",
      { environment: env }
    );
  }
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    const productionDomains = [
      "app.com",
      "wallet.com",
      "exchange.com"
      // Add your production domains here
    ];
    if (productionDomains.some((domain) => hostname.includes(domain))) {
      throw new SecurityViolationError(
        `Wallet mock cannot be used on production domain: ${hostname}`,
        { hostname, domain: window.location.href }
      );
    }
  }
}
function generateSecureToken(length = 32) {
  const bytes = SecureCrypto.generateSeed(length);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function generateSessionId() {
  const timestamp = Date.now().toString();
  const random = generateSecureToken(16);
  let hash = 0;
  const input = `${timestamp}-${random}`;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i) & 4294967295;
  }
  return Math.abs(hash).toString(16).substring(0, 16);
}
function validateSecurityToken(token) {
  if (!token || typeof token !== "string") return false;
  if (token.length < 16) return false;
  return /^[a-f0-9]+$/i.test(token);
}
function sanitiseSensitiveData(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const sensitiveKeys = ["privateKey", "secretKey", "password", "token", "secret"];
  const sanitised = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitised[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitised[key] = sanitiseSensitiveData(value);
    } else {
      sanitised[key] = value;
    }
  }
  return sanitised;
}
function validateOrigin(origin, allowedOrigins) {
  if (!allowedOrigins || allowedOrigins.length === 0) {
    return origin.includes("localhost") || origin.includes("127.0.0.1") || origin.startsWith("file://") || origin.includes("local.") || origin.includes(".local");
  }
  return allowedOrigins.some((allowed) => {
    if (allowed === "*") return true;
    if (allowed.startsWith("*")) {
      return origin.endsWith(allowed.substring(1));
    }
    return origin === allowed || origin.includes(allowed);
  });
}
class RateLimiter {
  constructor(maxAttempts = 10, windowMs = 6e4) {
    __publicField(this, "attempts", /* @__PURE__ */ new Map());
    __publicField(this, "maxAttempts");
    __publicField(this, "windowMs");
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }
  isAllowed(key) {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const validAttempts = attempts.filter((time) => now - time < this.windowMs);
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
  reset(key) {
    this.attempts.delete(key);
  }
  clear() {
    this.attempts.clear();
  }
}
const securityRateLimiter = new RateLimiter();
function validateSecurityLevel(level, operation) {
  const env = detectEnvironment$1();
  switch (level) {
    case SecurityLevel.STRICT:
      if (!env.isTest && !env.isCI) {
        throw new SecurityViolationError(
          `Operation '${operation}' requires test environment in strict mode`,
          { level, operation, environment: env }
        );
      }
      break;
    case SecurityLevel.TESTING:
      if (env.isProduction) {
        throw new SecurityViolationError(
          `Operation '${operation}' not allowed in production`,
          { level, operation, environment: env }
        );
      }
      break;
    case SecurityLevel.DEVELOPMENT:
      if (env.isProduction) {
        throw new SecurityViolationError(
          `Operation '${operation}' not allowed in production`,
          { level, operation, environment: env }
        );
      }
      break;
  }
}
function createSecureCleanup(resource, cleanupFn) {
  return async () => {
    try {
      await cleanupFn(resource);
    } catch (error) {
      console.warn("Secure cleanup failed:", error);
    }
  };
}
const DEFAULT_BRIDGE_CONFIG = {
  security: {
    level: "testing",
    checkProduction: true,
    validateContext: true,
    secureCleanup: true,
    maxInstances: 10,
    sessionTimeout: 30 * 60 * 1e3
    // 30 minutes
  },
  sessionTimeout: 30 * 60 * 1e3,
  maxMessageSize: 10 * 1024 * 1024,
  // 10MB
  enableLogging: true,
  logLevel: "info"
};
class MessageBridge {
  constructor(page, config = {}) {
    __publicField(this, "page");
    __publicField(this, "config");
    __publicField(this, "sessionId");
    __publicField(this, "securityToken");
    __publicField(this, "messageCounter", 0);
    __publicField(this, "pendingMessages", /* @__PURE__ */ new Map());
    this.page = page;
    this.config = { ...DEFAULT_BRIDGE_CONFIG, ...config };
    this.sessionId = generateSessionId();
    this.securityToken = generateSecureToken();
    validateEnvironment(this.config.security);
  }
  /**
   * Initialize the message bridge
   */
  async initialize() {
    try {
      await this.setupBrowserBridge();
      await this.performHandshake();
      this.log("info", "Message bridge initialized successfully", {
        sessionId: this.sessionId,
        securityLevel: this.config.security.level
      });
    } catch (error) {
      this.log("error", "Failed to initialize message bridge", { error });
      throw new BridgeError("Bridge initialization failed", { error });
    }
  }
  /**
   * Send a message to the browser and wait for response
   */
  async sendMessage(type, payload, timeout = 5e3) {
    const rateLimitKey = `${this.sessionId}-${type}`;
    if (!securityRateLimiter.isAllowed(rateLimitKey)) {
      throw new BridgeError("Rate limit exceeded for message type", { type });
    }
    const messageId = this.generateMessageId();
    const message = {
      id: messageId,
      type,
      payload,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      securityToken: this.securityToken
    };
    const messageSize = JSON.stringify(message).length;
    if (messageSize > this.config.maxMessageSize) {
      throw new BridgeError("Message size exceeds limit", {
        size: messageSize,
        limit: this.config.maxMessageSize
      });
    }
    this.log("debug", "Sending message", {
      messageId,
      type,
      payload: sanitiseSensitiveData(payload)
    });
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new BridgeError("Message timeout", { messageId, type, timeout }));
      }, timeout);
      this.pendingMessages.set(messageId, {
        resolve,
        reject,
        timeout: timeoutId
      });
      this.page.evaluate((msg) => {
        if (window.__walletMockBridge) {
          window.__walletMockBridge.handleMessage(msg);
        } else {
          throw new Error("Wallet mock bridge not available in browser");
        }
      }, message).catch((error) => {
        clearTimeout(timeoutId);
        this.pendingMessages.delete(messageId);
        reject(new BridgeError("Failed to send message to browser", { error, messageId }));
      });
    });
  }
  /**
   * Setup browser-side bridge code
   */
  async setupBrowserBridge() {
    await this.page.addInitScript((config) => {
      class BrowserBridge {
        constructor() {
          __publicField(this, "config", config);
          __publicField(this, "messageHandlers", /* @__PURE__ */ new Map());
          this.setupMessageHandling();
        }
        setupMessageHandling() {
          window.addEventListener("message", (event) => {
            if (event.data && event.data.__walletMockResponse) {
              this.handleResponse(event.data.response);
            }
          });
        }
        async handleMessage(message) {
          try {
            if (!this.validateMessage(message)) {
              throw new Error("Invalid message structure");
            }
            const response = await this.processMessage(message);
            this.sendResponse(message.id, { success: true, data: response });
          } catch (error) {
            this.sendResponse(message.id, {
              success: false,
              error: {
                message: error.message,
                code: error.code || "UNKNOWN_ERROR",
                stack: error.stack
              }
            });
          }
        }
        validateMessage(message) {
          if (!message || typeof message !== "object") return false;
          if (!message.id || !message.type || !message.sessionId) return false;
          if (!message.securityToken || message.securityToken.length < 16) return false;
          return true;
        }
        async processMessage(message) {
          const { type, payload } = message;
          switch (type) {
            case "install_wallet":
              return await this.handleInstallWallet(payload);
            case "remove_wallet":
              return await this.handleRemoveWallet(payload);
            case "update_config":
              return await this.handleUpdateConfig(payload);
            case "get_state":
              return await this.handleGetState(payload);
            case "cleanup_all":
              return await this.handleCleanupAll(payload);
            case "security_check":
              return await this.handleSecurityCheck(payload);
            case "heartbeat":
              return { timestamp: Date.now(), status: "alive" };
            default:
              throw new Error(`Unknown message type: ${type}`);
          }
        }
        async handleInstallWallet(payload) {
          const { createWallet } = await import("@arenaentertainment/wallet-mock");
          const wallet = await createWallet(payload.config);
          if (!window.__walletMockInstances) {
            window.__walletMockInstances = /* @__PURE__ */ new Map();
          }
          window.__walletMockInstances.set(payload.instanceId, {
            wallet,
            installedAt: Date.now(),
            config: payload.config
          });
          await this.installProviders(wallet, payload);
          return {
            instanceId: payload.instanceId,
            installedAt: Date.now(),
            supportedChains: this.getSupportedChains(wallet)
          };
        }
        async installProviders(wallet, payload) {
          var _a, _b;
          if (((_a = payload.chainTypes) == null ? void 0 : _a.includes("evm")) || !payload.chainTypes) {
            const { MockEthereumProvider } = await import("@arenaentertainment/wallet-mock-standards");
            window.ethereum = new MockEthereumProvider(wallet);
          }
          if (((_b = payload.chainTypes) == null ? void 0 : _b.includes("solana")) || !payload.chainTypes) {
            const { MockSolanaWallet } = await import("@arenaentertainment/wallet-mock-standards");
            if (!window.solana) window.solana = {};
            const solanaWallet = new MockSolanaWallet(wallet);
            if (window.solana) {
              window.solana.isPhantom = true;
              Object.assign(window.solana, solanaWallet);
            }
          }
        }
        getSupportedChains(wallet) {
          const state = wallet.getState();
          const chainTypes = /* @__PURE__ */ new Set();
          state.accounts.forEach((account) => {
            if ("evm" in account) chainTypes.add("evm");
            if ("solana" in account) chainTypes.add("solana");
          });
          return Array.from(chainTypes);
        }
        async handleRemoveWallet(payload) {
          const instances = window.__walletMockInstances;
          if (!instances || !instances.has(payload.instanceId)) {
            throw new Error(`Wallet instance not found: ${payload.instanceId}`);
          }
          const instance = instances.get(payload.instanceId);
          if (instance.wallet && typeof instance.wallet.destroy === "function") {
            await instance.wallet.destroy();
          }
          if (window.ethereum && window.ethereum.__instanceId === payload.instanceId) {
            delete window.ethereum;
          }
          if (window.solana && window.solana.__instanceId === payload.instanceId) {
            delete window.solana;
          }
          instances.delete(payload.instanceId);
          return { removed: true };
        }
        async handleUpdateConfig(payload) {
          const instances = window.__walletMockInstances;
          if (!instances || !instances.has(payload.instanceId)) {
            throw new Error(`Wallet instance not found: ${payload.instanceId}`);
          }
          const instance = instances.get(payload.instanceId);
          if (instance.wallet && typeof instance.wallet.updateConfig === "function") {
            await instance.wallet.updateConfig(payload.config);
          }
          return { updated: true };
        }
        async handleGetState(payload) {
          const instances = window.__walletMockInstances;
          if (!instances || !instances.has(payload.instanceId)) {
            return null;
          }
          const instance = instances.get(payload.instanceId);
          return instance.wallet.getState();
        }
        async handleCleanupAll() {
          const instances = window.__walletMockInstances;
          if (!instances) return { cleaned: 0 };
          let cleaned = 0;
          for (const [instanceId, instance] of instances.entries()) {
            try {
              if (instance.wallet && typeof instance.wallet.destroy === "function") {
                await instance.wallet.destroy();
              }
              cleaned++;
            } catch (error) {
              console.warn(`Failed to cleanup wallet instance ${instanceId}:`, error);
            }
          }
          instances.clear();
          delete window.ethereum;
          if (window.solana) {
            delete window.solana;
          }
          return { cleaned };
        }
        handleSecurityCheck() {
          return {
            origin: window.location.origin,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            hasInstances: !!(window.__walletMockInstances && window.__walletMockInstances.size > 0)
          };
        }
        sendResponse(messageId, response) {
          window.postMessage({
            __walletMockResponse: true,
            messageId,
            response: {
              ...response,
              messageId,
              timestamp: Date.now()
            }
          }, "*");
        }
        handleResponse(response) {
          console.debug("Bridge response:", response);
        }
      }
      window.__walletMockBridge = new BrowserBridge();
    }, this.config);
    await this.page.exposeFunction("__walletMockResponseHandler", (response) => {
      this.handleResponse(response);
    });
    await this.page.addInitScript(() => {
      window.addEventListener("message", (event) => {
        if (event.data && event.data.__walletMockResponse) {
          if (window.__walletMockResponseHandler) {
            window.__walletMockResponseHandler(event.data.response);
          }
        }
      });
    });
  }
  /**
   * Perform initial handshake with browser
   */
  async performHandshake() {
    const response = await this.sendMessage("security_check", {}, 3e3);
    this.log("debug", "Handshake completed", { response });
  }
  /**
   * Handle response from browser
   */
  handleResponse(response) {
    var _a, _b;
    const pending = this.pendingMessages.get(response.messageId);
    if (!pending) {
      this.log("warn", "Received response for unknown message", { messageId: response.messageId });
      return;
    }
    clearTimeout(pending.timeout);
    this.pendingMessages.delete(response.messageId);
    if (response.success) {
      pending.resolve(response.data);
    } else {
      const error = new BridgeError(
        ((_a = response.error) == null ? void 0 : _a.message) || "Unknown error",
        { code: (_b = response.error) == null ? void 0 : _b.code, messageId: response.messageId }
      );
      pending.reject(error);
    }
  }
  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg-${this.sessionId}-${++this.messageCounter}-${Date.now()}`;
  }
  /**
   * Log message with proper level
   */
  log(level, message, context) {
    if (!this.config.enableLogging) return;
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];
    if (messageLevel >= currentLevel) {
      const sanitisedContext = context ? sanitiseSensitiveData(context) : void 0;
      console[level](`[WalletMock Bridge] ${message}`, sanitisedContext);
    }
  }
  /**
   * Cleanup bridge resources
   */
  async cleanup() {
    try {
      for (const [messageId, pending] of this.pendingMessages.entries()) {
        clearTimeout(pending.timeout);
        pending.reject(new BridgeError("Bridge cleanup", { messageId }));
      }
      this.pendingMessages.clear();
      await this.sendMessage("cleanup_all", {}, 5e3);
      this.log("info", "Bridge cleanup completed");
    } catch (error) {
      this.log("warn", "Bridge cleanup failed", { error });
    }
  }
  /**
   * Get bridge session information
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      messageCount: this.messageCounter,
      pendingMessages: this.pendingMessages.size,
      config: this.config
    };
  }
}
const DEFAULT_WALLET_CONFIG = {
  autoConnect: true,
  security: {
    enableProductionChecks: true,
    enableSecureMemory: true,
    autoCleanup: true
  },
  debug: {
    enableLogging: true,
    logLevel: "info"
  }
};
const DEFAULT_SECURITY_CONFIG = {
  level: SecurityLevel.TESTING,
  checkProduction: true,
  validateContext: true,
  secureCleanup: true,
  maxInstances: 10,
  sessionTimeout: 30 * 60 * 1e3
  // 30 minutes
};
const DEFAULT_ISOLATION_CONFIG = {
  isolatePerTest: true,
  isolatePerContext: true,
  cleanupAfterTest: true,
  cleanupOnFailure: true
};
const installedWallets = /* @__PURE__ */ new Map();
async function installMockWallet$1(page, options = {}) {
  var _a, _b, _c;
  try {
    const env = detectEnvironment$1();
    if (env.isProduction && ((_a = options.security) == null ? void 0 : _a.checkProduction) !== false) {
      throw new SecurityViolationError("Cannot install mock wallet in production environment");
    }
    const security = { ...DEFAULT_SECURITY_CONFIG, ...options.security };
    const isolation = { ...DEFAULT_ISOLATION_CONFIG, ...options.isolation };
    const walletConfig = {
      ...DEFAULT_WALLET_CONFIG,
      ...options.config,
      accounts: options.accounts || [createDefaultAccount()]
    };
    const instanceId = options.instanceId || generateInstanceId(page);
    validateSecurityConfiguration(security, instanceId);
    if (installedWallets.has(instanceId) && !((_b = options.config) == null ? void 0 : _b.accounts)) {
      throw new InstallationError(`Wallet already installed with instance ID: ${instanceId}`);
    }
    const context = page.context();
    await validateBrowserContext(context, security);
    const bridge = new MessageBridge(page, {
      security,
      sessionTimeout: security.sessionTimeout || 30 * 60 * 1e3,
      maxMessageSize: 10 * 1024 * 1024,
      enableLogging: security.level !== SecurityLevel.STRICT,
      logLevel: env.isDevelopment ? "debug" : "info"
    });
    await bridge.initialize();
    const chainTypes = determineSupportedChainTypes(walletConfig.accounts || []);
    const installationResult = await bridge.sendMessage("install_wallet", {
      config: walletConfig,
      instanceId,
      override: ((_c = options.config) == null ? void 0 : _c.accounts) !== void 0,
      chainTypes
    }, options.timeout || 1e4);
    const result = {
      wallet: createWalletProxy(bridge, instanceId),
      instanceId,
      installedAt: installationResult.installedAt,
      supportedChains: installationResult.supportedChains
    };
    installedWallets.set(instanceId, {
      bridge,
      installationResult: result,
      page,
      context
    });
    await setupCleanupHandlers(page, context, instanceId, isolation);
    if (options.waitForReady !== false) {
      await waitForWalletReady(page, chainTypes, options.timeout || 1e4);
    }
    if (options.autoConnect !== false && walletConfig.autoConnect !== false) {
      await autoConnectWallet(result.wallet, chainTypes);
    }
    return result;
  } catch (error) {
    if (error instanceof SecurityViolationError || error instanceof InstallationError) {
      throw error;
    }
    throw new InstallationError("Failed to install mock wallet", {
      originalError: error,
      instanceId: options.instanceId,
      page: page.url()
    });
  }
}
async function removeMockWallet(instanceId, page) {
  const id = instanceId || (page ? generateInstanceId(page) : "");
  const installation = installedWallets.get(id);
  if (!installation) {
    throw new InstallationError(`Wallet instance not found: ${id}`);
  }
  try {
    await installation.bridge.sendMessage("remove_wallet", { instanceId: id });
    await installation.bridge.cleanup();
    installedWallets.delete(id);
  } catch (error) {
    throw new InstallationError("Failed to remove mock wallet", {
      originalError: error,
      instanceId: id
    });
  }
}
function getInstalledWallet(instanceId) {
  var _a;
  if (instanceId) {
    const installation = installedWallets.get(instanceId);
    return (installation == null ? void 0 : installation.installationResult) || null;
  }
  const first = installedWallets.values().next();
  return ((_a = first.value) == null ? void 0 : _a.installationResult) || null;
}
async function cleanupAllWallets() {
  const cleanupPromises = Array.from(installedWallets.entries()).map(
    async ([instanceId, installation]) => {
      try {
        await installation.bridge.sendMessage("remove_wallet", { instanceId });
        await installation.bridge.cleanup();
      } catch (error) {
        console.warn(`Failed to cleanup wallet instance ${instanceId}:`, error);
      }
    }
  );
  await Promise.allSettled(cleanupPromises);
  installedWallets.clear();
}
function createDefaultAccount() {
  return {
    type: "evm_only",
    name: "Test Account",
    evm: {
      chainIds: ["1"]
      // Ethereum mainnet
    }
  };
}
function generateInstanceId(page) {
  const url = page.url();
  const timestamp = Date.now();
  return `wallet-${Buffer.from(url).toString("base64").slice(0, 8)}-${timestamp}`;
}
function validateSecurityConfiguration(security, instanceId) {
  if (security.maxInstances && installedWallets.size >= security.maxInstances) {
    throw new SecurityViolationError(
      `Maximum wallet instances exceeded: ${security.maxInstances}`,
      { currentInstances: installedWallets.size, instanceId }
    );
  }
  validateEnvironment(security);
}
async function validateBrowserContext(context, security) {
  if (!security.validateContext) return;
  const pages = context.pages();
  if (pages.length === 0) {
    throw new SecurityViolationError("Browser context has no pages");
  }
  if (security.allowedOrigins && security.allowedOrigins.length > 0) {
    const page = pages[0];
    const url = page.url();
    const origin = new URL(url).origin;
    const isAllowed = security.allowedOrigins.some((allowed) => {
      if (allowed === "*") return true;
      return origin.includes(allowed);
    });
    if (!isAllowed) {
      throw new SecurityViolationError(
        `Origin not allowed: ${origin}`,
        { origin, allowedOrigins: security.allowedOrigins }
      );
    }
  }
}
function determineSupportedChainTypes(accounts) {
  const chainTypes = /* @__PURE__ */ new Set();
  for (const account of accounts) {
    switch (account.type) {
      case "evm_only":
        chainTypes.add("evm");
        break;
      case "solana_only":
        chainTypes.add("solana");
        break;
      case "dual_chain":
        chainTypes.add("evm");
        chainTypes.add("solana");
        break;
    }
  }
  return Array.from(chainTypes);
}
async function setupCleanupHandlers(page, context, instanceId, isolation) {
  if (!isolation.cleanupAfterTest && !isolation.cleanupOnFailure) return;
  page.on("close", async () => {
    try {
      await removeMockWallet(instanceId);
    } catch (error) {
      console.warn(`Failed to cleanup wallet on page close: ${instanceId}`, error);
    }
  });
  context.on("close", async () => {
    try {
      await removeMockWallet(instanceId);
    } catch (error) {
      console.warn(`Failed to cleanup wallet on context close: ${instanceId}`, error);
    }
  });
  if (isolation.customCleanup) {
    const originalCleanup = isolation.customCleanup;
    isolation.customCleanup = async () => {
      try {
        await removeMockWallet(instanceId);
      } catch (error) {
        console.warn(`Failed to cleanup wallet: ${instanceId}`, error);
      }
      await originalCleanup();
    };
  }
}
async function waitForWalletReady(page, chainTypes, timeout) {
  const checkWalletReady = async () => {
    return await page.evaluate((types) => {
      const checks = [];
      if (types.includes("evm") && window.ethereum) {
        checks.push(!!window.ethereum.request);
      }
      if (types.includes("solana") && window.solana) {
        checks.push(!!window.solana.connect);
      }
      return checks.length > 0 && checks.every((check) => check);
    }, chainTypes);
  };
  await page.waitForFunction(checkWalletReady, { timeout });
}
async function autoConnectWallet(wallet, chainTypes) {
  try {
    if (typeof wallet.connect === "function") {
      await wallet.connect();
    }
  } catch (error) {
    console.warn("Failed to auto-connect wallet:", error);
  }
}
function createWalletProxy(bridge, instanceId) {
  return new Proxy({}, {
    get(target, prop) {
      if (prop === "getState") {
        return async () => {
          return await bridge.sendMessage("get_state", { instanceId });
        };
      }
      if (prop === "connect") {
        return async () => {
          return true;
        };
      }
      if (prop === "disconnect") {
        return async () => {
          return true;
        };
      }
      if (prop === "destroy") {
        return async () => {
          await removeMockWallet(instanceId);
        };
      }
      return async (...args) => {
        throw new Error(`Method ${String(prop)} not implemented in wallet proxy`);
      };
    }
  });
}
const install = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  cleanupAllWallets,
  getInstalledWallet,
  installMockWallet: installMockWallet$1,
  removeMockWallet
}, Symbol.toStringTag, { value: "Module" }));
const _TestIsolationManager = class _TestIsolationManager {
  constructor() {
    __publicField(this, "testWallets", /* @__PURE__ */ new Map());
    // testId -> instanceIds
    __publicField(this, "contextWallets", /* @__PURE__ */ new Map());
    // contextId -> instanceIds
    __publicField(this, "cleanupHandlers", /* @__PURE__ */ new Map());
  }
  static getInstance() {
    if (!_TestIsolationManager.instance) {
      _TestIsolationManager.instance = new _TestIsolationManager();
    }
    return _TestIsolationManager.instance;
  }
  /**
   * Register a wallet instance for a test
   */
  registerWalletForTest(testId, instanceId, contextId) {
    if (!this.testWallets.has(testId)) {
      this.testWallets.set(testId, /* @__PURE__ */ new Set());
    }
    this.testWallets.get(testId).add(instanceId);
    if (contextId) {
      if (!this.contextWallets.has(contextId)) {
        this.contextWallets.set(contextId, /* @__PURE__ */ new Set());
      }
      this.contextWallets.get(contextId).add(instanceId);
    }
  }
  /**
   * Unregister a wallet instance
   */
  unregisterWallet(instanceId) {
    for (const [testId, instances] of this.testWallets.entries()) {
      instances.delete(instanceId);
      if (instances.size === 0) {
        this.testWallets.delete(testId);
      }
    }
    for (const [contextId, instances] of this.contextWallets.entries()) {
      instances.delete(instanceId);
      if (instances.size === 0) {
        this.contextWallets.delete(contextId);
      }
    }
  }
  /**
   * Cleanup wallets for a specific test
   */
  async cleanupTest(testId) {
    const instanceIds = this.testWallets.get(testId);
    if (!instanceIds || instanceIds.size === 0) {
      return { cleanedUpInstances: 0, errors: [], duration: 0 };
    }
    const startTime = Date.now();
    const errors = [];
    let cleanedUpInstances = 0;
    for (const instanceId of instanceIds) {
      try {
        const { removeMockWallet: removeMockWallet2 } = await Promise.resolve().then(() => install);
        await removeMockWallet2(instanceId);
        cleanedUpInstances++;
      } catch (error) {
        errors.push({
          instanceId,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }
    this.testWallets.delete(testId);
    const handlers = this.cleanupHandlers.get(testId) || [];
    for (const handler of handlers) {
      try {
        await handler();
      } catch (error) {
        console.warn("Custom cleanup handler failed:", error);
      }
    }
    this.cleanupHandlers.delete(testId);
    return {
      cleanedUpInstances,
      errors,
      duration: Date.now() - startTime
    };
  }
  /**
   * Cleanup wallets for a browser context
   */
  async cleanupContext(contextId) {
    const instanceIds = this.contextWallets.get(contextId);
    if (!instanceIds || instanceIds.size === 0) {
      return { cleanedUpInstances: 0, errors: [], duration: 0 };
    }
    const startTime = Date.now();
    const errors = [];
    let cleanedUpInstances = 0;
    for (const instanceId of instanceIds) {
      try {
        const { removeMockWallet: removeMockWallet2 } = await Promise.resolve().then(() => install);
        await removeMockWallet2(instanceId);
        cleanedUpInstances++;
      } catch (error) {
        errors.push({
          instanceId,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }
    this.contextWallets.delete(contextId);
    return {
      cleanedUpInstances,
      errors,
      duration: Date.now() - startTime
    };
  }
  /**
   * Add custom cleanup handler for a test
   */
  addCleanupHandler(testId, handler) {
    if (!this.cleanupHandlers.has(testId)) {
      this.cleanupHandlers.set(testId, []);
    }
    this.cleanupHandlers.get(testId).push(handler);
  }
  /**
   * Get all wallet instances for a test
   */
  getTestWallets(testId) {
    return Array.from(this.testWallets.get(testId) || []);
  }
  /**
   * Get all wallet instances for a context
   */
  getContextWallets(contextId) {
    return Array.from(this.contextWallets.get(contextId) || []);
  }
  /**
   * Get isolation manager state
   */
  getState() {
    return {
      testWallets: Object.fromEntries(
        Array.from(this.testWallets.entries()).map(
          ([testId, instances]) => [testId, Array.from(instances)]
        )
      ),
      contextWallets: Object.fromEntries(
        Array.from(this.contextWallets.entries()).map(
          ([contextId, instances]) => [contextId, Array.from(instances)]
        )
      ),
      cleanupHandlers: Array.from(this.cleanupHandlers.keys())
    };
  }
  /**
   * Clear all tracking (for testing purposes)
   */
  clear() {
    this.testWallets.clear();
    this.contextWallets.clear();
    this.cleanupHandlers.clear();
  }
};
__publicField(_TestIsolationManager, "instance");
let TestIsolationManager = _TestIsolationManager;
async function setupTestIsolation(testInfo, page, context, config) {
  const isolationManager = TestIsolationManager.getInstance();
  const testId = getTestId(testInfo);
  const contextId = getContextId(context);
  if (config.cleanupAfterTest) {
    isolationManager.addCleanupHandler(testId, async () => {
      await isolationManager.cleanupTest(testId);
    });
  }
  if (config.cleanupOnFailure) {
    testInfo.attach("wallet-cleanup-on-failure", {
      body: JSON.stringify({
        testId,
        contextId,
        timestamp: Date.now()
      }),
      contentType: "application/json"
    });
  }
  page.on("close", async () => {
    if (config.isolatePerTest) {
      await isolationManager.cleanupTest(testId);
    }
  });
  context.on("close", async () => {
    if (config.isolatePerContext) {
      await isolationManager.cleanupContext(contextId);
    }
  });
  if (config.customCleanup) {
    isolationManager.addCleanupHandler(testId, config.customCleanup);
  }
}
async function cleanupFailedTest(testInfo) {
  const isolationManager = TestIsolationManager.getInstance();
  const testId = getTestId(testInfo);
  return await isolationManager.cleanupTest(testId);
}
function getTestId(testInfo) {
  var _a;
  const titlePath = testInfo.titlePath.join(" > ");
  const projectName = ((_a = testInfo.project) == null ? void 0 : _a.name) || "default";
  return `${projectName}:${Buffer.from(titlePath).toString("base64")}`;
}
function getContextId(context) {
  return context._guid || `context-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
async function createIsolatedEnvironment(page, options = {}) {
  const context = page.context();
  if (options.clearStorage) {
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
  if (options.clearCookies) {
    await context.clearCookies();
  }
  if (options.blockNetworks && options.blockNetworks.length > 0) {
    await page.route((url) => {
      return options.blockNetworks.some((pattern) => url.includes(pattern));
    }, (route) => route.abort());
  }
  await page.addInitScript(() => {
    window.__WALLET_MOCK_TEST__ = true;
    window.__WALLET_MOCK_ISOLATED__ = true;
  });
}
async function validateTestIsolation(page) {
  const issues = [];
  const hasTestMarkers = await page.evaluate(() => {
    return !!window.__WALLET_MOCK_TEST__ && !!window.__WALLET_MOCK_ISOLATED__;
  });
  if (!hasTestMarkers) {
    issues.push("Test environment markers not found");
  }
  const hasExistingWallets = await page.evaluate(() => {
    return !!(window.ethereum && !window.ethereum.__WALLET_MOCK__) || !!(window.solana && !window.solana.__WALLET_MOCK__);
  });
  if (hasExistingWallets) {
    issues.push("Non-mock wallet instances detected");
  }
  const hasStorageData = await page.evaluate(() => {
    return localStorage.length > 0 || sessionStorage.length > 0;
  });
  if (hasStorageData) {
    issues.push("Storage contains data that might affect tests");
  }
  return {
    isIsolated: issues.length === 0,
    issues
  };
}
async function waitForIsolatedEnvironment(page, timeout = 5e3) {
  await page.waitForFunction(() => {
    return window.__WALLET_MOCK_TEST__ === true;
  }, { timeout });
}
class WalletHelpers {
  constructor(page) {
    this.page = page;
  }
  /**
   * Wait for wallet to be available in the page
   */
  async waitForWallet(chainType = "evm", timeout = 5e3) {
    const checkWallet = (type) => {
      if (type === "evm") {
        return window.ethereum && typeof window.ethereum.request === "function";
      } else if (type === "solana") {
        return window.solana && typeof window.solana.connect === "function";
      }
      return false;
    };
    await this.page.waitForFunction(checkWallet, chainType, { timeout });
  }
  /**
   * Connect to wallet from the page
   */
  async connectWallet(chainType = "evm") {
    if (chainType === "evm") {
      await this.page.evaluate(async () => {
        if (window.ethereum) {
          await window.ethereum.request({ method: "eth_requestAccounts" });
        }
      });
    } else if (chainType === "solana") {
      await this.page.evaluate(async () => {
        if (window.solana && window.solana.connect) {
          await window.solana.connect();
        }
      });
    }
  }
  /**
   * Disconnect wallet from the page
   */
  async disconnectWallet(chainType = "evm") {
    if (chainType === "evm") {
      await this.page.evaluate(() => {
        var _a, _b;
        if (window.ethereum && window.ethereum.__WALLET_MOCK__) {
          (_b = (_a = window.ethereum).disconnect) == null ? void 0 : _b.call(_a);
        }
      });
    } else if (chainType === "solana") {
      await this.page.evaluate(async () => {
        if (window.solana && window.solana.disconnect) {
          await window.solana.disconnect();
        }
      });
    }
  }
  /**
   * Switch to a different chain
   */
  async switchChain(chainId, chainType = "evm") {
    if (chainType === "evm") {
      await this.page.evaluate(async (id) => {
        if (window.ethereum) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: id }]
          });
        }
      }, chainId);
    } else if (chainType === "solana") {
      await this.page.evaluate((cluster) => {
        if (window.solana && window.solana.switchCluster) {
          window.solana.switchCluster(cluster);
        }
      }, chainId);
    }
  }
  /**
   * Get current account address
   */
  async getCurrentAccount(chainType = "evm") {
    if (chainType === "evm") {
      return await this.page.evaluate(async () => {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          return accounts[0] || null;
        }
        return null;
      });
    } else if (chainType === "solana") {
      return await this.page.evaluate(() => {
        if (window.solana && window.solana.publicKey) {
          return window.solana.publicKey.toString();
        }
        return null;
      });
    }
    return null;
  }
  /**
   * Sign a message
   */
  async signMessage(message, chainType = "evm") {
    if (chainType === "evm") {
      return await this.page.evaluate(async (msg) => {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length === 0) {
            throw new Error("No accounts available");
          }
          return await window.ethereum.request({
            method: "personal_sign",
            params: [msg, accounts[0]]
          });
        }
        throw new Error("Ethereum wallet not available");
      }, message);
    } else if (chainType === "solana") {
      return await this.page.evaluate(async (msg) => {
        if (window.solana && window.solana.signMessage) {
          const encodedMessage = new TextEncoder().encode(msg);
          const signature = await window.solana.signMessage(encodedMessage, "utf8");
          return Array.from(signature.signature).map((b) => b.toString(16).padStart(2, "0")).join("");
        }
        throw new Error("Solana wallet not available");
      }, message);
    }
    throw new Error(`Unsupported chain type: ${chainType}`);
  }
  /**
   * Send a transaction
   */
  async sendTransaction(to, value, chainType = "evm") {
    if (chainType === "evm") {
      return await this.page.evaluate(async (params) => {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length === 0) {
            throw new Error("No accounts available");
          }
          return await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [{
              from: accounts[0],
              to: params.to,
              value: params.value
            }]
          });
        }
        throw new Error("Ethereum wallet not available");
      }, { to, value });
    } else if (chainType === "solana") {
      return await this.page.evaluate(async (params) => {
        if (window.solana && window.solana.signAndSendTransaction) {
          throw new Error("Solana transaction sending not implemented in this example");
        }
        throw new Error("Solana wallet not available");
      }, { to, value });
    }
    throw new Error(`Unsupported chain type: ${chainType}`);
  }
  /**
   * Check if wallet is connected
   */
  async isWalletConnected(chainType = "evm") {
    if (chainType === "evm") {
      return await this.page.evaluate(async () => {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          return accounts.length > 0;
        }
        return false;
      });
    } else if (chainType === "solana") {
      return await this.page.evaluate(() => {
        return !!(window.solana && window.solana.isConnected);
      });
    }
    return false;
  }
  /**
   * Get wallet balance (simplified)
   */
  async getBalance(chainType = "evm") {
    if (chainType === "evm") {
      return await this.page.evaluate(async () => {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length === 0) {
            throw new Error("No accounts available");
          }
          return await window.ethereum.request({
            method: "eth_getBalance",
            params: [accounts[0], "latest"]
          });
        }
        throw new Error("Ethereum wallet not available");
      });
    } else if (chainType === "solana") {
      return await this.page.evaluate(async () => {
        if (window.solana && window.solana.getBalance) {
          return await window.solana.getBalance();
        }
        throw new Error("Solana wallet not available or getBalance not supported");
      });
    }
    throw new Error(`Unsupported chain type: ${chainType}`);
  }
  /**
   * Listen for wallet events
   */
  async onWalletEvent(eventName, chainType = "evm") {
    if (chainType === "evm") {
      await this.page.evaluate((event) => {
        if (window.ethereum) {
          window.ethereum.on(event, (...args) => {
            console.log(`Wallet event ${event}:`, args);
          });
        }
      }, eventName);
    } else if (chainType === "solana") {
      await this.page.evaluate((event) => {
        if (window.solana && window.solana.on) {
          window.solana.on(event, (...args) => {
            console.log(`Solana wallet event ${event}:`, args);
          });
        }
      }, eventName);
    }
  }
}
const walletInteractions = {
  /**
   * Click connect button with common selectors
   */
  async clickConnect(page) {
    const connectSelectors = [
      'button:has-text("Connect")',
      'button:has-text("Connect Wallet")',
      '[data-testid="connect-wallet"]',
      '[data-testid="wallet-connect"]',
      ".connect-wallet",
      ".wallet-connect",
      'button[aria-label="Connect wallet"]'
    ];
    for (const selector of connectSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1e3 })) {
          await element.click();
          return;
        }
      } catch {
      }
    }
    throw new Error("Connect button not found");
  },
  /**
   * Select wallet from list
   */
  async selectWallet(page, walletName = "MetaMask") {
    const walletSelectors = [
      `button:has-text("${walletName}")`,
      `[data-testid="${walletName.toLowerCase()}"]`,
      `[data-wallet="${walletName.toLowerCase()}"]`,
      `.wallet-option:has-text("${walletName}")`
    ];
    for (const selector of walletSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2e3 })) {
          await element.click();
          return;
        }
      } catch {
      }
    }
    throw new Error(`Wallet option "${walletName}" not found`);
  },
  /**
   * Handle wallet approval modal
   */
  async approveConnection(page) {
    const approveSelectors = [
      'button:has-text("Connect")',
      'button:has-text("Approve")',
      'button:has-text("Allow")',
      'button:has-text("Confirm")',
      '[data-testid="approve"]',
      '[data-testid="confirm"]',
      ".approve-button",
      ".confirm-button"
    ];
    for (const selector of approveSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2e3 })) {
          await element.click();
          return;
        }
      } catch {
      }
    }
    await page.waitForTimeout(1e3);
  },
  /**
   * Reject connection
   */
  async rejectConnection(page) {
    const rejectSelectors = [
      'button:has-text("Reject")',
      'button:has-text("Cancel")',
      'button:has-text("Deny")',
      '[data-testid="reject"]',
      '[data-testid="cancel"]',
      ".reject-button",
      ".cancel-button"
    ];
    for (const selector of rejectSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2e3 })) {
          await element.click();
          return;
        }
      } catch {
      }
    }
    throw new Error("Reject button not found");
  },
  /**
   * Wait for wallet connection status
   */
  async waitForConnectionStatus(page, connected, timeout = 5e3) {
    await page.waitForFunction(
      (expectedConnected) => {
        const isConnected = !!(window.ethereum && window.ethereum.selectedAddress || window.solana && window.solana.isConnected);
        return isConnected === expectedConnected;
      },
      connected,
      { timeout }
    );
  }
};
const accountHelpers = {
  /**
   * Create EVM-only account
   */
  createEVMAccount(chainIds = ["1"], name) {
    return {
      type: "evm_only",
      name,
      evm: { chainIds }
    };
  },
  /**
   * Create Solana-only account
   */
  createSolanaAccount(clusters = ["mainnet-beta"], name) {
    return {
      type: "solana_only",
      name,
      solana: { clusters }
    };
  },
  /**
   * Create dual-chain account
   */
  createDualChainAccount(chainIds = ["1"], clusters = ["mainnet-beta"], name) {
    return {
      type: "dual_chain",
      name,
      evm: { chainIds },
      solana: { clusters }
    };
  },
  /**
   * Create multiple test accounts
   */
  createTestAccounts(count, type = "evm_only") {
    const accounts = [];
    for (let i = 0; i < count; i++) {
      const name = `Test Account ${i + 1}`;
      switch (type) {
        case "evm_only":
          accounts.push(this.createEVMAccount(["1"], name));
          break;
        case "solana_only":
          accounts.push(this.createSolanaAccount(["mainnet-beta"], name));
          break;
        case "dual_chain":
          accounts.push(this.createDualChainAccount(["1"], ["mainnet-beta"], name));
          break;
      }
    }
    return accounts;
  }
};
const DEFAULT_FIXTURE_CONFIG = {
  defaultConfig: {
    autoConnect: true,
    security: {
      enableProductionChecks: true,
      enableSecureMemory: true,
      autoCleanup: true
    },
    debug: {
      enableLogging: false,
      logLevel: "info"
    }
  },
  defaultSecurity: {
    level: SecurityLevel.TESTING,
    checkProduction: true,
    validateContext: true,
    secureCleanup: true,
    maxInstances: 10,
    sessionTimeout: 30 * 60 * 1e3
  },
  defaultIsolation: {
    isolatePerTest: true,
    isolatePerContext: false,
    cleanupAfterTest: true,
    cleanupOnFailure: true
  },
  autoInstall: false,
  autoCleanup: true
};
const test = test$1.extend({
  /**
   * Wallet manager fixture - handles wallet lifecycle
   */
  walletManager: async ({ page, context }, use, testInfo) => {
    const isolationManager = TestIsolationManager.getInstance();
    const testId = getTestId(testInfo);
    const walletManager = {
      async initialize(pageInstance, contextInstance, options = {}) {
        const config = { ...DEFAULT_FIXTURE_CONFIG, ...options };
        await setupTestIsolation(
          testInfo,
          pageInstance,
          contextInstance,
          config.defaultIsolation
        );
        await createIsolatedEnvironment(pageInstance, {
          clearStorage: true,
          clearCookies: true
        });
      },
      async installWallet(options = {}) {
        const result = await installMockWallet$1(page, options);
        isolationManager.registerWalletForTest(
          testId,
          result.instanceId,
          context._guid
        );
        return result;
      },
      async getWallet(instanceId) {
        const installation = getInstalledWallet(instanceId);
        return (installation == null ? void 0 : installation.wallet) || null;
      },
      async removeWallet(instanceId) {
        const { removeMockWallet: removeMockWallet2 } = await Promise.resolve().then(() => install);
        await removeMockWallet2(instanceId, page);
        if (instanceId) {
          isolationManager.unregisterWallet(instanceId);
        }
      },
      async getAllWallets() {
        return [];
      },
      async cleanup() {
        await isolationManager.cleanupTest(testId);
      },
      getState() {
        return {
          instances: /* @__PURE__ */ new Map(),
          session: { id: testId, startedAt: Date.now(), lastActivity: Date.now() },
          security: {
            level: SecurityLevel.TESTING,
            validatedOrigins: /* @__PURE__ */ new Set(),
            tokenCache: /* @__PURE__ */ new Map()
          }
        };
      },
      async securityCheck() {
        return true;
      },
      async dispose() {
        await this.cleanup();
      }
    };
    await walletManager.initialize(page, context);
    await use(walletManager);
    await walletManager.cleanup();
  },
  /**
   * Install wallet helper function
   */
  installWallet: async ({ walletManager }, use) => {
    const installFunction = async (options = {}) => {
      return await walletManager.installWallet(options);
    };
    await use(installFunction);
  },
  /**
   * Get wallet helper function
   */
  getWallet: async ({ walletManager }, use) => {
    const getFunction = async (instanceId) => {
      return await walletManager.getWallet(instanceId);
    };
    await use(getFunction);
  },
  /**
   * Remove wallet helper function
   */
  removeWallet: async ({ walletManager }, use) => {
    const removeFunction = async (instanceId) => {
      await walletManager.removeWallet(instanceId);
    };
    await use(removeFunction);
  },
  /**
   * Cleanup wallets helper function
   */
  cleanupWallets: async ({ walletManager }, use) => {
    const cleanupFunction = async () => {
      await walletManager.cleanup();
    };
    await use(cleanupFunction);
  },
  /**
   * Get wallet state helper function
   */
  getWalletState: async ({ walletManager }, use) => {
    const getStateFunction = async (instanceId) => {
      const wallet = await walletManager.getWallet(instanceId);
      if (!wallet || typeof wallet.getState !== "function") {
        return null;
      }
      return await wallet.getState();
    };
    await use(getStateFunction);
  },
  /**
   * Wallet helpers utility
   */
  walletHelpers: async ({ page }, use) => {
    const helpers = new WalletHelpers(page);
    await use(helpers);
  },
  /**
   * Fixture configuration
   */
  fixtureConfig: async ({}, use) => {
    await use(DEFAULT_FIXTURE_CONFIG);
  }
});
const testWithEVMWallet = test.extend({
  /**
   * Auto-install EVM wallet before test
   */
  evmWallet: async ({ installWallet }, use) => {
    const wallet = await installWallet({
      accounts: [{
        type: "evm_only",
        name: "Test Account",
        evm: { chainIds: ["1", "137"] }
        // Ethereum + Polygon
      }],
      autoConnect: true,
      waitForReady: true
    });
    await use(wallet);
  }
});
const testWithSolanaWallet = test.extend({
  /**
   * Auto-install Solana wallet before test
   */
  solanaWallet: async ({ installWallet }, use) => {
    const wallet = await installWallet({
      accounts: [{
        type: "solana_only",
        name: "Test Account",
        solana: { clusters: ["mainnet-beta", "devnet"] }
      }],
      autoConnect: true,
      waitForReady: true
    });
    await use(wallet);
  }
});
const testWithMultiChainWallet = test.extend({
  /**
   * Auto-install multi-chain wallet before test
   */
  multiChainWallet: async ({ installWallet }, use) => {
    const wallet = await installWallet({
      accounts: [{
        type: "dual_chain",
        name: "Multi-chain Test Account",
        evm: { chainIds: ["1", "137"] },
        solana: { clusters: ["mainnet-beta"] }
      }],
      autoConnect: true,
      waitForReady: true
    });
    await use(wallet);
  }
});
const testWithErrorHandling = test.extend({
  page: async ({ page, context }, use, testInfo) => {
    page.on("pageerror", (error) => {
      console.error("Page error in test:", error);
      testInfo.attach("page-error", {
        body: error.stack || error.message,
        contentType: "text/plain"
      });
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error("Console error:", msg.text());
        testInfo.attach("console-error", {
          body: msg.text(),
          contentType: "text/plain"
        });
      }
    });
    page.on("requestfailed", (request) => {
      var _a;
      console.warn("Request failed:", request.url(), (_a = request.failure()) == null ? void 0 : _a.errorText);
    });
    await use(page);
    if (testInfo.status === "failed") {
      try {
        await cleanupFailedTest(testInfo);
        const screenshot = await page.screenshot();
        testInfo.attach("failure-screenshot", {
          body: screenshot,
          contentType: "image/png"
        });
        const walletState = await page.evaluate(() => {
          var _a;
          const state = {};
          if (window.ethereum) {
            state.ethereum = {
              isConnected: !!window.ethereum.selectedAddress,
              chainId: window.ethereum.chainId,
              selectedAddress: window.ethereum.selectedAddress
            };
          }
          if (window.solana) {
            state.solana = {
              isConnected: !!window.solana.isConnected,
              publicKey: (_a = window.solana.publicKey) == null ? void 0 : _a.toString()
            };
          }
          return state;
        });
        testInfo.attach("wallet-state-on-failure", {
          body: JSON.stringify(walletState, null, 2),
          contentType: "application/json"
        });
      } catch (cleanupError) {
        console.warn("Failed to cleanup after test failure:", cleanupError);
      }
    }
  }
});
const expectWallet = expect.extend({
  /**
   * Check if wallet is connected
   */
  async toBeConnected(page, chainType = "evm") {
    const isConnected = await page.evaluate((type) => {
      if (type === "evm") {
        return !!(window.ethereum && window.ethereum.selectedAddress);
      } else {
        return !!(window.solana && window.solana.isConnected);
      }
    }, chainType);
    return {
      message: () => `expected wallet to be ${isConnected ? "disconnected" : "connected"}`,
      pass: isConnected
    };
  },
  /**
   * Check if wallet has specific account
   */
  async toHaveAccount(page, expectedAddress, chainType = "evm") {
    const currentAddress = await page.evaluate((type) => {
      var _a, _b, _c;
      if (type === "evm") {
        return ((_a = window.ethereum) == null ? void 0 : _a.selectedAddress) || null;
      } else {
        return ((_c = (_b = window.solana) == null ? void 0 : _b.publicKey) == null ? void 0 : _c.toString()) || null;
      }
    }, chainType);
    const matches = currentAddress === expectedAddress;
    return {
      message: () => `expected wallet to have account ${expectedAddress}, but got ${currentAddress}`,
      pass: matches
    };
  },
  /**
   * Check if wallet is on specific chain
   */
  async toBeOnChain(page, expectedChainId) {
    const currentChainId = await page.evaluate(() => {
      var _a;
      return ((_a = window.ethereum) == null ? void 0 : _a.chainId) || null;
    });
    const matches = currentChainId === expectedChainId;
    return {
      message: () => `expected wallet to be on chain ${expectedChainId}, but got ${currentChainId}`,
      pass: matches
    };
  }
});
var SecurityLevel$1 = /* @__PURE__ */ ((SecurityLevel2) => {
  SecurityLevel2["DEVELOPMENT"] = "development";
  SecurityLevel2["TESTING"] = "testing";
  SecurityLevel2["STRICT"] = "strict";
  return SecurityLevel2;
})(SecurityLevel$1 || {});
var BridgeMessageType = /* @__PURE__ */ ((BridgeMessageType2) => {
  BridgeMessageType2["INSTALL_WALLET"] = "install_wallet";
  BridgeMessageType2["REMOVE_WALLET"] = "remove_wallet";
  BridgeMessageType2["UPDATE_CONFIG"] = "update_config";
  BridgeMessageType2["GET_STATE"] = "get_state";
  BridgeMessageType2["CLEANUP_ALL"] = "cleanup_all";
  BridgeMessageType2["SECURITY_CHECK"] = "security_check";
  BridgeMessageType2["HEARTBEAT"] = "heartbeat";
  return BridgeMessageType2;
})(BridgeMessageType || {});
class PlaywrightWalletError extends Error {
  constructor(message, code, context) {
    super(message);
    this.code = code;
    this.context = context;
    this.name = "PlaywrightWalletError";
  }
}
let SecurityViolationError$1 = class SecurityViolationError2 extends PlaywrightWalletError {
  constructor(message, context) {
    super(message, "SECURITY_VIOLATION", context);
    this.name = "SecurityViolationError";
  }
};
let InstallationError$1 = class InstallationError2 extends PlaywrightWalletError {
  constructor(message, context) {
    super(message, "INSTALLATION_ERROR", context);
    this.name = "InstallationError";
  }
};
let BridgeError$1 = class BridgeError2 extends PlaywrightWalletError {
  constructor(message, context) {
    super(message, "BRIDGE_ERROR", context);
    this.name = "BridgeError";
  }
};
const isPlaywrightWalletError = (error) => {
  return error instanceof Error && "code" in error;
};
const isSecurityViolationError = (error) => {
  return error instanceof SecurityViolationError$1;
};
const isInstallationError = (error) => {
  return error instanceof InstallationError$1;
};
const isBridgeError = (error) => {
  return error instanceof BridgeError$1;
};
const VERSION = "0.1.0";
const PACKAGE_NAME = "@arenaentertainment/wallet-mock-playwright";
const DEFAULT_INSTALL_OPTIONS = {
  autoConnect: true,
  waitForReady: true,
  timeout: 1e4,
  security: {
    level: SecurityLevel.TESTING,
    checkProduction: true,
    validateContext: true,
    secureCleanup: true
  },
  isolation: {
    isolatePerTest: true,
    isolatePerContext: false,
    cleanupAfterTest: true,
    cleanupOnFailure: true
  }
};
const quickSetup = {
  /**
   * Quick EVM wallet setup for tests
   */
  async evmWallet(page, chainIds = ["1"]) {
    return await installMockWallet(page, {
      accounts: [{
        type: "evm_only",
        name: "Test EVM Account",
        evm: { chainIds }
      }],
      ...DEFAULT_INSTALL_OPTIONS
    });
  },
  /**
   * Quick Solana wallet setup for tests
   */
  async solanaWallet(page, clusters = ["mainnet-beta"]) {
    return await installMockWallet(page, {
      accounts: [{
        type: "solana_only",
        name: "Test Solana Account",
        solana: { clusters }
      }],
      ...DEFAULT_INSTALL_OPTIONS
    });
  },
  /**
   * Quick multi-chain wallet setup for tests
   */
  async multiChainWallet(page, chainIds = ["1"], clusters = ["mainnet-beta"]) {
    return await installMockWallet(page, {
      accounts: [{
        type: "dual_chain",
        name: "Test Multi-chain Account",
        evm: { chainIds },
        solana: { clusters }
      }],
      ...DEFAULT_INSTALL_OPTIONS
    });
  }
};
function validateTestEnvironment() {
  const env = detectEnvironment();
  if (env.isProduction) {
    throw new SecurityViolationError(
      "Wallet mock cannot be used in production environment. This is a safety measure to prevent accidental usage in production."
    );
  }
  if (!env.isTest && !env.isDevelopment) {
    console.warn(
      "Warning: Using wallet mock in unrecognised environment. Ensure this is intended for testing purposes only."
    );
  }
}
try {
  validateTestEnvironment();
} catch (error) {
  throw error;
}
export {
  AccountType,
  BridgeError$1 as BridgeError,
  BridgeMessageType,
  CHAIN_PRESETS,
  DEFAULT_INSTALL_OPTIONS,
  DEFAULT_SECURITY_CONFIG$1 as DEFAULT_SECURITY_CONFIG,
  InstallationError$1 as InstallationError,
  MessageBridge,
  PACKAGE_NAME,
  PlaywrightWalletError,
  SecurityLevel$1 as SecurityLevel,
  SecurityViolationError$1 as SecurityViolationError,
  TestIsolationManager,
  VERSION,
  WalletHelpers,
  accountHelpers,
  cleanupAllWallets,
  cleanupFailedTest,
  createIsolatedEnvironment,
  createSecureCleanup,
  detectEnvironment$1 as detectEnvironment,
  expectWallet as expect,
  expectWallet,
  generateSecureToken,
  generateSessionId,
  getContextId,
  getInstalledWallet,
  getTestId,
  installMockWallet$1 as installMockWallet,
  isBridgeError,
  isInstallationError,
  isPlaywrightWalletError,
  isSecurityViolationError,
  quickSetup,
  removeMockWallet,
  sanitiseSensitiveData,
  securityRateLimiter,
  setupTestIsolation,
  test,
  testWithEVMWallet,
  testWithErrorHandling,
  testWithMultiChainWallet,
  testWithSolanaWallet,
  validateEnvironment,
  validateOrigin,
  validateSecurityLevel,
  validateSecurityToken,
  validateTestEnvironment,
  validateTestIsolation,
  waitForIsolatedEnvironment,
  walletInteractions
};
//# sourceMappingURL=index.js.map
