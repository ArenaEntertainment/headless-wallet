import type { App } from 'vue';
import { injectHeadlessWallet, type HeadlessWalletConfig } from '@arenaentertainment/headless-wallet';

export interface HeadlessWalletPluginOptions extends HeadlessWalletConfig {
  enabled?: boolean;
}

/**
 * HeadlessWalletPlugin - Injects mock wallet providers into the browser
 *
 * This plugin simply injects window.ethereum (and window.phantom.solana if configured)
 * so that standard wallet libraries like wagmi-vue, ethers, viem, Reown AppKit, etc. can
 * detect and interact with the mock wallet just like a real wallet.
 *
 * @example
 * ```ts
 * // In your main.ts
 * import { HeadlessWalletPlugin } from '@arenaentertainment/wallet-mock-vue'
 *
 * app.use(HeadlessWalletPlugin, {
 *   enabled: process.env.NODE_ENV === 'development',
 *   accounts: [{ privateKey: '0x...', type: 'evm' }]
 * })
 *
 * // Then use standard wallet libraries in components
 * <script setup>
 * import { useAccount, useSignMessage } from 'wagmi-vue' // or similar
 *
 * const { address } = useAccount() // wagmi-vue composable
 * const { signMessage } = useSignMessage() // wagmi-vue composable
 * // wallet-mock provides window.ethereum, wagmi handles the rest
 * </script>
 * ```
 */
export const HeadlessWalletPlugin = {
  install(app: App, options: HeadlessWalletPluginOptions) {
    const {
      enabled = process.env.NODE_ENV === 'development',
      accounts = [],
      ...walletConfig
    } = options;

    if (!enabled) {
      return;
    }

    try {
      // Simply inject the mock wallet providers into the browser
      // This sets up window.ethereum (and window.phantom.solana if configured)
      // Standard wallet libraries will detect and use these providers
      injectHeadlessWallet({
        accounts,
        ...walletConfig
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Mock wallet injected for development');
      }
    } catch (error) {
      console.warn('Failed to inject mock wallet:', error);
    }
  }
};