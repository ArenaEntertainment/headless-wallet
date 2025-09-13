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

interface RequestTracker {
  count: number;
  firstRequest: number;
  lastRequest: number;
  violations: number;
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
export class NetworkSecurityManager {
  private config: Required<NetworkSecurityConfig>;
  private requestTrackers = new Map<string, RequestTracker>();
  private originalFetch?: typeof fetch;
  private originalXMLHttpRequest?: typeof XMLHttpRequest;
  private isActive = false;

  // Known malicious patterns in URLs and headers
  private readonly maliciousPatterns = [
    // SSRF patterns
    /localhost|127\.0\.0\.1|0\.0\.0\.0|::1/i,
    /192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\./i,
    /metadata\.google\.internal|169\.254\.169\.254/i,

    // File access patterns
    /file:|ftp:|sftp:/i,
    /\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c/i,

    // Command injection patterns
    /[;&|`$]/,

    // Script injection patterns
    /<script|javascript:|vbscript:/i,

    // Common attack strings
    /union.*select|insert.*into|update.*set|delete.*from/i,
    /\beval\(|\bexec\(|\bsystem\(/i
  ];

  // Suspicious headers that might indicate attacks
  private readonly suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-original-url',
    'x-rewrite-url',
    'x-forwarded-proto',
    'x-forwarded-host'
  ];

  constructor(config: NetworkSecurityConfig = {}) {
    this.config = {
      enableRequestValidation: config.enableRequestValidation ?? true,
      enableResponseValidation: config.enableResponseValidation ?? true,
      enableOriginValidation: config.enableOriginValidation ?? true,
      allowedOrigins: config.allowedOrigins ?? [
        'http://localhost:*',
        'https://localhost:*',
        'http://127.0.0.1:*',
        'https://127.0.0.1:*'
      ],
      blockedDomains: config.blockedDomains ?? [
        'metadata.google.internal',
        '169.254.169.254',
        '::1',
        '0.0.0.0'
      ],
      maxRequestSize: config.maxRequestSize ?? 1024 * 1024, // 1MB
      requestTimeout: config.requestTimeout ?? 30000, // 30 seconds
      enableRateLimit: config.enableRateLimit ?? true,
      maxRequestsPerMinute: config.maxRequestsPerMinute ?? 60,
      enableRequestLogging: config.enableRequestLogging ?? false,
      onSecurityViolation: config.onSecurityViolation ?? this.defaultViolationHandler.bind(this),
      customInterceptor: config.customInterceptor
    };
  }

  /**
   * Start network security monitoring
   */
  start(): void {
    if (this.isActive || typeof window === 'undefined') return;

    this.isActive = true;

    // Intercept fetch API
    if (window.fetch) {
      this.originalFetch = window.fetch.bind(window);
      window.fetch = this.interceptFetch.bind(this);
    }

    // Intercept XMLHttpRequest
    if (window.XMLHttpRequest) {
      this.originalXMLHttpRequest = window.XMLHttpRequest;
      window.XMLHttpRequest = this.createSecureXMLHttpRequest();
    }

    // Cleanup request trackers periodically
    setInterval(() => this.cleanupRequestTrackers(), 60000); // Every minute

    console.info('[NetworkSecurity] Network security monitoring started');
  }

  /**
   * Stop network security monitoring
   */
  stop(): void {
    if (!this.isActive || typeof window === 'undefined') return;

    this.isActive = false;

    // Restore original fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }

    // Restore original XMLHttpRequest
    if (this.originalXMLHttpRequest) {
      window.XMLHttpRequest = this.originalXMLHttpRequest;
    }

    console.info('[NetworkSecurity] Network security monitoring stopped');
  }

  /**
   * Validate a URL for security issues
   */
  validateURL(url: string): { isValid: boolean; reason?: string } {
    try {
      const parsedUrl = new URL(url);

      // Check protocol
      if (!['http:', 'https:', 'wss:', 'ws:'].includes(parsedUrl.protocol)) {
        return {
          isValid: false,
          reason: `Unsupported protocol: ${parsedUrl.protocol}`
        };
      }

      // Check for malicious patterns
      for (const pattern of this.maliciousPatterns) {
        if (pattern.test(url)) {
          return {
            isValid: false,
            reason: `Malicious pattern detected in URL`
          };
        }
      }

      // Check blocked domains
      for (const blocked of this.config.blockedDomains) {
        if (parsedUrl.hostname.includes(blocked)) {
          return {
            isValid: false,
            reason: `Blocked domain: ${parsedUrl.hostname}`
          };
        }
      }

      // Check for private IP ranges (basic SSRF protection)
      if (this.isPrivateIP(parsedUrl.hostname)) {
        return {
          isValid: false,
          reason: `Private IP address not allowed: ${parsedUrl.hostname}`
        };
      }

      return { isValid: true };

    } catch (error) {
      return {
        isValid: false,
        reason: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate request headers for security issues
   */
  validateHeaders(headers: Record<string, string>): { isValid: boolean; reason?: string } {
    for (const [name, value] of Object.entries(headers)) {
      const lowerName = name.toLowerCase();

      // Check for suspicious headers
      if (this.suspiciousHeaders.includes(lowerName)) {
        return {
          isValid: false,
          reason: `Suspicious header detected: ${name}`
        };
      }

      // Check for injection attempts in header values
      for (const pattern of this.maliciousPatterns) {
        if (pattern.test(value)) {
          return {
            isValid: false,
            reason: `Malicious pattern detected in header ${name}`
          };
        }
      }

      // Check for overly long header values (potential DoS)
      if (value.length > 4096) {
        return {
          isValid: false,
          reason: `Header value too long: ${name}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate origin against allowed origins
   */
  validateOrigin(origin: string): boolean {
    if (!this.config.enableOriginValidation) return true;

    for (const allowedPattern of this.config.allowedOrigins) {
      // Convert wildcard pattern to regex
      const regex = new RegExp(
        allowedPattern
          .replace(/\*/g, '.*')
          .replace(/\./g, '\\.')
          .replace(/:/g, '\\:')
      );

      if (regex.test(origin)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check rate limits for requests
   */
  checkRateLimit(origin: string): boolean {
    if (!this.config.enableRateLimit) return true;

    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    let tracker = this.requestTrackers.get(origin);
    if (!tracker) {
      tracker = {
        count: 0,
        firstRequest: now,
        lastRequest: now,
        violations: 0
      };
      this.requestTrackers.set(origin, tracker);
    }

    // Reset if outside window
    if (tracker.firstRequest < windowStart) {
      tracker.count = 0;
      tracker.firstRequest = now;
    }

    tracker.count++;
    tracker.lastRequest = now;

    if (tracker.count > this.config.maxRequestsPerMinute) {
      tracker.violations++;
      return false;
    }

    return true;
  }

  /**
   * Intercept fetch requests
   */
  private async interceptFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input :
                input instanceof URL ? input.toString() :
                input.url;

    const method = init?.method || 'GET';
    const headers = this.normaliseHeaders(init?.headers || {});
    const origin = this.getRequestOrigin();

    const request: InterceptedRequest = {
      url,
      method,
      headers,
      body: init?.body,
      origin,
      timestamp: Date.now()
    };

    // Validate request
    const validationResult = await this.validateRequest(request);
    if (!validationResult.allowed) {
      throw new Error(`Request blocked: ${validationResult.reason}`);
    }

    // Apply custom interception if configured
    if (this.config.customInterceptor) {
      const customResponse = await this.config.customInterceptor(request);
      if (customResponse) {
        return this.createResponse(customResponse);
      }
    }

    // Make the request using original fetch
    try {
      const response = await this.originalFetch!(input, {
        ...init,
        signal: init?.signal || AbortSignal.timeout(this.config.requestTimeout)
      });

      // Validate response if enabled
      if (this.config.enableResponseValidation) {
        await this.validateResponse(response.clone(), request);
      }

      if (this.config.enableRequestLogging) {
        console.info('[NetworkSecurity] Request completed', {
          url,
          method,
          status: response.status,
          origin
        });
      }

      return response;

    } catch (error) {
      if (this.config.enableRequestLogging) {
        console.warn('[NetworkSecurity] Request failed', {
          url,
          method,
          error: error instanceof Error ? error.message : 'Unknown error',
          origin
        });
      }
      throw error;
    }
  }

  /**
   * Create secure XMLHttpRequest wrapper
   */
  private createSecureXMLHttpRequest(): any {
    const OriginalXHR = this.originalXMLHttpRequest!;
    const self = this;

    return function SecureXMLHttpRequest(this: any) {
      const xhr = new OriginalXHR();
      const originalOpen = xhr.open.bind(xhr);
      const originalSend = xhr.send.bind(xhr);
      const originalSetRequestHeader = xhr.setRequestHeader.bind(xhr);

      let requestUrl = '';
      let requestMethod = '';
      const requestHeaders: Record<string, string> = {};

      // Intercept open method
      xhr.open = function(method: string, url: string, ...args: any[]) {
        requestUrl = url;
        requestMethod = method;
        return originalOpen(method, url, ...args);
      };

      // Intercept setRequestHeader method
      xhr.setRequestHeader = function(name: string, value: string) {
        requestHeaders[name] = value;
        return originalSetRequestHeader(name, value);
      };

      // Intercept send method
      xhr.send = async function(body?: any) {
        const request: InterceptedRequest = {
          url: requestUrl,
          method: requestMethod,
          headers: requestHeaders,
          body,
          origin: self.getRequestOrigin(),
          timestamp: Date.now()
        };

        // Validate request
        const validationResult = await self.validateRequest(request);
        if (!validationResult.allowed) {
          // Simulate error response
          Object.defineProperty(xhr, 'status', { value: 403, configurable: true });
          Object.defineProperty(xhr, 'statusText', { value: 'Blocked by security policy', configurable: true });
          Object.defineProperty(xhr, 'responseText', { value: `Request blocked: ${validationResult.reason}`, configurable: true });

          if (xhr.onerror) {
            setTimeout(() => xhr.onerror!(new ProgressEvent('error')), 0);
          }
          return;
        }

        return originalSend(body);
      };

      return xhr;
    };
  }

  /**
   * Validate an intercepted request
   */
  private async validateRequest(request: InterceptedRequest): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // URL validation
    if (this.config.enableRequestValidation) {
      const urlValidation = this.validateURL(request.url);
      if (!urlValidation.isValid) {
        this.reportViolation('malicious_request', 'high', {
          url: request.url,
          method: request.method,
          origin: request.origin,
          reason: urlValidation.reason!
        });
        return { allowed: false, reason: urlValidation.reason };
      }
    }

    // Header validation
    if (this.config.enableRequestValidation) {
      const headerValidation = this.validateHeaders(request.headers);
      if (!headerValidation.isValid) {
        this.reportViolation('malicious_request', 'medium', {
          url: request.url,
          method: request.method,
          headers: request.headers,
          reason: headerValidation.reason!
        });
        return { allowed: false, reason: headerValidation.reason };
      }
    }

    // Origin validation
    if (request.origin && this.config.enableOriginValidation) {
      if (!this.validateOrigin(request.origin)) {
        this.reportViolation('blocked_origin', 'medium', {
          url: request.url,
          origin: request.origin,
          reason: 'Origin not in allowed list'
        });
        return { allowed: false, reason: 'Origin not allowed' };
      }
    }

    // Rate limiting
    const rateLimitKey = request.origin || this.extractHostname(request.url);
    if (!this.checkRateLimit(rateLimitKey)) {
      this.reportViolation('rate_limit', 'medium', {
        url: request.url,
        origin: request.origin,
        reason: 'Rate limit exceeded'
      });
      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    // Body size validation
    if (request.body) {
      const bodySize = this.getBodySize(request.body);
      if (bodySize > this.config.maxRequestSize) {
        this.reportViolation('malicious_request', 'medium', {
          url: request.url,
          method: request.method,
          reason: `Request body too large: ${bodySize} bytes`
        });
        return { allowed: false, reason: 'Request body too large' };
      }
    }

    return { allowed: true };
  }

  /**
   * Validate response for security issues
   */
  private async validateResponse(response: Response, request: InterceptedRequest): Promise<void> {
    // Check for suspicious response headers
    const suspiciousResponseHeaders = ['server', 'x-powered-by', 'x-aspnet-version'];

    for (const [name, value] of response.headers) {
      const lowerName = name.toLowerCase();

      if (suspiciousResponseHeaders.includes(lowerName)) {
        // Log but don't block - just informational
        if (this.config.enableRequestLogging) {
          console.warn('[NetworkSecurity] Suspicious response header', {
            url: request.url,
            header: name,
            value: value.substring(0, 100)
          });
        }
      }
    }

    // Check for potential data exfiltration in response
    try {
      const responseText = await response.text();

      // Check for sensitive patterns in response
      const sensitivePatterns = [
        /private.*key|secret.*key|api.*key/i,
        /password|passwd/i,
        /token|bearer/i,
        /0x[a-fA-F0-9]{64}/, // Private keys
        /[a-zA-Z0-9]{43,44}/ // Solana keys
      ];

      for (const pattern of sensitivePatterns) {
        if (pattern.test(responseText)) {
          this.reportViolation('invalid_response', 'high', {
            url: request.url,
            reason: 'Potential sensitive data in response',
            responseLength: responseText.length
          });
          break;
        }
      }

    } catch (error) {
      // Response not text or already consumed - skip validation
    }
  }

  /**
   * Check if hostname is a private IP address
   */
  private isPrivateIP(hostname: string): boolean {
    // IPv4 private ranges
    const privateIPv4Patterns = [
      /^127\./,                    // Loopback
      /^10\./,                     // Private Class A
      /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B
      /^192\.168\./,               // Private Class C
      /^169\.254\./,               // Link-local
      /^0\.0\.0\.0$/                // Wildcard
    ];

    // IPv6 private ranges
    const privateIPv6Patterns = [
      /^::1$/,                     // Loopback
      /^fc[0-9a-f]{2}:/i,          // Unique local
      /^fd[0-9a-f]{2}:/i,          // Unique local
      /^fe[8-9a-b][0-9a-f]:/i      // Link-local
    ];

    const allPatterns = [...privateIPv4Patterns, ...privateIPv6Patterns];
    return allPatterns.some(pattern => pattern.test(hostname));
  }

  /**
   * Get request origin from current context
   */
  private getRequestOrigin(): string {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    return 'unknown';
  }

  /**
   * Normalise headers to consistent format
   */
  private normaliseHeaders(headers: HeadersInit): Record<string, string> {
    const normalised: Record<string, string> = {};

    if (headers instanceof Headers) {
      headers.forEach((value, name) => {
        normalised[name.toLowerCase()] = value;
      });
    } else if (Array.isArray(headers)) {
      for (const [name, value] of headers) {
        normalised[name.toLowerCase()] = value;
      }
    } else if (headers) {
      for (const [name, value] of Object.entries(headers)) {
        normalised[name.toLowerCase()] = value;
      }
    }

    return normalised;
  }

  /**
   * Extract hostname from URL
   */
  private extractHostname(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  /**
   * Get size of request body
   */
  private getBodySize(body: string | ArrayBuffer | Blob): number {
    if (typeof body === 'string') {
      return new TextEncoder().encode(body).length;
    } else if (body instanceof ArrayBuffer) {
      return body.byteLength;
    } else if (body instanceof Blob) {
      return body.size;
    }
    return 0;
  }

  /**
   * Create Response object from intercepted response
   */
  private createResponse(interceptedResponse: InterceptedResponse): Response {
    return new Response(interceptedResponse.body, {
      status: interceptedResponse.status,
      statusText: interceptedResponse.statusText,
      headers: interceptedResponse.headers
    });
  }

  /**
   * Clean up old request trackers
   */
  private cleanupRequestTrackers(): void {
    const now = Date.now();
    const cutoff = now - 300000; // 5 minutes

    for (const [origin, tracker] of this.requestTrackers) {
      if (tracker.lastRequest < cutoff) {
        this.requestTrackers.delete(origin);
      }
    }
  }

  /**
   * Report security violation
   */
  private reportViolation(
    type: NetworkSecurityViolation['type'],
    severity: NetworkSecurityViolation['severity'],
    details: NetworkSecurityViolation['details']
  ): void {
    const violation: NetworkSecurityViolation = {
      type,
      severity,
      timestamp: Date.now(),
      details
    };

    this.config.onSecurityViolation(violation);
  }

  /**
   * Default security violation handler
   */
  private defaultViolationHandler(violation: NetworkSecurityViolation): void {
    const message = `[NetworkSecurity] ${violation.type.toUpperCase()}: ${violation.details.reason}`;

    switch (violation.severity) {
      case 'critical':
      case 'high':
        console.error(message, violation.details);
        break;
      case 'medium':
        console.warn(message, violation.details);
        break;
      case 'low':
        console.info(message, violation.details);
        break;
    }
  }
}

/**
 * Create network security manager with default configuration
 */
export function createNetworkSecurityManager(config: NetworkSecurityConfig = {}): NetworkSecurityManager {
  return new NetworkSecurityManager({
    enableRequestValidation: true,
    enableResponseValidation: true,
    enableOriginValidation: true,
    allowedOrigins: [
      'http://localhost:*',
      'https://localhost:*',
      'http://127.0.0.1:*',
      'https://127.0.0.1:*'
    ],
    blockedDomains: [
      'metadata.google.internal',
      '169.254.169.254',
      '::1',
      '0.0.0.0'
    ],
    maxRequestSize: 1024 * 1024, // 1MB
    requestTimeout: 30000, // 30 seconds
    enableRateLimit: true,
    maxRequestsPerMinute: 60,
    enableRequestLogging: false,
    ...config
  });
}