/**
 * Enhanced Production Environment Detection and Guard System
 *
 * Implements multi-layered production environment detection with confidence scoring,
 * comprehensive logging, and advanced override management.
 */

export interface ProductionCheckResult {
  isProduction: boolean;
  confidence: number; // 0-100 percentage
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

interface Override {
  reason: string;
  timestamp: number;
  expiresAt: number;
  creator: string;
  audited: boolean;
}

/**
 * Enhanced Production Guard with multi-layered detection
 */
export class EnhancedProductionGuard {
  private config: EnhancedProductionGuardConfig;
  private activeOverrides = new Map<string, Override>();
  private detectionCache = new Map<string, ProductionCheckResult>();
  private eventLog: SecurityEvent[] = [];

  constructor(config: Partial<EnhancedProductionGuardConfig> = {}) {
    this.config = {
      confidenceThreshold: 85,
      blockedDomains: [
        '*.com',
        '*.org',
        '*.net',
        '*prod*',
        '*production*',
        '*live*',
        '*staging*',
        'vercel.app',
        'netlify.app',
        'herokuapp.com',
        'railway.app',
        'render.com'
      ],
      allowedDomains: [
        'localhost',
        '127.0.0.1',
        '*.local',
        '*.dev',
        '*.test',
        '*.localhost',
        'dev-*',
        'test-*',
        'local-*'
      ],
      throwInProduction: true,
      overrideConfig: {
        allowOverrides: false,
        overrideTimeLimit: 30 * 60 * 1000, // 30 minutes
        requireReason: true,
        auditOverrides: true
      },
      enableLogging: true,
      ...config
    };

    // Start cleanup timer for expired overrides
    this.startCleanupTimer();
  }

  /**
   * Performs comprehensive production environment check
   */
  async checkProductionEnvironment(): Promise<ProductionCheckResult> {
    const cacheKey = this.generateCacheKey();
    const cached = this.detectionCache.get(cacheKey);

    // Return cached result if valid (5 minute cache)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached;
    }

    const environment = this.gatherEnvironmentInfo();
    const detectionMethods: DetectionMethod[] = [];

    // Run all detection methods
    detectionMethods.push(await this.checkDomainPatterns(environment));
    detectionMethods.push(await this.checkEnvironmentVariables(environment));
    detectionMethods.push(await this.checkNetworkConfiguration(environment));
    detectionMethods.push(await this.checkCIPlatforms(environment));
    detectionMethods.push(await this.checkContainerEnvironment(environment));
    detectionMethods.push(await this.checkDNSResolution(environment));
    detectionMethods.push(await this.checkSSLCertificate(environment));
    detectionMethods.push(await this.checkHttpHeaders(environment));

    // Calculate weighted confidence score
    let totalWeight = 0;
    let weightedScore = 0;

    for (const method of detectionMethods) {
      totalWeight += method.weight;
      if (method.result) {
        weightedScore += method.weight * (method.confidence / 100);
      }
    }

    const confidence = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
    const isProduction = confidence >= this.config.confidenceThreshold;

    const reasons = detectionMethods
      .filter(m => m.result)
      .map(m => `${m.name}: ${m.details}`);

    const result: ProductionCheckResult = {
      isProduction,
      confidence,
      reasons,
      detectionMethods,
      timestamp: Date.now(),
      environment
    };

    // Cache the result
    this.detectionCache.set(cacheKey, result);

    // Log the detection
    this.logSecurityEvent({
      type: 'production_detection',
      severity: isProduction ? 'critical' : 'info',
      message: `Production environment ${isProduction ? 'detected' : 'not detected'}`,
      details: { result },
      timestamp: Date.now(),
      source: 'EnhancedProductionGuard'
    });

    return result;
  }

