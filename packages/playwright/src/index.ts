import type { Page, BrowserContext } from '@playwright/test';
import { HeadlessWallet } from '@arenaentertainment/headless-wallet';
import type { HeadlessWalletConfig } from '@arenaentertainment/headless-wallet';
import type { Chain, Transport } from 'viem';

// Track installed wallets per page/context
const wallets = new Map<string, HeadlessWallet>();

// Track exposed functions to avoid re-exposure errors
const exposedFunctions: WeakSet<Page | BrowserContext> = new WeakSet();

export async function installHeadlessWallet(
  target: Page | BrowserContext,
  config: HeadlessWalletConfig & {
    autoConnect?: boolean;
    debug?: boolean;
  }
): Promise<string> {
  const walletId = `wallet-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const wallet = new HeadlessWallet(config);
  wallets.set(walletId, wallet);

  const { autoConnect = false, debug = false } = config;

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
        // Event emitter implementation
        const listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
        let isConnected = false;
        let accounts: string[] = [];

        const ethereumProvider = {
          isMetaMask: true,
          request: async (args: { method: string; params?: any[] }) => {
            const result = await (window as any).__headlessWalletRequest({
              walletId,
              method: args.method,
              params: args.params,
              provider: 'evm'
            });

            // Track connection state
            if (args.method === 'eth_requestAccounts' && result && result.length > 0) {
              isConnected = true;
              accounts = result;
              // Emit connect event
              const handlers = listeners.get('connect') || [];
              handlers.forEach(handler => handler({ chainId: '0x1' }));
            } else if (args.method === 'eth_accounts') {
              // Return cached accounts if disconnected
              if (!isConnected) {
                return [];
              }
            } else if (args.method === 'disconnect') {
              isConnected = false;
              accounts = [];
              // Emit disconnect event
              const disconnectHandlers = listeners.get('disconnect') || [];
              disconnectHandlers.forEach(handler => handler({ code: 4900, message: 'User disconnected' }));
              // Emit accountsChanged with empty array
              const accountsHandlers = listeners.get('accountsChanged') || [];
              accountsHandlers.forEach(handler => handler([]));

            }

            return result;
          },
          on: (event: string, handler: (...args: any[]) => void) => {
            if (!listeners.has(event)) {
              listeners.set(event, new Set());
            }
            listeners.get(event)!.add(handler);
          },
          removeListener: (event: string, handler: (...args: any[]) => void) => {
            listeners.get(event)?.delete(handler);
          },
          disconnect: async () => {
            const result = await (window as any).__headlessWalletRequest({
              walletId,
              method: 'disconnect',
              provider: 'evm'
            });

            // Update local state
            isConnected = false;
            accounts = [];

            // Emit events
            const disconnectHandlers = listeners.get('disconnect') || [];
            disconnectHandlers.forEach(handler => handler({ code: 4900, message: 'User disconnected' }));
            const accountsHandlers = listeners.get('accountsChanged') || [];
            accountsHandlers.forEach(handler => handler([]));

            return result;
          }
        };

        (window as any).ethereum = ethereumProvider;

        // EIP-6963 support
        const info = {
          uuid: walletId,
          name: 'Headless Wallet',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE0IDI4QzYuMjY4IDI4IDAgMjEuNzMyIDAgMTRTNi4yNjggMCAxNCAwczE0IDYuMjY4IDE0IDE0LTYuMjY4IDE0LTE0IDE0eiIgZmlsbD0iIzA1MkY3MiIvPjwvc3ZnPg==',
          rdns: 'io.metamask'
        };

        const announceProvider = () => {
          window.dispatchEvent(
            new CustomEvent('eip6963:announceProvider', {
              detail: { info, provider: ethereumProvider }
            })
          );
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
        // Event emitter implementation for Solana
        const solanaListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
        let solanaConnected = false;
        let solanaPublicKey: any = null;

        const solanaProvider = {
          isPhantom: true,
          isConnected: false,
          publicKey: null,
          connect: async () => {
            const result = await (window as any).__headlessWalletRequest({
              walletId,
              method: 'connect',
              provider: 'solana'
            });

            if (result && result.publicKey) {
              solanaConnected = true;
              solanaPublicKey = result.publicKey;
              solanaProvider.isConnected = true;
              solanaProvider.publicKey = result.publicKey;

              // Emit connect event
              const handlers = solanaListeners.get('connect') || [];
              handlers.forEach(handler => handler(result.publicKey));
            }

            return result;
          },
          disconnect: async () => {
            const result = await (window as any).__headlessWalletRequest({
              walletId,
              method: 'disconnect',
              provider: 'solana'
            });

            // Update local state
            solanaConnected = false;
            solanaPublicKey = null;
            solanaProvider.isConnected = false;
            solanaProvider.publicKey = null;

            // Emit disconnect event
            const handlers = solanaListeners.get('disconnect') || [];
            handlers.forEach(handler => handler());

            return result;
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
          on: (event: string, handler: (...args: any[]) => void) => {
            if (!solanaListeners.has(event)) {
              solanaListeners.set(event, new Set());
            }
            solanaListeners.get(event)!.add(handler);
          },
          removeListener: (event: string, handler: (...args: any[]) => void) => {
            solanaListeners.get(event)?.delete(handler);
          }
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

export async function uninstallHeadlessWallet(target: Page | BrowserContext, walletId?: string): Promise<void> {
  // If walletId is provided, remove specific wallet
  if (walletId) {
    wallets.delete(walletId);
  }

  // Clear injection by using an empty script
  if ('evaluate' in target) {
    await target.evaluate(() => {
    // Remove ethereum provider
    if ((window as any).ethereum) {
      delete (window as any).ethereum;
    }

    // Remove EIP-6963 listener
    const listeners = (window as any).__eip6963RequestListeners;
    if (listeners) {
      listeners.forEach((listener: any) => {
        window.removeEventListener('eip6963:requestProvider', listener);
      });
      delete (window as any).__eip6963RequestListeners;
    }

    // Remove Solana provider
    if ((window as any).phantom?.solana) {
      delete (window as any).phantom.solana;
      // Clean up phantom object if empty
      if ((window as any).phantom && Object.keys((window as any).phantom).length === 0) {
        delete (window as any).phantom;
      }
    }
  });
  } else {
    await target.addInitScript(() => {
      // Remove ethereum provider
      if ((window as any).ethereum) {
        delete (window as any).ethereum;
      }

      // Remove EIP-6963 listener
      const listeners = (window as any).__eip6963RequestListeners;
      if (listeners) {
        listeners.forEach((listener: any) => {
          window.removeEventListener('eip6963:requestProvider', listener);
        });
        delete (window as any).__eip6963RequestListeners;
      }

      // Remove Solana provider
      if ((window as any).phantom?.solana) {
        delete (window as any).phantom.solana;
        // Clean up phantom object if empty
        if ((window as any).phantom && Object.keys((window as any).phantom).length === 0) {
          delete (window as any).phantom;
        }
      }
    });
  }
}

// Export types
export type { HeadlessWalletConfig, Chain, Transport };