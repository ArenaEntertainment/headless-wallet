# Wallet-Mock Security Implementation

## Overview

The wallet-mock library implements comprehensive security measures to prevent accidental usage in production environments and protect against common security vulnerabilities. This security implementation follows OWASP Top 10 guidelines and implements defense-in-depth strategies.

## Security Architecture

### Core Security Components

1. **Enhanced Production Guard** - Multi-layered environment detection
2. **Runtime Security Monitor** - Real-time threat detection and prevention
3. **Memory Protection Manager** - Secure handling of sensitive data
4. **Secure Key Manager** - Cryptographic key lifecycle management
5. **Network Security Manager** - Request interception and validation

### Security Levels

#### Strict Mode
- Maximum security with zero tolerance for violations
- Blocks all suspicious activity
- Extensive logging and monitoring
- Suitable for sensitive development environments

#### Standard Mode (Default)
- Balanced security and usability
- Warns on potential issues, blocks confirmed threats
- Moderate performance impact
- Suitable for most development scenarios

#### Permissive Mode
- Minimal security checks for testing
- Allows overrides and reduced validation
- Lower performance impact
- Suitable for automated testing and CI/CD

## OWASP Top 10 Security Controls

### A01: Broken Access Control
- **Production Environment Detection**: Multi-layered detection prevents production usage
- **Session Management**: Time-limited sessions with automatic expiration
- **Origin Validation**: Cross-origin request validation

### A02: Cryptographic Failures
- **Secure Key Generation**: Cryptographically secure random number generation
- **Memory Protection**: Secure storage and clearing of sensitive data
- **Key Lifecycle Management**: Automatic key rotation and expiration

### A03: Injection
- **Input Validation**: Pattern-based injection detection
- **XSS Protection**: Content sanitisation and CSP recommendations
- **Command Injection Prevention**: Request and header validation

### A04: Insecure Design
- **Security by Default**: Secure defaults in all configurations
- **Fail-Safe Design**: Security violations cause controlled failures
- **Defense in Depth**: Multiple independent security layers

### A05: Security Misconfiguration
- **Environment Validation**: Automatic environment detection and validation
- **Secure Defaults**: All security features enabled by default
- **Configuration Validation**: Real-time configuration validation

### A06: Vulnerable and Outdated Components
- **Dependency Isolation**: Minimal external dependencies
- **Version Validation**: Runtime checks for component integrity
- **Update Monitoring**: Security event tracking and alerts

### A07: Identification and Authentication Failures
- **Session Security**: Secure session generation and management
- **Rate Limiting**: Protection against brute force attacks
- **Identity Validation**: Origin and request authentication

### A08: Software and Data Integrity Failures
- **Memory Integrity**: Real-time integrity checks for sensitive data
- **Component Validation**: Runtime integrity monitoring
- **Audit Logging**: Comprehensive security event logging

### A09: Security Logging and Monitoring
- **Comprehensive Audit Trail**: All security events logged
- **Real-time Monitoring**: Continuous security monitoring
- **Event Correlation**: Cross-component security event analysis

### A10: Server-Side Request Forgery (SSRF)
- **URL Validation**: Comprehensive URL and domain validation
- **Private IP Blocking**: Prevention of internal network access
- **Request Filtering**: Malicious request pattern detection

## Implementation Guide

### Quick Setup

```typescript
import { initializeDefaultSecurity } from '@arenaentertainment/wallet-mock';

// Initialize with default security settings
const securityManager = initializeDefaultSecurity();
```

### Advanced Configuration

```typescript
import {
  createSecurityManager,
  SecurityLevel,
  SECURITY_PRESETS
} from '@arenaentertainment/wallet-mock';

// Create with custom configuration
const securityManager = createSecurityManager({
  securityLevel: SecurityLevel.STRICT,
  productionGuard: {
    enableProductionChecks: true,
    allowProductionOverride: false,
    blockedDomains: ['example.com', 'production-domain.com'],
    allowedDomains: ['localhost', '*.local', '*.dev']
  },
  runtimeMonitor: {
    enableInjectionDetection: true,
    enableTamperingDetection: true,
    maxOperationsPerMinute: 50
  },
  memoryProtection: {
    enableAutoCleanup: true,
    cleanupInterval: 30000,
    enableObfuscation: true
  },
  keyManagement: {
    enableKeyRotation: true,
    maxKeyAge: 24 * 60 * 60 * 1000, // 24 hours
    enableAuditLogging: true
  },
  networkSecurity: {
    enableRequestValidation: true,
    maxRequestSize: 1024 * 1024, // 1MB
    allowedOrigins: ['http://localhost:*']
  }
});

securityManager.start();
```

