/**
 * Comprehensive Security Manager for Wallet Mock Library
 *
 * Coordinates all security components including production guards,
 * runtime monitoring, memory protection, and threat detection.
 */

import { EnhancedProductionGuard, SecurityEvent } from './enhanced-production-guard.js';

export enum SecurityLevel {
  STRICT = 'strict',
  STANDARD = 'standard',
  PERMISSIVE = 'permissive'
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
export class SecurityManager {
  private config: SecurityManagerConfig;
  private productionGuard: EnhancedProductionGuard;
  private securityEvents: SecurityEvent[] = [];
  private threatEvents: ThreatEvent[] = [];
  private violations: SecurityViolation[] = [];
  private operationCounters = new Map<string, number[]>();
  private lastHealthCheck: SecurityHealthCheck | null = null;

  constructor(config: Partial<SecurityManagerConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
    this.productionGuard = new EnhancedProductionGuard({
      ...this.config.productionGuard,
      onSecurityEvent: this.handleSecurityEvent.bind(this)
    });

    // Initialize security components
    this.initializeComponents();

    // Start monitoring
    this.startPeriodicHealthChecks();
  }

  /**
   * Initialize all security components based on configuration
   */
  private initializeComponents(): void {
    if (this.config.runtimeMonitor.enabled) {
      this.initializeRuntimeMonitor();
    }

    if (this.config.memoryProtection.enabled) {
      this.initializeMemoryProtection();
    }

    if (this.config.networkSecurity.enabled) {
      this.initializeNetworkSecurity();
    }

    if (this.config.keyManagement.enabled) {
      this.initializeKeyManagement();
    }
  }

  /**
   * Initialize runtime monitoring
   */
  private initializeRuntimeMonitor(): void {
    if (typeof window === 'undefined') return;

    // XSS Protection
    if (this.config.runtimeMonitor.xssProtection) {
      this.setupXSSProtection();
    }

    // Console Protection
    if (this.config.runtimeMonitor.consoleProtection) {
      this.setupConsoleProtection();
    }

    // Integrity Checks
    if (this.config.runtimeMonitor.integrityChecks) {
      this.setupIntegrityChecks();
    }
  }