  /**
   * Domain pattern checking
   */
  private async checkDomainPatterns(env: EnvironmentInfo): Promise<DetectionMethod> {
    const hostname = env.hostname.toLowerCase();

    // Check blocked domains
    const isBlocked = this.config.blockedDomains.some(pattern => {
      const regex = this.patternToRegex(pattern);
      return regex.test(hostname);
    });

    // Check allowed domains
    const isAllowed = this.config.allowedDomains.some(pattern => {
      const regex = this.patternToRegex(pattern);
      return regex.test(hostname);
    });

    let confidence = 0;
    let result = false;

    if (isBlocked && !isAllowed) {
      confidence = 90;
      result = true;
    } else if (isAllowed) {
      confidence = 5; // Low chance of production
      result = false;
    }

    return {
      name: 'Domain Pattern Check',
      weight: 30,
      result,
      confidence,
      details: `Hostname: ${hostname}, Blocked: ${isBlocked}, Allowed: ${isAllowed}`
    };
  }

  /**
   * Environment variables checking
   */
  private async checkEnvironmentVariables(env: EnvironmentInfo): Promise<DetectionMethod> {
    const prodIndicators = [
      'production',
      'prod',
      'live',
      'staging',
      'stage'
    ];

    let confidence = 0;
    let result = false;

    if (typeof process !== 'undefined' && process.env) {
      const nodeEnv = process.env.NODE_ENV?.toLowerCase() || '';
      const appEnv = process.env.APP_ENV?.toLowerCase() || '';
      const environment = process.env.ENVIRONMENT?.toLowerCase() || '';

      const allEnvs = [nodeEnv, appEnv, environment].filter(Boolean);

      for (const envVar of allEnvs) {
        if (prodIndicators.includes(envVar)) {
          confidence = Math.max(confidence, 95);
          result = true;
        }
      }
    }

    return {
      name: 'Environment Variables',
      weight: 25,
      result,
      confidence,
      details: `NODE_ENV: ${env.nodeEnv || 'undefined'}`
    };
  }

  /**
   * Network configuration checking
   */
  private async checkNetworkConfiguration(env: EnvironmentInfo): Promise<DetectionMethod> {
    let confidence = 0;
    let result = false;

    // Check for standard production ports
    if (env.port === 80 || env.port === 443) {
      confidence += 20;
      result = true;
    }

    // Check for HTTPS in production
    if (env.protocol === 'https:' && !this.isLocalHost(env.hostname)) {
      confidence += 30;
      result = true;
    }

    // Check for CDN indicators in hostname
    const cdnPatterns = ['cdn', 'static', 'assets', 'media'];
    if (cdnPatterns.some(pattern => env.hostname.includes(pattern))) {
      confidence += 25;
      result = true;
    }

    return {
      name: 'Network Configuration',
      weight: 20,
      result,
      confidence,
      details: `Port: ${env.port}, Protocol: ${env.protocol}, Host: ${env.hostname}`
    };
  }

  /**
   * CI/CD platform detection
   */
  private async checkCIPlatforms(env: EnvironmentInfo): Promise<DetectionMethod> {
    const ciIndicators = [
      'CI', 'CONTINUOUS_INTEGRATION',
      'GITHUB_ACTIONS', 'GITLAB_CI',
      'JENKINS_URL', 'BUILDKITE',
      'CIRCLECI', 'TRAVIS',
      'VERCEL', 'NETLIFY'
    ];

    let confidence = 0;
    let result = false;

    if (typeof process !== 'undefined' && process.env) {
      for (const indicator of ciIndicators) {
        if (process.env[indicator]) {
          confidence = 60; // CI environments might be for testing
          result = true;
          break;
        }
      }
    }

    return {
      name: 'CI/CD Platform Detection',
      weight: 15,
      result,
      confidence,
      details: `CI Platform: ${env.ciPlatform || 'none detected'}`
    };
  }

  /**
   * Container environment detection
   */
  private async checkContainerEnvironment(env: EnvironmentInfo): Promise<DetectionMethod> {
    let confidence = 0;
    let result = false;

    // Docker indicators
    if (env.dockerized) {
      confidence += 40;
      result = true;
    }

    // Kubernetes indicators
    if (env.kubernetesDeployed) {
      confidence += 50;
      result = true;
    }

    return {
      name: 'Container Environment',
      weight: 15,
      result,
      confidence,
      details: `Docker: ${env.dockerized}, Kubernetes: ${env.kubernetesDeployed}`
    };
  }

