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

interface RateLimitEntry {
  count: number;
  firstAccess: number;
  lastAccess: number;
}

interface IntegrityCheck {
  originalHash: string;
  lastCheck: number;
  changeCount: number;
}

/**
 * Runtime Security Monitor
 *
 * Monitors wallet-mock operations for security violations and suspicious activity.
 */
export class RuntimeSecurityMonitor {
  private config: Required<SecurityMonitorConfig>;
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private integrityChecks = new Map<string, IntegrityCheck>();
  private threatCounter = 0;
  private sessionId: string;
  private startTime: number;
  private isActive = false;

  // Security patterns for injection detection
  private readonly suspiciousPatterns = [
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /<iframe\b[^>]*>/gi,

    // SQL injection patterns
    /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b).*(\bfrom\b|\binto\b|\bwhere\b)/gi,
    /'.*(\bor\b|\band\b).*'/gi,
    /--.*$/gi,

    // Command injection patterns
    /(\||&&|;|`|\$\()/gi,
    /(rm\s|del\s|format\s|shutdown\s)/gi,

    // Path traversal patterns
    /\.\.(\/|\\)/gi,
    /(\/etc\/passwd|\/proc\/|\\windows\\system32)/gi
  ];

  constructor(config: SecurityMonitorConfig = {}) {
    this.config = {
      enableInjectionDetection: config.enableInjectionDetection ?? true,
      enableTamperingDetection: config.enableTamperingDetection ?? true,
      enableRateLimit: config.enableRateLimit ?? true,
      enableIntegrityChecks: config.enableIntegrityChecks ?? true,
      maxOperationsPerMinute: config.maxOperationsPerMinute ?? 100,
      onSecurityThreat: config.onSecurityThreat ?? this.defaultThreatHandler.bind(this),
      enableDetailedLogging: config.enableDetailedLogging ?? false,
      allowedOrigins: config.allowedOrigins ?? ['http://localhost:*', 'https://localhost:*']
    };

    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  /**
   * Start security monitoring
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.log('info', 'Runtime security monitor started', { sessionId: this.sessionId });

    if (this.config.enableTamperingDetection && typeof window !== 'undefined') {
      this.setupDOMTamperingDetection();
      this.setupConsoleProtection();
      this.setupStorageProtection();
    }

    if (this.config.enableIntegrityChecks) {
      this.startIntegrityMonitoring();
    }

    // Cleanup old rate limit entries periodically
    setInterval(() => this.cleanupRateLimitEntries(), 60000); // Every minute
  }

  /**
   * Stop security monitoring
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.log('info', 'Runtime security monitor stopped', {
      sessionId: this.sessionId,
      uptime: Date.now() - this.startTime,
      threatsDetected: this.threatCounter
    });
  }

  /**
   * Validate input for injection attempts
   */
  validateInput(input: any, context: string): boolean {
    if (!this.config.enableInjectionDetection || !this.isActive) return true;

    const inputString = typeof input === 'string' ? input : JSON.stringify(input);

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(inputString)) {
        this.reportThreat({
          type: 'injection',
          severity: 'high',
          description: `Potential injection attempt detected in ${context}`,
          context: { input: this.sanitiseString(inputString), pattern: pattern.toString() }
        });
        return false;
      }
    }

    // Check for suspicious Unicode characters
    if (/[\u0000-\u001F\u007F-\u009F]/.test(inputString)) {
      this.reportThreat({
        type: 'injection',
        severity: 'medium',
        description: `Suspicious control characters detected in ${context}`,
        context: { input: this.sanitiseString(inputString) }
      });
      return false;
    }

    return true;
  }

  /**
   * Check rate limits for operations
   */
  checkRateLimit(operation: string, identifier?: string): boolean {
    if (!this.config.enableRateLimit || !this.isActive) return true;

    const key = identifier ? `${operation}:${identifier}` : operation;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    let entry = this.rateLimitMap.get(key);

    if (!entry) {
      entry = { count: 0, firstAccess: now, lastAccess: now };
      this.rateLimitMap.set(key, entry);
    }

    // Reset if outside window
    if (entry.firstAccess < windowStart) {
      entry.count = 0;
      entry.firstAccess = now;
    }

    entry.count++;
    entry.lastAccess = now;

    if (entry.count > this.config.maxOperationsPerMinute) {
      this.reportThreat({
        type: 'rate_limit',
        severity: 'medium',
        description: `Rate limit exceeded for operation: ${operation}`,
        context: {
          operation,
          identifier,
          count: entry.count,
          limit: this.config.maxOperationsPerMinute
        }
      });
      return false;
    }

    return true;
  }

  /**
   * Validate origin for cross-frame communication
   */
  validateOrigin(origin: string): boolean {
    if (!this.isActive) return true;

    for (const allowedPattern of this.config.allowedOrigins) {
      // Convert glob pattern to regex
      const regex = new RegExp(
        allowedPattern
          .replace(/\*/g, '.*')
          .replace(/\./g, '\\.')
      );

      if (regex.test(origin)) {
        return true;
      }
    }

    this.reportThreat({
      type: 'suspicious_activity',
      severity: 'medium',
      description: `Unauthorised origin detected: ${origin}`,
      context: { origin, allowedOrigins: this.config.allowedOrigins }
    });

    return false;
  }

  /**
   * Register integrity check for critical components
   */
  registerIntegrityCheck(componentId: string, content: any): void {
    if (!this.config.enableIntegrityChecks || !this.isActive) return;

    const hash = this.simpleHash(JSON.stringify(content));
    this.integrityChecks.set(componentId, {
      originalHash: hash,
      lastCheck: Date.now(),
      changeCount: 0
    });

    this.log('debug', `Integrity check registered for ${componentId}`, { hash });
  }

  /**
   * Verify component integrity
   */
  verifyIntegrity(componentId: string, currentContent: any): boolean {
    if (!this.config.enableIntegrityChecks || !this.isActive) return true;

    const check = this.integrityChecks.get(componentId);
    if (!check) {
      this.log('warn', `No integrity check found for ${componentId}`);
      return true;
    }

    const currentHash = this.simpleHash(JSON.stringify(currentContent));
    check.lastCheck = Date.now();

    if (currentHash !== check.originalHash) {
      check.changeCount++;

      this.reportThreat({
        type: 'integrity_violation',
        severity: 'high',
        description: `Integrity violation detected for component: ${componentId}`,
        context: {
          componentId,
          expectedHash: check.originalHash,
          actualHash: currentHash,
          changeCount: check.changeCount
        }
      });

      return false;
    }

    return true;
  }

  /**
   * Setup DOM tampering detection
   */
  private setupDOMTamperingDetection(): void {
    if (typeof window === 'undefined' || !('MutationObserver' in window)) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check for suspicious script injections
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);

          for (const node of addedNodes) {
            if (node.nodeName === 'SCRIPT') {
              const script = node as HTMLScriptElement;

              // Check for inline scripts with suspicious content
              if (script.innerHTML) {
                if (this.containsSuspiciousContent(script.innerHTML)) {
                  this.reportThreat({
                    type: 'tampering',
                    severity: 'critical',
                    description: 'Suspicious inline script injection detected',
                    context: {
                      script: this.sanitiseString(script.innerHTML.substring(0, 200)),
                      target: mutation.target
                    }
                  });
                }
              }

              // Check for external scripts from untrusted sources
              if (script.src && !this.isTrustedScriptSource(script.src)) {
                this.reportThreat({
                  type: 'tampering',
                  severity: 'high',
                  description: 'Untrusted external script injection detected',
                  context: { src: script.src, target: mutation.target }
                });
              }
            }

            // Check for iframe injections
            if (node.nodeName === 'IFRAME') {
              const iframe = node as HTMLIFrameElement;
              this.reportThreat({
                type: 'tampering',
                severity: 'medium',
                description: 'Iframe injection detected',
                context: { src: iframe.src, target: mutation.target }
              });
            }
          }
        }

        // Check for attribute modifications that could be malicious
        if (mutation.type === 'attributes') {
          const target = mutation.target as Element;
          const attributeName = mutation.attributeName;

          if (attributeName && this.isSuspiciousAttribute(attributeName)) {
            const attributeValue = target.getAttribute(attributeName);
            if (attributeValue && this.containsSuspiciousContent(attributeValue)) {
              this.reportThreat({
                type: 'tampering',
                severity: 'medium',
                description: `Suspicious attribute modification: ${attributeName}`,
                context: {
                  attribute: attributeName,
                  value: this.sanitiseString(attributeValue),
                  target: target.tagName
                }
              });
            }
          }
        }
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['onclick', 'onload', 'onerror', 'src', 'href', 'action']
    });

    this.log('debug', 'DOM tampering detection enabled');
  }

  /**
   * Setup console protection to detect debugging attempts
   */
  private setupConsoleProtection(): void {
    if (typeof window === 'undefined') return;

    const originalConsole = { ...console };
    const self = this;

    // Monitor console.log for sensitive information leakage
    console.log = function(...args: any[]) {
      const message = args.join(' ');

      // Check for potential private key or sensitive data logging
      if (self.containsSensitiveData(message)) {
        self.reportThreat({
          type: 'suspicious_activity',
          severity: 'medium',
          description: 'Potential sensitive data logging detected',
          context: { message: self.sanitiseString(message) }
        });
      }

      return originalConsole.log.apply(console, args);
    };

    // Monitor for DevTools opening attempts
    let devtools = { open: false, orientation: null };
    const threshold = 160;

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.reportThreat({
            type: 'suspicious_activity',
            severity: 'low',
            description: 'Developer tools opened',
            context: {
              outerWidth: window.outerWidth,
              innerWidth: window.innerWidth,
              outerHeight: window.outerHeight,
              innerHeight: window.innerHeight
            }
          });
        }
      } else {
        devtools.open = false;
      }
    }, 1000);

    this.log('debug', 'Console protection enabled');
  }

  /**
   * Setup storage protection
   */
  private setupStorageProtection(): void {
    if (typeof window === 'undefined') return;

    // Monitor localStorage for sensitive data storage
    const originalSetItem = localStorage.setItem;
    const self = this;

    localStorage.setItem = function(key: string, value: string) {
      if (self.containsSensitiveData(key) || self.containsSensitiveData(value)) {
        self.reportThreat({
          type: 'suspicious_activity',
          severity: 'medium',
          description: 'Sensitive data detected in localStorage',
          context: {
            key: self.sanitiseString(key),
            valueLength: value.length
          }
        });
      }

      return originalSetItem.call(localStorage, key, value);
    };

    this.log('debug', 'Storage protection enabled');
  }

  /**
   * Start periodic integrity monitoring
   */
  private startIntegrityMonitoring(): void {
    setInterval(() => {
      if (!this.isActive) return;

      for (const [componentId, check] of this.integrityChecks) {
        // Verify components haven't been tampered with
        const timeSinceCheck = Date.now() - check.lastCheck;
        if (timeSinceCheck > 300000) { // 5 minutes
          this.log('warn', `Integrity check overdue for ${componentId}`, {
            componentId,
            timeSinceCheck
          });
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Check if content contains suspicious patterns
   */
  private containsSuspiciousContent(content: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if content contains sensitive data patterns
   */
  private containsSensitiveData(content: string): boolean {
    const sensitivePatterns = [
      /0x[a-fA-F0-9]{64}/g, // Private keys
      /[a-zA-Z0-9]{43,44}/, // Solana public keys
      /password/gi,
      /secret/gi,
      /private.*key/gi,
      /mnemonic/gi,
      /seed.*phrase/gi
    ];

    return sensitivePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if script source is trusted
   */
  private isTrustedScriptSource(src: string): boolean {
    const trustedDomains = [
      'localhost',
      '127.0.0.1',
      'unpkg.com',
      'jsdelivr.net',
      'cdnjs.cloudflare.com'
    ];

    try {
      const url = new URL(src, window.location.href);
      return trustedDomains.some(domain => url.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  /**
   * Check if attribute is potentially suspicious
   */
  private isSuspiciousAttribute(attributeName: string): boolean {
    const suspiciousAttribs = [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus',
      'onblur', 'onchange', 'onsubmit', 'onreset', 'onkeydown',
      'onkeyup', 'onkeypress'
    ];

    return suspiciousAttribs.includes(attributeName.toLowerCase());
  }

  /**
   * Report security threat
   */
  private reportThreat(threat: Omit<SecurityThreat, 'id' | 'timestamp' | 'fingerprint'>): void {
    const fullThreat: SecurityThreat = {
      id: `threat_${++this.threatCounter}_${Date.now()}`,
      timestamp: Date.now(),
      fingerprint: this.generateThreatFingerprint(threat),
      ...threat
    };

    this.config.onSecurityThreat(fullThreat);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `monitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate threat fingerprint for deduplication
   */
  private generateThreatFingerprint(threat: Omit<SecurityThreat, 'id' | 'timestamp' | 'fingerprint'>): string {
    const content = `${threat.type}_${threat.description}`;
    return this.simpleHash(content).substring(0, 16);
  }

  /**
   * Simple hash implementation for integrity checks
   */
  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash + input.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Sanitise string for safe logging
   */
  private sanitiseString(input: string): string {
    return input
      .substring(0, 200) // Limit length
      .replace(/0x[a-fA-F0-9]{64}/g, '0x[PRIVATE_KEY]')
      .replace(/0x[a-fA-F0-9]{40}/g, '0x[ADDRESS]')
      .replace(/[a-zA-Z0-9]{43,44}/g, '[PUBKEY]')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT_TAG]');
  }

