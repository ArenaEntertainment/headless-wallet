# Custom Wallet Branding Examples

## Basic Usage with Custom Name

```typescript
import { injectHeadlessWallet } from '@arenaentertainment/headless-wallet';

injectHeadlessWallet({
  accounts: [
    { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' }
  ],
  branding: {
    name: 'My Development Wallet'
  }
});
```

## Custom Icon and Branding

```typescript
const customIcon = `<svg width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="16" fill="#ff6b35"/>
  <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="12">MW</text>
</svg>`;

injectHeadlessWallet({
  accounts: [
    { privateKey: '0xac0974...', type: 'evm' },
    { privateKey: new Uint8Array([...]), type: 'solana' }
  ],
  branding: {
    name: 'MetaWin Test Wallet',
    icon: customIcon,
    rdns: 'com.metawin.test-wallet',
    isMetaMask: false, // Don't pretend to be MetaMask
    isPhantom: false   // Don't pretend to be Phantom
  }
});
```

## Company-Branded Wallet

```typescript
injectHeadlessWallet({
  accounts: [...],
  branding: {
    name: 'Arena Entertainment Wallet',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiI+CiAgPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MzY2ZjEiLz4KICA8dGV4dCB4PSIxNiIgeT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkFFPC90ZXh0Pgo8L3N2Zz4K',
    rdns: 'com.arenaentertainment.wallet'
  }
});
```

## Playwright Testing with Custom Branding

```typescript
import { test, expect } from '@playwright/test';
import { installHeadlessWallet } from '@arenaentertainment/headless-wallet-playwright';

test('test with custom wallet branding', async ({ page }) => {
  await installHeadlessWallet(page, {
    accounts: [
      { privateKey: '0xac0974...', type: 'evm' }
    ],
    branding: {
      name: 'E2E Test Wallet',
      isMetaMask: true // For compatibility with apps that check for MetaMask
    }
  });

  await page.goto('http://localhost:3000');

  // The wallet connection UI will show "E2E Test Wallet"
  await expect(page.locator('text=E2E Test Wallet')).toBeVisible();
});
```

## Vue Plugin with Custom Branding

```typescript
// main.ts
import { createApp } from 'vue';
import { HeadlessWalletPlugin } from '@arenaentertainment/headless-wallet-vue';

const app = createApp(App);

app.use(HeadlessWalletPlugin, {
  enabled: process.env.NODE_ENV === 'development',
  accounts: [
    { privateKey: '0xac0974...', type: 'evm' }
  ],
  branding: {
    name: 'Vue Dev Wallet',
    icon: '<svg>...</svg>'
  }
});
```

## React Provider with Custom Branding

```tsx
import { HeadlessWalletProvider } from '@arenaentertainment/headless-wallet-react';

function App() {
  return (
    <HeadlessWalletProvider
      enabled={process.env.NODE_ENV === 'development'}
      accounts={[
        { privateKey: '0xac0974...', type: 'evm' }
      ]}
      branding={{
        name: 'React Dev Wallet',
        isMetaMask: true
      }}
    >
      <YourApp />
    </HeadlessWalletProvider>
  );
}
```

## Multiple Branded Wallets (For Testing Wallet Selection)

```typescript
// Create multiple wallets with different branding for testing
const wallets = [
  {
    name: 'Test Wallet A',
    icon: generateWalletIcon('A', '#ff0000'),
    accounts: [{ privateKey: '0xac0974...', type: 'evm' }]
  },
  {
    name: 'Test Wallet B',
    icon: generateWalletIcon('B', '#00ff00'),
    accounts: [{ privateKey: '0x59c699...', type: 'evm' }]
  }
];

wallets.forEach((wallet, index) => {
  injectHeadlessWallet({
    accounts: wallet.accounts,
    branding: {
      name: wallet.name,
      icon: wallet.icon,
      rdns: `com.test.wallet-${index}`
    }
  });
});

function generateWalletIcon(letter: string, color: string): string {
  return `<svg width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="${color}"/>
    <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${letter}</text>
  </svg>`;
}
```

## Benefits of Custom Branding

1. **Realistic Testing**: Test how your app handles different wallet names and icons
2. **Brand Consistency**: Use your company's branding in development/demos
3. **Multi-Wallet Testing**: Create multiple branded wallets to test wallet selection UIs
4. **E2E Testing**: Easily identify which wallet is being used in automated tests
5. **Demo Presentations**: Professional-looking wallet for client demos