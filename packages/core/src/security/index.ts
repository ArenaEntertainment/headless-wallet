/**
 * Security Module for Wallet Mock Library
 *
 * Comprehensive security framework providing production environment detection,
 * runtime monitoring, memory protection, and threat detection capabilities.
 *
 * @example Basic Usage
 * ```typescript
 * import { initializeDefaultSecurity } from '@arenaentertainment/wallet-mock';
 *
 * const security = initializeDefaultSecurity();
 * ```
 *
 * @example Advanced Configuration
 * ```typescript
 * import { createSecurityManager, SecurityLevel } from '@arenaentertainment/wallet-mock';
 *
 * const security = createSecurityManager({
 *   securityLevel: SecurityLevel.STRICT,
 *   productionGuard: {
 *     blockedDomains: ['*.com', '*.org', '*prod*'],
 *     allowedDomains: ['localhost', '*.local', '*.dev']
 *   },
 *   onSecurityEvent: (event) => {
 *     if (event.severity === 'critical') {
 *       console.error('CRITICAL SECURITY EVENT:', event);
 *     }
 *   }
 * });
 * ```
 */

// =============================================================================
// Enhanced Production Guard
// =============================================================================

export {
  EnhancedProductionGuard,
  createProductionGuard,
  createStrictProductionGuard,
  type ProductionCheckResult,
  type DetectionMethod,
  type EnvironmentInfo,
  type EnhancedProductionGuardConfig,
  type OverrideConfig,
  type SecurityEvent
} from './enhanced-production-guard.js';

// =============================================================================
// Comprehensive Security Manager
// =============================================================================

export {
  SecurityManager,
  createSecurityManager,
  createStrictSecurityManager,
  createPermissiveSecurityManager,
  initializeDefaultSecurity,
  SecurityLevel,
  type SecurityManagerConfig,
  type SecurityPolicy,
  type ValidationRule,
  type EnvironmentRestriction,
  type OperationLimit,
  type ThreatPattern,
  type ThreatEvent,
  type SecurityViolation,
  type SecurityHealthCheck,
  type ComponentHealth
} from './security-manager.js';

// =============================================================================
// Security Configuration Presets
// =============================================================================

/**
 * Development security configuration
 * - Permissive settings for local development
 * - Minimal performance impact
 * - Error-level logging only
 */
