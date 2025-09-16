import { injectHeadlessWallet } from '@arenaentertainment/headless-wallet';
import type { HeadlessWalletConfig } from '@arenaentertainment/headless-wallet';

// Declare global function for TypeScript
declare global {
  interface Window {
    __injectHeadlessWallet: (config: HeadlessWalletConfig & { autoConnect?: boolean; debug?: boolean }) => any;
    __playwrightHeadlessWallets?: Map<string, any>;
  }
}

// Expose the function globally for injection
window.__injectHeadlessWallet = (config: HeadlessWalletConfig & { autoConnect?: boolean; debug?: boolean }) => {
  if (config.debug) {
    console.log('[Bundled Headless Wallet] Initializing with config:', {
      accounts: config.accounts?.length || 0,
      branding: config.branding?.name || 'Arena Headless Wallet'
    });
  }

  try {
    // Use the real injectHeadlessWallet function from the core package
    const wallet = injectHeadlessWallet(config);

    if (config.debug) {
      console.log('✅ Bundled wallet injection successful');
      console.log('  - EVM wallet:', wallet.hasEVM());
      console.log('  - Solana wallet:', wallet.hasSolana());

      // Debug EIP-6963 events
      if (wallet.hasEVM()) {
        window.addEventListener('eip6963:requestProvider', () => {
          console.log('🔍 EIP-6963 request detected');
        });
      }
    }

    return wallet;
  } catch (error) {
    console.error('❌ Failed to inject bundled headless wallet:', error);
    throw error;
  }
};

// Export types for Playwright package
export type { HeadlessWalletConfig };