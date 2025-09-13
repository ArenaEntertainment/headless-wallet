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
export { EnhancedProductionGuard, createProductionGuard, createStrictProductionGuard, type ProductionCheckResult, type DetectionMethod, type EnvironmentInfo, type EnhancedProductionGuardConfig, type OverrideConfig, type SecurityEvent } from './enhanced-production-guard.js';
export { SecurityManager, createSecurityManager, createStrictSecurityManager, createPermissiveSecurityManager, initializeDefaultSecurity, SecurityLevel, type SecurityManagerConfig, type SecurityPolicy, type ValidationRule, type EnvironmentRestriction, type OperationLimit, type ThreatPattern, type ThreatEvent, type SecurityViolation, type SecurityHealthCheck, type ComponentHealth } from './security-manager.js';
/**
 * Development security configuration
 * - Permissive settings for local development
 * - Minimal performance impact
 * - Error-level logging only
 */
export declare const DEVELOPMENT_SECURITY_CONFIG: {
    securityLevel: any;
    productionGuard: {
        enabled: boolean;
        confidenceThreshold: number;
        throwInProduction: boolean;
        blockedDomains: never[];
        allowedDomains: string[];
    };
    runtimeMonitor: {
        enabled: boolean;
        xssProtection: boolean;
        rateLimiting: boolean;
        consoleProtection: boolean;
        integrityChecks: boolean;
    };
    memoryProtection: {
        enabled: boolean;
        secureStorage: boolean;
        autoCleanup: boolean;
        leakDetection: boolean;
    };
    networkSecurity: {
        enabled: boolean;
        ssrfProtection: boolean;
        originValidation: boolean;
        requestFiltering: boolean;
    };
    keyManagement: {
        enabled: boolean;
        secureGeneration: boolean;
        autoRotation: boolean;
        testKeyMarking: boolean;
    };
    enableLogging: boolean;
    logLevel: "error";
};
/**
 * Testing security configuration
 * - Balanced security for testing environments
 * - Production detection enabled
 * - Warning-level logging
 */
export declare const TESTING_SECURITY_CONFIG: {
    securityLevel: any;
    productionGuard: {
        enabled: boolean;
        confidenceThreshold: number;
        throwInProduction: boolean;
        blockedDomains: string[];
        allowedDomains: string[];
    };
    runtimeMonitor: {
        enabled: boolean;
        xssProtection: boolean;
        rateLimiting: boolean;
        consoleProtection: boolean;
        integrityChecks: boolean;
    };
    memoryProtection: {
        enabled: boolean;
        secureStorage: boolean;
        autoCleanup: boolean;
        leakDetection: boolean;
    };
    networkSecurity: {
        enabled: boolean;
        ssrfProtection: boolean;
        originValidation: boolean;
        requestFiltering: boolean;
    };
    keyManagement: {
        enabled: boolean;
        secureGeneration: boolean;
        autoRotation: boolean;
        testKeyMarking: boolean;
    };
    enableLogging: boolean;
    logLevel: "warning";
};
/**
 * Production-adjacent security configuration
 * - Strict security for staging/pre-prod environments
 * - High sensitivity production detection
 * - Info-level logging for comprehensive audit trails
 */
export declare const PRODUCTION_ADJACENT_SECURITY_CONFIG: {
    securityLevel: any;
    productionGuard: {
        enabled: boolean;
        confidenceThreshold: number;
        throwInProduction: boolean;
        blockedDomains: string[];
        allowedDomains: string[];
    };
    runtimeMonitor: {
        enabled: boolean;
        xssProtection: boolean;
        rateLimiting: boolean;
        consoleProtection: boolean;
        integrityChecks: boolean;
    };
    memoryProtection: {
        enabled: boolean;
        secureStorage: boolean;
        autoCleanup: boolean;
        leakDetection: boolean;
    };
    networkSecurity: {
        enabled: boolean;
        ssrfProtection: boolean;
        originValidation: boolean;
        requestFiltering: boolean;
    };
    keyManagement: {
        enabled: boolean;
        secureGeneration: boolean;
        autoRotation: boolean;
        testKeyMarking: boolean;
    };
    enableLogging: boolean;
    logLevel: "info";
};
/**
 * Quick security setup for different environments
 */
export declare class SecurityPresets {
    /**
     * Initialize security for development environment
     */
    static forDevelopment(): SecurityManager;
    /**
     * Initialize security for testing environment
     */
    static forTesting(): SecurityManager;
    /**
     * Initialize security for production-adjacent environments
     */
    static forProductionAdjacent(): SecurityManager;
    /**
     * Auto-detect environment and initialize appropriate security
     */
    static autoDetect(): SecurityManager;
}
/**
 * Security event severity levels
 */
export declare const SECURITY_SEVERITY: {
    INFO: "info";
    WARNING: "warning";
    ERROR: "error";
    CRITICAL: "critical";
};
/**
 * Common threat patterns for custom security policies
 */
export declare const COMMON_THREAT_PATTERNS: {
    XSS_SCRIPT: RegExp;
    XSS_JAVASCRIPT: RegExp;
    XSS_EVENT_HANDLER: RegExp;
    SQL_INJECTION: RegExp;
    COMMAND_INJECTION: RegExp;
    PATH_TRAVERSAL: RegExp;
    PRIVATE_KEY: RegExp;
    MNEMONIC_PHRASE: RegExp;
    ETHEREUM_ADDRESS: RegExp;
    BITCOIN_ADDRESS: RegExp;
};
/**
 * Validate security configuration
 */
export declare function validateSecurityConfig(config: Partial<SecurityManagerConfig>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Get security recommendations based on environment
 */
export declare function getSecurityRecommendations(environment: 'development' | 'testing' | 'production'): string[];
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
export declare function generateSecurityReport(securityManager: SecurityManager): SecurityReport;
/**
 * Check if error is security-related
 */
export declare function isSecurityError(error: Error): boolean;
/**
 * Sanitize sensitive data from logs
 */
export declare function sanitizeForLogging(data: any): any;
/**
 * Default security instance for quick setup
 * Automatically detects environment and configures appropriate security level
 */
export declare const defaultSecurity: SecurityManager;
/**
 * Legacy compatibility - maintain backwards compatibility with existing production guard
 */
export { createProductionGuard as createProductionCheck };
export type { ProductionCheckResult as ProductionGuardResult };
//# sourceMappingURL=index.d.ts.map