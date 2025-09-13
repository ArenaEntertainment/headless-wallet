# @arenaentertainment/wallet-mock-playwright

Playwright integration package for the wallet-mock library, providing comprehensive testing support for dApps with secure wallet mocking, test isolation, and helper utilities.

## Features

- 🔒 **Secure Bridge Communication** - Safe message passing between Node.js test environment and browser
- 🏗️ **Multiple Wallet Support** - Install and manage multiple wallet instances per test
- 🛡️ **Production Safety** - Built-in security checks to prevent production usage
- ⛓️ **Multi-chain Support** - Full support for EVM and Solana chains
- 🧪 **Test Isolation** - Proper cleanup and resource management between tests
- 🔧 **Playwright Fixtures** - Ready-to-use fixtures for easy test setup
- 🎯 **Helper Utilities** - Common wallet operations and interaction helpers
- 📝 **TypeScript Support** - Full type safety with comprehensive type definitions

## Installation

```bash
npm install @arenaentertainment/wallet-mock-playwright @playwright/test
```

## Basic Usage

### Simple Wallet Installation

```typescript
import { test } from '@playwright/test';
import { installMockWallet } from '@arenaentertainment/wallet-mock-playwright';

test('dApp wallet interaction', async ({ page }) => {
  // Install mock wallet
  await installMockWallet(page, {
    accounts: [{
      type: 'evm_only',
      evm: { chainIds: ['1', '137'] } // Ethereum + Polygon
    }],
    autoConnect: true
  });

  // Navigate to your dApp
  await page.goto('https://your-dapp.local');

  // window.ethereum is now available
  const isConnected = await page.evaluate(async () => {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    return accounts.length > 0;
  });
});
```

### Using Playwright Fixtures (Recommended)

```typescript
import { testWithEVMWallet } from '@arenaentertainment/wallet-mock-playwright';

testWithEVMWallet('dApp interaction with auto-setup', async ({
  page,
  evmWallet,
  walletHelpers
}) => {
  // Wallet is already installed and connected
  await page.goto('https://your-dapp.local');

  // Wait for wallet to be ready
  await walletHelpers.waitForWallet('evm');

  // Get current account
  const account = await walletHelpers.getCurrentAccount('evm');
  console.log('Connected account:', account);

  // Sign a message
  const signature = await walletHelpers.signMessage('Hello World!', 'evm');
  console.log('Message signature:', signature);
});
```

## Advanced Usage

### Multi-chain Wallet Testing

```typescript
import { testWithMultiChainWallet } from '@arenaentertainment/wallet-mock-playwright';

testWithMultiChainWallet('multi-chain dApp', async ({
  page,
  multiChainWallet,
  walletHelpers
}) => {
  await page.goto('https://multi-chain-dapp.local');

  // Test EVM functionality
  await walletHelpers.connectWallet('evm');
  const evmAccount = await walletHelpers.getCurrentAccount('evm');

  // Test Solana functionality
  await walletHelpers.connectWallet('solana');
  const solanaAccount = await walletHelpers.getCurrentAccount('solana');

  // Switch between chains
  await walletHelpers.switchChain('137', 'evm'); // Switch to Polygon
});
```

### Custom Wallet Configuration

```typescript
import { test, installMockWallet } from '@arenaentertainment/wallet-mock-playwright';

test('custom wallet setup', async ({ page }) => {
  await installMockWallet(page, {
    accounts: [
      {
        type: 'evm_only',
        name: 'Primary Account',
        evm: {
          chainIds: ['1', '137', '56'], // Ethereum, Polygon, BSC
          // privateKey: 'custom-private-key' // Optional: use specific key
        }
      },
      {
        type: 'dual_chain',
        name: 'Multi-chain Account',
        evm: { chainIds: ['1'] },
        solana: { clusters: ['mainnet-beta', 'devnet'] }
      }
    ],
    security: {
      level: 'testing',
      checkProduction: true,
      maxInstances: 5
    },
    isolation: {
      isolatePerTest: true,
      cleanupAfterTest: true
    }
  });
});
```

### Manual Wallet Management

