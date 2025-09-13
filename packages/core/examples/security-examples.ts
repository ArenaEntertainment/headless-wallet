/**
 * Security Implementation Examples
 *
 * Comprehensive examples demonstrating the security features
 * of the wallet-mock library.
 */

import {
  // Main security manager
  ComprehensiveSecurityManager,
  createSecurityManager,
  createStrictSecurityManager,
  SecurityLevel,

  // Individual security components
  EnhancedProductionGuard,
  RuntimeSecurityMonitor,
  MemoryProtectionManager,
  SecureKeyManager,
  NetworkSecurityManager,

  // Utilities and presets
  initializeDefaultSecurity,
  initializeStrictSecurity,
  createSecurityManagerWithPreset,
  SECURITY_PRESETS,
  validateSecurityConfiguration,
  performSecurityHealthCheck
} from '../src/security/index.js';

/**
 * Example 1: Quick Setup with Default Security
 */
export function exampleQuickSetup() {
  console.log('=== Quick Security Setup ===');

  // Initialize with sensible defaults
  const securityManager = initializeDefaultSecurity();

  // Security is now active with standard protection
  console.log('Security Status:', securityManager.getSecurityStatus().isActive);

  // Perform health check
  const healthCheck = performSecurityHealthCheck(securityManager);
  console.log('Security Health:', healthCheck.status, `(${healthCheck.score}/100)`);

  return securityManager;
}

/**
 * Example 2: Strict Security for Sensitive Development
 */
export function exampleStrictSecurity() {
  console.log('=== Strict Security Configuration ===');

  const securityManager = createStrictSecurityManager({
    customPolicy: {
      allowedEnvironments: ['development', 'testing'],
      maxSessionDuration: 2 * 60 * 60 * 1000, // 2 hours
      requireTestMarkers: true,
      allowMemoryDebugging: false,
      enableAuditLogging: true
    },
    productionGuard: {
      blockedDomains: [
        '.*\\.com$',
        '.*\\.org$',
        '.*prod.*',
        '.*staging.*'
      ],
      allowedDomains: [
        'localhost',
        '127\\.0\\.0\\.1',
        '.*\\.local$',
        '.*\\.dev$'
      ]
    },
    onSecurityEvent: (event) => {
      if (event.severity === 'critical' || event.severity === 'error') {
        console.error(`🚨 SECURITY ALERT [${event.source}]:`, event.details);
      } else if (event.severity === 'warning') {
        console.warn(`⚠️  SECURITY WARNING [${event.source}]:`, event.details);
      }
    }
  });

  return securityManager;
}

/**
 * Example 3: Testing Configuration with Reduced Security
 */
export function exampleTestingConfiguration() {
  console.log('=== Testing Security Configuration ===');

  const securityManager = createSecurityManagerWithPreset('TESTING', {
    customPolicy: {
      allowedEnvironments: ['development', 'testing', 'staging'],
      maxSessionDuration: 8 * 60 * 60 * 1000, // 8 hours
      requireTestMarkers: false,
      allowMemoryDebugging: true,
      enableAuditLogging: false // Reduce log noise in tests
    }
  });

  // Validate configuration
  const config = securityManager.exportConfiguration();
  const validation = validateSecurityConfiguration(config);

  if (!validation.isValid) {
    console.error('Configuration errors:', validation.errors);
    throw new Error('Invalid security configuration');
  }

  if (validation.warnings.length > 0) {
    console.warn('Configuration warnings:', validation.warnings);
  }

  return securityManager;
}

/**
 * Example 4: Individual Component Usage
 */