### Using Security Presets

```typescript
import { createSecurityManagerWithPreset } from '@arenaentertainment/wallet-mock';

// Development preset
const devSecurity = createSecurityManagerWithPreset('DEVELOPMENT');

// Testing preset
const testSecurity = createSecurityManagerWithPreset('TESTING');

// CI/CD preset
const ciSecurity = createSecurityManagerWithPreset('CI_CD');
```

## Security Features

### Enhanced Production Detection

Comprehensive environment analysis including:
- Environment variables (NODE_ENV, platform-specific vars)
- Domain pattern matching (production vs. development patterns)
- Network configuration analysis
- CI/CD platform detection
- Browser security feature detection

```typescript
import { EnhancedProductionGuard } from '@arenaentertainment/wallet-mock';

const guard = new EnhancedProductionGuard({
  enableProductionChecks: true,
  blockedDomains: ['*.com', '*.org', '*prod*'],
  allowedDomains: ['localhost', '*.local', '*.dev']
});

const result = guard.checkEnvironment();
console.log('Production confidence:', result.confidence + '%');
```

### Runtime Security Monitoring

Real-time threat detection including:
- XSS and injection attempt detection
- DOM tampering monitoring
- Console access protection
- Rate limiting enforcement

```typescript
import { RuntimeSecurityMonitor } from '@arenaentertainment/wallet-mock';

const monitor = new RuntimeSecurityMonitor({
  enableInjectionDetection: true,
  enableTamperingDetection: true,
  onSecurityThreat: (threat) => {
    console.error('Security threat detected:', threat);
  }
});

monitor.start();
```

### Memory Protection

Secure handling of sensitive data:
- Automatic memory obfuscation
- Secure data clearing with multiple passes
- Memory leak detection
- Integrity checking

```typescript
import { SecureBuffer, MemoryProtectionManager } from '@arenaentertainment/wallet-mock';

// Create secure buffer for sensitive data
const privateKey = new Uint8Array(32);
// ... populate with key data
const secureBuffer = new SecureBuffer(privateKey);

// Use data safely
const keyData = secureBuffer.getData();
// ... use key data
keyData.fill(0); // Clear after use

// Secure buffer automatically clears on destruction
secureBuffer.clear();
```

### Secure Key Management

Enterprise-grade key management:
- Hardware-grade entropy validation
- Automatic key rotation
- Comprehensive audit logging
- Test key marking for development

```typescript
import { SecureKeyManager } from '@arenaentertainment/wallet-mock';

const keyManager = new SecureKeyManager({
  enableKeyRotation: true,
  maxKeyAge: 24 * 60 * 60 * 1000, // 24 hours
  enableAuditLogging: true
});

// Generate secure test keys
const ethKey = keyManager.generateEthereumPrivateKey({ testOnly: true });
const solKey = keyManager.generateSolanaPrivateKey({ testOnly: true });
```

### Network Security

Comprehensive request protection:
- SSRF prevention
- Origin validation
- Rate limiting
- Request/response validation

```typescript
import { NetworkSecurityManager } from '@arenaentertainment/wallet-mock';

const networkSecurity = new NetworkSecurityManager({
  enableRequestValidation: true,
  allowedOrigins: ['http://localhost:*'],
  blockedDomains: ['internal.company.com'],
  maxRequestsPerMinute: 60
});

networkSecurity.start(); // Automatically intercepts requests
```

## Security Monitoring

### Health Checks

```typescript
// Perform comprehensive security check
const healthCheck = securityManager.performSecurityCheck();
console.log('Security status:', healthCheck.overall);

// Get detailed security status
const status = securityManager.getSecurityStatus();
console.log('Active features:', status.activatedFeatures);
console.log('Critical events:', status.criticalEvents);
```

### Event Monitoring

