# Security Policy

## Supported Versions

We actively support the following versions of wallet-mock with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :warning: Limited  |

## Reporting a Vulnerability

### Security Contact

If you discover a security vulnerability, please report it to us privately:

- **Email**: security@arenaentertainment.com
- **Subject**: `[Security] wallet-mock vulnerability report`

### What to Include

Please include the following information:

1. **Description**: A clear description of the vulnerability
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Impact**: Potential impact and severity assessment
4. **Environment**: Affected versions, browsers, or environments
5. **Proof of Concept**: Code or screenshots demonstrating the issue
6. **Suggested Fix**: If you have a proposed solution

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 72 hours
- **Regular Updates**: Every 5 business days
- **Resolution Timeline**: Varies by severity (see below)

### Severity Classification

#### Critical (24-48 hours)
- Remote code execution
- Authentication bypass
- Privilege escalation
- Data exposure affecting multiple users

#### High (1-2 weeks)
- Local privilege escalation
- SQL injection
- Cross-site scripting (XSS)
- Significant data exposure

#### Medium (2-4 weeks)
- Information disclosure
- Denial of service
- Logic flaws with security implications

#### Low (1-3 months)
- Minor information disclosure
- Issues requiring user interaction
- Theoretical attacks with low impact

### Security Features

wallet-mock includes several built-in security features:

#### 1. Production Guards
```typescript
// Automatic detection of production environments
if (process.env.NODE_ENV === 'production') {
  console.warn('wallet-mock detected in production environment');
}
```

#### 2. Phishing Detection
```typescript
const wallet = new WalletMock({
  securityMode: 'strict',
  detectPhishing: true
});
```

#### 3. Suspicious Transaction Detection
```typescript
// Automatically blocks suspicious transactions
wallet.simulateError('suspicious_transaction', 1.0);
```

#### 4. Rate Limiting
```typescript
const wallet = new WalletMock({
  rateLimiting: {
    requests: 100,
    window: '15m'
  }
});
```

### Security Best Practices

When using wallet-mock:

1. **Never use in production**: wallet-mock is for testing only
2. **Secure test environments**: Protect staging environments
3. **Validate inputs**: Always validate user inputs
4. **Use HTTPS**: Ensure secure connections in all environments
5. **Regular updates**: Keep dependencies updated
6. **Code review**: Review all wallet integration code
7. **Principle of least privilege**: Limit permissions and access

### Testing Security Features

To test security scenarios:

```typescript
import WalletMock from '@arenaentertainment/wallet-mock';

const wallet = new WalletMock({
  securityMode: 'strict',
  detectPhishing: true,
  blockSuspiciousTransactions: true
});

// Test phishing detection
await wallet.testPhishingScenario('fake-dapp.com');

// Test suspicious transaction detection
await wallet.testSuspiciousTransaction({
  to: '0x0000000000000000000000000000000000000000',
  value: '1000000000000000000000' // Large amount
});
```

### Security Checklist

Before deploying applications that use wallet-mock:

- [ ] wallet-mock is only used in test/development environments
- [ ] No wallet-mock code is included in production builds
- [ ] Test data doesn't contain real private keys or sensitive information
- [ ] Security testing scenarios are implemented
- [ ] Regular dependency audits are performed
- [ ] Security patches are applied promptly

### Vulnerability History

We maintain a record of all security vulnerabilities and their fixes:

| Date | Version | Severity | Description | Status |
|------|---------|----------|-------------|--------|
| - | - | - | No vulnerabilities reported | - |

### Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web3 Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Ethereum Security Guide](https://ethereum.org/en/developers/docs/security/)

### Responsible Disclosure

We follow responsible disclosure practices:

1. **Private reporting**: Initial reports are kept confidential
2. **Coordinated disclosure**: We work with reporters on timing
3. **Public disclosure**: Details are published after fixes are available
4. **Credit**: Security researchers are credited for their findings

### Bug Bounty Program

We are considering a bug bounty program for wallet-mock. Stay tuned for updates.

### Contact

For security-related questions or concerns:

- **Security Team**: security@arenaentertainment.com
- **General Support**: support@arenaentertainment.com
- **GitHub Issues**: For non-security issues only

Thank you for helping keep wallet-mock secure!