```typescript
import {
  test,
  installMockWallet,
  removeMockWallet,
  getInstalledWallet
} from '@arenaentertainment/wallet-mock-playwright';

test('manual wallet management', async ({ page }) => {
  // Install first wallet
  const wallet1 = await installMockWallet(page, {
    instanceId: 'wallet-1',
    accounts: [{ type: 'evm_only', evm: { chainIds: ['1'] } }]
  });

  // Install second wallet
  const wallet2 = await installMockWallet(page, {
    instanceId: 'wallet-2',
    accounts: [{ type: 'solana_only', solana: { clusters: ['mainnet-beta'] } }]
  });

  // Get wallet by instance ID
  const retrievedWallet = getInstalledWallet('wallet-1');

  // Remove specific wallet
  await removeMockWallet('wallet-1', page);

  // Cleanup all wallets
  await cleanupAllWallets();
});
```

## Fixtures Reference

### Available Fixtures

- `test` - Base test with wallet management capabilities
- `testWithEVMWallet` - Pre-configured with EVM wallet
- `testWithSolanaWallet` - Pre-configured with Solana wallet
- `testWithMultiChainWallet` - Pre-configured with multi-chain wallet
- `testWithErrorHandling` - Enhanced error handling and debugging

### Fixture Properties

```typescript
// Available in all wallet fixtures
async ({
  page,              // Playwright Page
  context,           // Browser Context
  walletManager,     // Wallet Manager instance
  installWallet,     // Install wallet function
  getWallet,         // Get wallet function
  removeWallet,      // Remove wallet function
  cleanupWallets,    // Cleanup function
  getWalletState,    // Get state function
  walletHelpers      // Wallet interaction helpers
}) => {
  // Test implementation
});
```

## Helper Utilities

### WalletHelpers Class

```typescript
const walletHelpers = new WalletHelpers(page);

// Wait for wallet availability
await walletHelpers.waitForWallet('evm', 5000);

// Connect to wallet
await walletHelpers.connectWallet('evm');

// Check connection status
const isConnected = await walletHelpers.isWalletConnected('evm');

// Get current account
const account = await walletHelpers.getCurrentAccount('evm');

// Switch chains
await walletHelpers.switchChain('137', 'evm');

// Sign message
const signature = await walletHelpers.signMessage('Test message', 'evm');

// Send transaction
const txHash = await walletHelpers.sendTransaction(
  '0x742d35Cc6634C0532925a3b8D3A0D1c0A6b5C4EA',
  '0x1000000000000000',
  'evm'
);
```

### Wallet Interactions

```typescript
import { walletInteractions } from '@arenaentertainment/wallet-mock-playwright';

// Click connect button (tries common selectors)
await walletInteractions.clickConnect(page);

// Select wallet from list
await walletInteractions.selectWallet(page, 'MetaMask');

// Approve connection
await walletInteractions.approveConnection(page);

// Wait for connection status
await walletInteractions.waitForConnectionStatus(page, true, 5000);
```

### Account Helpers

```typescript
import { accountHelpers } from '@arenaentertainment/wallet-mock-playwright';

// Create account configurations
const evmAccount = accountHelpers.createEVMAccount(['1', '137'], 'Test Account');
const solanaAccount = accountHelpers.createSolanaAccount(['mainnet-beta'], 'Solana Test');
const dualAccount = accountHelpers.createDualChainAccount(['1'], ['mainnet-beta']);

// Create multiple test accounts
const accounts = accountHelpers.createTestAccounts(3, 'evm_only');
```

## Security Features

### Production Protection

The package automatically detects and prevents usage in production environments:

```typescript
// This will throw in production
validateTestEnvironment();
```

### Environment Detection

```typescript
import { detectEnvironment } from '@arenaentertainment/wallet-mock-playwright';

const env = detectEnvironment();
console.log({
  isTest: env.isTest,
  isCI: env.isCI,
  isDevelopment: env.isDevelopment,
  isProduction: env.isProduction  // Should always be false
});
```

### Security Configuration

```typescript
await installMockWallet(page, {
  security: {
    level: 'strict',           // 'development' | 'testing' | 'strict'
    checkProduction: true,     // Validate environment
    validateContext: true,     // Validate browser context
    secureCleanup: true,      // Secure resource cleanup
    allowedOrigins: [         // Allowed origins (optional)
      'https://localhost:*',
      'https://*.local'
    ],
    maxInstances: 10,         // Max wallet instances
    sessionTimeout: 1800000   // 30 minutes
  }
});
```

