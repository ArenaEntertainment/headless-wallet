import { MockWallet } from '@arenaentertainment/wallet-mock';
import { randomUUID } from 'crypto';
// Global wallet storage for Playwright contexts
const wallets = new Map();
export async function installMockWallet(target, options) {
    const { debug = false, autoConnect = true, ...walletConfig } = options;
    // Create the real wallet in Node.js context
    const wallet = new MockWallet(walletConfig);
    const walletId = randomUUID();
    wallets.set(walletId, wallet);
    // Expose bridge function for browser to call back to Node.js wallet
    await target.exposeFunction('__mockWalletRequest', async (request) => {
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
    // Inject providers into browser context
    await target.addInitScript(({ walletId, hasEVM, hasSolana, autoConnect, debug }) => {
        // EVM Provider (window.ethereum)
        if (hasEVM) {
            const ethereumProvider = {
                isMetaMask: true,
                request: async (args) => {
                    return await window.__mockWalletRequest({
                        walletId,
                        method: args.method,
                        params: args.params,
                        provider: 'evm'
                    });
                },
                on: () => { }, // Event handling would need more complex bridge
                removeListener: () => { }
            };
            window.ethereum = ethereumProvider;
            // EIP-6963 wallet discovery
            const announceProvider = () => {
                window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
                    detail: Object.freeze({
                        info: {
                            uuid: `arena-mock-wallet-${walletId}`,
                            name: 'Arena Mock Wallet (EVM)',
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
                    return await window.__mockWalletRequest({
                        walletId,
                        method: 'connect',
                        provider: 'solana'
                    });
                },
                disconnect: async () => {
                    return await window.__mockWalletRequest({
                        walletId,
                        method: 'disconnect',
                        provider: 'solana'
                    });
                },
                signTransaction: async (transaction) => {
                    return await window.__mockWalletRequest({
                        walletId,
                        method: 'signTransaction',
                        params: [transaction],
                        provider: 'solana'
                    });
                },
                signMessage: async (message) => {
                    return await window.__mockWalletRequest({
                        walletId,
                        method: 'signMessage',
                        params: [message],
                        provider: 'solana'
                    });
                },
                on: () => { },
                removeListener: () => { }
            };
            if (!window.phantom) {
                window.phantom = {};
            }
            window.phantom.solana = solanaProvider;
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
    }, {
        walletId,
        hasEVM: wallet.hasEVM(),
        hasSolana: wallet.hasSolana(),
        autoConnect,
        debug
    });
}
// Helper functions for testing
export async function connectMockWallet(page) {
    await page.evaluate(() => {
        return window.ethereum?.request({ method: 'eth_requestAccounts' });
    });
}
export async function getMockWalletAccounts(page) {
    return await page.evaluate(() => {
        return window.ethereum?.request({ method: 'eth_accounts' });
    });
}
export async function switchMockWalletChain(page, chainId) {
    await page.evaluate((chainId) => {
        return window.ethereum?.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }]
        });
    }, chainId);
}
export async function signMockWalletMessage(page, message, address) {
    return await page.evaluate(async ({ message, address }) => {
        const accounts = address ? [address] : await window.ethereum.request({ method: 'eth_accounts' });
        return window.ethereum.request({
            method: 'personal_sign',
            params: [message, accounts[0]]
        });
    }, { message, address });
}
export async function connectMockSolanaWallet(page) {
    return await page.evaluate(() => {
        return window.phantom?.solana?.connect();
    });
}
export async function signMockSolanaMessage(page, message) {
    return await page.evaluate((message) => {
        const encodedMessage = new TextEncoder().encode(message);
        return window.phantom?.solana?.signMessage(encodedMessage);
    }, message);
}
// Cleanup function to remove wallets from memory
export function cleanupMockWallets() {
    wallets.clear();
}
