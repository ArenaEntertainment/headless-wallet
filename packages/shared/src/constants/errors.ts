/**
 * Standard error codes for wallet operations
 */
export enum WalletErrorCode {
  // Connection errors
  NOT_CONNECTED = 4900,
  CONNECTION_FAILED = 4901,
  ALREADY_CONNECTED = 4902,

  // Account errors
  ACCOUNT_NOT_FOUND = 4100,
  INVALID_ACCOUNT = 4101,
  ACCOUNT_ALREADY_EXISTS = 4102,

  // Chain errors
  UNSUPPORTED_CHAIN = 4902,
  CHAIN_NOT_FOUND = 4903,
  INVALID_CHAIN = 4904,

  // Transaction errors
  INVALID_TRANSACTION = 4001,
  TRANSACTION_REJECTED = 4002,
  INSUFFICIENT_FUNDS = 4003,

  // Signature errors
  INVALID_SIGNATURE = 4200,
  SIGNATURE_REJECTED = 4201,

  // Security errors
  PRODUCTION_ENVIRONMENT = 5000,
  UNSAFE_OPERATION = 5001,
  INVALID_CREDENTIALS = 5002,

  // General errors
  INVALID_PARAMS = 4000,
  INTERNAL_ERROR = 5003,
  NOT_IMPLEMENTED = 5004
}

/**
 * Base wallet error class
 */
export class WalletError extends Error {
  public readonly code: WalletErrorCode;
  public readonly data?: any;

  constructor(code: WalletErrorCode, message: string, data?: any) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    this.data = data;
  }
}

/**
 * Connection related errors
 */
export class ConnectionError extends WalletError {
  constructor(message: string, data?: any) {
    super(WalletErrorCode.CONNECTION_FAILED, message, data);
    this.name = 'ConnectionError';
  }
}

/**
 * Account related errors
 */
export class AccountError extends WalletError {
  constructor(code: WalletErrorCode, message: string, data?: any) {
    super(code, message, data);
    this.name = 'AccountError';
  }
}

/**
 * Chain related errors
 */
export class ChainError extends WalletError {
  constructor(code: WalletErrorCode, message: string, data?: any) {
    super(code, message, data);
    this.name = 'ChainError';
  }
}

/**
 * Transaction related errors
 */
export class TransactionError extends WalletError {
  constructor(code: WalletErrorCode, message: string, data?: any) {
    super(code, message, data);
    this.name = 'TransactionError';
  }
}

/**
 * Security related errors
 */
export class SecurityError extends WalletError {
  constructor(code: WalletErrorCode, message: string, data?: any) {
    super(code, message, data);
    this.name = 'SecurityError';
  }
}

/**
 * Error factory functions
 */
export const WalletErrors = {
  notConnected: () => new WalletError(
    WalletErrorCode.NOT_CONNECTED,
    'Wallet is not connected'
  ),

  accountNotFound: (accountId: string) => new AccountError(
    WalletErrorCode.ACCOUNT_NOT_FOUND,
    `Account not found: ${accountId}`,
    { accountId }
  ),

  unsupportedChain: (chainId: string) => new ChainError(
    WalletErrorCode.UNSUPPORTED_CHAIN,
    `Unsupported chain: ${chainId}`,
    { chainId }
  ),

  invalidTransaction: (reason: string) => new TransactionError(
    WalletErrorCode.INVALID_TRANSACTION,
    `Invalid transaction: ${reason}`,
    { reason }
  ),

  productionEnvironment: () => new SecurityError(
    WalletErrorCode.PRODUCTION_ENVIRONMENT,
    'Mock wallet cannot be used in production environment'
  ),

  invalidParams: (param: string) => new WalletError(
    WalletErrorCode.INVALID_PARAMS,
    `Invalid parameter: ${param}`,
    { param }
  ),

  internalError: (message: string) => new WalletError(
    WalletErrorCode.INTERNAL_ERROR,
    `Internal error: ${message}`
  )
};