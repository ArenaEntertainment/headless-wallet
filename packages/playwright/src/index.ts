import type { Page, BrowserContext } from '@playwright/test';
import { HeadlessWallet } from '@arenaentertainment/headless-wallet';
import type { HeadlessWalletConfig } from '@arenaentertainment/headless-wallet';
import type { Chain, Transport } from 'viem';

// Track installed wallets per page/context
const wallets = new Map<string, HeadlessWallet>();

// Track exposed functions to avoid re-exposure errors
const exposedFunctions: WeakSet<Page | BrowserContext> = new WeakSet();

export interface InstallOptions {
  autoConnect?: boolean;
  debug?: boolean;
  /**
   * How to handle window.ethereum:
   * - 'replace': Replace window.ethereum (default, legacy behavior)
   * - 'none': Don't set window.ethereum at all (only EIP-6963)
   * - 'array': Use EIP-5749 wallet array pattern
   */
  windowEthereumMode?: 'replace' | 'none' | 'array';
  /**
   * How to handle window.phantom.solana:
   * - 'replace': Replace window.phantom.solana (default)
   * - 'none': Don't set window.phantom.solana
   */
  windowSolanaMode?: 'replace' | 'none';
}

export async function installHeadlessWallet(
  target: Page | BrowserContext,
  config: HeadlessWalletConfig & InstallOptions
): Promise<string> {
  const walletId = `wallet-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const wallet = new HeadlessWallet(config);
  wallets.set(walletId, wallet);

  const {
    autoConnect = false,
    debug = false,
    windowEthereumMode = 'replace',
    windowSolanaMode = 'replace'
  } = config;

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

  // Define the injection script
  const injectionScript = ({ walletId, hasEVM, hasSolana, branding, autoConnect, debug, windowEthereumMode, windowSolanaMode }: any) => {
      // EVM Provider (window.ethereum)
      if (hasEVM) {
        // Event emitter implementation
        const listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
        let isConnected = false;
        let accounts: string[] = [];

        const ethereumProvider = {
          isMetaMask: branding.isMetaMask,
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

        // Install provider based on mode
        if (windowEthereumMode === 'replace') {
          (window as any).ethereum = ethereumProvider;
        } else if (windowEthereumMode === 'array') {
          // EIP-5749: Support multiple wallets via array
          if (!(window as any).ethereum) {
            // No existing provider, create array
            (window as any).ethereum = [ethereumProvider];
            // Add proxy methods to the array for backward compatibility
            Object.assign((window as any).ethereum, {
              request: ethereumProvider.request,
              on: ethereumProvider.on,
              removeListener: ethereumProvider.removeListener,
              disconnect: ethereumProvider.disconnect,
              isMetaMask: ethereumProvider.isMetaMask
            });
          } else if (Array.isArray((window as any).ethereum)) {
            // Already an array, add to it
            (window as any).ethereum.push(ethereumProvider);
          } else {
            // Single provider exists, convert to array
            const existingProvider = (window as any).ethereum;
            (window as any).ethereum = [existingProvider, ethereumProvider];
            // Keep the existing provider's methods as default
            Object.assign((window as any).ethereum, {
              request: existingProvider.request,
              on: existingProvider.on,
              removeListener: existingProvider.removeListener,
              disconnect: existingProvider.disconnect,
              isMetaMask: existingProvider.isMetaMask
            });
          }
        }
        // If mode is 'none', don't set window.ethereum at all

        // Track provider for cleanup
        if (!(window as any).__headlessWalletProviders) {
          (window as any).__headlessWalletProviders = new Map();
        }
        const existingProviderInfo = (window as any).__headlessWalletProviders.get(walletId) || {};
        (window as any).__headlessWalletProviders.set(walletId, {
          ...existingProviderInfo,
          evmType: 'ethereum',
          evmProvider: ethereumProvider
        });

        // EIP-6963 support
        const info = {
          uuid: walletId,
          name: branding.name,
          icon: branding.icon,
          rdns: branding.rdns
        };

        const announceProvider = () => {
          window.dispatchEvent(
            new CustomEvent('eip6963:announceProvider', {
              detail: { info, provider: ethereumProvider }
            })
          );
        };

        // Track the listener for cleanup
        if (!(window as any).__headlessWalletListeners) {
          (window as any).__headlessWalletListeners = new Map();
        }
        (window as any).__headlessWalletListeners.set(walletId, {
          event: 'eip6963:requestProvider',
          handler: announceProvider
        });

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
        // Helper to create PublicKey-like object from plain data
        const createPublicKeyObject = (data: any) => {
          if (!data) return null;
          // If it already has methods, return as-is
          if (typeof data.toBase58 === 'function') return data;
          // Create object with methods from plain data
          const base58String = data._base58 || data.toString();
          return {
            ...data,
            toBase58: () => base58String,
            toString: () => base58String,
            toJSON: () => base58String
          };
        };

        // Event emitter implementation for Solana
        const solanaListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
        let solanaConnected = false;
        let solanaPublicKey: any = null;

        const solanaProvider = {
          isPhantom: branding.isPhantom,
          isConnected: false,
          publicKey: null,
          connect: async () => {
            const result = await (window as any).__headlessWalletRequest({
              walletId,
              method: 'connect',
              provider: 'solana'
            });

            if (result && result.publicKey) {
              // Create PublicKey-like object from plain data
              const publicKeyObj = createPublicKeyObject(result.publicKey);

              solanaConnected = true;
              solanaPublicKey = publicKeyObj;
              solanaProvider.isConnected = true;
              solanaProvider.publicKey = publicKeyObj;

              // Emit connect event
              const handlers = solanaListeners.get('connect') || [];
              handlers.forEach(handler => handler(publicKeyObj));

              return { publicKey: publicKeyObj };
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
            const result = await (window as any).__headlessWalletRequest({
              walletId,
              method: 'signMessage',
              params: [message],
              provider: 'solana'
            });

            // Enhance publicKey with methods if needed
            if (result && result.publicKey) {
              result.publicKey = createPublicKeyObject(result.publicKey);
            }

            return result;
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
        // Install Solana provider based on mode
        if (windowSolanaMode === 'replace') {
          (window as any).phantom.solana = solanaProvider;
        }
        // If mode is 'none', don't set window.phantom.solana

        // Track Solana provider for cleanup
        if (!(window as any).__headlessWalletProviders) {
          (window as any).__headlessWalletProviders = new Map();
        }
        const existingProviderInfo = (window as any).__headlessWalletProviders.get(walletId) || {};
        (window as any).__headlessWalletProviders.set(walletId, {
          ...existingProviderInfo,
          solanaType: 'solana',
          solanaProvider: solanaProvider
        });

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
  };

  const injectionParams = {
    walletId,
    hasEVM: wallet.hasEVM(),
    hasSolana: wallet.hasSolana(),
    branding: wallet.getBranding(),
    autoConnect,
    debug,
    windowEthereumMode,
    windowSolanaMode
  };

  // Add script for future navigations
  await target.addInitScript(injectionScript, injectionParams);

  // Also inject immediately if the page is already loaded
  if ('evaluate' in target) {
    try {
      await target.evaluate(injectionScript, injectionParams);
    } catch (e) {
      // Page might not be ready yet, that's OK - the init script will handle it
    }
  }

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
  console.log('uninstallHeadlessWallet called with walletId:', walletId);

  // If walletId is provided, remove specific wallet
  if (walletId) {
    wallets.delete(walletId);
  }

  // Clear injection by using an empty script
  if ('evaluate' in target) {
    try {
      const result = await target.evaluate((targetWalletId) => {
      // Aggressive cleanup - remove everything
      if (targetWalletId) {
        // Remove window.ethereum
        delete window.ethereum;

        // Remove window.phantom.solana
        if (window.phantom) {
          delete window.phantom.solana;
          if (Object.keys(window.phantom).length === 0) {
            delete window.phantom;
          }
        }

        // Clean up tracking
        if (window.__headlessWalletProviders) {
          window.__headlessWalletProviders.delete(targetWalletId);
          if (window.__headlessWalletProviders.size === 0) {
            delete window.__headlessWalletProviders;
          }
        }
        if (window.__headlessWalletListeners) {
          const listenerInfo = window.__headlessWalletListeners.get(targetWalletId);
          if (listenerInfo) {
            window.removeEventListener(listenerInfo.event, listenerInfo.handler);
          }
          window.__headlessWalletListeners.delete(targetWalletId);
          if (window.__headlessWalletListeners.size === 0) {
            delete window.__headlessWalletListeners;
          }
        }
        return 'specific-wallet-cleanup-done';
      } else {
        // Remove all wallets (fallback to old logic)
        const walletsToRemove = Array.from((window as any).__headlessWalletProviders?.keys() || []);

        walletsToRemove.forEach((wId) => {
          // Remove EIP-6963 event listener for this wallet
          const listenerInfo = (window as any).__headlessWalletListeners?.get(wId);
          if (listenerInfo) {
            window.removeEventListener(listenerInfo.event, listenerInfo.handler);
            (window as any).__headlessWalletListeners.delete(wId);
          }

          // Remove provider references
          const providerInfo = (window as any).__headlessWalletProviders?.get(wId);
          if (providerInfo) {
            // Handle EVM provider removal
            if (providerInfo.evmType === 'ethereum') {
              console.log('Removing EVM provider for wallet:', wId);
              delete (window as any).ethereum;
            }

            // Handle Solana provider removal
            if (providerInfo.solanaType === 'solana') {
              console.log('Removing Solana provider for wallet:', wId);
              if ((window as any).phantom) {
                delete (window as any).phantom.solana;
                // Clean up phantom object if empty
                if (Object.keys((window as any).phantom).length === 0) {
                  delete (window as any).phantom;
                }
              }
            }

            (window as any).__headlessWalletProviders.delete(wId);
          }
        });
      }

      // Clean up tracking maps if empty
      if ((window as any).__headlessWalletListeners?.size === 0) {
        delete (window as any).__headlessWalletListeners;
      }
      if ((window as any).__headlessWalletProviders?.size === 0) {
        delete (window as any).__headlessWalletProviders;
      }

      // Don't remove exposed function since it needs to persist for subsequent installations

      // Force refresh EIP-6963 discovery
      window.dispatchEvent(new Event('eip6963:requestProvider'));
      return 'all-wallets-cleanup-done';
    }, walletId);
      console.log('Uninstall result:', result);
    } catch (error) {
      console.log('Error in uninstall evaluate:', error);
    }
  } else {
    await target.addInitScript((targetWalletId) => {
      // If we're removing a specific wallet, be more aggressive
      if (targetWalletId) {
        // Remove EIP-6963 listeners for this specific wallet
        const listenerInfo = (window as any).__headlessWalletListeners?.get(targetWalletId);
        if (listenerInfo) {
          window.removeEventListener(listenerInfo.event, listenerInfo.handler);
          (window as any).__headlessWalletListeners?.delete(targetWalletId);
        }

        // Aggressively remove window.ethereum
        if (typeof (window as any).ethereum !== 'undefined') {
          delete (window as any).ethereum;
        }

        // Aggressively remove window.phantom.solana
        if ((window as any).phantom?.solana) {
          delete (window as any).phantom.solana;
          // Clean up phantom object if empty
          if ((window as any).phantom && Object.keys((window as any).phantom).length === 0) {
            delete (window as any).phantom;
          }
        }

        // Clean up provider tracking
        (window as any).__headlessWalletProviders?.delete(targetWalletId);
        return;
      }

      // Remove all wallets (fallback to old logic)
      const walletsToRemove = Array.from((window as any).__headlessWalletProviders?.keys() || []);

      walletsToRemove.forEach((wId) => {
        // Remove EIP-6963 event listener for this wallet
        const listenerInfo = (window as any).__headlessWalletListeners?.get(wId);
        if (listenerInfo) {
          window.removeEventListener(listenerInfo.event, listenerInfo.handler);
          (window as any).__headlessWalletListeners.delete(wId);
        }

        // Remove provider references
        const providerInfo = (window as any).__headlessWalletProviders?.get(wId);
        if (providerInfo) {
          // Handle EVM provider removal
          if (providerInfo.evmType === 'ethereum') {
            console.log('Removing EVM provider for wallet:', wId);

            // If we're removing a specific wallet and it has an EVM provider, remove window.ethereum
            if (targetWalletId && targetWalletId === wId) {
              console.log('Removing window.ethereum for specific wallet');
              delete (window as any).ethereum;
            } else {
              // Check if this is the current ethereum provider
              if (providerInfo.evmProvider === (window as any).ethereum ||
                  ((window as any).ethereum && Array.isArray((window as any).ethereum) &&
                   (window as any).ethereum.includes(providerInfo.evmProvider))) {

                // Emit disconnect event if possible
                if (typeof providerInfo.evmProvider.removeListener === 'function') {
                  // Remove all listeners
                  ['connect', 'disconnect', 'accountsChanged', 'chainChanged'].forEach(event => {
                    providerInfo.evmProvider.removeListener(event, () => {});
                  });
                }

                // Remove from window.ethereum
                if ((window as any).ethereum === providerInfo.evmProvider) {
                  delete (window as any).ethereum;
                } else if (Array.isArray((window as any).ethereum)) {
                  const index = (window as any).ethereum.indexOf(providerInfo.evmProvider);
                  if (index > -1) {
                    (window as any).ethereum.splice(index, 1);
                    if ((window as any).ethereum.length === 0) {
                      delete (window as any).ethereum;
                    }
                  }
                }
              }
            }
          }

          // Handle Solana provider removal
          if (providerInfo.solanaType === 'solana') {
            console.log('Removing Solana provider for wallet:', wId);

            // If we're removing a specific wallet and it has a Solana provider, remove window.phantom.solana
            if (targetWalletId && targetWalletId === wId) {
              console.log('Removing window.phantom.solana for specific wallet');
              if ((window as any).phantom) {
                delete (window as any).phantom.solana;
                // Clean up phantom object if empty
                if (Object.keys((window as any).phantom).length === 0) {
                  delete (window as any).phantom;
                }
              }
            } else if (providerInfo.solanaProvider === (window as any).phantom?.solana) {
              delete (window as any).phantom.solana;
              // Clean up phantom object if empty
              if ((window as any).phantom && Object.keys((window as any).phantom).length === 0) {
                delete (window as any).phantom;
              }
            }
          }

          (window as any).__headlessWalletProviders.delete(wId);
        }
      });

      // Clean up tracking maps if empty
      if ((window as any).__headlessWalletListeners?.size === 0) {
        delete (window as any).__headlessWalletListeners;
      }
      if ((window as any).__headlessWalletProviders?.size === 0) {
        delete (window as any).__headlessWalletProviders;
      }

      // Don't remove exposed function since it needs to persist for subsequent installations

      // Force refresh EIP-6963 discovery
      window.dispatchEvent(new Event('eip6963:requestProvider'));
    }, walletId);
  }
}

// Export types
export type { HeadlessWalletConfig, Chain, Transport };