/**
 * @fileoverview Bridge module exports
 *
 * This module provides a secure communication bridge between Node.js test
 * environment and browser context for wallet mock operations.
 */

export { MessageBridge } from './message-bridge.js';
export {
  detectEnvironment,
  validateEnvironment,
  generateSecureToken,
  generateSessionId,
  validateSecurityToken,
  createMessageHash,
  validateMessageIntegrity,
  sanitiseSensitiveData,
  validateOrigin,
  securityRateLimiter,
  validateSecurityLevel,
  createSecureCleanup,
  DEFAULT_SECURITY_CONFIG
} from './security.js';

// Re-export types for convenience
export type {
  EnvironmentInfo,
  BridgeSetupConfig
} from '../types.js';