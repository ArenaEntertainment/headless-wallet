## 0.11.6 (2025-09-18)

### 🩹 Fixes

- Enhance VersionedTransaction support for AppKit integration ([#25](https://github.com/ArenaEntertainment/headless-wallet/issues/25))

### ❤️ Thank You

- Chris Kitch

## 0.11.5 (2025-09-18)

### 🩹 Fixes

- Resolve Solana transaction deserialization issues and failing tests ([7b432fa5](https://github.com/ArenaEntertainment/headless-wallet/commit/7b432fa5))

### ❤️ Thank You

- Chris Kitch

## 0.11.4 (2025-09-18)

### 🩹 Fixes

- Achieve 100% test success - eliminate all test failures and skips ([24c820a9](https://github.com/ArenaEntertainment/headless-wallet/commit/24c820a9))

### ❤️ Thank You

- Chris Kitch

## 0.11.3 (2025-09-18)

### 🩹 Fixes

- Improve explicit transport handling and fix balance test expectations ([cc14b367](https://github.com/ArenaEntertainment/headless-wallet/commit/cc14b367))

### ❤️ Thank You

- Chris Kitch

## 0.11.2 (2025-09-18)

### 🩹 Fixes

- Fix EVMWalletStandard to use actual configured chains instead of hardcoded list ([38a23440](https://github.com/ArenaEntertainment/headless-wallet/commit/38a23440))

### ❤️ Thank You

- Chris Kitch

## 0.11.1 (2025-09-18)

### 🩹 Fixes

- Resolve critical testnet chain auto-configuration bug ([#24](https://github.com/ArenaEntertainment/headless-wallet/issues/24))

### ❤️ Thank You

- Chris Kitch

## 0.11.0 (2025-09-18)

### 🚀 Features

- Improve testnet detection using viem's testnet property ([59ffcf1e](https://github.com/ArenaEntertainment/headless-wallet/commit/59ffcf1e))

### ❤️ Thank You

- Chris Kitch

## 0.10.0 (2025-09-17)

### 🚀 Features

- Implement client reuse optimisation to reduce RPC rate limiting ([47cd3107](https://github.com/ArenaEntertainment/headless-wallet/commit/47cd3107))

### 🩹 Fixes

- Add optional chaining for publicClient.chain access ([4e9fb5dd](https://github.com/ArenaEntertainment/headless-wallet/commit/4e9fb5dd))

### ❤️ Thank You

- Chris Kitch

## 0.9.0 (2025-09-17)

### 🚀 Features

- Auto-configure ALL available testnet chains for zero-config testing ([b6c62062](https://github.com/ArenaEntertainment/headless-wallet/commit/b6c62062))

### ❤️ Thank You

- Chris Kitch

## 0.8.0 (2025-09-17)

This was a version bump only for @arenaentertainment/headless-wallet to align it with other projects, there were no code changes.

## 0.7.4 (2025-09-16)

### 🩹 Fixes

- Ensure wallets correctly expose configured chain IDs ([b6125241](https://github.com/ArenaEntertainment/headless-wallet/commit/b6125241))

### ❤️ Thank You

- Chris Kitch

## 0.7.3 (2025-09-16)

### 🩹 Fixes

- Resolve provider switching and chain selection issues ([#23](https://github.com/ArenaEntertainment/headless-wallet/pull/23))

### ❤️ Thank You

- Chris Kitch

## 0.7.2 (2025-09-16)

### 🩹 Fixes

- Complete test suite stabilisation and cleanup ([4c5bfd9d](https://github.com/ArenaEntertainment/headless-wallet/commit/4c5bfd9d))

### ❤️ Thank You

- Chris Kitch

## 0.7.1 (2025-09-16)

This was a version bump only for @arenaentertainment/headless-wallet to align it with other projects, there were no code changes.

## 0.7.0 (2025-09-15)

This was a version bump only for @arenaentertainment/headless-wallet to align it with other projects, there were no code changes.

## 0.6.2 (2025-09-15)

This was a version bump only for @arenaentertainment/headless-wallet to align it with other projects, there were no code changes.

## 0.6.1 (2025-09-15)

### 🩹 Fixes

- ensure default wallet icon is always set ([746c556e](https://github.com/ArenaEntertainment/headless-wallet/commit/746c556e))
- remove hardcoded branding from demos and fix icon encoding ([86932a1f](https://github.com/ArenaEntertainment/headless-wallet/commit/86932a1f))

### ❤️ Thank You

- Chris Kitch

## 0.6.0 (2025-09-15)

### 🚀 Features

- standardize Reown AppKit demos UI and clean up documentation ([d52491b1](https://github.com/ArenaEntertainment/headless-wallet/commit/d52491b1))
- Switch all demos to use testnets and remove mock transaction fallbacks ([e94c5668](https://github.com/ArenaEntertainment/headless-wallet/commit/e94c5668))

### ❤️ Thank You

- Chris Kitch

## 0.5.1 (2025-09-14)

### 🩹 Fixes

- Fix Solana base58 key support and PublicKey serialization ([731eca33](https://github.com/ArenaEntertainment/headless-wallet/commit/731eca33))
- use bs58 library for proper base58 decoding ([7f9dc06c](https://github.com/ArenaEntertainment/headless-wallet/commit/7f9dc06c))

### ❤️ Thank You

- Chris Kitch

## 0.5.0 (2025-09-14)

### 🚀 Features

- add support for Solana private keys as strings ([#8](https://github.com/ArenaEntertainment/headless-wallet/issues/8))

### ❤️ Thank You

- Chris Kitch

## 0.4.9 (2025-09-14)

### 🎨 Styles

- update default wallet icon to have square background instead of rounded corners

### ❤️ Thank You

- Chris Kitch

## 0.4.8 (2025-09-14)

This was a version bump only for @arenaentertainment/headless-wallet to align it with other projects, there were no code changes.

## 0.4.7 (2025-09-14)

### 🩹 Fixes

- handle hex-encoded messages in personal_sign for ethers v6 compatibility ([#6](https://github.com/ArenaEntertainment/headless-wallet/issues/6))

### ❤️ Thank You

- Chris Kitch

## 0.4.6 (2025-09-14)

This was a version bump only for @arenaentertainment/headless-wallet to align it with other projects, there were no code changes.

## 0.4.5 (2025-09-14)

### 🩹 Fixes

- use wallet branding from core instead of hardcoding in playwright adapter ([aa929afa](https://github.com/ArenaEntertainment/headless-wallet/commit/aa929afa))

### ❤️ Thank You

- Chris Kitch

## 0.4.4 (2025-09-14)

### 🩹 Fixes

- implement disconnect functionality with proper state management and event emission ([#4](https://github.com/ArenaEntertainment/headless-wallet/issues/4))

### ❤️ Thank You

- Chris Kitch

## 0.4.3 (2025-09-14)

### 🩹 Fixes

- achieve feature parity with previous wallet-mock library and fix critical issues ([#1](https://github.com/ArenaEntertainment/headless-wallet/issues/1), [#2](https://github.com/ArenaEntertainment/headless-wallet/issues/2), [#3](https://github.com/ArenaEntertainment/headless-wallet/issues/3))

### ❤️ Thank You

- Chris Kitch

## 0.4.2 (2025-09-14)

This was a version bump only for @arenaentertainment/headless-wallet to align it with other projects, there were no code changes.

## 0.4.1 (2025-09-14)

This was a version bump only for @arenaentertainment/headless-wallet to align it with other projects, there were no code changes.

## 0.4.0 (2025-09-14)

This was a version bump only for @arenaentertainment/headless-wallet to align it with other projects, there were no code changes.

## 0.3.0 (2025-09-14)

### 🚀 Features

- implement multi-chain account switching with Reown AppKit integration ([15a96b93](https://github.com/ArenaEntertainment/headless-wallet/commit/15a96b93))

### ❤️ Thank You

- Chris Kitch

## 0.2.0 (2025-09-13)

### 🚀 Features

- set up automated publishing to GitHub Packages with Nx Release ([0ce37e66](https://github.com/ArenaEntertainment/headless-wallet/commit/0ce37e66))
- implement Arena "A" logo as new default branding ([#07](https://github.com/ArenaEntertainment/headless-wallet/issues/07), [#046](https://github.com/ArenaEntertainment/headless-wallet/issues/046))

### 🩹 Fixes

- GitHub Actions build errors - complete HeadlessWallet transition ([d4cd3949](https://github.com/ArenaEntertainment/headless-wallet/commit/d4cd3949))
- add @types/node dependency to core package ([94c44eb8](https://github.com/ArenaEntertainment/headless-wallet/commit/94c44eb8))

### ❤️ Thank You

- Chris Kitch