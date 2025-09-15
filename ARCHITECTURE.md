# Headless Multi-Chain Wallet Architecture

This document outlines the comprehensive TypeScript architecture for the headless multi-chain wallet system, designed for maximum type safety, extensibility, and enterprise-grade reliability.

## Architecture Overview

The new architecture provides a robust foundation for multi-chain wallet operations while maintaining backward compatibility with the existing HeadlessWallet implementation. The system is built around several core principles:

- **Strong Type Safety**: Extensive use of TypeScript's advanced type system
- **Modularity**: Clean separation of concerns with plugin-based extensibility
- **Chain Agnostic**: Abstract interfaces that work across different blockchains
- **Enterprise Ready**: Comprehensive error handling, validation, and testing utilities
- **Event Driven**: Strongly-typed event system for reactive programming

## Core Components

### 1. Type System (`/types/core.ts`)

**Purpose**: Provides the foundational type system that ensures compile-time safety across all wallet operations.

**Key Features**:
- Chain-agnostic base types (`ChainType`, `BaseAccount`, `ChainConfig`)
- Chain-specific types (`EVMAccount`, `SolanaAccount`, `EVMTransactionRequest`)
- Strong typing for RPC operations and responses
- Conditional types for chain-specific behaviour
- Structured error handling with `WalletError`

**Example Usage**:
```typescript
// Type-safe account handling
function processAccount<T extends ChainType>(
  account: AccountForChain<T>
): TransactionForChain<T> {
  // TypeScript ensures account and transaction types match
}
```

### 2. Base Provider System (`/base/provider.ts`)

**Purpose**: Abstract base classes that provide common functionality while allowing chain-specific implementations.

**Key Components**:
- `AbstractWalletProvider<T>`: Base class for all chain providers
- `BaseAccountManager<T>`: Abstract account management
- `ValidationUtils`: Common validation logic
- `ConnectionManager`: Connection state management

**Benefits**:
- Enforces consistent interfaces across chains
- Reduces code duplication
- Provides common error handling and validation
- Simplifies testing and mocking

### 3. Event System (`/events/typed-emitter.ts`)

**Purpose**: Strongly-typed event system that provides compile-time safety for event handling.

**Key Features**:
- `EnhancedTypedEventEmitter<T>`: Type-safe event emitter
- Event middleware support for logging, rate limiting, error handling
- Reactive programming with `EventStream` and `MappedEventStream`
- Event replay system for testing

**Example Usage**:
```typescript
interface MyWalletEvents extends EventMap<{
  connect: [account: EVMAccount];
  transactionSent: [txHash: string, amount: bigint];
}> {}

const wallet = new EnhancedTypedEventEmitter<MyWalletEvents>();

// TypeScript enforces correct event types
wallet.on('connect', (account) => {
  // account is typed as EVMAccount
  console.log(`Connected to ${account.address}`);
});
```

### 4. Plugin System (`/plugins/system.ts`)

**Purpose**: Modular architecture for extending wallet functionality without modifying core code.

**Key Components**:
- `PluginManager`: Manages plugin lifecycle
- `ChainAdapterRegistry`: Registry for chain-specific adapters
- `MiddlewareManager`: Request/response middleware system
- `FeatureManager`: Dynamic feature flag management

**Benefits**:
- Easy addition of new blockchain networks
- Runtime feature enabling/disabling
- Request/response transformation and validation
- Separation of concerns

**Adding a New Chain**:
```typescript
// 1. Create chain adapter
class BitcoinAdapter implements ChainAdapter<'bitcoin'> {
  readonly chainType = 'bitcoin';
  // Implementation...
}

// 2. Register adapter
const registry = new ChainAdapterRegistry();
registry.register(new BitcoinAdapter());

// 3. Bitcoin providers are now available
const provider = registry.createProvider(bitcoinConfig);
```

### 5. Account Management (`/accounts/manager.ts`)

**Purpose**: Unified account management system that works across all supported chains.

**Key Features**:
- `UniversalAccountManager`: Cross-chain account management
- `AccountPermissions`: Fine-grained permission system
- `AccountSession`: Session-based access control
- Security features: auto-lock, trusted origins, approval requirements

**Benefits**:
- Consistent API across all chains
- Advanced security features
- Permission-based access control
- Session management for dApps

### 6. Validation & Error Handling (`/validation/system.ts`)

**Purpose**: Comprehensive error handling and input validation system.

**Key Components**:
- `EnhancedWalletError`: Structured error with recovery suggestions
- `ErrorHandler`: Automatic retry and recovery mechanisms
- `ValidationManager`: Schema-based input validation
- Recovery action system for common error scenarios

**Benefits**:
- Structured error handling with context
- Automatic recovery for transient errors
- Input validation prevents common bugs
- Better debugging with error context

### 7. Testing Framework (`/testing/framework.ts`)

**Purpose**: Comprehensive testing utilities for wallet functionality.

**Key Components**:
- `MockWalletProvider<T>`: Chain-agnostic mock provider
- `TestFixtureBuilder`: Fluent API for test setup
- `NetworkSimulator`: Simulate network conditions
- `EventReplay`: Record and replay event sequences