export async function exampleIndividualComponents() {
  console.log('=== Individual Security Components ===');

  // 1. Enhanced Production Guard
  console.log('--- Production Guard ---');
  const productionGuard = new EnhancedProductionGuard({
    enableProductionChecks: true,
    allowProductionOverride: false,
    blockedDomains: ['example.com', 'badactor.org'],
    enableRuntimeMonitoring: true
  });

  try {
    productionGuard.validateEnvironment();
    console.log('✅ Environment validation passed');
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
  }

  // 2. Runtime Security Monitor
  console.log('--- Runtime Security Monitor ---');
  const runtimeMonitor = new RuntimeSecurityMonitor({
    enableInjectionDetection: true,
    enableTamperingDetection: true,
    onSecurityThreat: (threat) => {
      console.warn(`🔍 Runtime threat detected: ${threat.type} (${threat.severity})`);
    }
  });

  // Test input validation
  const testInputs = [
    'normal input',
    '<script>alert("xss")</script>',
    'SELECT * FROM users',
    '../../../etc/passwd'
  ];

  for (const input of testInputs) {
    const isValid = runtimeMonitor.validateInput(input, 'test_context');
    console.log(`Input "${input.substring(0, 20)}..." - Valid: ${isValid}`);
  }

  runtimeMonitor.start();

  // 3. Memory Protection
  console.log('--- Memory Protection ---');
  const memoryManager = new MemoryProtectionManager({
    enableAutoCleanup: true,
    cleanupInterval: 30000, // 30 seconds
    enableObfuscation: true,
    enableIntegrityChecks: true
  });

  memoryManager.start();

  // Store sensitive data
  const sensitiveData = new TextEncoder().encode('sensitive_private_key_data');
  const dataId = memoryManager.storeSecureData(sensitiveData, 'private_key', 'Test private key');

  // Retrieve and verify
  const retrievedData = memoryManager.retrieveSecureData(dataId);
  if (retrievedData) {
    console.log('✅ Sensitive data retrieved successfully');
    retrievedData.fill(0); // Clear after use
  }

  // 4. Secure Key Management
  console.log('--- Secure Key Management ---');
  const keyManager = new SecureKeyManager({
    enableAuditLogging: true,
    enableDevMarkers: true,
    auditLogger: (event) => {
      console.log(`🔑 Key event: ${event.event} (${event.keyType})`);
    }
  });

  // Generate test keys
  try {
    const ethKey = keyManager.generateEthereumPrivateKey({ testOnly: true });
    console.log('✅ Ethereum test key generated:', ethKey.substring(0, 10) + '...');

    const solKey = keyManager.generateSolanaPrivateKey({ testOnly: true });
    console.log('✅ Solana test key generated (length:', solKey.length, 'bytes)');

    // Get key statistics
    const stats = keyManager.getStats();
    console.log('Key manager stats:', stats);
  } catch (error) {
    console.error('❌ Key generation failed:', error.message);
  }

  // 5. Network Security
  console.log('--- Network Security ---');
  const networkManager = new NetworkSecurityManager({
    enableRequestValidation: true,
    allowedOrigins: ['http://localhost:*', 'https://localhost:*'],
    blockedDomains: ['malicious-site.com', '169.254.169.254'],
    onSecurityViolation: (violation) => {
      console.warn(`🌐 Network violation: ${violation.type} - ${violation.details.reason}`);
    }
  });

  // Test URL validation
  const testUrls = [
    'https://api.example.com/data',
    'http://localhost:3000/api',
    'http://169.254.169.254/metadata',
    'javascript:alert(1)',
    'file:///etc/passwd'
  ];

  for (const url of testUrls) {
    const validation = networkManager.validateURL(url);
    console.log(`URL "${url}" - Valid: ${validation.isValid}${validation.reason ? ` (${validation.reason})` : ''}`);
  }

  networkManager.start();

  // Cleanup
  setTimeout(() => {
    runtimeMonitor.stop();
    memoryManager.stop();
    networkManager.stop();
    keyManager.destroyAllKeys();
    console.log('🧹 Components cleaned up');
  }, 5000);
}

/**
 * Example 5: Security Event Monitoring
 */