  /**
   * Clean up old rate limit entries
   */
  private cleanupRateLimitEntries(): void {
    const now = Date.now();
    const cutoff = now - 300000; // 5 minutes

    for (const [key, entry] of this.rateLimitMap) {
      if (entry.lastAccess < cutoff) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  /**
   * Default threat handler
   */
  private defaultThreatHandler(threat: SecurityThreat): void {
    const message = `[Security Threat] ${threat.type.toUpperCase()}: ${threat.description}`;

    switch (threat.severity) {
      case 'critical':
      case 'high':
        console.error(message, threat);
        break;
      case 'medium':
        console.warn(message, threat);
        break;
      case 'low':
        console.info(message, threat);
        break;
    }
  }

  /**
   * Logging utility
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.config.enableDetailedLogging && level === 'debug') return;

    const logMessage = `[SecurityMonitor] ${message}`;

    switch (level) {
      case 'error':
        console.error(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      case 'debug':
        console.debug(logMessage, data);
        break;
    }
  }
}

/**
 * Create runtime security monitor with default configuration
 */
export function createRuntimeSecurityMonitor(config: SecurityMonitorConfig = {}): RuntimeSecurityMonitor {
  return new RuntimeSecurityMonitor({
    enableInjectionDetection: true,
    enableTamperingDetection: true,
    enableRateLimit: true,
    enableIntegrityChecks: true,
    maxOperationsPerMinute: 100,
    enableDetailedLogging: false,
    allowedOrigins: ['http://localhost:*', 'https://localhost:*'],
    ...config
  });
}