  /**
   * DNS resolution checking
   */
  private async checkDNSResolution(env: EnvironmentInfo): Promise<DetectionMethod> {
    let confidence = 0;
    let result = false;

    // Skip localhost/IP addresses
    if (this.isLocalHost(env.hostname) || this.isIPAddress(env.hostname)) {
      return {
        name: 'DNS Resolution',
        weight: 10,
        result: false,
        confidence: 0,
        details: 'Local host or IP address'
      };
    }

    // In browser environment, we can't do direct DNS lookups
    // but we can check hostname characteristics
    if (env.hostname.includes('.')) {
      const parts = env.hostname.split('.');
      if (parts.length >= 2) {
        const tld = parts[parts.length - 1];
        // Common production TLDs
        if (['com', 'org', 'net', 'io', 'app'].includes(tld)) {
          confidence = 30;
          result = true;
        }
      }
    }

    return {
      name: 'DNS Resolution',
      weight: 10,
      result,
      confidence,
      details: `Hostname analysis: ${env.hostname}`
    };
  }

  /**
   * SSL certificate checking
   */
  private async checkSSLCertificate(env: EnvironmentInfo): Promise<DetectionMethod> {
    let confidence = 0;
    let result = false;

    if (env.protocol === 'https:' && !this.isLocalHost(env.hostname)) {
      confidence = 40;
      result = true;
    }

    return {
      name: 'SSL Certificate',
      weight: 15,
      result,
      confidence,
      details: `HTTPS: ${env.protocol === 'https:'}, Host: ${env.hostname}`
    };
  }

  /**
   * HTTP headers checking
   */
  private async checkHttpHeaders(env: EnvironmentInfo): Promise<DetectionMethod> {
    let confidence = 0;
    let result = false;

    // Check user agent for production indicators
    const ua = env.userAgent.toLowerCase();
    const prodHeaders = ['bot', 'crawler', 'spider', 'monitor'];

    if (prodHeaders.some(header => ua.includes(header))) {
      confidence = 35;
      result = true;
    }

    return {
      name: 'HTTP Headers',
      weight: 10,
      result,
      confidence,
      details: `User-Agent analysis complete`
    };
  }

