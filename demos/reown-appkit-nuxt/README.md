# Arena Headless Wallet + Reown AppKit Nuxt Demo

This demo showcases the integration of Arena Headless Wallet with Reown AppKit using Nuxt 3 and Vue composition API.

## Features

- 🔗 Multi-chain support (EVM chains + Solana)
- 🎯 Reactive state management with Vue composition API
- 🔐 Real cryptographic operations using Ethers and Solana Web3.js
- ✍️ Message and typed data signing
- 💸 Transaction sending capabilities
- 🎨 Modern UI with responsive design

## Tech Stack

- **Nuxt 3** - Vue.js framework
- **@reown/appkit-vue** - AppKit Vue integration
- **@reown/appkit-adapter-ethers** - Ethers.js adapter for EVM chains
- **@reown/appkit-adapter-solana** - Solana adapter
- **@arenaentertainment/headless-wallet** - Mock wallet for testing

## Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## How It Works

1. **Wallet Injection**: The Arena Headless Wallet is automatically injected when the app mounts
2. **AppKit Integration**: AppKit is configured as a Nuxt plugin with both EVM and Solana adapters
3. **Reactive UI**: Vue's composition API provides reactive state management that automatically updates the UI
4. **Multi-chain Support**: Seamlessly switch between EVM chains and Solana

## Key Differences from Vanilla Demo

- **Reactive State**: No manual DOM manipulation needed - Vue handles all UI updates
- **Composables**: AppKit hooks are used as Vue composables for clean state management
- **Type Safety**: Full TypeScript support with proper typing
- **Component Architecture**: Modular component-based structure

## AppKit Composables Used

- `useAppKitAccount()` - Account connection state
- `useAppKitNetwork()` - Network/chain management
- `useAppKitProvider()` - Access to wallet providers
- `useAppKitState()` - AppKit modal state
- `useWalletInfo()` - Wallet metadata

## File Structure

```
reown-appkit-nuxt/
├── app.vue                 # Main app component with wallet injection
├── nuxt.config.ts         # Nuxt configuration
├── plugins/
│   └── appkit.client.ts   # AppKit plugin configuration
├── pages/
│   └── index.vue          # Main demo page
├── layouts/
│   └── default.vue        # Default layout
└── assets/
    └── css/
        └── main.css       # Global styles
```