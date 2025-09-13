import type {
  MockWallet,
  WalletFactory,
  WalletConfig,
  AccountConfig
} from '@arenaentertainment/wallet-mock-shared';
import { AccountType } from '@arenaentertainment/wallet-mock-shared';
import { CHAIN_PRESETS } from '@arenaentertainment/wallet-mock-shared';

import { UnifiedWallet } from '../wallet/unified-wallet.js';

/**
 * Preset wallet configurations for common use cases
 */
export interface WalletPreset {
  name: string;
  description: string;
  config: WalletConfig;
}

/**
 * Builder pattern for wallet configuration
 */
export class WalletConfigBuilder {
  private config: WalletConfig = {};

  /**
   * Set initial accounts
   */
  withAccounts(accounts: AccountConfig[]): WalletConfigBuilder {
    this.config.accounts = accounts;
    return this;
  }

  /**
   * Add a single account
   */
  withAccount(account: AccountConfig): WalletConfigBuilder {
    if (!this.config.accounts) {
      this.config.accounts = [];
    }
    this.config.accounts.push(account);
    return this;
  }

  /**
   * Add EVM-only account
   */
  withEVMAccount(name?: string, chainIds: string[] = ['1', '137']): WalletConfigBuilder {
    return this.withAccount({
      type: AccountType.EVM_ONLY,
      name,
      evm: { chainIds }
    });
  }

  /**
   * Add Solana-only account
   */
  withSolanaAccount(name?: string, clusters: string[] = ['mainnet-beta', 'devnet']): WalletConfigBuilder {
    return this.withAccount({
      type: AccountType.SOLANA_ONLY,
      name,
      solana: { clusters }
    });
  }

  /**
   * Add dual-chain account
   */
  withDualChainAccount(
    name?: string,
    chainIds: string[] = ['1', '137'],
    clusters: string[] = ['mainnet-beta', 'devnet']
  ): WalletConfigBuilder {
    return this.withAccount({
      type: AccountType.DUAL_CHAIN,
      name,
      evm: { chainIds },
      solana: { clusters }
    });
  }

  /**
   * Set default active account index
   */
  withDefaultAccountIndex(index: number): WalletConfigBuilder {
    this.config.defaultAccountIndex = index;
    return this;
  }

  /**
   * Enable auto-connect
   */
  withAutoConnect(autoConnect: boolean = true): WalletConfigBuilder {
    this.config.autoConnect = autoConnect;
    return this;
  }

  /**
   * Configure security settings
   */
  withSecurity(security: WalletConfig['security']): WalletConfigBuilder {
    this.config.security = { ...this.config.security, ...security };
    return this;
  }

  /**
   * Enable production checks
   */
  withProductionChecks(enabled: boolean = true): WalletConfigBuilder {
    if (!this.config.security) {
      this.config.security = {};
    }
    this.config.security.enableProductionChecks = enabled;
    return this;
  }

  /**
   * Configure debug settings
   */
  withDebug(debug: WalletConfig['debug']): WalletConfigBuilder {
    this.config.debug = { ...this.config.debug, ...debug };
    return this;
  }

  /**
   * Enable debug logging
   */
  withDebugLogging(enabled: boolean = true, logLevel: 'debug' | 'info' | 'warn' | 'error' = 'debug'): WalletConfigBuilder {
    if (!this.config.debug) {
      this.config.debug = {};
    }
    this.config.debug.enableLogging = enabled;
    this.config.debug.logLevel = logLevel;
    return this;
  }

  /**
   * Build the wallet configuration
   */
  build(): WalletConfig {
    return { ...this.config };
  }
}

/**
 * Wallet factory implementation for easy instantiation
 */