export const DEVELOPMENT_SECURITY_CONFIG = {
  securityLevel: SecurityLevel.PERMISSIVE,
  productionGuard: {
    enabled: false,
    confidenceThreshold: 95,
    throwInProduction: false,
    blockedDomains: [],
    allowedDomains: ['*']
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
  logLevel: 'error' as const
};

/**
 * Testing security configuration
 * - Balanced security for testing environments
 * - Production detection enabled
 * - Warning-level logging
 */
export const TESTING_SECURITY_CONFIG = {
  securityLevel: SecurityLevel.STANDARD,
  productionGuard: {
    enabled: true,
    confidenceThreshold: 80,
    throwInProduction: true,
    blockedDomains: ['*.com', '*.org', '*.net', '*prod*', '*production*'],
    allowedDomains: ['localhost', '*.local', '*.dev', '*.test', 'test-*']
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
  logLevel: 'warning' as const
};

/**
 * Production-adjacent security configuration
 * - Strict security for staging/pre-prod environments
 * - High sensitivity production detection
 * - Info-level logging for comprehensive audit trails
 */
export const PRODUCTION_ADJACENT_SECURITY_CONFIG = {
  securityLevel: SecurityLevel.STRICT,
  productionGuard: {
    enabled: true,
    confidenceThreshold: 70,
    throwInProduction: true,
    blockedDomains: [
      '*.com', '*.org', '*.net', '*.io', '*.app',
      '*prod*', '*production*', '*live*', '*staging*', '*stage*',
      'vercel.app', 'netlify.app', 'herokuapp.com',
      'railway.app', 'render.com', 'fly.io'
    ],
    allowedDomains: ['localhost', '127.0.0.1', '*.local', '*.dev', 'dev-*']
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
  logLevel: 'info' as const
};

// =============================================================================
// Security Utilities
// =============================================================================

/**
 * Quick security setup for different environments
 */
export class SecurityPresets {
  /**
   * Initialize security for development environment
   */
  static forDevelopment(): SecurityManager {
    return createPermissiveSecurityManager(DEVELOPMENT_SECURITY_CONFIG);
  }

  /**
   * Initialize security for testing environment
   */
  static forTesting(): SecurityManager {
    return createSecurityManager(TESTING_SECURITY_CONFIG);
  }

  /**
   * Initialize security for production-adjacent environments
   */
  static forProductionAdjacent(): SecurityManager {
    return createStrictSecurityManager(PRODUCTION_ADJACENT_SECURITY_CONFIG);
  }

  /**
   * Auto-detect environment and initialize appropriate security
   */
  static autoDetect(): SecurityManager {
    if (typeof process !== 'undefined' && process.env) {
      const nodeEnv = process.env.NODE_ENV?.toLowerCase();

      switch (nodeEnv) {
        case 'development':
        case 'dev':
          return this.forDevelopment();

        case 'test':
        case 'testing':
          return this.forTesting();

        case 'production':
        case 'prod':
        case 'staging':
        case 'stage':
          return this.forProductionAdjacent();

        default:
          return this.forTesting(); // Default to testing level
      }
    }

    // Browser environment - use hostname detection
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname.toLowerCase();

      if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.dev')) {
        return this.forDevelopment();
      }

      if (hostname.includes('test') || hostname.includes('staging')) {
        return this.forTesting();
      }

      // Production-like domain
      return this.forProductionAdjacent();
    }

    // Fallback to standard security
    return initializeDefaultSecurity();
  }
}

/**
 * Security event severity levels
 */
export const SECURITY_SEVERITY = {
  INFO: 'info' as const,
  WARNING: 'warning' as const,
  ERROR: 'error' as const,
  CRITICAL: 'critical' as const
};

/**
 * Common threat patterns for custom security policies
 */
export const COMMON_THREAT_PATTERNS = {
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

/**
 * Validate security configuration
 */
export function validateSecurityConfig(config: Partial<SecurityManagerConfig>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate security level
  if (config.securityLevel && !Object.values(SecurityLevel).includes(config.securityLevel)) {
    errors.push('Invalid security level');
  }

  // Validate production guard
  if (config.productionGuard) {
    const pg = config.productionGuard;

    if (pg.confidenceThreshold !== undefined) {
      if (pg.confidenceThreshold < 0 || pg.confidenceThreshold > 100) {
        errors.push('Production guard confidence threshold must be between 0 and 100');
      }

      if (pg.confidenceThreshold < 50) {
        warnings.push('Low confidence threshold may cause false positives');
      }
    }

    if (pg.blockedDomains && pg.blockedDomains.length === 0) {
      warnings.push('No blocked domains configured - consider adding common production patterns');
    }
  }

  // Validate log level
  if (config.logLevel && !['info', 'warning', 'error', 'critical'].includes(config.logLevel)) {
    errors.push('Invalid log level');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get security recommendations based on environment
 */
export function getSecurityRecommendations(environment: 'development' | 'testing' | 'production'): string[] {
  switch (environment) {
    case 'development':
      return [
        'Use minimal security settings for development speed',
        'Enable test key marking to identify mock keys',
        'Consider enabling console protection for sensitive data',
        'Use error-level logging to reduce noise'
      ];

    case 'testing':
      return [
        'Enable production detection to catch deployment issues',
        'Use XSS protection for frontend testing',
        'Enable memory leak detection for long-running tests',
        'Configure appropriate domain allowlists',
        'Use warning-level logging for test debugging'
      ];

    case 'production':
      return [
        'NEVER use mock wallets in production',
        'Use strict security level with low confidence threshold',
        'Enable all protection mechanisms',
        'Set up comprehensive logging and monitoring',
        'Implement security event alerting',
        'Regular security health checks',
        'Use strong production detection patterns'
      ];

    default:
      return ['Use SecurityPresets.autoDetect() for automatic configuration'];
  }
}

// =============================================================================
// Security Metrics and Monitoring
// =============================================================================

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  threatEvents: number;
  violations: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  lastHealthCheck: number;
  uptime: number;
}

export interface SecurityReport {
  timestamp: number;
  metrics: SecurityMetrics;
  topThreats: ThreatEvent[];
  recentViolations: SecurityViolation[];
  recommendations: string[];
  configurationHealth: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

/**
 * Generate comprehensive security report
 */
export function generateSecurityReport(securityManager: SecurityManager): SecurityReport {
  const metrics = securityManager.getSecurityMetrics();
  const logs = securityManager.getEventLogs();

  // Get top threats by severity
  const topThreats = logs.threatEvents
    .sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    })
    .slice(0, 5);

  // Get recent violations
  const recentViolations = logs.violations
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  // Generate recommendations based on current state
  const recommendations = [];

  if (metrics.criticalEvents > 0) {
    recommendations.push('Review and address critical security events immediately');
  }

  if (metrics.threatEvents > 10) {
    recommendations.push('High number of threat events detected - review security posture');
  }

  if (metrics.healthStatus !== 'healthy') {
    recommendations.push('Security health check indicates issues - perform system review');
  }

  return {
    timestamp: Date.now(),
    metrics: {
      totalEvents: metrics.securityEvents,
      criticalEvents: logs.securityEvents.filter(e => e.severity === 'critical').length,
      threatEvents: metrics.threatEvents,
      violations: metrics.violations,
      healthStatus: metrics.overallHealth || 'healthy',
      lastHealthCheck: metrics.lastHealthCheck || 0,
      uptime: Date.now() - (metrics.lastHealthCheck || Date.now())
    },
    topThreats,
    recentViolations,
    recommendations,
    configurationHealth: validateSecurityConfig({}) // Would pass actual config in real implementation
  };
}

// =============================================================================
// Type Guards and Utilities
// =============================================================================

/**
 * Check if error is security-related
 */
export function isSecurityError(error: Error): boolean {
  const securityKeywords = [
    'security', 'production', 'blocked', 'threat', 'violation',
    'xss', 'injection', 'unauthorized', 'forbidden'
  ];

  const message = error.message.toLowerCase();
  return securityKeywords.some(keyword => message.includes(keyword));
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeForLogging(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/0x[a-fA-F0-9]{40}/g, '0x[ETHEREUM_ADDRESS]')
      .replace(/[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g, '[BITCOIN_ADDRESS]')
      .replace(/-----BEGIN\s+.*?-----[\s\S]*?-----END\s+.*?-----/gi, '[PRIVATE_KEY]')
      .replace(/\b\w+(\s+\w+){11,23}\b/g, '[MNEMONIC_PHRASE]');
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof key === 'string' && /private|secret|key|mnemonic|password/i.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }

    return sanitized;
  }

  return data;
}

// =============================================================================
// Export Default Security Instance (for convenience)
// =============================================================================

/**
 * Default security instance for quick setup
 * Automatically detects environment and configures appropriate security level
 */
export const defaultSecurity = SecurityPresets.autoDetect();

/**
 * Legacy compatibility - maintain backwards compatibility with existing production guard
 */
export { createProductionGuard as createProductionCheck };
export type { ProductionCheckResult as ProductionGuardResult };