export function exampleSecurityMonitoring() {
  console.log('=== Security Event Monitoring ===');

  const securityManager = createSecurityManager({
    securityLevel: SecurityLevel.STANDARD,
    onSecurityEvent: (event) => {
      // Custom security event handler
      const timestamp = new Date(event.timestamp).toISOString();
      const message = `[${timestamp}] ${event.source}/${event.type} (${event.severity})`;

      switch (event.severity) {
        case 'critical':
          console.error('🚨 CRITICAL:', message, event.details);
          // In production, you might send alerts, page administrators, etc.
          break;
        case 'error':
          console.error('🔴 ERROR:', message, event.details);
          break;
        case 'warning':
          console.warn('🟡 WARNING:', message, event.details);
          break;
        case 'info':
          console.info('🔵 INFO:', message);
          break;
      }
    }
  });

  securityManager.start();

  // Simulate some activity to generate events
  setTimeout(() => {
    // Get security events
    const allEvents = securityManager.getSecurityEvents();
    const criticalEvents = securityManager.getSecurityEvents({ severity: 'critical' });
    const recentEvents = securityManager.getSecurityEvents({
      since: Date.now() - 60000, // Last minute
      limit: 10
    });

    console.log(`📊 Event Summary:`);
    console.log(`  Total events: ${allEvents.length}`);
    console.log(`  Critical events: ${criticalEvents.length}`);
    console.log(`  Recent events: ${recentEvents.length}`);

    // Perform comprehensive security check
    const securityCheck = securityManager.performSecurityCheck();
    console.log(`🔍 Security Check Result: ${securityCheck.overall}`);
    console.log('  Component Details:');
    securityCheck.details.forEach(detail => {
      const icon = detail.status === 'ok' ? '✅' : detail.status === 'warning' ? '⚠️' : '❌';
      console.log(`    ${icon} ${detail.component}: ${detail.message}`);
    });

    // Get overall status
    const status = securityManager.getSecurityStatus();
    console.log(`📈 Security Status:`);
    console.log(`  Active: ${status.isActive}`);
    console.log(`  Level: ${status.securityLevel}`);
    console.log(`  Features: ${status.activatedFeatures.join(', ')}`);
    console.log(`  Session Duration: ${Math.round((Date.now() - status.sessionStartTime) / 1000)}s`);
  }, 2000);

  return securityManager;
}

/**
 * Example 6: Custom Security Policy
 */
export function exampleCustomSecurityPolicy() {
  console.log('=== Custom Security Policy ===');

  const securityManager = createSecurityManager({
    securityLevel: SecurityLevel.STANDARD,
    customPolicy: {
      allowedEnvironments: ['development', 'testing'],
      maxSessionDuration: 4 * 60 * 60 * 1000, // 4 hours
      requireTestMarkers: true,
      allowMemoryDebugging: false,
      enableAuditLogging: true,
      customRules: [
        {
          name: 'development_hours_check',
          validator: (context) => {
            const hour = new Date().getHours();
            const isDevelopmentHours = hour >= 8 && hour <= 18; // 8 AM to 6 PM

            return {
              isValid: isDevelopmentHours,
              severity: isDevelopmentHours ? 'info' : 'warning',
              message: isDevelopmentHours
                ? 'Within development hours'
                : 'Outside development hours - extra caution advised',
              action: 'warn'
            };
          }
        },
        {
          name: 'hostname_validation',
          validator: (context) => {
            const isLocalhost = context.hostname?.includes('localhost') ||
                              context.hostname?.includes('127.0.0.1') ||
                              context.hostname?.endsWith('.local');

            return {
              isValid: isLocalhost || false,
              severity: isLocalhost ? 'info' : 'error',
              message: isLocalhost
                ? 'Localhost hostname validated'
                : 'Non-localhost hostname detected',
              action: isLocalhost ? 'allow' : 'block'
            };
          }
        }
      ]
    }
  });

  try {
    securityManager.start();
    console.log('✅ Security manager started with custom policy');
  } catch (error) {
    console.error('❌ Custom policy validation failed:', error.message);
  }

  return securityManager;
}

/**
 * Example 7: Performance Impact Analysis
 */
