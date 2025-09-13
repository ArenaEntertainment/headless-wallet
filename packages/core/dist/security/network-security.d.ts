/**
 * Network Security and Request Interception
 *
 * Provides secure network request handling, validation, and protection
 * against malicious network interactions for the wallet-mock library.
 *
 * OWASP Security Controls:
 * - A03: Injection Prevention
 * - A07: Identification and Authentication Failures Prevention
 * - A10: Server-Side Request Forgery Prevention
 * - A05: Security Misconfiguration Prevention
 */
export interface NetworkSecurityConfig {
    /** Enable request validation */
    enableRequestValidation?: boolean;
    /** Enable response validation */
    enableResponseValidation?: boolean;
    /** Enable origin validation */
    enableOriginValidation?: boolean;
    /** Allowed origins for cross-origin requests */
    allowedOrigins?: string[];
    /** Blocked domains/IPs */
    blockedDomains?: string[];
    /** Maximum request size in bytes */
    maxRequestSize?: number;
    /** Request timeout in milliseconds */
    requestTimeout?: number;
    /** Enable rate limiting */
    enableRateLimit?: boolean;
    /** Maximum requests per minute */
    maxRequestsPerMinute?: number;
    /** Enable request logging */
    enableRequestLogging?: boolean;
    /** Security event callback */
    onSecurityViolation?: (violation: NetworkSecurityViolation) => void;
    /** Custom request interceptor */
    customInterceptor?: (request: InterceptedRequest) => Promise<InterceptedResponse | null>;
}
export interface NetworkSecurityViolation {
    type: 'blocked_origin' | 'blocked_domain' | 'rate_limit' | 'malicious_request' | 'invalid_response';
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    details: {
        url?: string;
        origin?: string;
        method?: string;
        headers?: Record<string, string>;
        body?: string;
        reason: string;
    };
}
export interface InterceptedRequest {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string | ArrayBuffer | Blob;
    origin?: string;
    timestamp: number;
}
export interface InterceptedResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: string | ArrayBuffer | Blob;
    timestamp: number;
}
/**
 * Network Security Manager
 *
 * Intercepts and validates network requests to prevent:
 * - SSRF attacks
 * - Malicious request injection
 * - Cross-origin attacks
 * - Rate limiting violations
 * - Sensitive data exfiltration
 */
export declare class NetworkSecurityManager {
    private config;
    private requestTrackers;
    private originalFetch?;
    private originalXMLHttpRequest?;
    private isActive;
    private readonly maliciousPatterns;
    private readonly suspiciousHeaders;
    constructor(config?: NetworkSecurityConfig);
    /**
     * Start network security monitoring
     */
    start(): void;
    /**
     * Stop network security monitoring
     */
    stop(): void;
    /**
     * Validate a URL for security issues
     */
    validateURL(url: string): {
        isValid: boolean;
        reason?: string;
    };
    /**
     * Validate request headers for security issues
     */
    validateHeaders(headers: Record<string, string>): {
        isValid: boolean;
        reason?: string;
    };
    /**
     * Validate origin against allowed origins
     */
    validateOrigin(origin: string): boolean;
    /**
     * Check rate limits for requests
     */
    checkRateLimit(origin: string): boolean;
    /**
     * Intercept fetch requests
     */
    private interceptFetch;
    /**
     * Create secure XMLHttpRequest wrapper
     */
    private createSecureXMLHttpRequest;
    /**
     * Validate an intercepted request
     */
    private validateRequest;
    /**
     * Validate response for security issues
     */
    private validateResponse;
    /**
     * Check if hostname is a private IP address
     */
    private isPrivateIP;
    /**
     * Get request origin from current context
     */
    private getRequestOrigin;
    /**
     * Normalise headers to consistent format
     */
    private normaliseHeaders;
    /**
     * Extract hostname from URL
     */
    private extractHostname;
    /**
     * Get size of request body
     */
    private getBodySize;
    /**
     * Create Response object from intercepted response
     */
    private createResponse;
    /**
     * Clean up old request trackers
     */
    private cleanupRequestTrackers;
    /**
     * Report security violation
     */
    private reportViolation;
    /**
     * Default security violation handler
     */
    private defaultViolationHandler;
}
/**
 * Create network security manager with default configuration
 */
export declare function createNetworkSecurityManager(config?: NetworkSecurityConfig): NetworkSecurityManager;
//# sourceMappingURL=network-security.d.ts.map