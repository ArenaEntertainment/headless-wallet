import { HeadlessWallet } from '@arenaentertainment/headless-wallet';
// Track installed wallets per page/context
const wallets = new Map();
// Track exposed functions to avoid re-exposure errors
const exposedFunctions = new WeakSet();
export async function installHeadlessWallet(target, config) {
    const walletId = `wallet-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const wallet = new HeadlessWallet(config);
    wallets.set(walletId, wallet);
    const { autoConnect = false, debug = false, windowEthereumMode = 'replace', windowSolanaMode = 'replace' } = config;
    // Only expose if not already exposed to avoid re-installation errors
    if (!exposedFunctions.has(target)) {
        try {
            await target.exposeFunction('__headlessWalletRequest', async (request) => {
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
                }
                catch (error) {
                    if (debug) {
                        console.log(`WALLET ${walletId.substring(0, 8)} REQUEST ${method}`, params, 'ERROR', error);
                    }
                    throw error;
                }
            });
            exposedFunctions.add(target);
        }
        catch (error) {
            // Function already exposed, continue without error
            if (debug) {
                console.log('Bridge function already exposed, continuing...');
            }
        }
    }
    // Define the injection script
    const injectionScript = ({ walletId, hasEVM, hasSolana, branding, autoConnect, debug, windowEthereumMode, windowSolanaMode }) => {
        // EVM Provider (window.ethereum)
        if (hasEVM) {
            // Event emitter implementation
            const listeners = new Map();
            let isConnected = false;
            let accounts = [];
            const ethereumProvider = {
                isMetaMask: branding.isMetaMask,
                request: async (args) => {
                    const result = await window.__headlessWalletRequest({
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
                    }
                    else if (args.method === 'eth_accounts') {
                        // Return cached accounts if disconnected
                        if (!isConnected) {
                            return [];
                        }
                    }
                    else if (args.method === 'disconnect') {
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
                on: (event, handler) => {
                    if (!listeners.has(event)) {
                        listeners.set(event, new Set());
                    }
                    listeners.get(event).add(handler);
                },
                removeListener: (event, handler) => {
                    listeners.get(event)?.delete(handler);
                },
                disconnect: async () => {
                    const result = await window.__headlessWalletRequest({
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
                window.ethereum = ethereumProvider;
            }
            else if (windowEthereumMode === 'array') {
                // EIP-5749: Support multiple wallets via array
                if (!window.ethereum) {
                    // No existing provider, create array
                    window.ethereum = [ethereumProvider];
                    // Add proxy methods to the array for backward compatibility
                    Object.assign(window.ethereum, {
                        request: ethereumProvider.request,
                        on: ethereumProvider.on,
                        removeListener: ethereumProvider.removeListener,
                        disconnect: ethereumProvider.disconnect,
                        isMetaMask: ethereumProvider.isMetaMask
                    });
                }
                else if (Array.isArray(window.ethereum)) {
                    // Already an array, add to it
                    window.ethereum.push(ethereumProvider);
                }
                else {
                    // Single provider exists, convert to array
                    const existingProvider = window.ethereum;
                    window.ethereum = [existingProvider, ethereumProvider];
                    // Keep the existing provider's methods as default
                    Object.assign(window.ethereum, {
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
            if (!window.__headlessWalletProviders) {
                window.__headlessWalletProviders = new Map();
            }
            window.__headlessWalletProviders.set(walletId, { type: 'ethereum', provider: ethereumProvider });
            // EIP-6963 support
            const info = {
                uuid: walletId,
                name: branding.name,
                icon: branding.icon,
                rdns: branding.rdns
            };
            const announceProvider = () => {
                window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
                    detail: { info, provider: ethereumProvider }
                }));
            };
            // Track the listener for cleanup
            if (!window.__headlessWalletListeners) {
                window.__headlessWalletListeners = new Map();
            }
            window.__headlessWalletListeners.set(walletId, {
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
            const createPublicKeyObject = (data) => {
                if (!data)
                    return null;
                // If it already has methods, return as-is
                if (typeof data.toBase58 === 'function')
                    return data;
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
            const solanaListeners = new Map();
            let solanaConnected = false;
            let solanaPublicKey = null;
            const solanaProvider = {
                isPhantom: branding.isPhantom,
                isConnected: false,
                publicKey: null,
                connect: async () => {
                    const result = await window.__headlessWalletRequest({
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
                    const result = await window.__headlessWalletRequest({
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
                signTransaction: async (transaction) => {
                    return await window.__headlessWalletRequest({
                        walletId,
                        method: 'signTransaction',
                        params: [transaction],
                        provider: 'solana'
                    });
                },
                signMessage: async (message) => {
                    const result = await window.__headlessWalletRequest({
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
                on: (event, handler) => {
                    if (!solanaListeners.has(event)) {
                        solanaListeners.set(event, new Set());
                    }
                    solanaListeners.get(event).add(handler);
                },
                removeListener: (event, handler) => {
                    solanaListeners.get(event)?.delete(handler);
                }
            };
            if (!window.phantom) {
                window.phantom = {};
            }
            // Install Solana provider based on mode
            if (windowSolanaMode === 'replace') {
                window.phantom.solana = solanaProvider;
            }
            // If mode is 'none', don't set window.phantom.solana
            // Track Solana provider for cleanup
            if (!window.__headlessWalletProviders) {
                window.__headlessWalletProviders = new Map();
            }
            window.__headlessWalletProviders.set(walletId, {
                type: 'solana',
                provider: solanaProvider,
                ...window.__headlessWalletProviders.get(walletId) // Merge if EVM already exists
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
        }
        catch (e) {
            // Page might not be ready yet, that's OK - the init script will handle it
        }
    }
    return walletId;
}
// Helper functions for testing
export async function connectHeadlessWallet(page) {
    await page.evaluate(() => {
        return window.ethereum?.request({ method: 'eth_requestAccounts' });
    });
}
export async function getHeadlessWalletAccounts(page) {
    return await page.evaluate(() => {
        return window.ethereum?.request({ method: 'eth_accounts' });
    });
}
export async function switchHeadlessWalletChain(page, chainId) {
    await page.evaluate((chainId) => {
        return window.ethereum?.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }]
        });
    }, chainId);
}
export async function signHeadlessWalletMessage(page, message, address) {
    return await page.evaluate(async ({ message, address }) => {
        const accounts = address ? [address] : await window.ethereum.request({ method: 'eth_accounts' });
        return window.ethereum.request({
            method: 'personal_sign',
            params: [message, accounts[0]]
        });
    }, { message, address });
}
export async function uninstallHeadlessWallet(target, walletId) {
    // If walletId is provided, remove specific wallet
    if (walletId) {
        wallets.delete(walletId);
    }
    // Clear injection by using an empty script
    if ('evaluate' in target) {
        await target.evaluate((targetWalletId) => {
            // Remove specific wallet if walletId provided, or all wallets
            const walletsToRemove = targetWalletId ? [targetWalletId] : Array.from(window.__headlessWalletProviders?.keys() || []);
            walletsToRemove.forEach((wId) => {
                // Remove EIP-6963 event listener for this wallet
                const listenerInfo = window.__headlessWalletListeners?.get(wId);
                if (listenerInfo) {
                    window.removeEventListener(listenerInfo.event, listenerInfo.handler);
                    window.__headlessWalletListeners.delete(wId);
                }
                // Remove provider references
                const providerInfo = window.__headlessWalletProviders?.get(wId);
                if (providerInfo) {
                    // Emit disconnect events before removal
                    if (providerInfo.type === 'ethereum' && providerInfo.provider === window.ethereum) {
                        // Emit disconnect event
                        if (typeof providerInfo.provider.removeListener === 'function') {
                            // Remove all listeners
                            ['connect', 'disconnect', 'accountsChanged', 'chainChanged'].forEach(event => {
                                providerInfo.provider.removeListener(event, () => { });
                            });
                        }
                        delete window.ethereum;
                    }
                    if (providerInfo.type === 'solana' && providerInfo.provider === window.phantom?.solana) {
                        delete window.phantom.solana;
                        // Clean up phantom object if empty
                        if (window.phantom && Object.keys(window.phantom).length === 0) {
                            delete window.phantom;
                        }
                    }
                    window.__headlessWalletProviders.delete(wId);
                }
            });
            // Clean up tracking maps if empty
            if (window.__headlessWalletListeners?.size === 0) {
                delete window.__headlessWalletListeners;
            }
            if (window.__headlessWalletProviders?.size === 0) {
                delete window.__headlessWalletProviders;
            }
            // Don't remove exposed function since it needs to persist for subsequent installations
            // Force refresh EIP-6963 discovery
            window.dispatchEvent(new Event('eip6963:requestProvider'));
        }, walletId);
    }
    else {
        await target.addInitScript((targetWalletId) => {
            // Remove specific wallet if walletId provided, or all wallets
            const walletsToRemove = targetWalletId ? [targetWalletId] : Array.from(window.__headlessWalletProviders?.keys() || []);
            walletsToRemove.forEach((wId) => {
                // Remove EIP-6963 event listener for this wallet
                const listenerInfo = window.__headlessWalletListeners?.get(wId);
                if (listenerInfo) {
                    window.removeEventListener(listenerInfo.event, listenerInfo.handler);
                    window.__headlessWalletListeners.delete(wId);
                }
                // Remove provider references
                const providerInfo = window.__headlessWalletProviders?.get(wId);
                if (providerInfo) {
                    // Emit disconnect events before removal
                    if (providerInfo.type === 'ethereum' && providerInfo.provider === window.ethereum) {
                        // Emit disconnect event
                        if (typeof providerInfo.provider.removeListener === 'function') {
                            // Remove all listeners
                            ['connect', 'disconnect', 'accountsChanged', 'chainChanged'].forEach(event => {
                                providerInfo.provider.removeListener(event, () => { });
                            });
                        }
                        delete window.ethereum;
                    }
                    if (providerInfo.type === 'solana' && providerInfo.provider === window.phantom?.solana) {
                        delete window.phantom.solana;
                        // Clean up phantom object if empty
                        if (window.phantom && Object.keys(window.phantom).length === 0) {
                            delete window.phantom;
                        }
                    }
                    window.__headlessWalletProviders.delete(wId);
                }
            });
            // Clean up tracking maps if empty
            if (window.__headlessWalletListeners?.size === 0) {
                delete window.__headlessWalletListeners;
            }
            if (window.__headlessWalletProviders?.size === 0) {
                delete window.__headlessWalletProviders;
            }
            // Don't remove exposed function since it needs to persist for subsequent installations
            // Force refresh EIP-6963 discovery
            window.dispatchEvent(new Event('eip6963:requestProvider'));
        }, walletId);
    }
}