  /**
   * Gather environment information
   */
  private gatherEnvironmentInfo(): EnvironmentInfo {
    const location = typeof window !== 'undefined' ? window.location : {};

    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      hostname: location.hostname || 'localhost',
      protocol: location.protocol || 'http:',
      port: location.port ? parseInt(location.port) : (location.protocol === 'https:' ? 443 : 80),
      origin: location.origin || 'http://localhost',
      nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : undefined,
      ciPlatform: this.detectCIPlatform(),
      dockerized: this.detectDocker(),
      kubernetesDeployed: this.detectKubernetes()
    };
  }

  /**
   * Detect CI platform
   */
  private detectCIPlatform(): string | undefined {
    if (typeof process === 'undefined' || !process.env) return undefined;

    const platforms = {
      'GITHUB_ACTIONS': 'GitHub Actions',
      'GITLAB_CI': 'GitLab CI',
      'JENKINS_URL': 'Jenkins',
      'BUILDKITE': 'Buildkite',
      'CIRCLECI': 'CircleCI',
      'TRAVIS': 'Travis CI',
      'VERCEL': 'Vercel',
      'NETLIFY': 'Netlify'
    };

    for (const [env, platform] of Object.entries(platforms)) {
      if (process.env[env]) return platform;
    }

    return undefined;
  }

  /**
   * Detect Docker environment
   */
  private detectDocker(): boolean {
    if (typeof process === 'undefined') return false;

    // Check for .dockerenv file
    try {
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        return fs.existsSync('/.dockerenv');
      }
    } catch {
      // Fallback to environment variables
    }

    return !!(process.env.DOCKER_CONTAINER || process.env.HOSTNAME?.startsWith('docker-'));
  }

  /**
   * Detect Kubernetes environment
   */
  private detectKubernetes(): boolean {
    if (typeof process === 'undefined') return false;

    return !!(
      process.env.KUBERNETES_SERVICE_HOST ||
      process.env.KUBERNETES_PORT ||
      process.env.K8S_NODE_NAME
    );
  }

  /**
   * Convert pattern to regex
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`, 'i');
  }

  /**
   * Check if hostname is localhost
   */
  private isLocalHost(hostname: string): boolean {
    const localHosts = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
    return localHosts.includes(hostname) || hostname.endsWith('.local');
  }

  /**
   * Check if string is IP address
   */
  private isIPAddress(hostname: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(hostname) || ipv6Regex.test(hostname);
  }

  /**
   * Generate cache key for detection results
   */
  private generateCacheKey(): string {
    const env = this.gatherEnvironmentInfo();
    return `${env.hostname}:${env.port}:${env.protocol}:${env.nodeEnv}`;
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: SecurityEvent): void {
    if (!this.config.enableLogging) return;

    this.eventLog.push(event);

    // Limit log size
    if (this.eventLog.length > 1000) {
      this.eventLog.splice(0, 500);
    }

    // Call external handler if provided
    if (this.config.onSecurityEvent) {
      this.config.onSecurityEvent(event);
    }

    // Console logging based on severity
    if (event.severity === 'critical' || event.severity === 'error') {
      console.error(`[SECURITY] ${event.message}`, event.details);
    } else if (event.severity === 'warning') {
      console.warn(`[SECURITY] ${event.message}`, event.details);
    } else if (this.config.enableLogging) {
      console.info(`[SECURITY] ${event.message}`, event.details);
    }
  }

  /**
   * Start cleanup timer for expired overrides
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, override] of this.activeOverrides.entries()) {
        if (now > override.expiresAt) {
          this.activeOverrides.delete(key);
          this.logSecurityEvent({
            type: 'override_usage',
            severity: 'info',
            message: 'Production override expired',
            details: { key, override },
            timestamp: now,
            source: 'EnhancedProductionGuard'
          });
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Create temporary production override (discouraged)
   */
  public createOverride(reason: string, durationMs?: number): string {
    if (!this.config.overrideConfig.allowOverrides) {
      throw new Error('Production overrides are disabled');
    }

    if (this.config.overrideConfig.requireReason && !reason) {
      throw new Error('Override reason is required');
    }

    const overrideId = this.generateOverrideId();
    const duration = durationMs || this.config.overrideConfig.overrideTimeLimit;

    const override: Override = {
      reason,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
      creator: this.getCreatorInfo(),
      audited: this.config.overrideConfig.auditOverrides
    };

    this.activeOverrides.set(overrideId, override);

    this.logSecurityEvent({
      type: 'override_usage',
      severity: 'warning',
      message: 'Production override created',
      details: { overrideId, reason, duration },
      timestamp: Date.now(),
      source: 'EnhancedProductionGuard'
    });

    return overrideId;
  }

  /**
   * Check if override is active
   */
  public hasActiveOverride(overrideId: string): boolean {
    const override = this.activeOverrides.get(overrideId);
    return override ? Date.now() < override.expiresAt : false;
  }

  /**
   * Get security event log
   */
  public getEventLog(): SecurityEvent[] {
    return [...this.eventLog];
  }

  /**
   * Clear detection cache
   */
  public clearCache(): void {
    this.detectionCache.clear();
  }

  /**
   * Generate unique override ID
   */
  private generateOverrideId(): string {
    return `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get creator information for audit trail
   */
  private getCreatorInfo(): string {
    // In a real implementation, this might get user info from auth context
    return `${Date.now()}_${typeof window !== 'undefined' ? window.location.href : 'server'}`;
  }
}

/**
 * Create production guard with default security settings
 */
export function createProductionGuard(config?: Partial<EnhancedProductionGuardConfig>): EnhancedProductionGuard {
  return new EnhancedProductionGuard(config);
}

/**
 * Create strict production guard for sensitive environments
 */
export function createStrictProductionGuard(config?: Partial<EnhancedProductionGuardConfig>): EnhancedProductionGuard {
  const strictConfig: Partial<EnhancedProductionGuardConfig> = {
    confidenceThreshold: 75, // Lower threshold for stricter detection
    throwInProduction: true,
    overrideConfig: {
      allowOverrides: false,
      overrideTimeLimit: 5 * 60 * 1000, // 5 minutes max
      requireReason: true,
      auditOverrides: true
    },
    enableLogging: true,
    ...config
  };

  return new EnhancedProductionGuard(strictConfig);
}