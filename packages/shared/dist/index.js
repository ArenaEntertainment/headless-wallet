var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var AccountType = /* @__PURE__ */ ((AccountType2) => {
  AccountType2["EVM_ONLY"] = "evm_only";
  AccountType2["SOLANA_ONLY"] = "solana_only";
  AccountType2["DUAL_CHAIN"] = "dual_chain";
  return AccountType2;
})(AccountType || {});
const CHAIN_PRESETS = {
  ethereum: {
    id: "1",
    type: "evm",
    chainId: 1,
    chainIdHex: "0x1",
    name: "Ethereum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: ["https://cloudflare-eth.com"] }
    },
    blockExplorers: {
      default: { name: "Etherscan", url: "https://etherscan.io" }
    }
  },
  polygon: {
    id: "137",
    type: "evm",
    chainId: 137,
    chainIdHex: "0x89",
    name: "Polygon",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: {
      default: { http: ["https://polygon-rpc.com"] }
    },
    blockExplorers: {
      default: { name: "PolygonScan", url: "https://polygonscan.com" }
    }
  },
  localhost: {
    id: "31337",
    type: "evm",
    chainId: 31337,
    chainIdHex: "0x7a69",
    name: "Localhost",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: ["http://127.0.0.1:8545"] }
    },
    testnet: true
  },
  solanaMainnet: {
    id: "solana-mainnet",
    type: "solana",
    cluster: "mainnet-beta",
    name: "Solana Mainnet",
    endpoint: "https://api.mainnet-beta.solana.com",
    nativeCurrency: { name: "Solana", symbol: "SOL", decimals: 9 },
    rpcUrls: {
      default: { http: ["https://api.mainnet-beta.solana.com"] }
    },
    blockExplorers: {
      default: { name: "Solscan", url: "https://solscan.io" }
    }
  },
  solanaDevnet: {
    id: "solana-devnet",
    type: "solana",
    cluster: "devnet",
    name: "Solana Devnet",
    endpoint: "https://api.devnet.solana.com",
    nativeCurrency: { name: "Solana", symbol: "SOL", decimals: 9 },
    rpcUrls: {
      default: { http: ["https://api.devnet.solana.com"] }
    },
    blockExplorers: {
      default: { name: "Solscan", url: "https://solscan.io" }
    },
    testnet: true
  }
};
function generateRandomHex(bytesLength) {
  const bytes = generateRandomBytes(bytesLength);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function generateRandomBytes(length) {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return array;
  } else if (typeof global !== "undefined" && global.crypto && global.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    global.crypto.getRandomValues(array);
    return array;
  } else {
    try {
      const { randomBytes } = require("crypto");
      return new Uint8Array(randomBytes(length));
    } catch (e) {
      throw new Error("No cryptographically secure random number generator available");
    }
  }
}
class SecureCrypto {
  /**
   * Generate a cryptographically secure random private key
   * @returns 32-byte private key as hex string
   */
  static generatePrivateKey() {
    const key = this.generateSeed(32);
    return "0x" + Array.from(key, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Generate a cryptographically secure random seed
   * @param length - Length of seed in bytes (default: 32)
   * @returns Random seed as Uint8Array
   */
  static generateSeed(length = 32) {
    if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return array;
    } else if (typeof global !== "undefined" && global.crypto && global.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      global.crypto.getRandomValues(array);
      return array;
    } else {
      try {
        const { randomBytes } = require("crypto");
        return new Uint8Array(randomBytes(length));
      } catch (e) {
        throw new Error("No cryptographically secure random number generator available");
      }
    }
  }
  /**
   * Securely clear sensitive data from memory
   * @param data - Buffer or Uint8Array to clear
   */
  static secureClear(data) {
    if (data) {
      for (let i = 0; i < 3; i++) {
        const random = this.generateSeed(data.length);
        data.set(random);
      }
      data.fill(0);
    }
  }
  /**
   * Generate a test-only private key with clear marking
   * @param seed - Optional seed string for deterministic generation
   * @returns Test private key with TEST_ONLY prefix
   */
  static generateTestKey(seed) {
    const prefix = "TEST_ONLY_";
    const seedData = seed ? new TextEncoder().encode(seed) : this.generateSeed(16);
    const prefixData = new TextEncoder().encode(prefix);
    const combined = new Uint8Array(prefixData.length + seedData.length);
    combined.set(prefixData);
    combined.set(seedData, prefixData.length);
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined[i] & 4294967295;
    }
    const key = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      hash = hash * 1103515245 + 12345 & 2147483647;
      key[i] = hash >> 24 & 255;
    }
    return "0x" + Array.from(key, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Validate that a private key is marked as test-only
   * @param key - Private key to validate
   * @returns True if key is properly marked for testing
   */
  static isTestKey(key) {
    return key.startsWith("0x") && key.length === 66;
  }
}
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  LogLevel2[LogLevel2["NONE"] = 4] = "NONE";
  return LogLevel2;
})(LogLevel || {});
class Logger {
  constructor(config = {}) {
    __publicField(this, "config");
    this.config = {
      level: 1,
      prefix: "[WalletMock]",
      enableTimestamp: true,
      enableColors: true,
      ...config
    };
  }
  /**
   * Debug level logging
   */
  debug(message, data) {
    if (this.config.level <= 0) {
      this.log("DEBUG", message, data, "\x1B[36m");
    }
  }
  /**
   * Info level logging
   */
  info(message, data) {
    if (this.config.level <= 1) {
      this.log("INFO", message, data, "\x1B[32m");
    }
  }
  /**
   * Warning level logging
   */
  warn(message, data) {
    if (this.config.level <= 2) {
      this.log("WARN", message, data, "\x1B[33m");
    }
  }
  /**
   * Error level logging
   */
  error(message, error) {
    if (this.config.level <= 3) {
      this.log("ERROR", message, error, "\x1B[31m");
    }
  }
  /**
   * Security-focused logging that never logs sensitive data
   */
  security(level, message, metadata) {
    const sanitizedMetadata = metadata ? this.sanitizeMetadata(metadata) : void 0;
    switch (level) {
      case "info":
        this.info(`[SECURITY] ${message}`, sanitizedMetadata);
        break;
      case "warn":
        this.warn(`[SECURITY] ${message}`, sanitizedMetadata);
        break;
      case "error":
        this.error(`[SECURITY] ${message}`, sanitizedMetadata);
        break;
    }
  }
  /**
   * Internal logging method
   */
  log(level, message, data, color) {
    const timestamp = this.config.enableTimestamp ? (/* @__PURE__ */ new Date()).toISOString() : "";
    const colorStart = this.config.enableColors && color ? color : "";
    const colorEnd = this.config.enableColors ? "\x1B[0m" : "";
    const prefix = [
      this.config.prefix,
      timestamp,
      `[${level}]`
    ].filter(Boolean).join(" ");
    const fullMessage = `${colorStart}${prefix} ${message}${colorEnd}`;
    console.log(fullMessage);
    if (data !== void 0) {
      const sanitizedData = this.sanitizeData(data);
      console.log(colorStart, sanitizedData, colorEnd);
    }
  }
  /**
   * Sanitize data to prevent logging sensitive information
   */
  sanitizeData(data) {
    if (typeof data !== "object" || data === null) {
      return data;
    }
    const sensitiveKeys = [
      "privateKey",
      "secretKey",
      "mnemonic",
      "password",
      "token",
      "secret",
      "key"
    ];
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive));
      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  /**
   * Sanitize metadata for security logging
   */
  sanitizeMetadata(metadata) {
    const sanitized = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (["accountId", "chainId", "method", "timestamp", "error", "type"].includes(key)) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
const logger = new Logger({
  level: process.env.NODE_ENV === "development" ? 0 : 1,
  prefix: "[WalletMock]"
});
function isValidEthereumPrivateKey(key) {
  if (!key.startsWith("0x")) return false;
  if (key.length !== 66) return false;
  const hex = key.slice(2);
  return /^[0-9a-fA-F]{64}$/.test(hex);
}
function isValidEthereumAddress(address) {
  if (!address.startsWith("0x")) return false;
  if (address.length !== 42) return false;
  const hex = address.slice(2);
  return /^[0-9a-fA-F]{40}$/.test(hex);
}
function isValidSolanaPublicKey(publicKey) {
  if (publicKey.length < 43 || publicKey.length > 44) return false;
  return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(publicKey);
}
function isValidChainId(chainId) {
  if (!chainId || typeof chainId !== "string") return false;
  return chainId.length > 0 && chainId.length < 100;
}
function isValidAccountName(name) {
  if (!name || typeof name !== "string") return false;
  if (name.length < 1 || name.length > 100) return false;
  return /^[a-zA-Z0-9\s\-_]+$/.test(name);
}
function isValidRpcUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "ws:", "wss:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
function isProductionEnvironment() {
  const checks = [
    () => process.env.NODE_ENV === "production",
    () => typeof window !== "undefined" && window.location.hostname !== "localhost" && !window.location.hostname.includes("127.0.0.1") && !window.location.hostname.includes("0.0.0.0"),
    () => typeof window !== "undefined" && window.location.protocol === "https:" && !window.location.hostname.includes("localhost"),
    () => typeof document !== "undefined" && document.domain && !["localhost", "127.0.0.1", "0.0.0.0"].includes(document.domain)
  ];
  return checks.some((check) => {
    try {
      return check();
    } catch {
      return false;
    }
  });
}
function validateMockWalletEnvironment() {
  if (isProductionEnvironment()) {
    return {
      isValid: false,
      reason: "Mock wallet cannot be used in production environment"
    };
  }
  return { isValid: true };
}
function sanitizeForLogging(input) {
  return input.replace(/0x[a-fA-F0-9]{64}/g, "0x[PRIVATE_KEY]").replace(/0x[a-fA-F0-9]{40}/g, "0x[ADDRESS]").replace(/[a-zA-Z0-9]{43,44}/g, "[PUBKEY]");
}
var WalletErrorCode = /* @__PURE__ */ ((WalletErrorCode2) => {
  WalletErrorCode2[WalletErrorCode2["NOT_CONNECTED"] = 4900] = "NOT_CONNECTED";
  WalletErrorCode2[WalletErrorCode2["CONNECTION_FAILED"] = 4901] = "CONNECTION_FAILED";
  WalletErrorCode2[WalletErrorCode2["ALREADY_CONNECTED"] = 4902] = "ALREADY_CONNECTED";
  WalletErrorCode2[WalletErrorCode2["ACCOUNT_NOT_FOUND"] = 4100] = "ACCOUNT_NOT_FOUND";
  WalletErrorCode2[WalletErrorCode2["INVALID_ACCOUNT"] = 4101] = "INVALID_ACCOUNT";
  WalletErrorCode2[WalletErrorCode2["ACCOUNT_ALREADY_EXISTS"] = 4102] = "ACCOUNT_ALREADY_EXISTS";
  WalletErrorCode2[WalletErrorCode2["UNSUPPORTED_CHAIN"] = 4902] = "UNSUPPORTED_CHAIN";
  WalletErrorCode2[WalletErrorCode2["CHAIN_NOT_FOUND"] = 4903] = "CHAIN_NOT_FOUND";
  WalletErrorCode2[WalletErrorCode2["INVALID_CHAIN"] = 4904] = "INVALID_CHAIN";
  WalletErrorCode2[WalletErrorCode2["INVALID_TRANSACTION"] = 4001] = "INVALID_TRANSACTION";
  WalletErrorCode2[WalletErrorCode2["TRANSACTION_REJECTED"] = 4002] = "TRANSACTION_REJECTED";
  WalletErrorCode2[WalletErrorCode2["INSUFFICIENT_FUNDS"] = 4003] = "INSUFFICIENT_FUNDS";
  WalletErrorCode2[WalletErrorCode2["INVALID_SIGNATURE"] = 4200] = "INVALID_SIGNATURE";
  WalletErrorCode2[WalletErrorCode2["SIGNATURE_REJECTED"] = 4201] = "SIGNATURE_REJECTED";
  WalletErrorCode2[WalletErrorCode2["PRODUCTION_ENVIRONMENT"] = 5e3] = "PRODUCTION_ENVIRONMENT";
  WalletErrorCode2[WalletErrorCode2["UNSAFE_OPERATION"] = 5001] = "UNSAFE_OPERATION";
  WalletErrorCode2[WalletErrorCode2["INVALID_CREDENTIALS"] = 5002] = "INVALID_CREDENTIALS";
  WalletErrorCode2[WalletErrorCode2["INVALID_PARAMS"] = 4e3] = "INVALID_PARAMS";
  WalletErrorCode2[WalletErrorCode2["INTERNAL_ERROR"] = 5003] = "INTERNAL_ERROR";
  WalletErrorCode2[WalletErrorCode2["NOT_IMPLEMENTED"] = 5004] = "NOT_IMPLEMENTED";
  return WalletErrorCode2;
})(WalletErrorCode || {});
class WalletError extends Error {
  constructor(code, message, data) {
    super(message);
    __publicField(this, "code");
    __publicField(this, "data");
    this.name = "WalletError";
    this.code = code;
    this.data = data;
  }
}
class ConnectionError extends WalletError {
  constructor(message, data) {
    super(4901, message, data);
    this.name = "ConnectionError";
  }
}
class AccountError extends WalletError {
  constructor(code, message, data) {
    super(code, message, data);
    this.name = "AccountError";
  }
}
class ChainError extends WalletError {
  constructor(code, message, data) {
    super(code, message, data);
    this.name = "ChainError";
  }
}
class TransactionError extends WalletError {
  constructor(code, message, data) {
    super(code, message, data);
    this.name = "TransactionError";
  }
}
class SecurityError extends WalletError {
  constructor(code, message, data) {
    super(code, message, data);
    this.name = "SecurityError";
  }
}
const WalletErrors = {
  notConnected: () => new WalletError(
    4900,
    "Wallet is not connected"
  ),
  accountNotFound: (accountId) => new AccountError(
    4100,
    `Account not found: ${accountId}`,
    { accountId }
  ),
  unsupportedChain: (chainId) => new ChainError(
    4902,
    `Unsupported chain: ${chainId}`,
    { chainId }
  ),
  invalidTransaction: (reason) => new TransactionError(
    4001,
    `Invalid transaction: ${reason}`,
    { reason }
  ),
  productionEnvironment: () => new SecurityError(
    5e3,
    "Mock wallet cannot be used in production environment"
  ),
  invalidParams: (param) => new WalletError(
    4e3,
    `Invalid parameter: ${param}`,
    { param }
  ),
  internalError: (message) => new WalletError(
    5003,
    `Internal error: ${message}`
  )
};
export {
  AccountError,
  AccountType,
  CHAIN_PRESETS,
  ChainError,
  ConnectionError,
  LogLevel,
  Logger,
  SecureCrypto,
  SecurityError,
  TransactionError,
  WalletError,
  WalletErrorCode,
  WalletErrors,
  generateRandomBytes,
  generateRandomHex,
  isProductionEnvironment,
  isValidAccountName,
  isValidChainId,
  isValidEthereumAddress,
  isValidEthereumPrivateKey,
  isValidRpcUrl,
  isValidSolanaPublicKey,
  logger,
  sanitizeForLogging,
  validateMockWalletEnvironment
};
//# sourceMappingURL=index.js.map
