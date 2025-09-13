/**
 * Runtime Security Monitor
 *
 * Provides continuous security monitoring and threat detection for the
 * wallet-mock library during runtime execution.
 *
 * OWASP Security Controls:
 * - A03: Injection Prevention
 * - A07: Identification and Authentication Failures Prevention
 * - A09: Security Logging and Monitoring
 * - A10: Server-Side Request Forgery Prevention
 */
export interface SecurityThreat {
    id: string;
    type: 'injection' | 'tampering' | 'suspicious_activity' | 'rate_limit' | 'integrity_violation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: number;
    context: any;
    fingerprint: string;
}
export interface SecurityMonitorConfig {
    /** Enable injection detection */
    enableInjectionDetection?: boolean;
    /** Enable DOM tampering detection */
    enableTamperingDetection?: boolean;
    /** Enable rate limiting */
    enableRateLimit?: boolean;
    /** Enable integrity checking */
    enableIntegrityChecks?: boolean;
    /** Maximum operations per minute per endpoint */
    maxOperationsPerMinute?: number;
    /** Security event callback */
    onSecurityThreat?: (threat: SecurityThreat) => void;
    /** Enable detailed logging */
    enableDetailedLogging?: boolean;
    /** Allowed origins for cross-frame communication */
    allowedOrigins?: string[];
}
/**
 * Runtime Security Monitor
 *
 * Monitors wallet-mock operations for security violations and suspicious activity.
 */
export declare class RuntimeSecurityMonitor {
    private config;
    private rateLimitMap;
    private integrityChecks;
    private threatCounter;
    private sessionId;
    private startTime;
    private isActive;
    private readonly suspiciousPatterns;
    constructor(config?: SecurityMonitorConfig);
    /**
     * Start security monitoring
     */
    start(): void;
    /**
     * Stop security monitoring
     */
    stop(): void;
    /**
     * Validate input for injection attempts
     */
    validateInput(input: any, context: string): boolean;
    /**
     * Check rate limits for operations
     */
    checkRateLimit(operation: string, identifier?: string): boolean;
    /**
     * Validate origin for cross-frame communication
     */
    validateOrigin(origin: string): boolean;
    /**
     * Register integrity check for critical components
     */
    registerIntegrityCheck(componentId: string, content: any): void;
    /**
     * Verify component integrity
     */
    verifyIntegrity(componentId: string, currentContent: any): boolean;
    /**
     * Setup DOM tampering detection
     */
    private setupDOMTamperingDetection;
    /**
     * Setup console protection to detect debugging attempts
     */
    private setupConsoleProtection;
    /**
     * Setup storage protection
     */
    private setupStorageProtection;
    /**
     * Start periodic integrity monitoring
     */
    private startIntegrityMonitoring;
    /**
     * Check if content contains suspicious patterns
     */
    private containsSuspiciousContent;
    /**
     * Check if content contains sensitive data patterns
     */
    private containsSensitiveData;
    /**
     * Check if script source is trusted
     */
    private isTrustedScriptSource;
    /**
     * Check if attribute is potentially suspicious
     */
    private isSuspiciousAttribute;
    /**
     * Report security threat
     */
    private reportThreat;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Generate threat fingerprint for deduplication
     */
    private generateThreatFingerprint;
    /**
     * Simple hash implementation for integrity checks
     */
    private simpleHash;
    /**
     * Sanitise string for safe logging
     */
    private sanitiseString;
    /**
     * Clean up old rate limit entries
     */
    private cleanupRateLimitEntries;
    /**
     * Default threat handler
     */
    private defaultThreatHandler;
    /**
     * Logging utility
     */
    private log;
}
/**
 * Create runtime security monitor with default configuration
 */
export declare function createRuntimeSecurityMonitor(config?: SecurityMonitorConfig): RuntimeSecurityMonitor;
//# sourceMappingURL=runtime-security-monitor.d.ts.map