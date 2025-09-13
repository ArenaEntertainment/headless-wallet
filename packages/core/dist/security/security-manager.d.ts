import { SecurityEvent } from './enhanced-production-guard.js';
export declare enum SecurityLevel {
    STRICT = "strict",
    STANDARD = "standard",
    PERMISSIVE = "permissive"
}
export interface SecurityManagerConfig {
    /** Security level setting */
    securityLevel: SecurityLevel;
    /** Production guard configuration */
    productionGuard: {
        enabled: boolean;
        confidenceThreshold: number;
        blockedDomains: string[];
        allowedDomains: string[];
        throwInProduction: boolean;
    };
    /** Runtime monitoring configuration */
    runtimeMonitor: {
        enabled: boolean;
        xssProtection: boolean;
        rateLimiting: boolean;
        consoleProtection: boolean;
        integrityChecks: boolean;
    };
    /** Memory protection configuration */
    memoryProtection: {
        enabled: boolean;
        secureStorage: boolean;
        autoCleanup: boolean;
        leakDetection: boolean;
    };
    /** Network security configuration */
    networkSecurity: {
        enabled: boolean;
        ssrfProtection: boolean;
        originValidation: boolean;
        requestFiltering: boolean;
    };
    /** Key management configuration */
    keyManagement: {
        enabled: boolean;
        secureGeneration: boolean;
        autoRotation: boolean;
        testKeyMarking: boolean;
    };
    /** Custom security policy */
    customPolicy?: SecurityPolicy;
    /** Event handlers */
    onSecurityEvent?: (event: SecurityEvent) => void;
    onThreatDetected?: (threat: ThreatEvent) => void;
    onSecurityViolation?: (violation: SecurityViolation) => void;
    /** Logging configuration */
    enableLogging: boolean;
    logLevel: 'info' | 'warning' | 'error' | 'critical';
}
export interface SecurityPolicy {
    /** Custom validation rules */
    validationRules: ValidationRule[];
    /** Environment restrictions */
    environmentRestrictions: EnvironmentRestriction[];
    /** Operation limits */
    operationLimits: OperationLimit[];
    /** Custom threat patterns */
    threatPatterns: ThreatPattern[];
}
export interface ValidationRule {
    name: string;
    pattern: RegExp;
    action: 'block' | 'warn' | 'log';
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
}
export interface EnvironmentRestriction {
    condition: string;
    allowed: boolean;
    message: string;
}
export interface OperationLimit {
    operation: string;
    maxPerMinute: number;
    maxPerHour: number;
    action: 'block' | 'throttle' | 'warn';
}
export interface ThreatPattern {
    name: string;
    pattern: RegExp;
    severity: 'low' | 'medium' | 'high' | 'critical';
    action: 'block' | 'warn' | 'log';
}
export interface ThreatEvent {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    message: string;
    details: any;
    timestamp: number;
    blocked: boolean;
}
export interface SecurityViolation {
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    source: string;
    message: string;
    details: any;
    timestamp: number;
    action: string;
}
export interface SecurityHealthCheck {
    overall: 'healthy' | 'warning' | 'critical';
    components: ComponentHealth[];
    recommendations: string[];
    lastCheck: number;
}
export interface ComponentHealth {
    name: string;
    status: 'healthy' | 'warning' | 'error' | 'disabled';
    message: string;
    metrics?: any;
}
/**
 * Comprehensive Security Manager
 */
export declare class SecurityManager {
    private config;
    private productionGuard;
    private securityEvents;
    private threatEvents;
    private violations;
    private operationCounters;
    private lastHealthCheck;
    constructor(config?: Partial<SecurityManagerConfig>);
    /**
     * Initialize all security components based on configuration
     */
    private initializeComponents;
    /**
     * Initialize runtime monitoring
     */
    private initializeRuntimeMonitor;
    /**
     * Setup XSS Protection
     */
    private setupXSSProtection;
    /**
     * Setup Console Protection
     */
    private setupConsoleProtection;
    /**
     * Setup Integrity Checks
     */
    private setupIntegrityChecks;
    /**
     * Initialize Memory Protection
     */
    private initializeMemoryProtection;
    /**
     * Setup Memory Leak Detection
     */
    private setupMemoryLeakDetection;
    /**
     * Initialize Network Security
     */
    private initializeNetworkSecurity;
    /**
     * Setup SSRF Protection
     */
    private setupSSRFProtection;
    /**
     * Setup Request Filtering
     */
    private setupRequestFiltering;
    /**
     * Initialize Key Management
     */
    private initializeKeyManagement;
    /**
     * Start Key Rotation
     */
    private startKeyRotation;
    /**
     * Check if URL is SSRF attempt
     */
    private isSSRFAttempt;
    /**
     * Check if content contains XSS patterns
     */
    private static containsXSSPatterns;
    /**
     * Check if data contains sensitive information
     */
    private containsSensitiveData;
    /**
     * Record security threat
     */
    private recordThreat;
    /**
     * Record security violation
     */
    private recordViolation;
    /**
     * Handle security event from other components
     */
    private handleSecurityEvent;
    /**
     * Start periodic health checks
     */
    private startPeriodicHealthChecks;
    /**
     * Perform security health check
     */
    performHealthCheck(): Promise<SecurityHealthCheck>;
    /**
     * Assess overall health
     */
    private assessOverallHealth;
    /**
     * Generate security recommendations
     */
    private generateRecommendations;
    /**
     * Get security metrics
     */
    getSecurityMetrics(): any;
    /**
     * Get event logs
     */
    getEventLogs(): {
        securityEvents: SecurityEvent[];
        threatEvents: ThreatEvent[];
        violations: SecurityViolation[];
    };
    /**
     * Logging methods
     */
    private logInfo;
    private logWarning;
    private logError;
    private shouldLog;
    /**
     * Merge configuration with defaults
     */
    private mergeWithDefaults;
}
/**
 * Create security manager with default settings
 */
export declare function createSecurityManager(config?: Partial<SecurityManagerConfig>): SecurityManager;
/**
 * Create strict security manager for production-adjacent environments
 */
export declare function createStrictSecurityManager(config?: Partial<SecurityManagerConfig>): SecurityManager;
/**
 * Create permissive security manager for development
 */
export declare function createPermissiveSecurityManager(config?: Partial<SecurityManagerConfig>): SecurityManager;
/**
 * Initialize default security for quick setup
 */
export declare function initializeDefaultSecurity(): SecurityManager;
//# sourceMappingURL=security-manager.d.ts.map