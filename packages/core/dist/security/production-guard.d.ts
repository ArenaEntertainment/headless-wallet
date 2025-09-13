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
export declare class ProductionGuard {
    private config;
    constructor(config: ProductionGuardConfig);
    /**
     * Check if current environment is production and validate if wallet mock should be allowed
     */
    checkEnvironment(): ProductionCheckResult;
    /**
     * Validate environment and throw if production environment detected without override
     */
    validateEnvironment(): void;
    /**
     * Default production environment detection logic
     */
    private defaultProductionDetector;
    /**
     * Run default production environment checks
     */
    private runDefaultChecks;
    /**
     * Check if production override is active
     */
    private isOverrideActive;
}
/**
 * Create a default production guard instance
 */
export declare function createProductionGuard(config?: Partial<ProductionGuardConfig>): ProductionGuard;
//# sourceMappingURL=production-guard.d.ts.map