export class MockWalletFactory implements WalletFactory {
  /**
   * Create a wallet with the given configuration
   */
  async create(config: WalletConfig): Promise<MockWallet> {
    try {
      const wallet = new UnifiedWallet(config);
      return wallet;
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a wallet from configuration (alias for create)
   */
  async createFromConfig(config: WalletConfig): Promise<MockWallet> {
    return this.create(config);
  }

  /**
   * Create a wallet using a builder pattern
   */
  async createWithBuilder(builderFn: (builder: WalletConfigBuilder) => WalletConfigBuilder): Promise<MockWallet> {
    const builder = new WalletConfigBuilder();
    const config = builderFn(builder).build();
    return this.create(config);
  }

  /**
   * Create a wallet from a preset configuration
   */
  async createFromPreset(presetName: keyof typeof WALLET_PRESETS): Promise<MockWallet> {
    const preset = WALLET_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Unknown wallet preset: ${presetName}`);
    }
    return this.create(preset.config);
  }

  /**
   * Create a minimal EVM-only wallet
   */
  async createEVMWallet(config: {
    chainIds?: string[];
    accountName?: string;
    autoConnect?: boolean;
  } = {}): Promise<MockWallet> {
    const walletConfig: WalletConfig = {
      accounts: [{
        type: AccountType.EVM_ONLY,
        name: config.accountName,
        evm: {
          chainIds: config.chainIds || ['1', '137'] // Ethereum and Polygon by default
        }
      }],
      autoConnect: config.autoConnect ?? false,
      security: {
        enableProductionChecks: true
      }
    };

    return this.create(walletConfig);
  }

  /**
   * Create a minimal Solana-only wallet
   */
  async createSolanaWallet(config: {
    clusters?: string[];
    accountName?: string;
    autoConnect?: boolean;
  } = {}): Promise<MockWallet> {
    const walletConfig: WalletConfig = {
      accounts: [{
        type: AccountType.SOLANA_ONLY,
        name: config.accountName,
        solana: {
          clusters: config.clusters || ['mainnet-beta', 'devnet']
        }
      }],
      autoConnect: config.autoConnect ?? false,
      security: {
        enableProductionChecks: true
      }
    };

    return this.create(walletConfig);
  }

  /**
   * Create a multi-chain wallet supporting both EVM and Solana
   */
  async createMultiChainWallet(config: {
    evmChainIds?: string[];
    solanaClusters?: string[];
    accountName?: string;
    autoConnect?: boolean;
  } = {}): Promise<MockWallet> {
    const walletConfig: WalletConfig = {
      accounts: [{
        type: AccountType.DUAL_CHAIN,
        name: config.accountName,
        evm: {
          chainIds: config.evmChainIds || ['1', '137']
        },
        solana: {
          clusters: config.solanaClusters || ['mainnet-beta', 'devnet']
        }
      }],
      autoConnect: config.autoConnect ?? false,
      security: {
        enableProductionChecks: true
      }
    };

    return this.create(walletConfig);
  }

  /**
   * Create a development wallet with relaxed security
   */
  async createDevWallet(config: {
    accounts?: AccountConfig[];
    autoConnect?: boolean;
    enableLogging?: boolean;
  } = {}): Promise<MockWallet> {
    const walletConfig: WalletConfig = {
      accounts: config.accounts || [
        {
          type: AccountType.DUAL_CHAIN,
          name: 'Development Account',
          evm: { chainIds: ['31337', '1337'] }, // Local development chains
          solana: { clusters: ['devnet', 'localnet'] }
        }
      ],
      autoConnect: config.autoConnect ?? true,
      security: {
        enableProductionChecks: true, // Keep production checks even in dev
        enableSecureMemory: false,
        autoCleanup: true
      },
      debug: {
        enableLogging: config.enableLogging ?? true,
        logLevel: 'debug'
      }
    };

    return this.create(walletConfig);
  }

  /**
   * Get configuration builder
   */
  configBuilder(): WalletConfigBuilder {
    return new WalletConfigBuilder();
  }

  /**
   * Get available presets
   */
  getPresets(): Record<string, WalletPreset> {
    return WALLET_PRESETS;
  }
}

/**
 * Predefined wallet configurations
 */
export const WALLET_PRESETS: Record<string, WalletPreset> = {
  minimal: {
    name: 'Minimal Wallet',
    description: 'Basic wallet with single EVM account',
    config: {
      accounts: [{
        type: AccountType.EVM_ONLY,
        name: 'Main Account',
        evm: { chainIds: ['1'] }
      }],
      autoConnect: false
    }
  },

  development: {
    name: 'Development Wallet',
    description: 'Full-featured wallet for development with debug logging',
    config: {
      accounts: [
        {
          type: AccountType.DUAL_CHAIN,
          name: 'Development Account 1',
          evm: { chainIds: ['31337', '1337', '1', '137'] },
          solana: { clusters: ['devnet', 'localnet'] }
        },
        {
          type: AccountType.EVM_ONLY,
          name: 'EVM Test Account',
          evm: { chainIds: ['31337', '1337'] }
        }
      ],
      autoConnect: true,
      security: {
        enableProductionChecks: true,
        autoCleanup: true
      },
      debug: {
        enableLogging: true,
        logLevel: 'debug'
      }
    }
  },

  multiChain: {
    name: 'Multi-Chain Wallet',
    description: 'Production-ready wallet supporting both EVM and Solana',
    config: {
      accounts: [{
        type: AccountType.DUAL_CHAIN,
        name: 'Multi-Chain Account',
        evm: { chainIds: ['1', '137', '42161', '10'] }, // Ethereum, Polygon, Arbitrum, Optimism
        solana: { clusters: ['mainnet-beta', 'devnet'] }
      }],
      autoConnect: false,
      security: {
        enableProductionChecks: true,
        enableSecureMemory: true,
        autoCleanup: true
      }
    }
  },

  testing: {
    name: 'Testing Wallet',
    description: 'Wallet configured for automated testing',
    config: {
      accounts: [
        {
          type: AccountType.EVM_ONLY,
          name: 'Test Account EVM',
          evm: { chainIds: ['31337'] }
        },
        {
          type: AccountType.SOLANA_ONLY,
          name: 'Test Account Solana',
          solana: { clusters: ['devnet'] }
        },
        {
          type: AccountType.DUAL_CHAIN,
          name: 'Test Account Dual',
          evm: { chainIds: ['31337'] },
          solana: { clusters: ['devnet'] }
        }
      ],
      autoConnect: false,
      security: {
        enableProductionChecks: false, // Disable for testing
        autoCleanup: false
      },
      debug: {
        enableLogging: false // Reduce noise in tests
      }
    }
  }
};

/**
 * Default factory instance
 */
export const walletFactory = new MockWalletFactory();

/**
 * Convenience functions for creating wallets
 */
export const createWallet = walletFactory.create.bind(walletFactory);
export const createEVMWallet = walletFactory.createEVMWallet.bind(walletFactory);
export const createSolanaWallet = walletFactory.createSolanaWallet.bind(walletFactory);
export const createMultiChainWallet = walletFactory.createMultiChainWallet.bind(walletFactory);
export const createDevWallet = walletFactory.createDevWallet.bind(walletFactory);
export const createWalletFromPreset = walletFactory.createFromPreset.bind(walletFactory);