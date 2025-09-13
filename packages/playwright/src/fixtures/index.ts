/**
 * @fileoverview Fixtures module exports
 *
 * This module exports all Playwright fixtures and testing utilities
 * for wallet mock integration with proper TypeScript types.
 */

// Main fixtures and test extensions
export {
  test,
  testWithEVMWallet,
  testWithSolanaWallet,
  testWithMultiChainWallet,
  testWithErrorHandling,
  expect,
  expectWallet
} from './wallet-fixtures.js';

// Re-export types for fixture configuration
export type {
  WalletFixtureConfig
} from './wallet-fixtures.js';

// Re-export Playwright types that are commonly used with fixtures
export type {
  PlaywrightWalletContext,
  PlaywrightFixtureOptions,
  InstallMockWalletOptions,
  WalletInstallationResult,
  PlaywrightWalletManager
} from '../types.js';