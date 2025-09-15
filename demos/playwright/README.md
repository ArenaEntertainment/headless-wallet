# Arena Headless Wallet Playwright Demo

End-to-end testing showcase demonstrating automated wallet testing with Playwright and the Arena Headless Wallet library.

## Features

- **Multi-Browser Testing**: Chrome, Firefox, Safari, Mobile Chrome
- **Wallet Automation**: Automated wallet connection and interaction testing
- **Visual Regression**: Screenshot and video recording capabilities
- **CI/CD Ready**: Configured for continuous integration environments

## Quick Start

```bash
# Install dependencies and browsers
npm install
npx playwright install

# Run tests in headless mode
npm run test

# Run tests with browser UI
npm run test:headed

# Run tests with Playwright UI
npm run test:ui

# Debug tests
npm run test:debug
```

## Test Coverage

- Wallet connection flows
- Account management
- Chain switching
- Transaction signing
- Error handling scenarios
- Mobile responsiveness

## Reports

Test results are generated in HTML format:
```bash
npm run test:report
```

This demo demonstrates how to use the wallet-mock library for comprehensive E2E testing of blockchain applications.