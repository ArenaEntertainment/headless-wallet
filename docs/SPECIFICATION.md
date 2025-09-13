# @arenaentertainment/wallet-mock Specification

## Project Overview

Create a universal mock wallet library that supports both EVM and Solana chains, designed for testing automation (Playwright) and development workflows (Vue/React plugins). This will replace the current `@johanneskares/wallet-mock` dependency with a more feature-rich solution.

### Goals

1. **Multi-Chain Support**: Support both EVM (Ethereum Virtual Machine) and SVM (Solana Virtual Machine) chains in a single wallet
2. **Multiple Accounts**: Allow switching between multiple accounts like real wallets (MetaMask, Phantom)
3. **Framework Agnostic**: Work in Playwright tests and as browser plugins for Vue/React
4. **Standards Compliant**: Implement all relevant wallet standards for maximum compatibility
5. **Developer Experience**: Better debugging, logging, and developer tools integration than existing solutions

## Technical Requirements

### 1. Multi-Chain Architecture

The wallet must support both blockchain ecosystems:

**EVM Support:**
- Ethereum, Polygon, BSC, Arbitrum, and other EVM-compatible chains
- EIP-1193 provider interface
- EIP-6963 wallet discovery standard
- Standard signing methods (personal_sign, eth_signTypedData_v4, etc.)

**Solana Support:**
- Solana mainnet, devnet, testnet
- Solana Wallet Standard implementation
- Transaction and message signing
- Program interaction capabilities

### 2. Account Management

- **Multiple Accounts**: Support unlimited accounts per wallet instance
- **Account Types**: Each account can be EVM-only, Solana-only, or dual-chain
- **Dynamic Management**: Add/remove accounts at runtime
- **Account Switching**: Seamless switching between accounts
- **Import Methods**: Support private key and mnemonic phrase import

### 3. Integration Modes

**Playwright Mode:**
- Integration via `page.exposeFunction()` bridge
- Browser-to-Node.js communication
- Test isolation and cleanup
- Multiple wallet instances per test

**Plugin Mode:**
- Direct browser injection
- Vue/Nuxt plugin architecture
- React hooks and context providers
- Development-time wallet simulation

## Architecture Design

### Monorepo Structure

Using Nx for monorepo management:

```
packages/
├── core/                                   # @arenaentertainment/wallet-mock
│   ├── src/
│   │   ├── wallet/
│   │   │   ├── evm/                       # EVM wallet implementation
│   │   │   ├── solana/                    # Solana wallet implementation
│   │   │   └── unified.ts                 # Unified wallet interface
│   │   ├── standards/
│   │   │   ├── eip1193.ts                 # EIP-1193 provider
│   │   │   ├── eip6963.ts                 # EIP-6963 discovery
│   │   │   └── wallet-standard.ts         # Solana Wallet Standard
│   │   ├── accounts/
│   │   │   ├── manager.ts                 # Account management
│   │   │   └── types.ts                   # Account interfaces
│   │   └── index.ts
│   └── package.json
├── playwright/                            # @arenaentertainment/wallet-mock-playwright
│   └── src/
│       ├── install.ts                     # Playwright installation
│       └── bridge.ts                      # Node.js bridge
├── vue/                                   # @arenaentertainment/wallet-mock-vue
│   └── src/
│       ├── plugin.ts                      # Vue plugin
│       └── composables.ts                 # Vue composables
└── react/                                 # @arenaentertainment/wallet-mock-react
    └── src/
        ├── provider.tsx                   # React context
        └── hooks.ts                       # React hooks
```

### Core Wallet Interface

```typescript
interface MockWallet {
  // Account management
  accounts: Account[]
  activeAccount: number
  addAccount(config: AccountConfig): Promise<string>
  switchAccount(index: number): Promise<void>
  removeAccount(index: number): Promise<void>

  // EVM methods
  evm: {
    request(method: string, params: any[]): Promise<any>
    on(event: string, listener: Function): void
    removeListener(event: string, listener: Function): void
  }

  // Solana methods
  solana: {
    connect(): Promise<{ publicKey: PublicKey }>
    disconnect(): Promise<void>
    signTransaction(transaction: Transaction): Promise<Transaction>
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>
    signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>
  }

  // Chain management
  switchChain(chainId: string): Promise<void>
  addChain(chain: Chain): Promise<void>
  
  // State
  isConnected(): boolean
  getState(): WalletState
}
```

## Implementation Requirements

### 1. Wallet Standards Implementation

**EIP-6963 Wallet Discovery:**
- Announce wallet via `eip6963:announceProvider` events
- Handle `eip6963:requestProvider` requests
- Support multiple wallet identities if needed

**EIP-1193 Provider:**
- Full EIP-1193 compliance for EVM chains
- Event emission for account/chain changes
- Request/response handling

**Solana Wallet Standard:**
- Implement Wallet Standard interface
- Support all required features
- Optional features for enhanced functionality

### 2. Reown AppKit Integration

**Research Required:**
- How to register as multi-chain wallet with Reown AppKit
- Whether special configuration is needed for dual-chain support
- How AppKit detects wallet capabilities
- Integration patterns with existing wallets

**Requirements:**
- AppKit must detect the mock wallet
- Both EVM and Solana functionality must be available
- Account switching must work through AppKit
- Chain switching must work through AppKit

### 3. Framework Integrations