```typescript
// Monitor security events
securityManager.config.onSecurityEvent = (event) => {
  console.log(`[${event.source}] ${event.type}:`, event.details);

  if (event.severity === 'critical') {
    // Handle critical security events
    console.error('CRITICAL SECURITY EVENT:', event);
  }
};

// Get security events with filtering
const criticalEvents = securityManager.getSecurityEvents({
  severity: 'critical',
  since: Date.now() - 60000 // Last minute
});
```

### Performance Impact

| Security Level | Memory Overhead | CPU Overhead | Network Overhead |
|---------------|----------------|--------------|------------------|
| Strict        | ~2-5MB         | ~5-10%       | ~10-20ms/request |
| Standard      | ~1-3MB         | ~2-5%        | ~5-10ms/request  |
| Permissive    | ~0.5-1MB       | ~1-2%        | ~1-5ms/request   |

## Best Practices

### Development Environment

1. **Use Standard Security Level**: Provides balanced protection without hindering development
2. **Enable Audit Logging**: Track security events for debugging
3. **Regular Health Checks**: Monitor security status periodically
4. **Test Key Marking**: Ensure all keys are properly marked for testing

### Testing Environment

1. **Use Testing Preset**: Optimized for automated testing
2. **Allow Production Overrides**: For staging environment testing
3. **Disable Intrusive Features**: Reduce false positives in tests
4. **Monitor Memory Usage**: Prevent memory leaks in long-running tests

### CI/CD Integration

```typescript
// Example CI/CD configuration
const ciSecurity = createSecurityManagerWithPreset('CI_CD', {
  customPolicy: {
    allowedEnvironments: ['testing'],
    maxSessionDuration: 30 * 60 * 1000, // 30 minutes
    requireTestMarkers: true,
    enableAuditLogging: false // Reduce log noise
  }
});

// Perform security validation before tests
const validation = validateSecurityConfiguration(ciSecurity.exportConfiguration());
if (!validation.isValid) {
  throw new Error('Security configuration validation failed');
}

ciSecurity.start();
```

## Troubleshooting

### Common Issues

#### "Production environment detected"
- **Cause**: Environment appears to be production
- **Solution**: Check NODE_ENV, domain patterns, and environment variables
- **Override**: Set `WALLET_MOCK_ALLOW_PRODUCTION=true` (NOT RECOMMENDED)

#### "Rate limit exceeded"
- **Cause**: Too many operations per minute
- **Solution**: Increase `maxOperationsPerMinute` or add delays
- **Debug**: Check rate limiting configuration

#### "Memory protection violation"
- **Cause**: Sensitive data integrity failure
- **Solution**: Check for memory corruption or concurrent access
- **Debug**: Enable detailed memory logging

#### "Network request blocked"
- **Cause**: Request fails security validation
- **Solution**: Check URL patterns, origins, and request content
- **Debug**: Enable request logging

### Debug Mode

```typescript
// Enable comprehensive debugging
const securityManager = createSecurityManager({
  securityLevel: SecurityLevel.STANDARD,
  runtimeMonitor: {
    enableDetailedLogging: true
  },
  memoryProtection: {
    onSecurityEvent: (event) => {
      console.debug('[Memory]', event);
    }
  },
  networkSecurity: {
    enableRequestLogging: true
  }
});
```

## Security Checklist

### Development Setup
- [ ] Security manager initialized and started
- [ ] Appropriate security level configured
- [ ] Environment validation passes
- [ ] Audit logging enabled
- [ ] Health checks configured

### Production Prevention
- [ ] Production checks enabled
- [ ] No production overrides in code
- [ ] Domain blocking configured
- [ ] Environment variables validated
- [ ] CI/CD detection working

### Data Protection
- [ ] Memory protection active
- [ ] Secure buffers used for sensitive data
- [ ] Automatic cleanup configured
- [ ] Integrity checking enabled
- [ ] Key rotation policies defined

### Monitoring
- [ ] Security event handling configured
- [ ] Health check alerts set up
- [ ] Performance monitoring active
- [ ] Audit trail configured
- [ ] Incident response procedures defined

## Support and Updates

For security issues or questions:
1. Review this documentation
2. Check the troubleshooting section
3. Enable debug logging for detailed analysis
4. Report security vulnerabilities responsibly

Regular security updates are provided with new releases. Always use the latest version for optimal security.