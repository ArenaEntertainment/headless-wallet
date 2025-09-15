import type { Page, BrowserContext } from '@playwright/test';
import type { HeadlessWalletConfig } from '@arenaentertainment/headless-wallet';
import { HeadlessWallet } from '@arenaentertainment/headless-wallet';

// Track installed wallets globally
const wallets = new Map<string, HeadlessWallet>();
const exposedFunctions = new WeakSet<Page | BrowserContext>();

/**
 * Installs a headless wallet using a bridge pattern where the core HeadlessWallet
 * handles ALL wallet logic, and we just create a thin proxy in the browser
 */
export async function installHeadlessWallet(
  target: Page | BrowserContext,
  config: HeadlessWalletConfig & { autoConnect?: boolean; debug?: boolean }
): Promise<string> {
  const walletId = `wallet-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const wallet = new HeadlessWallet(config);

  // Store wallet reference
  wallets.set(walletId, wallet);

  // Only expose bridge function once per target
  if (!exposedFunctions.has(target)) {
    await target.exposeFunction('__headlessWalletBridge', async (request: {
      walletId: string;
      action: string;
      data?: any;
    }) => {
      const { walletId: reqWalletId, action, data } = request;
      const targetWallet = wallets.get(reqWalletId);

      if (!targetWallet) {
        throw new Error(`Wallet ${reqWalletId} not found`);
      }

      // Handle different bridge actions
      switch (action) {
        case 'request':
          return targetWallet.request(data);
        case 'getEthereumProvider':
          return targetWallet.getEthereumProvider();
        case 'getSolanaProvider':
          return targetWallet.getSolanaProvider();
        case 'hasEVM':
          return targetWallet.hasEVM();
        case 'hasSolana':
          return targetWallet.hasSolana();
        case 'getBranding':
          return targetWallet.getBranding();
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    });
    exposedFunctions.add(target);
  }

  // Injection script that uses the EXACT same logic as core's injectHeadlessWallet
  // but with bridge calls instead of direct wallet access
  const injectionScript = `
    (async function() {
      const walletId = '${walletId}';
      const debug = ${config.debug || false};

      // Get wallet info from bridge
      const hasEVM = await window.__headlessWalletBridge({ walletId, action: 'hasEVM' });
      const hasSolana = await window.__headlessWalletBridge({ walletId, action: 'hasSolana' });
      const branding = await window.__headlessWalletBridge({ walletId, action: 'getBranding' });

      if (debug) {
        console.log('[Headless Wallet] Injecting wallet', walletId, { hasEVM, hasSolana, branding });
      }

      // Create a local HeadlessWallet-like object that delegates to bridge
      const wallet = {
        hasEVM: () => hasEVM,
        hasSolana: () => hasSolana,
        getBranding: () => branding,
        getEthereumProvider: function() {
          return this.ethereumProvider;
        },
        getSolanaProvider: function() {
          return this.solanaProvider;
        },
        ethereumProvider: null,
        solanaProvider: null
      };

      // Store wallet reference for cleanup
      if (!window.__headlessWallets) window.__headlessWallets = new Map();
      window.__headlessWallets.set(walletId, wallet);

      // This is the EXACT logic from core's injectHeadlessWallet function (lines 351-414)
      // Just with bridge calls instead of direct wallet access

      // Inject EVM provider (matching core/src/index.ts:352-378)
      if (hasEVM) {
        const ethereumProvider = {
          isMetaMask: branding.isMetaMask,
          request: async (args) => {
            return window.__headlessWalletBridge({
              walletId,
              action: 'request',
              data: { method: args.method, params: args.params, provider: 'evm' }
            });
          },
          on: () => {}, // Event handling would need more bridge work
          removeListener: () => {}
        };

        wallet.ethereumProvider = ethereumProvider;
        window.ethereum = ethereumProvider;

        // EIP-6963 wallet discovery (matching core/src/index.ts:355-377)
        const walletUuid = crypto.randomUUID ? crypto.randomUUID() :
          'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
          });

        const announceProvider = () => {
          window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
            detail: Object.freeze({
              info: {
                uuid: walletUuid,
                name: branding.name || 'Arena Headless Wallet',
                icon: branding.icon,
                rdns: branding.rdns || 'com.arenaentertainment.headless-wallet'
              },
              provider: ethereumProvider
            })
          }));
        };

        // Announce immediately and on request
        announceProvider();
        window.addEventListener('eip6963:requestProvider', announceProvider);
      }

      // Inject Solana provider (matching core/src/index.ts:380-414)
      if (hasSolana) {
        const solanaProvider = {
          isPhantom: branding.isPhantom,
          isConnected: false,
          publicKey: null,
          connect: async () => {
            const result = await window.__headlessWalletBridge({
              walletId,
              action: 'request',
              data: { method: 'connect', provider: 'solana' }
            });
            if (result?.publicKey) {
              solanaProvider.isConnected = true;
              solanaProvider.publicKey = result.publicKey;
            }
            return result;
          },
          disconnect: async () => {
            await window.__headlessWalletBridge({
              walletId,
              action: 'request',
              data: { method: 'disconnect', provider: 'solana' }
            });
            solanaProvider.isConnected = false;
            solanaProvider.publicKey = null;
          },
          signTransaction: async (transaction) => {
            return window.__headlessWalletBridge({
              walletId,
              action: 'request',
              data: { method: 'signTransaction', params: [transaction], provider: 'solana' }
            });
          },
          signAllTransactions: async (transactions) => {
            return window.__headlessWalletBridge({
              walletId,
              action: 'request',
              data: { method: 'signAllTransactions', params: [transactions], provider: 'solana' }
            });
          },
          signMessage: async (message) => {
            return window.__headlessWalletBridge({
              walletId,
              action: 'request',
              data: { method: 'signMessage', params: [message], provider: 'solana' }
            });
          }
        };

        wallet.solanaProvider = solanaProvider;

        if (!window.phantom) window.phantom = {};
        window.phantom.solana = solanaProvider;

        // Wallet Standard registration (matching core/src/index.ts:387-410)
        // This matches the exact pattern from the core package
        const walletStandard = {
          version: '1.0.0',
          name: branding.name || 'Arena Headless Wallet',
          icon: branding.icon,
          chains: ['solana:mainnet', 'solana:devnet', 'solana:testnet'],
          accounts: [],
          features: {
            'standard:connect': {
              version: '1.0.0',
              connect: solanaProvider.connect
            },
            'standard:disconnect': {
              version: '1.0.0',
              disconnect: solanaProvider.disconnect
            },
            'standard:events': {
              version: '1.0.0',
              on: () => {},
              off: () => {}
            }
          }
        };

        // Register via Wallet Standard event (matching core)
        const registerWallet = (callback) => {
          if (typeof callback === 'function') {
            callback(walletStandard);
          }
          return walletStandard;
        };

        window.dispatchEvent(new CustomEvent('wallet-standard:register-wallet', {
          detail: registerWallet
        }));
      }

      // Auto-connect if requested
      if (${config.autoConnect || false}) {
        setTimeout(() => {
          if (wallet.ethereumProvider) {
            wallet.ethereumProvider.request({ method: 'eth_requestAccounts' }).catch(() => {});
          }
          if (wallet.solanaProvider) {
            wallet.solanaProvider.connect().catch(() => {});
          }
        }, 100);
      }

      if (debug) {
        console.log('[Headless Wallet] Successfully injected wallet', walletId);
      }
    })();
  `;

  if ('evaluate' in target) {
    await target.evaluate(injectionScript);
  } else {
    await target.addInitScript(injectionScript);
  }

  return walletId;
}

/**
 * Uninstalls a headless wallet
 */
export async function uninstallHeadlessWallet(
  target: Page | BrowserContext,
  walletId: string
): Promise<void> {
  // Clean up Node.js side
  wallets.delete(walletId);

  // Clean up browser side
  const cleanupScript = `
    if (window.__headlessWallets?.has('${walletId}')) {
      window.__headlessWallets.delete('${walletId}');

      // Clean up providers if this was the last wallet
      if (window.__headlessWallets.size === 0) {
        delete window.ethereum;
        if (window.phantom) {
          delete window.phantom.solana;
          if (Object.keys(window.phantom).length === 0) {
            delete window.phantom;
          }
        }
      }
    }
  `;

  if ('evaluate' in target) {
    await target.evaluate(cleanupScript);
  }
}

// Re-export types from core
export type { HeadlessWalletConfig } from '@arenaentertainment/headless-wallet';