# Arena Wallet Mock + Reown AppKit Demo

This demo showcases the integration between Arena's wallet-mock library and Reown's AppKit, demonstrating how our mock wallet seamlessly integrates with modern Web3 tooling through standard protocols.

## 🎯 What This Demo Demonstrates

- **EIP-6963 Wallet Discovery**: AppKit automatically detects our mock wallet through the standard wallet discovery protocol
- **Real Cryptographic Operations**: Uses actual private keys and viem for authentic signature generation
- **Multi-Chain Support**: Proper chain switching with `wallet_getCapabilities` announcement
- **Standards Compliance**: Full EIP-1193, EIP-6963, EIP-3085, and EIP-5792 compatibility
- **Seamless Integration**: Works with existing Web3 infrastructure without modifications

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure Environment** (Optional):
   ```bash
   cp .env.example .env
   # Edit .env with your Reown project ID from https://cloud.reown.com
   ```

3. **Start Development Server**:
   ```bash
   pnpm dev
   ```

4. **Open Demo**: Navigate to `http://localhost:5174`

## 🔧 Features Demonstrated

### Wallet Discovery
- Our mock wallet announces itself via EIP-6963 `CustomEvent`
- AppKit automatically detects and lists it as available
- No manual injection needed - follows Web3 standards

### Real Cryptography
- Uses hardhat test private keys for authentic signatures
- All operations use viem library for real blockchain interactions
- Signatures are cryptographically valid and verifiable

### Multi-Chain Capabilities
- `wallet_getCapabilities` exposes supported chains and methods
- Seamless network switching between Ethereum, Polygon, Arbitrum, and Optimism
- Proper EIP-3085 chain addition validation

### Standard Operations
- **Connect/Disconnect**: Standard wallet connection flows
- **Message Signing**: `personal_sign` with real ECDSA signatures
- **Typed Data Signing**: EIP-712 structured data signatures
- **Transaction Sending**: Real transaction construction and signing
- **Chain Switching**: Network changes with proper event emission

## 🧪 Test Accounts

The demo includes two Hardhat test accounts with known private keys:

- **Account 1**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Account 2**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

These accounts have predefined private keys making them perfect for testing and development.

## 🔍 Technical Details

### Architecture
```
User Interface (Demo)
       ↓
   Reown AppKit (Wallet Management)
       ↓
   Wagmi (Ethereum Library)
       ↓
   window.ethereum (EIP-1193 Provider)
       ↓
Arena Mock Wallet (Real Cryptography)
       ↓
     Viem (Blockchain Operations)
```

### Standards Compliance
- **EIP-1193**: Ethereum Provider JavaScript API
- **EIP-6963**: Multi Injected Provider Discovery
- **EIP-3085**: Wallet Add Ethereum Chain RPC Method
- **EIP-3326**: Wallet Switch Ethereum Chain RPC Method
- **EIP-5792**: Wallet Function Call API (capabilities)
- **EIP-712**: Typed structured data hashing and signing

### Key Implementation Details
- UUID v4 compliant wallet identification
- Custom SVG wallet icon with Arena branding
- RDNS namespace: `com.arenaentertainment.wallet-mock`
- Real-time event logging for debugging
- Responsive design for mobile and desktop

## 🎮 Usage in Your Projects

This demo shows how developers can use our wallet-mock for testing their dApps:

```typescript
import { injectMockWallet } from '@arenaentertainment/wallet-mock';

// Inject mock wallet before initializing your Web3 library
injectMockWallet({
  accounts: [
    { privateKey: 'your-test-private-key', type: 'evm' }
  ]
});

// Now use any Web3 library (wagmi, ethers, viem) normally
// Your library will automatically detect the mock wallet
```

## 🔧 Development

- **Framework**: Vanilla TypeScript + Vite
- **Styling**: Custom CSS with modern design
- **Build Tool**: Vite with TypeScript support
- **Package Manager**: pnpm (workspace compatible)

## 📝 Environment Variables

- `VITE_PROJECT_ID`: Your Reown Cloud project ID
  - Get yours at: https://cloud.reown.com
  - Demo works with placeholder ID for testing

## 🎯 Next Steps

This demo can be extended to show:
- Solana wallet integration
- Custom transaction types
- Advanced EIP-712 schemas
- Cross-chain message signing
- Batch transaction support

## 🤝 Contributing

This demo is part of the Arena wallet-mock monorepo. See the main README for contribution guidelines.