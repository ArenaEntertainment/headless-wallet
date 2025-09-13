/**
 * Enhanced Production Environment Detection and Guard System
 *
 * Implements multi-layered production environment detection with confidence scoring,
 * comprehensive logging, and advanced override management.
 */
export interface ProductionCheckResult {
    isProduction: boolean;
    confidence: number;
    reasons: string[];
    detectionMethods: DetectionMethod[];
    timestamp: number;
    environment: EnvironmentInfo;
}
export interface DetectionMethod {
    name: string;
    weight: number;
    result: boolean;
    confidence: number;
    details: string;
}
export interface EnvironmentInfo {
    userAgent: string;
    hostname: string;
    protocol: string;
    port: number;
    origin: string;
    nodeEnv?: string;
    ciPlatform?: string;
    dockerized: boolean;
    kubernetesDeployed: boolean;
}
export interface EnhancedProductionGuardConfig {
    /** Confidence threshold for production detection (0-100) */
    confidenceThreshold: number;
    /** Explicitly blocked domains/patterns */
    blockedDomains: string[];
    /** Explicitly allowed domains/patterns */
    allowedDomains: string[];
    /** Whether to throw on production detection */
    throwInProduction: boolean;
    /** Custom warning message */
    warningMessage?: string;
    /** Override settings */
    overrideConfig: OverrideConfig;
    /** Event handler for security events */
    onSecurityEvent?: (event: SecurityEvent) => void;
    /** Enable comprehensive logging */
    enableLogging: boolean;
}
export interface OverrideConfig {
    /** Allow temporary overrides (discouraged) */
    allowOverrides: boolean;
    /** Time limit for overrides in milliseconds */
    overrideTimeLimit: number;
    /** Required override reason */
    requireReason: boolean;
    /** Audit all override usage */
    auditOverrides: boolean;
}
export interface SecurityEvent {
    type: 'production_detection' | 'override_usage' | 'security_violation';
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    details: any;
    timestamp: number;
    source: string;
}
/**
 * Enhanced Production Guard with multi-layered detection
 */
export declare class EnhancedProductionGuard {
    private config;
    private activeOverrides;
    private detectionCache;
    private eventLog;
    constructor(config?: Partial<EnhancedProductionGuardConfig>);
    /**
     * Performs comprehensive production environment check
     */
    checkProductionEnvironment(): Promise<ProductionCheckResult>;
    /**
     * Domain pattern checking
     */
    private checkDomainPatterns;
    /**
     * Environment variables checking
     */
    private checkEnvironmentVariables;
    /**
     * Network configuration checking
     */
    private checkNetworkConfiguration;
    /**
     * CI/CD platform detection
     */
    private checkCIPlatforms;
    /**
     * Container environment detection
     */
    private checkContainerEnvironment;
    /**
     * DNS resolution checking
     */
    private checkDNSResolution;
    /**
     * SSL certificate checking
     */
    private checkSSLCertificate;
    /**
     * HTTP headers checking
     */
    private checkHttpHeaders;
    /**
     * Gather environment information
     */
    private gatherEnvironmentInfo;
    /**
     * Detect CI platform
     */
    private detectCIPlatform;
    /**
     * Detect Docker environment
     */
    private detectDocker;
    /**
     * Detect Kubernetes environment
     */
    private detectKubernetes;
    /**
     * Convert pattern to regex
     */
    private patternToRegex;
    /**
     * Check if hostname is localhost
     */
    private isLocalHost;
    /**
     * Check if string is IP address
     */
    private isIPAddress;
    /**
     * Generate cache key for detection results
     */
    private generateCacheKey;
    /**
     * Log security event
     */
    private logSecurityEvent;
    /**
     * Start cleanup timer for expired overrides
     */
    private startCleanupTimer;
    /**
     * Create temporary production override (discouraged)
     */
    createOverride(reason: string, durationMs?: number): string;
    /**
     * Check if override is active
     */
    hasActiveOverride(overrideId: string): boolean;
    /**
     * Get security event log
     */
    getEventLog(): SecurityEvent[];
    /**
     * Clear detection cache
     */
    clearCache(): void;
    /**
     * Generate unique override ID
     */
    private generateOverrideId;
    /**
     * Get creator information for audit trail
     */
    private getCreatorInfo;
}
/**
 * Create production guard with default security settings
 */
export declare function createProductionGuard(config?: Partial<EnhancedProductionGuardConfig>): EnhancedProductionGuard;
/**
 * Create strict production guard for sensitive environments
 */
export declare function createStrictProductionGuard(config?: Partial<EnhancedProductionGuardConfig>): EnhancedProductionGuard;
//# sourceMappingURL=enhanced-production-guard.d.ts.map