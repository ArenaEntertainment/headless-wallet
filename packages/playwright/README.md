# @arenaentertainment/headless-wallet-playwright

Playwright integration for headless wallet - perfect for automated Web3 testing.

## Installation

```bash
npm install --save-dev @arenaentertainment/headless-wallet-playwright
```

## Quick Start

```typescript
import { test } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

test('wallet connection', async ({ page }) => {
  // Install wallet before navigating (returns walletId)
  const walletId = await installHeadlessWallet(page, {
    accounts: [
      {
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        type: 'evm'
      }
    ]
  });

  await page.goto('http://localhost:3000');

  // Wallet is now available in the page
  const accounts = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_requestAccounts' })
  );

  expect(accounts).toContain('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

  // Clean up after test
  await uninstallHeadlessWallet(page, walletId);
});
```

## API Reference

### `installHeadlessWallet(target, config)`

Installs the headless wallet into a Playwright page or browser context.

**Parameters:**
- `target`: `Page | BrowserContext` - Playwright page or context
- `config`: `HeadlessWalletConfig` - Wallet configuration

**Returns:** `Promise<string>` - Returns the wallet ID for use with uninstallHeadlessWallet

### `uninstallHeadlessWallet(target, walletId)`

Removes the headless wallet from a page or context.

**Parameters:**
- `target`: `Page | BrowserContext` - Playwright page or context
- `walletId`: `string` - Wallet ID returned from installHeadlessWallet

**Returns:** `Promise<void>`

## Configuration

### Basic Configuration

```typescript
{
  accounts: [
    // EVM account
    {
      privateKey: '0xac0974...',
      type: 'evm'
    },
    // Solana account
    {
      privateKey: 'base58_key_here',
      type: 'solana'
    }
  ],
  autoConnect: false,  // Auto-approve connection requests
  debug: true          // Show wallet activity in console
}
```

### Advanced Configuration with RPC

```typescript
import { mainnet, polygon } from 'viem/chains';
import { http } from 'viem';

await installHeadlessWallet(page, {
  accounts: [...],

  // EVM configuration
  evm: {
    defaultChain: mainnet,
    transports: {
      [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'),
      [polygon.id]: http('https://polygon.g.alchemy.com/v2/YOUR_KEY')
    }
  },

  // Solana configuration
  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com'
  }
});
```

## Testing Examples

### Test with wagmi

```typescript
test('wagmi integration', async ({ page }) => {
  const walletId = await installHeadlessWallet(page, {
    accounts: [{ privateKey: '0xac0974...', type: 'evm' }]
  });

  await page.goto('/app');

  // wagmi auto-detects the wallet
  await page.click('[data-testid="connect-wallet"]');
  await page.waitForSelector('[data-testid="wallet-connected"]');

  await uninstallHeadlessWallet(page, walletId);
});
```

### Test transaction signing

```typescript
test('sign transaction', async ({ page }) => {
  const walletId = await installHeadlessWallet(page, {
    accounts: [{ privateKey: '0xac0974...', type: 'evm' }],
    debug: true
  });

  await page.goto('/app');

  // Trigger transaction through UI
  await page.click('[data-testid="send-transaction"]');

  // Transaction is auto-approved with autoConnect: false
  await page.waitForSelector('[data-testid="tx-hash"]');

  await uninstallHeadlessWallet(page, walletId);
});
```

### Test with multiple accounts

```typescript
test('multiple accounts', async ({ page }) => {
  const walletId = await installHeadlessWallet(page, {
    accounts: [
      { privateKey: '0xac0974...', type: 'evm' },
      { privateKey: '0xbeef12...', type: 'evm' }
    ]
  });

  // Accounts are available for testing account switching

  await uninstallHeadlessWallet(page, walletId);
});
```

### Browser context installation

```typescript
let walletId: string;

test.beforeEach(async ({ context }) => {
  // Install once for all pages in context
  walletId = await installHeadlessWallet(context, {
    accounts: [{ privateKey: '0xac0974...', type: 'evm' }]
  });
});

test.afterEach(async ({ context }) => {
  // Clean up after each test
  await uninstallHeadlessWallet(context, walletId);
});

test('page 1', async ({ page }) => {
  await page.goto('/page1');
  // Wallet available
});

test('page 2', async ({ page }) => {
  await page.goto('/page2');
  // Wallet available
});
```

## Troubleshooting

### Wallet not detected
- Ensure `installHeadlessWallet` is called before `page.goto()`
- Check that the dApp supports the wallet type (EVM/Solana)

### Re-installation issues
- The library handles re-installation automatically
- No need to uninstall between tests

### Debug mode
- Set `debug: true` to see all wallet requests and responses
- Helpful for understanding dApp interactions

## License

MIT