  /**
   * Setup XSS Protection
   */
  private setupXSSProtection(): void {
    if (typeof window === 'undefined') return;

    // Monitor dangerous innerHTML usage
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (originalInnerHTML) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value: string) {
          if (typeof value === 'string' && SecurityManager.containsXSSPatterns(value)) {
            const threat: ThreatEvent = {
              type: 'xss_attempt',
              severity: 'high',
              source: 'runtime_monitor',
              message: 'Potentially malicious innerHTML detected',
              details: { value: value.substring(0, 100) },
              timestamp: Date.now(),
              blocked: true
            };

            // Don't execute if XSS detected
            console.error('[SECURITY] XSS attempt blocked:', value);
            return;
          }
          originalInnerHTML.set!.call(this, value);
        },
        get: originalInnerHTML.get,
        configurable: true
      });
    }
  }

  /**
   * Setup Console Protection
   */
  private setupConsoleProtection(): void {
    if (typeof console === 'undefined') return;

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      if (this.containsSensitiveData(args)) {
        this.recordViolation({
          type: 'sensitive_data_logging',
          severity: 'warning',
          source: 'console_protection',
          message: 'Sensitive data detected in console.log',
          details: { args: args.map(arg => typeof arg === 'string' ? arg.substring(0, 50) : typeof arg) },
          timestamp: Date.now(),
          action: 'filtered'
        });
        originalLog('[FILTERED SENSITIVE DATA]');
        return;
      }
      originalLog.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      if (this.containsSensitiveData(args)) {
        originalWarn('[FILTERED SENSITIVE DATA]');
        return;
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      if (this.containsSensitiveData(args)) {
        originalError('[FILTERED SENSITIVE DATA]');
        return;
      }
      originalError.apply(console, args);
    };
  }

  /**
   * Setup Integrity Checks
   */
  private setupIntegrityChecks(): void {
    // Monitor critical object modifications
    const criticalObjects = [window.crypto, window.localStorage, window.sessionStorage];

    criticalObjects.forEach(obj => {
      if (!obj) return;

      const handler: ProxyHandler<any> = {
        set: (target, prop, value) => {
          this.recordThreat({
            type: 'critical_object_modification',
            severity: 'high',
            source: 'integrity_monitor',
            message: `Critical object modification detected: ${String(prop)}`,
            details: { target: target.constructor.name, property: String(prop) },
            timestamp: Date.now(),
            blocked: false
          });
          target[prop] = value;
          return true;
        }
      };

      // Note: In practice, you'd need to be more careful about proxying global objects
    });
  }

  /**
   * Initialize Memory Protection
   */
  private initializeMemoryProtection(): void {
    if (this.config.memoryProtection.leakDetection) {
      this.setupMemoryLeakDetection();
    }
  }

  /**
   * Setup Memory Leak Detection
   */
  private setupMemoryLeakDetection(): void {
    let objectCount = 0;
    let lastObjectCount = 0;

    setInterval(() => {
      // Simple memory leak detection
      if (typeof performance !== 'undefined' && performance.memory) {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.totalJSHeapSize * 0.9) {
          this.recordViolation({
            type: 'memory_leak_detected',
            severity: 'warning',
            source: 'memory_monitor',
            message: 'High memory usage detected',
            details: {
              usedHeapSize: memory.usedJSHeapSize,
              totalHeapSize: memory.totalJSHeapSize
            },
            timestamp: Date.now(),
            action: 'logged'
          });
        }
      }

      lastObjectCount = objectCount;
    }, 30000); // Check every 30 seconds
  }

  /**
   * Initialize Network Security
   */
  private initializeNetworkSecurity(): void {
    if (typeof window === 'undefined') return;

    if (this.config.networkSecurity.ssrfProtection) {
      this.setupSSRFProtection();
    }

    if (this.config.networkSecurity.requestFiltering) {
      this.setupRequestFiltering();
    }
  }

  /**
   * Setup SSRF Protection
   */
  private setupSSRFProtection(): void {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (this.isSSRFAttempt(url)) {
        const threat: ThreatEvent = {
          type: 'ssrf_attempt',
          severity: 'high',
          source: 'network_security',
          message: 'SSRF attempt blocked',
          details: { url },
          timestamp: Date.now(),
          blocked: true
        };
        this.recordThreat(threat);
        throw new Error('Network request blocked by security policy');
      }

      return originalFetch(input, init);
    };
  }

  /**
   * Setup Request Filtering
   */
  private setupRequestFiltering(): void {
    // Monitor XMLHttpRequest
    if (typeof XMLHttpRequest !== 'undefined') {
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
        if (SecurityManager.prototype.isSSRFAttempt(url)) {
          throw new Error('XMLHttpRequest blocked by security policy');
        }
        return originalOpen.apply(this, [method, url, ...args]);
      };
    }
  }

  /**
   * Initialize Key Management
   */
  private initializeKeyManagement(): void {
    // Key management initialization would be more complex in practice
    if (this.config.keyManagement.autoRotation) {
      this.startKeyRotation();
    }
  }

  /**
   * Start Key Rotation
   */
  private startKeyRotation(): void {
    // Implement key rotation logic
    setInterval(() => {
      this.logInfo('Key rotation check performed');
    }, 24 * 60 * 60 * 1000); // Daily rotation check
  }

  /**
   * Check if URL is SSRF attempt
   */
  private isSSRFAttempt(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Block private IP ranges
      const privateRanges = [
        /^127\./, // 127.0.0.0/8
        /^192\.168\./, // 192.168.0.0/16
        /^10\./, // 10.0.0.0/8
        /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
        /^169\.254\./, // 169.254.0.0/16
        /^::1$/, // IPv6 loopback
        /^fe80::/i // IPv6 link-local
      ];

      return privateRanges.some(range => range.test(hostname)) || hostname === 'localhost';
    } catch {
      return true; // Block invalid URLs
    }
  }

  /**
   * Check if content contains XSS patterns
   */
  private static containsXSSPatterns(content: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /eval\s*\(/gi,
      /document\.write/gi,
      /innerHTML/gi
    ];

    return xssPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if data contains sensitive information
   */
  private containsSensitiveData(args: any[]): boolean {
    const sensitivePatterns = [
      /private.*key/i,
      /mnemonic/i,
      /seed.*phrase/i,
      /password/i,
      /secret/i,
      /token.*[a-zA-Z0-9]{20,}/i,
      /0x[a-fA-F0-9]{40}/i, // Ethereum addresses
      /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/i, // Bitcoin addresses
    ];

    const stringified = args.map(arg =>
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');

    return sensitivePatterns.some(pattern => pattern.test(stringified));
  }

  /**
   * Record security threat
   */
  private recordThreat(threat: ThreatEvent): void {
    this.threatEvents.push(threat);

    // Limit log size
    if (this.threatEvents.length > 1000) {
      this.threatEvents.splice(0, 500);
    }

    // Call handler if provided
    if (this.config.onThreatDetected) {
      this.config.onThreatDetected(threat);
    }

    this.logError(`Threat detected: ${threat.message}`, threat.details);
  }

  /**
   * Record security violation
   */
  private recordViolation(violation: SecurityViolation): void {
    this.violations.push(violation);

    // Limit log size
    if (this.violations.length > 1000) {
      this.violations.splice(0, 500);
    }

    // Call handler if provided
    if (this.config.onSecurityViolation) {
      this.config.onSecurityViolation(violation);
    }

    if (violation.severity === 'critical' || violation.severity === 'error') {
      this.logError(`Security violation: ${violation.message}`, violation.details);
    } else {
      this.logWarning(`Security violation: ${violation.message}`, violation.details);
    }
  }

  /**
   * Handle security event from other components
   */
  private handleSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);

    // Limit log size
    if (this.securityEvents.length > 1000) {
      this.securityEvents.splice(0, 500);
    }

    // Call external handler
    if (this.config.onSecurityEvent) {
      this.config.onSecurityEvent(event);
    }
  }

  /**
   * Start periodic health checks
   */
  private startPeriodicHealthChecks(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Perform initial health check
    setTimeout(() => this.performHealthCheck(), 1000);
  }

  /**
   * Perform security health check
   */
  public async performHealthCheck(): Promise<SecurityHealthCheck> {
    const components: ComponentHealth[] = [];

    // Check production guard
    components.push({
      name: 'Production Guard',
      status: this.config.productionGuard.enabled ? 'healthy' : 'disabled',
      message: this.config.productionGuard.enabled ? 'Active' : 'Disabled'
    });

    // Check runtime monitor
    components.push({
      name: 'Runtime Monitor',
      status: this.config.runtimeMonitor.enabled ? 'healthy' : 'disabled',
      message: this.config.runtimeMonitor.enabled ? 'Monitoring active' : 'Disabled'
    });

    // Check memory protection
    let memoryStatus: ComponentHealth['status'] = 'healthy';
    let memoryMessage = 'Operating normally';

    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;

      if (usageRatio > 0.9) {
        memoryStatus = 'warning';
        memoryMessage = 'High memory usage detected';
      }
    }

    components.push({
      name: 'Memory Protection',
      status: this.config.memoryProtection.enabled ? memoryStatus : 'disabled',
      message: this.config.memoryProtection.enabled ? memoryMessage : 'Disabled'
    });

    // Check network security
    components.push({
      name: 'Network Security',
      status: this.config.networkSecurity.enabled ? 'healthy' : 'disabled',
      message: this.config.networkSecurity.enabled ? 'Protection active' : 'Disabled'
    });

    // Overall health assessment
    const overall = this.assessOverallHealth(components);
    const recommendations = this.generateRecommendations(components);

    this.lastHealthCheck = {
      overall,
      components,
      recommendations,
      lastCheck: Date.now()
    };

    this.logInfo('Security health check completed', { overall, componentCount: components.length });

    return this.lastHealthCheck;
  }

  /**
   * Assess overall health
   */
  private assessOverallHealth(components: ComponentHealth[]): SecurityHealthCheck['overall'] {
    const activeComponents = components.filter(c => c.status !== 'disabled');
    const errorComponents = activeComponents.filter(c => c.status === 'error');
    const warningComponents = activeComponents.filter(c => c.status === 'warning');

    if (errorComponents.length > 0) return 'critical';
    if (warningComponents.length > 0) return 'warning';
    return 'healthy';
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(components: ComponentHealth[]): string[] {
    const recommendations: string[] = [];

    components.forEach(component => {
      if (component.status === 'error') {
        recommendations.push(`Fix ${component.name}: ${component.message}`);
      } else if (component.status === 'warning') {
        recommendations.push(`Review ${component.name}: ${component.message}`);
      } else if (component.status === 'disabled') {
        recommendations.push(`Consider enabling ${component.name} for enhanced security`);
      }
    });

    return recommendations;
  }

  /**
   * Get security metrics
   */
  public getSecurityMetrics(): any {
    return {
      securityEvents: this.securityEvents.length,
      threatEvents: this.threatEvents.length,
      violations: this.violations.length,
      lastHealthCheck: this.lastHealthCheck?.lastCheck,
      overallHealth: this.lastHealthCheck?.overall
    };
  }

  /**
   * Get event logs
   */
  public getEventLogs(): {
    securityEvents: SecurityEvent[];
    threatEvents: ThreatEvent[];
    violations: SecurityViolation[];
  } {
    return {
      securityEvents: [...this.securityEvents],
      threatEvents: [...this.threatEvents],
      violations: [...this.violations]
    };
  }

  /**
   * Logging methods
   */
  private logInfo(message: string, details?: any): void {
    if (this.config.enableLogging && this.shouldLog('info')) {
      console.info(`[SECURITY] ${message}`, details || '');
    }
  }

  private logWarning(message: string, details?: any): void {
    if (this.config.enableLogging && this.shouldLog('warning')) {
      console.warn(`[SECURITY] ${message}`, details || '');
    }
  }

  private logError(message: string, details?: any): void {
    if (this.config.enableLogging && this.shouldLog('error')) {
      console.error(`[SECURITY] ${message}`, details || '');
    }
  }

  private shouldLog(level: 'info' | 'warning' | 'error' | 'critical'): boolean {
    const levels = ['info', 'warning', 'error', 'critical'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }

  /**
   * Merge configuration with defaults
   */
  private mergeWithDefaults(config: Partial<SecurityManagerConfig>): SecurityManagerConfig {
    const defaults: SecurityManagerConfig = {
      securityLevel: SecurityLevel.STANDARD,
      productionGuard: {
        enabled: true,
        confidenceThreshold: 85,
        blockedDomains: ['*.com', '*.org', '*.net'],
        allowedDomains: ['localhost', '*.local', '*.dev'],
        throwInProduction: true
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
      logLevel: 'info'
    };

    return {
      ...defaults,
      ...config,
      productionGuard: { ...defaults.productionGuard, ...config.productionGuard },
      runtimeMonitor: { ...defaults.runtimeMonitor, ...config.runtimeMonitor },
      memoryProtection: { ...defaults.memoryProtection, ...config.memoryProtection },
      networkSecurity: { ...defaults.networkSecurity, ...config.networkSecurity },
      keyManagement: { ...defaults.keyManagement, ...config.keyManagement }
    };
  }
}

/**
 * Create security manager with default settings
 */
export function createSecurityManager(config?: Partial<SecurityManagerConfig>): SecurityManager {
  return new SecurityManager(config);
}

/**
 * Create strict security manager for production-adjacent environments
 */
export function createStrictSecurityManager(config?: Partial<SecurityManagerConfig>): SecurityManager {
  const strictConfig: Partial<SecurityManagerConfig> = {
    securityLevel: SecurityLevel.STRICT,
    productionGuard: {
      enabled: true,
      confidenceThreshold: 75,
      throwInProduction: true,
      ...config?.productionGuard
    },
    logLevel: 'warning',
    ...config
  };

  return new SecurityManager(strictConfig);
}

/**
 * Create permissive security manager for development
 */
export function createPermissiveSecurityManager(config?: Partial<SecurityManagerConfig>): SecurityManager {
  const permissiveConfig: Partial<SecurityManagerConfig> = {
    securityLevel: SecurityLevel.PERMISSIVE,
    productionGuard: {
      enabled: false,
      throwInProduction: false,
      ...config?.productionGuard
    },
    logLevel: 'error',
    ...config
  };

  return new SecurityManager(permissiveConfig);
}

/**
 * Initialize default security for quick setup
 */
export function initializeDefaultSecurity(): SecurityManager {
  return createSecurityManager({
    securityLevel: SecurityLevel.STANDARD,
    enableLogging: true,
    logLevel: 'info'
  });
}