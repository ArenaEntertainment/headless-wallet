/**
 * Production environment security guard
 * Prevents wallet mock from being used in production environments
 */

export interface ProductionGuardConfig {
  /** Enable production environment checks */
  enableProductionChecks: boolean;
  /** Custom production detection logic */
  customProductionDetector?: () => boolean;
  /** Allow override for specific use cases */
  allowProductionOverride?: boolean;
  /** Environment variable name to check for override */
  overrideEnvVar?: string;
}

export interface ProductionCheckResult {
  /** Whether environment appears to be production */
  isProduction: boolean;
  /** Reasons why environment was flagged as production */
  reasons: string[];
  /** Whether override is active */
  overrideActive: boolean;
}

/**
 * Production environment detector
 */
export class ProductionGuard {
  private config: Required<ProductionGuardConfig>;

  constructor(config: ProductionGuardConfig) {
    this.config = {
      enableProductionChecks: config.enableProductionChecks,
      customProductionDetector: config.customProductionDetector || this.defaultProductionDetector.bind(this),
      allowProductionOverride: config.allowProductionOverride ?? false,
      overrideEnvVar: config.overrideEnvVar || 'WALLET_MOCK_ALLOW_PRODUCTION'
    };
  }

  /**
   * Check if current environment is production and validate if wallet mock should be allowed
   */
  checkEnvironment(): ProductionCheckResult {
    const reasons: string[] = [];
    let isProduction = false;

    // Check if production checks are disabled
    if (!this.config.enableProductionChecks) {
      return {
        isProduction: false,
        reasons: ['Production checks disabled'],
        overrideActive: false
      };
    }

    // Check for environment override
    const overrideActive = this.isOverrideActive();
    if (overrideActive && this.config.allowProductionOverride) {
      return {
        isProduction: false,
        reasons: ['Production environment detected but override active'],
        overrideActive: true
      };
    }

    // Run production detection
    try {
      isProduction = this.config.customProductionDetector();
      if (isProduction) {
        reasons.push('Custom production detector flagged environment');
      }
    } catch (error) {
      reasons.push(`Error in custom production detector: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Run default production checks
    const defaultResult = this.runDefaultChecks();
    if (defaultResult.isProduction) {
      isProduction = true;
      reasons.push(...defaultResult.reasons);
    }

    return {
      isProduction,
      reasons,
      overrideActive
    };
  }

  /**
   * Validate environment and throw if production environment detected without override
   */
  validateEnvironment(): void {
    const result = this.checkEnvironment();

    if (result.isProduction && !result.overrideActive) {
      const reasonsStr = result.reasons.join(', ');
      throw new Error(
        `Wallet mock detected production environment and cannot be used for security reasons. ` +
        `Reasons: ${reasonsStr}. ` +
        `To override this check (NOT RECOMMENDED), set ${this.config.overrideEnvVar}=true`
      );
    }
  }

  /**
   * Default production environment detection logic
   */
  private defaultProductionDetector(): boolean {
    const checks = this.runDefaultChecks();
    return checks.isProduction;
  }

  /**
   * Run default production environment checks
   */
  private runDefaultChecks(): { isProduction: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let isProduction = false;

    // Check NODE_ENV
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
      isProduction = true;
      reasons.push('NODE_ENV is set to production');
    }

    // Check for common production environment variables
    if (typeof process !== 'undefined' && process.env) {
      const prodEnvVars = [
        'VERCEL',
        'NETLIFY',
        'AWS_LAMBDA_FUNCTION_NAME',
        'HEROKU_APP_NAME',
        'RAILWAY_ENVIRONMENT',
        'RENDER'
      ];

      for (const envVar of prodEnvVars) {
        if (process.env[envVar]) {
          isProduction = true;
          reasons.push(`Production platform detected: ${envVar}`);
        }
      }
    }

    // Check for production-like hostnames in browser
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      const prodPatterns = [
        /^(?!localhost)(?!127\.0\.0\.1)(?!192\.168\.)(?!10\.)(?!172\.(1[6-9]|2\d|3[01])\.).*$/,
        /\.(com|org|net|io|co|app)$/
      ];

      for (const pattern of prodPatterns) {
        if (pattern.test(hostname)) {
          isProduction = true;
          reasons.push(`Production hostname detected: ${hostname}`);
          break;
        }
      }
    }

    // Check for HTTPS in production-like contexts
    if (typeof window !== 'undefined' && window.location?.protocol === 'https:') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && !hostname.startsWith('192.168.') && !hostname.startsWith('10.')) {
        isProduction = true;
        reasons.push('HTTPS detected on non-local domain');
      }
    }

    return { isProduction, reasons };
  }

  /**
   * Check if production override is active
   */
  private isOverrideActive(): boolean {
    if (!this.config.allowProductionOverride) {
      return false;
    }

    // Check environment variable
    if (typeof process !== 'undefined' && process.env?.[this.config.overrideEnvVar] === 'true') {
      return true;
    }

    // Check localStorage in browser (for development)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(this.config.overrideEnvVar) === 'true';
      } catch {
        // localStorage access can fail in some contexts
        return false;
      }
    }

    return false;
  }
}

/**
 * Create a default production guard instance
 */
export function createProductionGuard(config: Partial<ProductionGuardConfig> = {}): ProductionGuard {
  return new ProductionGuard({
    enableProductionChecks: config.enableProductionChecks ?? true,
    customProductionDetector: config.customProductionDetector,
    allowProductionOverride: config.allowProductionOverride ?? false,
    overrideEnvVar: config.overrideEnvVar
  });
}