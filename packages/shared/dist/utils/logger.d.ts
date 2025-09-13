/**
 * Log levels
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}
/**
 * Logger configuration
 */
export interface LoggerConfig {
    level: LogLevel;
    prefix: string;
    enableTimestamp: boolean;
    enableColors: boolean;
}
/**
 * Mock wallet logger with security-aware logging
 */
export declare class Logger {
    private config;
    constructor(config?: Partial<LoggerConfig>);
    /**
     * Debug level logging
     */
    debug(message: string, data?: any): void;
    /**
     * Info level logging
     */
    info(message: string, data?: any): void;
    /**
     * Warning level logging
     */
    warn(message: string, data?: any): void;
    /**
     * Error level logging
     */
    error(message: string, error?: Error | any): void;
    /**
     * Security-focused logging that never logs sensitive data
     */
    security(level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, any>): void;
    /**
     * Internal logging method
     */
    private log;
    /**
     * Sanitize data to prevent logging sensitive information
     */
    private sanitizeData;
    /**
     * Sanitize metadata for security logging
     */
    private sanitizeMetadata;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map