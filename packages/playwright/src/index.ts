import type { Page, BrowserContext } from '@playwright/test';
import { HeadlessWallet, type Account, type HeadlessWalletConfig } from '@arenaentertainment/headless-wallet';
import type { Chain, Transport } from 'viem';
import { randomUUID } from 'crypto';

export interface InstallHeadlessWalletOptions extends HeadlessWalletConfig {
  debug?: boolean;
  autoConnect?: boolean;
}

// Global wallet storage for Playwright contexts
const wallets: Map<string, HeadlessWallet> = new Map();
// Track exposed functions to avoid re-exposure errors
const exposedFunctions: WeakSet<Page | BrowserContext> = new WeakSet();

export async function installHeadlessWallet(
  target: Page | BrowserContext,
  options: InstallHeadlessWalletOptions
): Promise<string> {
  const { debug = false, autoConnect = true, ...walletConfig } = options;

  // Create the real wallet in Node.js context with full config including transports
  const wallet = new HeadlessWallet(walletConfig);
  const walletId = randomUUID();
  wallets.set(walletId, wallet);

  // Expose bridge function for browser to call back to Node.js wallet
  // Only expose if not already exposed to avoid re-installation errors
  if (!exposedFunctions.has(target)) {
    try {
      await target.exposeFunction('__headlessWalletRequest', async (request: {
    walletId: string;
    method: string;
    params?: any[];
    provider?: 'evm' | 'solana';
      }) => {
        const { walletId: reqWalletId, method, params, provider } = request;
        const targetWallet = wallets.get(reqWalletId);

        if (!targetWallet) {
          throw new Error(`Wallet ${reqWalletId} not found`);
        }

        try {
          const result = await targetWallet.request({ method, params, provider });

          if (debug) {
            console.log(`WALLET ${walletId.substring(0, 8)} REQUEST ${method}`, params, 'RESULT', result);
          }

          return result;
        } catch (error) {
          if (debug) {
            console.log(`WALLET ${walletId.substring(0, 8)} REQUEST ${method}`, params, 'ERROR', error);
          }
          throw error;
        }
      });
      exposedFunctions.add(target);
    } catch (error) {
      // Function already exposed, continue without error
      if (debug) {
        console.log('Bridge function already exposed, continuing...');
      }
    }
  }

  // Inject providers into browser context
  await target.addInitScript(
    ({ walletId, hasEVM, hasSolana, autoConnect, debug }) => {
      // EVM Provider (window.ethereum)
      if (hasEVM) {
        const ethereumProvider = {
          isMetaMask: true,
          request: async (args: { method: string; params?: any[] }) => {
            return await (window as any).__headlessWalletRequest({
              walletId,
              method: args.method,
              params: args.params,
              provider: 'evm'
            });
          },
          on: () => {}, // Event handling would need more complex bridge
          removeListener: () => {},
          disconnect: async () => {
            return await (window as any).__headlessWalletRequest({
              walletId,
              method: 'disconnect',
              provider: 'evm'
            });
          }
        };

        (window as any).ethereum = ethereumProvider;

        // EIP-6963 wallet discovery
        const announceProvider = () => {
          window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
            detail: Object.freeze({
              info: {
                uuid: `arena-mock-wallet-${walletId}`,
                name: 'Arena Wallet (EVM)',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
                rdns: 'com.arenaentertainment.mock'
              },
              provider: ethereumProvider
            })
          }));
        };

        announceProvider();
        window.addEventListener('eip6963:requestProvider', announceProvider);

        // Auto-connect if requested
        if (autoConnect) {
          setTimeout(() => {
            ethereumProvider.request({ method: 'eth_requestAccounts' });
          }, 100);
        }
      }

      // Solana Provider (window.phantom.solana)
      if (hasSolana) {
        const solanaProvider = {
          isPhantom: true,
          connect: async () => {
            return await (window as any).__headlessWalletRequest({
              walletId,
              method: 'connect',
              provider: 'solana'
            });
          },
          disconnect: async () => {
            return await (window as any).__headlessWalletRequest({
              walletId,
              method: 'disconnect',
              provider: 'solana'
            });
          },
          signTransaction: async (transaction: any) => {
            return await (window as any).__headlessWalletRequest({
              walletId,
              method: 'signTransaction',
              params: [transaction],
              provider: 'solana'
            });
          },
          signMessage: async (message: Uint8Array) => {
            return await (window as any).__headlessWalletRequest({
              walletId,
              method: 'signMessage',
              params: [message],
              provider: 'solana'
            });
          },
          on: () => {},
          removeListener: () => {}
        };

        if (!(window as any).phantom) {
          (window as any).phantom = {};
        }
        (window as any).phantom.solana = solanaProvider;

        // Auto-connect Solana if requested
        if (autoConnect) {
          setTimeout(() => {
            solanaProvider.connect();
          }, 150);
        }
      }

      if (debug) {
        console.log(`Mock wallet ${walletId.substring(0, 8)} injected with EVM:${hasEVM}, Solana:${hasSolana}`);
      }
    },
    {
      walletId,
      hasEVM: wallet.hasEVM(),
      hasSolana: wallet.hasSolana(),
      autoConnect,
      debug
    }
  );

  return walletId;
}

// Helper functions for testing
export async function connectHeadlessWallet(page: Page): Promise<void> {
  await page.evaluate(() => {
    return (window as any).ethereum?.request({ method: 'eth_requestAccounts' });
  });
}

export async function getHeadlessWalletAccounts(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    return (window as any).ethereum?.request({ method: 'eth_accounts' });
  });
}

export async function switchHeadlessWalletChain(page: Page, chainId: string): Promise<void> {
  await page.evaluate((chainId) => {
    return (window as any).ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }]
    });
  }, chainId);
}

export async function signHeadlessWalletMessage(page: Page, message: string, address?: string): Promise<string> {
  return await page.evaluate(async ({ message, address }) => {
    const accounts = address ? [address] : await (window as any).ethereum.request({ method: 'eth_accounts' });
    return (window as any).ethereum.request({
      method: 'personal_sign',
      params: [message, accounts[0]]
    });
  }, { message, address });
}

export async function connectMockSolanaWallet(page: Page): Promise<{ publicKey: string }> {
  return await page.evaluate(() => {
    return (window as any).phantom?.solana?.connect();
  });
}

export async function signMockSolanaMessage(page: Page, message: string): Promise<{ signature: Uint8Array }> {
  return await page.evaluate((message) => {
    const encodedMessage = new TextEncoder().encode(message);
    return (window as any).phantom?.solana?.signMessage(encodedMessage);
  }, message);
}

// Uninstall a specific wallet
export async function uninstallHeadlessWallet(target: Page | BrowserContext, walletId?: string): Promise<void> {
  if (walletId) {
    wallets.delete(walletId);
  }

  // For Page, use evaluate to immediately remove providers
  if ('evaluate' in target) {
    await target.evaluate(() => {
      delete (window as any).ethereum;
      if ((window as any).phantom) {
        delete (window as any).phantom.solana;
      }
    });
  } else {
    // For BrowserContext, use addInitScript for future pages
    await target.addInitScript(() => {
      delete (window as any).ethereum;
      if ((window as any).phantom) {
        delete (window as any).phantom.solana;
      }
    });
  }
}

// Cleanup function to remove all wallets from memory
export function cleanupHeadlessWallets(): void {
  wallets.clear();
  // Note: exposedFunctions WeakSet will auto-cleanup when pages/contexts are closed
}