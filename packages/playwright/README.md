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

## Installation Timing and Target Selection

**Critical**: The choice between `Page` and `BrowserContext` depends on **when** you install:

### Install BEFORE Navigation → Use BrowserContext

```typescript
test('install before navigation', async ({ page, context }) => {
  // ✅ Install on context BEFORE any navigation
  const walletId = await installHeadlessWallet(context, {
    accounts: [{ privateKey: '0xac0974...', type: 'evm' }]
  });

  // Now navigate - wallet will be available
  await page.goto('/app');

  // Wallet is automatically injected
  const accounts = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_requestAccounts' })
  );

  await uninstallHeadlessWallet(context, walletId);
});
```

### Install AFTER Navigation → Use Page

```typescript
test('install after navigation', async ({ page }) => {
  // Navigate first
  await page.goto('/app');

  // ✅ Install on page AFTER navigation for immediate injection
  const walletId = await installHeadlessWallet(page, {
    accounts: [{ privateKey: '0xac0974...', type: 'evm' }]
  });

  // Wallet is immediately available
  const accounts = await page.evaluate(() =>
    window.ethereum.request({ method: 'eth_requestAccounts' })
  );

  await uninstallHeadlessWallet(page, walletId);
});
```

### Multiple Pages with Context Installation

```typescript
let walletId: string;

test.beforeEach(async ({ context }) => {
  // Install once for all pages in context (BEFORE navigation)
  walletId = await installHeadlessWallet(context, {
    accounts: [{ privateKey: '0xac0974...', type: 'evm' }]
  });
});

test.afterEach(async ({ context }) => {
  await uninstallHeadlessWallet(context, walletId);
});

test('page 1', async ({ page }) => {
  await page.goto('/page1');  // Wallet automatically available
});

test('page 2', async ({ page }) => {
  await page.goto('/page2');  // Wallet automatically available
});
```

## Troubleshooting

### Installation Target Selection

**❌ Wrong: Installing on Page before navigation**
```typescript
// This WON'T work - page not ready yet
const walletId = await installHeadlessWallet(page, config);
await page.goto('/app');  // Wallet lost during navigation
```

**✅ Correct: Use Context for pre-navigation**
```typescript
// This WILL work - wallet persists through navigation
const walletId = await installHeadlessWallet(context, config);
await page.goto('/app');  // Wallet available
```

**✅ Correct: Use Page for post-navigation**
```typescript
// This WILL work - immediate injection
await page.goto('/app');
const walletId = await installHeadlessWallet(page, config);
```

### Common Issues

**Wallet not detected**
- 🔴 **Wrong target**: Used `page` before navigation → Use `context` instead
- 🔴 **Wrong timing**: Called after `page.goto()` with context → Use `page` instead
- Check that the dApp supports the wallet type (EVM/Solana)

**"Wallet appears then disappears"**
- 🔴 **Navigation reset**: Used `page` target before `page.goto()` → Use `context` target

**Multiple pages need wallet**
- 🔴 **Installing per page**: Use `context` in `beforeEach()` instead

### Debug mode
- Set `debug: true` to see all wallet requests and responses
- Watch browser console for injection and provider events
- Use `page.pause()` to inspect wallet state manually

## License

MIT