## Test Isolation

### Automatic Cleanup

```typescript
await installMockWallet(page, {
  isolation: {
    isolatePerTest: true,      // Clean up after each test
    isolatePerContext: true,   // Clean up when context closes
    cleanupAfterTest: true,    // Auto cleanup
    cleanupOnFailure: true,    // Clean up on test failure
    customCleanup: async () => {
      // Custom cleanup logic
      console.log('Custom cleanup executed');
    }
  }
});
```

### Manual Isolation

```typescript
import {
  createIsolatedEnvironment,
  validateTestIsolation
} from '@arenaentertainment/wallet-mock-playwright';

// Create isolated environment
await createIsolatedEnvironment(page, {
  clearStorage: true,
  clearCookies: true,
  blockNetworks: ['analytics.com', 'tracking.com']
});

// Validate isolation
const validation = await validateTestIsolation(page);
if (!validation.isIsolated) {
  console.warn('Isolation issues:', validation.issues);
}
```

## Error Handling

### Custom Expect Extensions

```typescript
import { expect } from '@arenaentertainment/wallet-mock-playwright';

// Check wallet connection status
await expect(page).toBeConnected('evm');

// Check current account
await expect(page).toHaveAccount('0x742d35Cc...', 'evm');

// Check current chain
await expect(page).toBeOnChain('0x1'); // Ethereum mainnet
```

### Error Recovery

```typescript
import { testWithErrorHandling } from '@arenaentertainment/wallet-mock-playwright';

testWithErrorHandling('resilient test', async ({ page }) => {
  try {
    await installMockWallet(page, {/* config */});
    // Test implementation...
  } catch (error) {
    // Automatic error handling and cleanup
    // Screenshots and logs attached to test results
  }
});
```

## TypeScript Support

The package includes comprehensive TypeScript definitions:

```typescript
import type {
  InstallMockWalletOptions,
  WalletInstallationResult,
  PlaywrightWalletContext,
  SecurityLevel,
  TestIsolationConfig
} from '@arenaentertainment/wallet-mock-playwright';

const options: InstallMockWalletOptions = {
  accounts: [/* ... */],
  security: {
    level: SecurityLevel.TESTING,
    checkProduction: true
  }
};
```

## Examples and Best Practices

### DeFi dApp Testing

```typescript
testWithEVMWallet('DeFi swap functionality', async ({
  page,
  evmWallet,
  walletHelpers
}) => {
  await page.goto('https://defi-app.local');

  // Connect wallet
  await walletInteractions.clickConnect(page);
  await walletInteractions.selectWallet(page, 'MetaMask');
  await walletInteractions.approveConnection(page);

  // Verify connection
  await expect(page).toBeConnected('evm');

  // Perform swap
  await page.fill('[data-testid="amount-input"]', '1.0');
  await page.click('[data-testid="swap-button"]');

  // Sign transaction
  const signature = await walletHelpers.signMessage('Confirm swap', 'evm');
  expect(signature).toBeTruthy();
});
```

### NFT Marketplace Testing

```typescript
testWithMultiChainWallet('NFT marketplace', async ({
  page,
  multiChainWallet,
  walletHelpers
}) => {
  await page.goto('https://nft-marketplace.local');

  // Test Ethereum NFTs
  await walletHelpers.switchChain('1', 'evm');
  await page.click('[data-testid="ethereum-nfts"]');

  // Test Solana NFTs
  await walletHelpers.connectWallet('solana');
  await page.click('[data-testid="solana-nfts"]');

  // Verify multi-chain support
  const evmAccount = await walletHelpers.getCurrentAccount('evm');
  const solanaAccount = await walletHelpers.getCurrentAccount('solana');

  expect(evmAccount).toBeTruthy();
  expect(solanaAccount).toBeTruthy();
});
```

## API Reference

For complete API documentation, see the TypeScript definitions included in the package.

## License

This package is part of the Arena Entertainment wallet-mock library suite.