**Benefits**:
- Deterministic testing with mock providers
- Network condition simulation
- Event-driven testing capabilities
- Type-safe test fixtures

## Integration Architecture (`/architecture/index.ts`)

The `HeadlessWalletArchitecture` class serves as the main orchestrator, integrating all components into a cohesive system:

```typescript
const wallet = new WalletBuilder()
  .withBranding({ name: 'My Wallet', icon: 'data:...' })
  .withSecurity({ autoLock: true, lockTimeout: 300000 })
  .withChain(evmConfig)
  .withChain(solanaConfig)
  .withFeature('advanced-signing')
  .build();

// Type-safe multi-chain operations
const evmAccount = await wallet.connect('evm');
const solanaAccount = await wallet.connect('solana');

// Unified request handling
const balance = await wallet.request('evm', {
  method: 'eth_getBalance',
  params: [evmAccount.address, 'latest']
});
```

## Backward Compatibility

The new architecture maintains full backward compatibility with existing code:

- Original `HeadlessWallet` class remains unchanged
- All existing exports are preserved
- `injectHeadlessWallet()` function continues to work
- Existing type definitions are maintained

Users can gradually migrate to the new architecture or continue using the existing simple API.

## Migration Path

### For Simple Use Cases
Continue using the existing `HeadlessWallet` class:

```typescript
import { HeadlessWallet } from '@arena/headless-wallet-core';

const wallet = new HeadlessWallet({
  accounts: [{ type: 'evm', privateKey: '0x...' }]
});
```

### For Advanced Use Cases
Adopt the new architecture:

```typescript
import { WalletBuilder, EVMChainConfig } from '@arena/headless-wallet-core';

const wallet = await new WalletBuilder()
  .withChain(evmConfig)
  .withFeature('advanced-permissions')
  .build();
```

## Benefits of the New Architecture

### 1. **Type Safety**
- Compile-time error detection
- IntelliSense support for all operations
- Prevents common runtime errors

### 2. **Extensibility**
- Plugin system for new chains
- Middleware for custom logic
- Feature flags for A/B testing

### 3. **Maintainability**
- Clear separation of concerns
- Abstract base classes reduce duplication
- Comprehensive error handling

### 4. **Testability**
- Mock providers for unit testing
- Event replay for integration testing
- Network simulation for edge cases

### 5. **Enterprise Features**
- Permission management system
- Session-based access control
- Automatic error recovery
- Comprehensive logging and monitoring

### 6. **Developer Experience**
- Fluent builder API
- Strongly-typed events
- Comprehensive documentation
- Example implementations

## Usage Examples

### Basic Setup
```typescript
import { createWallet, EVMChainConfig } from '@arena/headless-wallet-core';

const evmConfig: EVMChainConfig = {
  type: 'evm',
  id: 'ethereum',
  name: 'Ethereum Mainnet',
  chainId: 1,
  rpcUrl: 'https://eth.llamarpc.com'
};

const wallet = await createWallet(
  { chains: [evmConfig] },
  [evmConfig]
);
```

### Adding Middleware
```typescript
import { LoggingMiddleware } from '@arena/headless-wallet-core';

wallet.useMiddleware(new LoggingMiddleware(console.log));
```

### Plugin Development
```typescript
import { WalletPlugin } from '@arena/headless-wallet-core';

class CustomPlugin implements WalletPlugin {
  readonly name = 'custom-plugin';
  readonly version = '1.0.0';
  readonly chainTypes = ['evm'];

  async init(wallet: BaseWalletProvider): Promise<void> {
    wallet.on('connect', (account) => {
      console.log('Custom plugin: Connected to', account.address);
    });
  }

  async destroy(): Promise<void> {
    // Cleanup
  }
}

await wallet.registerPlugin(new CustomPlugin());
```

### Testing
```typescript
import { TestFixtureBuilder, TestUtils } from '@arena/headless-wallet-core';

const { provider, accounts } = new TestFixtureBuilder('evm')
  .withAccounts(3)
  .withMockResponse('eth_getBalance', '0x1BC16D674EC80000')
  .build();

// Test wallet operations
const balance = await provider.request({
  method: 'eth_getBalance',
  params: [accounts[0].address, 'latest']
});

expect(balance).toBe('0x1BC16D674EC80000');
```

## Future Enhancements

The architecture is designed to support future enhancements:

1. **Additional Chains**: Bitcoin, Cosmos, Polkadot, etc.
2. **Advanced Features**: Multi-signature, hardware wallet support
3. **Performance Optimisations**: Request batching, connection pooling
4. **Security Enhancements**: Hardware security modules, secure enclaves
5. **Monitoring**: Metrics collection, health checks
6. **Developer Tools**: Debugging utilities, performance profiling

## Conclusion

This comprehensive TypeScript architecture provides a robust foundation for multi-chain wallet development. It combines the flexibility needed for diverse blockchain ecosystems with the type safety and reliability required for enterprise applications.

The modular design ensures that teams can adopt components incrementally while maintaining backward compatibility with existing code. The extensive testing framework and error handling systems provide confidence in production deployments.

Whether building simple wallet integrations or complex multi-chain applications, this architecture provides the tools and patterns needed for success.