**Vue/Nuxt Plugin:**
```typescript
app.use(MockWalletPlugin, {
  enabled: process.env.NODE_ENV === 'development',
  accounts: [
    { privateKey: '0x...', chains: ['ethereum', 'polygon'] },
    { secretKey: [...], chains: ['solana'] }
  ],
  defaultAccount: 0,
  autoConnect: true
})
```

**React Integration:**
```typescript
<MockWalletProvider accounts={accounts}>
  <App />
</MockWalletProvider>
```

**Playwright Integration:**
```typescript
await installMockWallet(page, {
  accounts: [
    { type: 'evm', privateKey: '0x...', chains: ['ethereum'] },
    { type: 'solana', secretKey: [...] },
    { type: 'dual', evmKey: '0x...', solanaKey: [...] }
  ],
  activeAccount: 0
})
```

## Research Requirements

### 1. Multi-Chain Wallet Analysis

**Phantom Wallet Research:**
- How Phantom structures `window.phantom.ethereum` and `window.phantom.solana`
- Event handling between chains
- Account management across chains
- Error handling patterns

**MetaMask Research:**
- Recent Solana integration approach
- How they handle chain detection
- Provider interface modifications

### 2. Wallet Standards Deep Dive

**EIP-6963:**
- Implementation examples
- Best practices
- Compatibility requirements

**Solana Wallet Standard:**
- Required vs optional features
- Integration with web3.js
- Event patterns

### 3. Framework Integration Patterns

**Vue Plugin Architecture:**
- Best practices for wallet plugins
- Reactivity integration
- TypeScript support

**React Provider Patterns:**
- Context API usage
- Hook design patterns
- State management

### 4. Testing Strategies

**Playwright Integration:**
- Bridge pattern implementation
- State isolation
- Cleanup strategies
- Multi-instance support

## Dependencies

### Core Dependencies
- `viem` - EVM operations and utilities
- `@solana/web3.js` - Solana blockchain operations
- `@solana/wallet-standard-wallet-adapter-base` - Wallet Standard implementation

### Development Dependencies
- `nx` - Monorepo management
- `typescript` - Type definitions
- `vitest` - Testing framework
- `playwright` - E2E testing

### Framework-Specific
- `vue` / `@vue/composition-api` - Vue integration
- `react` - React integration

## Success Criteria

### Functional Requirements
1. **Multi-Account Support**: Can create, switch between, and manage multiple accounts
2. **Dual-Chain Operation**: Successfully interact with both EVM and Solana applications
3. **Playwright Integration**: Can replace `@johanneskares/wallet-mock` in existing tests
4. **Framework Plugins**: Work as development plugins in Vue and React applications
5. **Standards Compliance**: Pass wallet standard compliance tests
6. **Reown AppKit Compatibility**: Full integration with Reown/WalletConnect AppKit

### Performance Requirements
1. **Fast Initialization**: Wallet ready in <100ms
2. **Responsive Switching**: Account/chain switches in <50ms
3. **Memory Efficient**: Minimal memory footprint
4. **Clean Teardown**: Proper cleanup in test environments

### Developer Experience Requirements
1. **Clear APIs**: Intuitive and well-documented interfaces
2. **Good Debugging**: Comprehensive logging and error messages
3. **TypeScript Support**: Full type safety and IntelliSense
4. **Vue DevTools Integration**: Observable state in Vue DevTools

## Testing Strategy

### Unit Tests
- Core wallet functionality
- Account management
- Chain switching
- Standards compliance

### Integration Tests
- Framework plugin functionality
- Playwright bridge operation
- Real DApp integration

### E2E Tests
- Full user workflows
- Cross-chain operations
- Error scenarios

## Migration Path

### Phase 1: Core Implementation
1. Core wallet logic
2. EVM support
3. Basic account management

### Phase 2: Solana Integration
1. Solana wallet implementation
2. Dual-chain account support
3. Standards compliance

### Phase 3: Framework Adapters
1. Playwright integration
2. Vue plugin
3. React hooks

### Phase 4: Advanced Features
1. Reown AppKit integration
2. Advanced account management
3. Developer tools integration

## Reference Materials

### Existing Implementations
- `/Users/chriskitch/Repos/wallet-mock` - Forked johanneskares/wallet-mock
- `/Users/chriskitch/Repos/metawin/web-metawin-v2/projects/main/utils/mockWallet.ts` - Current mock implementation
- `/Users/chriskitch/Repos/metawin/web-metawin-v2/projects/main/node_modules/@johanneskares/wallet-mock/` - Current dependency

### Standards Documentation
- EIP-1193: https://eips.ethereum.org/EIPS/eip-1193
- EIP-6963: https://eips.ethereum.org/EIPS/eip-6963
- Solana Wallet Standard: https://github.com/wallet-standard/wallet-standard

### Framework Documentation
- Nx Monorepo: https://nx.dev/
- Vue Plugin API: https://vuejs.org/guide/reusability/plugins.html
- React Context: https://react.dev/reference/react/createContext

## Deliverables

1. **Core Package**: `@arenaentertainment/wallet-mock`
2. **Playwright Adapter**: `@arenaentertainment/wallet-mock-playwright`
3. **Vue Plugin**: `@arenaentertainment/wallet-mock-vue`
4. **React Package**: `@arenaentertainment/wallet-mock-react`
5. **Documentation**: Complete API documentation and usage guides
6. **Examples**: Working examples for each integration pattern
7. **Tests**: Comprehensive test suite covering all functionality

This specification provides the foundation for implementing a production-ready, multi-chain mock wallet that meets all current and anticipated future requirements.