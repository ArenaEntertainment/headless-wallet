## 1.0.3 (2025-09-16)

### 🩹 Fixes

- resolve __dirname ES modules compatibility issue ([#20](https://github.com/ArenaEntertainment/headless-wallet/pull/20))

### ❤️ Thank You

- Chris Kitch

## 1.0.2 (2025-09-16)

### 🩹 Fixes

- add esbuild alias to resolve Node.js events module for browser bundling ([5234d610](https://github.com/ArenaEntertainment/headless-wallet/commit/5234d610))
- resolve Node.js 'events' module bundling issue in Playwright package ([a0ae99a2](https://github.com/ArenaEntertainment/headless-wallet/commit/a0ae99a2))
- **playwright:** implement pre-bundled wallet injection for AppKit multichain detection ([#18](https://github.com/ArenaEntertainment/headless-wallet/issues/18))

### 🔥 Performance

- **playwright:** optimise bundle size from 2.11 MB to 0.92 MB (56% reduction) ([5d1d6518](https://github.com/ArenaEntertainment/headless-wallet/commit/5d1d6518))

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.7.1

### ❤️ Thank You

- Chris Kitch

## 1.0.1 (2025-09-15)

### 🩹 Fixes

- **playwright:** resolve AppKit wallet detection with proper Solana wallet standard ([#18](https://github.com/ArenaEntertainment/headless-wallet/issues/18))

### ❤️ Thank You

- Chris Kitch

# 1.0.0 (2025-09-15)

### 🚀 Features

- ⚠️  **playwright:** major refactor to bridge pattern eliminating code duplication ([9ada1d1c](https://github.com/ArenaEntertainment/headless-wallet/commit/9ada1d1c))

### ⚠️  Breaking Changes

- **playwright:** Refactored Playwright package from 450+ lines to 294 lines using bridge pattern that delegates all wallet logic to core HeadlessWallet class. This is a major architectural improvement that eliminates code duplication while maintaining all functionality.

### ❤️ Thank You

- Chris Kitch

## 0.7.0 (2025-09-15)

### 🚀 Features

- enhance EIP-6963 wallet discovery and add BrowserContext injection tests ([#18](https://github.com/ArenaEntertainment/headless-wallet/issues/18))

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.7.0

### ❤️ Thank You

- Chris Kitch

## 0.6.2 (2025-09-15)

### 🩹 Fixes

- AppKit integration private key persistence bug ([#16](https://github.com/ArenaEntertainment/headless-wallet/issues/16))

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.6.2

### ❤️ Thank You

- Chris Kitch

## 0.6.1 (2025-09-15)

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.6.1

## 0.6.0 (2025-09-15)

### 🚀 Features

- Switch all demos to use testnets and remove mock transaction fallbacks ([e94c5668](https://github.com/ArenaEntertainment/headless-wallet/commit/e94c5668))

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.6.0

### ❤️ Thank You

- Chris Kitch

## 0.5.1 (2025-09-14)

### 🩹 Fixes

- Fix Solana base58 key support and PublicKey serialization ([731eca33](https://github.com/ArenaEntertainment/headless-wallet/commit/731eca33))

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.5.1

### ❤️ Thank You

- Chris Kitch

## 0.5.0 (2025-09-14)

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.5.0

## 0.4.6 (2025-09-14)

### 🩹 Fixes

- update default wallet icon to have square background ([457d13b6](https://github.com/ArenaEntertainment/headless-wallet/commit/457d13b6))

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.4.9

### ❤️ Thank You

- Chris Kitch

## 0.4.5 (2025-09-14)

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.4.8

## 0.4.4 (2025-09-14)

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.4.7

## 0.4.3 (2025-09-14)

### 🩹 Fixes

- wallet reinstallation with proper cleanup and Solana tests ([#5](https://github.com/ArenaEntertainment/headless-wallet/issues/5))

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.4.6

### ❤️ Thank You

- Chris Kitch

## 0.4.2 (2025-09-14)

### 🩹 Fixes

- use wallet branding from core instead of hardcoding in playwright adapter ([aa929afa](https://github.com/ArenaEntertainment/headless-wallet/commit/aa929afa))

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.4.5

### ❤️ Thank You

- Chris Kitch

## 0.4.1 (2025-09-14)

### 🩹 Fixes

- implement disconnect functionality with proper state management and event emission ([#4](https://github.com/ArenaEntertainment/headless-wallet/issues/4))

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.4.4

### ❤️ Thank You

- Chris Kitch

## 0.4.0 (2025-09-14)

### 🚀 Features

- add comprehensive test coverage for new features ([b567bf03](https://github.com/ArenaEntertainment/headless-wallet/commit/b567bf03))

### 🩹 Fixes

- achieve feature parity with wallet-mock and fix critical issues ([#1](https://github.com/ArenaEntertainment/headless-wallet/issues/1), [#2](https://github.com/ArenaEntertainment/headless-wallet/issues/2), [#3](https://github.com/ArenaEntertainment/headless-wallet/issues/3))

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.4.3

### ❤️ Thank You

- Chris Kitch

## 0.3.2 (2025-09-14)

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.4.2

## 0.3.1 (2025-09-14)

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.4.1

## 0.3.0 (2025-09-14)

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.4.0

## 0.2.1 (2025-09-14)

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.3.0

## 0.2.0 (2025-09-13)

### 🚀 Features

- set up automated publishing to GitHub Packages with Nx Release ([0ce37e66](https://github.com/ArenaEntertainment/headless-wallet/commit/0ce37e66))
- implement Arena "A" logo as new default branding ([#07](https://github.com/ArenaEntertainment/headless-wallet/issues/07), [#046](https://github.com/ArenaEntertainment/headless-wallet/issues/046))

### 🩹 Fixes

- install Nx as devDependency to enable nx release command ([7d3c478d](https://github.com/ArenaEntertainment/headless-wallet/commit/7d3c478d))
- GitHub Actions build errors - complete HeadlessWallet transition ([d4cd3949](https://github.com/ArenaEntertainment/headless-wallet/commit/d4cd3949))
- update import paths and add missing @types/node dependencies ([5d785e48](https://github.com/ArenaEntertainment/headless-wallet/commit/5d785e48))

### 🧱 Updated Dependencies

- Updated @arenaentertainment/headless-wallet to 0.2.0

### ❤️ Thank You

- Chris Kitch