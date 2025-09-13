/**
 * Standard error codes for wallet operations
 */
export declare enum WalletErrorCode {
    NOT_CONNECTED = 4900,
    CONNECTION_FAILED = 4901,
    ALREADY_CONNECTED = 4902,
    ACCOUNT_NOT_FOUND = 4100,
    INVALID_ACCOUNT = 4101,
    ACCOUNT_ALREADY_EXISTS = 4102,
    UNSUPPORTED_CHAIN = 4902,
    CHAIN_NOT_FOUND = 4903,
    INVALID_CHAIN = 4904,
    INVALID_TRANSACTION = 4001,
    TRANSACTION_REJECTED = 4002,
    INSUFFICIENT_FUNDS = 4003,
    INVALID_SIGNATURE = 4200,
    SIGNATURE_REJECTED = 4201,
    PRODUCTION_ENVIRONMENT = 5000,
    UNSAFE_OPERATION = 5001,
    INVALID_CREDENTIALS = 5002,
    INVALID_PARAMS = 4000,
    INTERNAL_ERROR = 5003,
    NOT_IMPLEMENTED = 5004
}
/**
 * Base wallet error class
 */
export declare class WalletError extends Error {
    readonly code: WalletErrorCode;
    readonly data?: any;
    constructor(code: WalletErrorCode, message: string, data?: any);
}
/**
 * Connection related errors
 */
export declare class ConnectionError extends WalletError {
    constructor(message: string, data?: any);
}
/**
 * Account related errors
 */
export declare class AccountError extends WalletError {
    constructor(code: WalletErrorCode, message: string, data?: any);
}
/**
 * Chain related errors
 */
export declare class ChainError extends WalletError {
    constructor(code: WalletErrorCode, message: string, data?: any);
}
/**
 * Transaction related errors
 */
export declare class TransactionError extends WalletError {
    constructor(code: WalletErrorCode, message: string, data?: any);
}
/**
 * Security related errors
 */
export declare class SecurityError extends WalletError {
    constructor(code: WalletErrorCode, message: string, data?: any);
}
/**
 * Error factory functions
 */
export declare const WalletErrors: {
    notConnected: () => WalletError;
    accountNotFound: (accountId: string) => AccountError;
    unsupportedChain: (chainId: string) => ChainError;
    invalidTransaction: (reason: string) => TransactionError;
    productionEnvironment: () => SecurityError;
    invalidParams: (param: string) => WalletError;
    internalError: (message: string) => WalletError;
};
//# sourceMappingURL=errors.d.ts.map