export async function examplePerformanceAnalysis() {
  console.log('=== Performance Impact Analysis ===');

  const testOperations = 1000;
  const testData = new Array(testOperations).fill(0).map((_, i) => `test_operation_${i}`);

  // Test without security
  console.log('Testing without security...');
  const startWithoutSecurity = performance.now();
  for (const data of testData) {
    // Simulate operation
    JSON.parse(JSON.stringify({ data }));
  }
  const timeWithoutSecurity = performance.now() - startWithoutSecurity;

  // Test with standard security
  console.log('Testing with standard security...');
  const standardSecurity = createSecurityManagerWithPreset('DEVELOPMENT');
  standardSecurity.start();

  const startWithSecurity = performance.now();
  for (const data of testData) {
    // Validate input
    const monitor = standardSecurity.getSecurityComponent<RuntimeSecurityMonitor>('runtimeMonitor');
    monitor.validateInput(data, 'performance_test');

    // Simulate operation
    JSON.parse(JSON.stringify({ data }));
  }
  const timeWithSecurity = performance.now() - startWithSecurity;

  // Test with strict security
  console.log('Testing with strict security...');
  const strictSecurity = createSecurityManagerWithPreset('DEVELOPMENT');
  strictSecurity.updateSecurityLevel(SecurityLevel.STRICT);

  const startWithStrictSecurity = performance.now();
  for (const data of testData) {
    // More comprehensive validation
    const monitor = strictSecurity.getSecurityComponent<RuntimeSecurityMonitor>('runtimeMonitor');
    monitor.validateInput(data, 'performance_test');
    monitor.checkRateLimit('performance_test');

    // Simulate operation
    JSON.parse(JSON.stringify({ data }));
  }
  const timeWithStrictSecurity = performance.now() - startWithStrictSecurity;

  // Report results
  console.log(`📊 Performance Results (${testOperations} operations):`);
  console.log(`  Without security: ${timeWithoutSecurity.toFixed(2)}ms`);
  console.log(`  Standard security: ${timeWithSecurity.toFixed(2)}ms (${((timeWithSecurity / timeWithoutSecurity - 1) * 100).toFixed(1)}% overhead)`);
  console.log(`  Strict security: ${timeWithStrictSecurity.toFixed(2)}ms (${((timeWithStrictSecurity / timeWithoutSecurity - 1) * 100).toFixed(1)}% overhead)`);

  // Cleanup
  standardSecurity.stop();
  strictSecurity.stop();
}

/**
 * Example 8: Integration with Existing Code
 */
export function exampleIntegration() {
  console.log('=== Integration Example ===');

  // Existing wallet creation function
  async function createMockWallet(config: any) {
    // Initialize security first
    const securityManager = initializeDefaultSecurity();

    try {
      // Perform security checks
      const securityCheck = securityManager.performSecurityCheck();
      if (securityCheck.overall === 'critical') {
        throw new Error('Security check failed - cannot create wallet');
      }

      // Generate secure keys using security manager
      const keyManager = securityManager.getSecurityComponent<SecureKeyManager>('keyManager');
      const privateKey = keyManager.generateEthereumPrivateKey({ testOnly: true });

      console.log('✅ Secure wallet created with enhanced security');

      // Return wallet configuration with security context
      return {
        privateKey,
        securityManager,
        securityStatus: securityManager.getSecurityStatus()
      };
    } catch (error) {
      securityManager.stop();
      throw error;
    }
  }

  // Usage
  createMockWallet({ network: 'localhost' })
    .then(wallet => {
      console.log('Wallet created with security level:', wallet.securityStatus.securityLevel);
      console.log('Active security features:', wallet.securityStatus.activatedFeatures);
    })
    .catch(error => {
      console.error('Wallet creation failed:', error.message);
    });
}

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('🔒 Wallet-Mock Security Examples\n');

  // Run all examples
  (async () => {
    try {
      exampleQuickSetup().stop();
      await new Promise(resolve => setTimeout(resolve, 1000));

      exampleStrictSecurity().stop();
      await new Promise(resolve => setTimeout(resolve, 1000));

      exampleTestingConfiguration().stop();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await exampleIndividualComponents();
      await new Promise(resolve => setTimeout(resolve, 2000));

      exampleSecurityMonitoring().stop();
      await new Promise(resolve => setTimeout(resolve, 3000));

      exampleCustomSecurityPolicy().stop();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await examplePerformanceAnalysis();
      await new Promise(resolve => setTimeout(resolve, 1000));

      exampleIntegration();
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('\n✅ All security examples completed successfully!');
    } catch (error) {
      console.error('\n❌ Example execution failed:', error);
    }
  })();
}