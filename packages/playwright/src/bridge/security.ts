/**
 * @fileoverview Security utilities for Playwright integration
 *
 * This module provides security functions for validating the environment,
 * generating secure tokens, and protecting against production usage.
 */

import { SecureCrypto } from '@arenaentertainment/wallet-mock-shared';
import type {
  EnvironmentInfo,
  SecurityLevel,
  PlaywrightSecurityConfig,
  SecurityViolationError
} from '../types.js';

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: PlaywrightSecurityConfig = {
  level: SecurityLevel.TESTING,
  checkProduction: true,
  validateContext: true,
  secureCleanup: true,
  maxInstances: 10,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
};

/**
 * Environment detection keywords that indicate production
 */
const PRODUCTION_INDICATORS = [
  'production',
  'prod',
  'live',
  'deploy',
  'staging',
  'release'
];

/**
 * Test environment detection keywords
 */
const TEST_INDICATORS = [
  'test',
  'testing',
  'spec',
  'jest',
  'mocha',
  'vitest',
  'playwright',
  'cypress',
  'dev',
  'development',
  'local'
];

/**
 * Detect the current environment
 */
export function detectEnvironment(): EnvironmentInfo {
  const env = process.env;
  const nodeVersion = process.version;

  // Check for CI environment
  const isCI = !!(
    env.CI ||
    env.GITHUB_ACTIONS ||
    env.JENKINS_URL ||
    env.BUILDKITE ||
    env.CIRCLECI ||
    env.TRAVIS ||
    env.GITLAB_CI
  );

  // Check NODE_ENV
  const nodeEnv = (env.NODE_ENV || '').toLowerCase();

  // Check for production indicators
  const isProduction = PRODUCTION_INDICATORS.some(indicator =>
    nodeEnv.includes(indicator) ||
    (env.ENVIRONMENT || '').toLowerCase().includes(indicator)
  );

  // Check for test indicators
  const isTest = TEST_INDICATORS.some(indicator =>
    nodeEnv.includes(indicator) ||
    (env.ENVIRONMENT || '').toLowerCase().includes(indicator)
  ) || isCI;

  const isDevelopment = nodeEnv === 'development' || (!isProduction && !isTest);

  // Try to detect Playwright version
  let playwrightVersion: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('@playwright/test/package.json');
    playwrightVersion = pkg.version;
  } catch {
    // Playwright not available
  }

  return {
    isTest,
    isCI,
    isDevelopment,
    isProduction,
    nodeVersion,
    playwrightVersion,
  };
}

/**
 * Validate that we're not running in production
 */
export function validateEnvironment(config: PlaywrightSecurityConfig): void {
  if (!config.checkProduction) return;

  const env = detectEnvironment();

  if (env.isProduction) {
    throw new SecurityViolationError(
      'Wallet mock cannot be used in production environment',
      { environment: env }
    );
  }

  // Additional safety check for common production domains
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const productionDomains = [
      'app.com',
      'wallet.com',
      'exchange.com',
      // Add your production domains here
    ];

    if (productionDomains.some(domain => hostname.includes(domain))) {
      throw new SecurityViolationError(
        `Wallet mock cannot be used on production domain: ${hostname}`,
        { hostname, domain: window.location.href }
      );
    }
  }
}

/**
 * Generate a secure token for bridge communication
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = SecureCrypto.generateSeed(length);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString();
  const random = generateSecureToken(16);
  // Simple hash implementation since we can't use crypto.createHash
  let hash = 0;
  const input = `${timestamp}-${random}`;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash).toString(16).substring(0, 16);
}

/**
 * Validate security token
 */
export function validateSecurityToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (token.length < 16) return false;
  return /^[a-f0-9]+$/i.test(token);
}

/**
 * Create a secure message hash
 */
export function createMessageHash(messageId: string, payload: any, securityToken: string): string {
  const content = JSON.stringify({ messageId, payload, securityToken });
  // Simple hash implementation
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash + content.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Validate message integrity
 */
export function validateMessageIntegrity(
  messageId: string,
  payload: any,
  securityToken: string,
  expectedHash: string
): boolean {
  const actualHash = createMessageHash(messageId, payload, securityToken);
  return actualHash === expectedHash;
}

/**
 * Sanitise sensitive data from objects for logging
 */
export function sanitiseSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveKeys = ['privateKey', 'secretKey', 'password', 'token', 'secret'];
  const sanitised = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      (sanitised as any)[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      (sanitised as any)[key] = sanitiseSensitiveData(value);
    } else {
      (sanitised as any)[key] = value;
    }
  }

  return sanitised;
}

/**
 * Validate origin against allowed origins
 */
export function validateOrigin(origin: string, allowedOrigins?: string[]): boolean {
  if (!allowedOrigins || allowedOrigins.length === 0) {
    // If no allowed origins specified, only allow localhost and file:// for testing
    return origin.includes('localhost') ||
           origin.includes('127.0.0.1') ||
           origin.startsWith('file://') ||
           origin.includes('local.') ||
           origin.includes('.local');
  }

  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.startsWith('*')) {
      return origin.endsWith(allowed.substring(1));
    }
    return origin === allowed || origin.includes(allowed);
  });
}

/**
 * Rate limiting for security operations
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);

    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);

    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  clear(): void {
    this.attempts.clear();
  }
}

/**
 * Global rate limiter instance
 */
export const securityRateLimiter = new RateLimiter();

/**
 * Security level validation
 */
export function validateSecurityLevel(level: SecurityLevel, operation: string): void {
  const env = detectEnvironment();

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
      // Most permissive, but still block production
      if (env.isProduction) {
        throw new SecurityViolationError(
          `Operation '${operation}' not allowed in production`,
          { level, operation, environment: env }
        );
      }
      break;
  }
}

/**
 * Create secure cleanup function
 */
export function createSecureCleanup<T>(
  resource: T,
  cleanupFn: (resource: T) => Promise<void>
): () => Promise<void> {
  return async () => {
    try {
      await cleanupFn(resource);
    } catch (error) {
      // Log but don't throw - cleanup should be best effort
      console.warn('Secure cleanup failed:', error);
    }
  };
}