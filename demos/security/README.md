# Wallet Mock Security Demo

A focused demonstration of the wallet-mock library's security features and production safeguards.

## Features Demonstrated

### 🛡️ Production Guards
- **Environment Detection**: Automatic detection of production environments
- **Host Validation**: Restrict wallet usage to approved domains
- **Security Policies**: Configurable security levels and restrictions

### 🔍 Threat Detection
- **Pattern Monitoring**: Detection of suspicious activity patterns
- **Rate Limiting**: Protection against rapid-fire requests
- **Injection Prevention**: Script injection and XSS protection

### 🧹 Data Sanitisation
- **Sensitive Data**: Automatic sanitisation of private keys and secrets
- **Logging Safety**: Secure logging that doesn't expose sensitive information
- **Error Messages**: Safe error reporting without data leakage

### 📊 Security Monitoring
- **Real-time Events**: Live security event monitoring
- **Security Reports**: Comprehensive security status reporting
- **Audit Trails**: Complete logging of security-related activities

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3003` to explore the security features.

## Security Testing

```bash
# Run security scan
npm run security:scan

# Generate security report
npm run security:report
```

## Production Configuration

```javascript
const wallet = createWallet({
  production: {
    allowedHosts: ['app.example.com'],
    throwInProduction: true,
    enableWarnings: true,
    securityLevel: 'strict'
  }
})
```

This demo shows how wallet-mock protects applications in production environments while providing flexibility for development and testing.