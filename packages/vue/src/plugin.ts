/**
 * Vue plugin for wallet-mock integration
 */

import type { App, InjectionKey } from 'vue';
import { ref, type Ref } from 'vue';
import {
  createWallet,
  type MockWallet,
  type WalletConfig,
  createProductionGuard
} from '@arenaentertainment/wallet-mock';
import type {
  MockWalletPluginOptions,
  MockWalletPlugin,
  ProductionSafetyCheck
} from './types.js';
import { setupDevTools, updateDevToolsWallet } from './devtools.js';

/**
 * Injection key for the wallet instance
 */
export const WALLET_INJECTION_KEY: InjectionKey<Ref<MockWallet | null>> = Symbol('wallet-mock');

/**
 * Default injection key name
 */
const DEFAULT_INJECT_KEY = 'wallet-mock';

/**
 * Global wallet instance storage
 */
let globalWalletInstance: Ref<MockWallet | null> = ref(null);

/**
 * Production safety checker
 */
function checkProductionSafety(): ProductionSafetyCheck {
  const guard = createProductionGuard({
    allowInProduction: false,
    strictMode: true
  });

  const result = guard.checkEnvironment();

  return {
    isProduction: result.isProduction,
    warnings: result.warnings,
    blockingErrors: result.errors,
    canProceed: result.canProceed
  };
}

/**
 * Create the Vue plugin instance
 */
export function createMockWalletPlugin(): MockWalletPlugin {
  return {
    install(app: App, options: MockWalletPluginOptions = {}) {
      // Extract plugin-specific options
      const {
        autoConnect = false,
        devtools = true,
        injectKey = WALLET_INJECTION_KEY,
        productionChecks = true,
        ...walletConfig
      } = options;

      // Production safety checks
      if (productionChecks) {
        const safety = checkProductionSafety();

        if (safety.warnings.length > 0) {
          console.warn('[WalletMock Vue Plugin] Production warnings:', safety.warnings);
        }

        if (!safety.canProceed) {
          console.error('[WalletMock Vue Plugin] Production errors:', safety.blockingErrors);
          throw new Error('WalletMock cannot be used in production environment');
        }
      }

      // Create wallet configuration with defaults
      const config: WalletConfig = {
        accounts: [{ type: 'dual_chain' }],
        chains: ['ethereum', 'polygon', 'mainnet-beta'],
        autoConnect: false, // We handle autoConnect at plugin level
        ...walletConfig
      };

      // Initialize wallet instance
      const initializeWallet = async () => {
        try {
          const wallet = await createWallet(config);
          globalWalletInstance.value = wallet;

          // Setup DevTools if enabled
          if (devtools && process.env.NODE_ENV !== 'production') {
            setupDevTools(app, wallet);
          }

          // Auto-connect if requested
          if (autoConnect) {
            await wallet.connect();
          }

          return wallet;
        } catch (error) {
          console.error('[WalletMock Vue Plugin] Failed to initialize wallet:', error);
          throw error;
        }
      };

      // Provide the wallet instance
      if (typeof injectKey === 'string') {
        app.provide(injectKey, globalWalletInstance);
      } else {
        app.provide(injectKey, globalWalletInstance);
      }

      // Add global properties for convenience
      app.config.globalProperties.$wallet = globalWalletInstance;

      // Initialize wallet on next tick
      app.config.globalProperties.$nextTick(() => {
        initializeWallet().catch((error) => {
          console.error('[WalletMock Vue Plugin] Wallet initialization failed:', error);
        });
      });

      // Plugin utilities
      app.config.globalProperties.$walletUtils = {
        /**
         * Reinitialize the wallet with new configuration
         */
        async reinitialize(newConfig: Partial<WalletConfig>) {
          const mergedConfig = { ...config, ...newConfig };

          // Disconnect current wallet if exists
          if (globalWalletInstance.value) {
            await globalWalletInstance.value.disconnect();
          }

          // Create new wallet
          const wallet = await createWallet(mergedConfig);
          globalWalletInstance.value = wallet;

          // Update DevTools
          if (devtools && process.env.NODE_ENV !== 'production') {
            updateDevToolsWallet(wallet);
          }

          return wallet;
        },

        /**
         * Get current wallet instance
         */
        getWallet() {
          return globalWalletInstance.value;
        },

        /**
         * Check if wallet is available
         */
        isWalletAvailable() {
          return globalWalletInstance.value !== null;
        },

        /**
         * Reset wallet to initial state
         */
        async reset() {
          if (globalWalletInstance.value) {
            await globalWalletInstance.value.disconnect();
            globalWalletInstance.value = null;
          }

          return initializeWallet();
        }
      };

      // Development helpers
      if (process.env.NODE_ENV !== 'production') {
        // Add to global scope for debugging
        if (typeof window !== 'undefined') {
          (window as any).__WALLET_MOCK_VUE__ = {
            wallet: globalWalletInstance,
            utils: app.config.globalProperties.$walletUtils,
            version: '0.1.0'
          };
        }

        console.log('[WalletMock Vue Plugin] Plugin installed successfully');
        console.log('[WalletMock Vue Plugin] Config:', config);
      }
    }
  };
}

/**
 * Default plugin instance
 */
export const MockWalletPlugin = createMockWalletPlugin();

/**
 * Get the global wallet instance
 */
export function getGlobalWalletInstance(): Ref<MockWallet | null> {
  return globalWalletInstance;
}

/**
 * Set the global wallet instance (for testing purposes)
 */
export function setGlobalWalletInstance(wallet: MockWallet | null): void {
  globalWalletInstance.value = wallet;

  // Update DevTools
  if (process.env.NODE_ENV !== 'production') {
    updateDevToolsWallet(wallet);
  }
}

/**
 * Type guard to check if wallet is available
 */
export function isWalletAvailable(wallet: MockWallet | null): wallet is MockWallet {
  return wallet !== null && typeof wallet === 'object';
}

// Type declaration for global properties
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $wallet: Ref<MockWallet | null>;
    $walletUtils: {
      reinitialize(config: Partial<WalletConfig>): Promise<MockWallet>;
      getWallet(): MockWallet | null;
      isWalletAvailable(): boolean;
      reset(): Promise<MockWallet>;
    };
  }
}