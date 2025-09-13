/**
 * Log levels
 */
export enum LogLevel {
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
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      prefix: '[WalletMock]',
      enableTimestamp: true,
      enableColors: true,
      ...config
    };
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: any): void {
    if (this.config.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, data, '\x1b[36m'); // Cyan
    }
  }

  /**
   * Info level logging
   */
  info(message: string, data?: any): void {
    if (this.config.level <= LogLevel.INFO) {
      this.log('INFO', message, data, '\x1b[32m'); // Green
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: any): void {
    if (this.config.level <= LogLevel.WARN) {
      this.log('WARN', message, data, '\x1b[33m'); // Yellow
    }
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | any): void {
    if (this.config.level <= LogLevel.ERROR) {
      this.log('ERROR', message, error, '\x1b[31m'); // Red
    }
  }

  /**
   * Security-focused logging that never logs sensitive data
   */
  security(level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, any>): void {
    const sanitizedMetadata = metadata ? this.sanitizeMetadata(metadata) : undefined;

    switch (level) {
      case 'info':
        this.info(`[SECURITY] ${message}`, sanitizedMetadata);
        break;
      case 'warn':
        this.warn(`[SECURITY] ${message}`, sanitizedMetadata);
        break;
      case 'error':
        this.error(`[SECURITY] ${message}`, sanitizedMetadata);
        break;
    }
  }

  /**
   * Internal logging method
   */
  private log(level: string, message: string, data?: any, color?: string): void {
    const timestamp = this.config.enableTimestamp ? new Date().toISOString() : '';
    const colorStart = this.config.enableColors && color ? color : '';
    const colorEnd = this.config.enableColors ? '\x1b[0m' : '';

    const prefix = [
      this.config.prefix,
      timestamp,
      `[${level}]`
    ].filter(Boolean).join(' ');

    const fullMessage = `${colorStart}${prefix} ${message}${colorEnd}`;

    console.log(fullMessage);

    if (data !== undefined) {
      // Sanitize data before logging
      const sanitizedData = this.sanitizeData(data);
      console.log(colorStart, sanitizedData, colorEnd);
    }
  }

  /**
   * Sanitize data to prevent logging sensitive information
   */
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = [
      'privateKey',
      'secretKey',
      'mnemonic',
      'password',
      'token',
      'secret',
      'key'
    ];

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
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
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      // Only include safe metadata
      if (['accountId', 'chainId', 'method', 'timestamp', 'error', 'type'].includes(key)) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Export default logger instance
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  prefix: '[WalletMock]'
});