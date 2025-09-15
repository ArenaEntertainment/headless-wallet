import { EVMWallet } from './evm/wallet.js';
import { SolanaWallet } from './solana/wallet.js';
import { EVMWalletStandard } from './evm/wallet-standard.js';
import { SolanaWalletStandard } from './solana/wallet-standard.js';
import { registerWallet as registerWalletStandard } from '@wallet-standard/wallet';
// Browser-compatible UUID generation
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback UUID generation for browsers without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
export class HeadlessWallet {
    constructor(config) {
        // Set up branding with defaults
        this.branding = {
            name: 'Arena Headless Wallet',
            rdns: 'com.arenaentertainment.headless-wallet',
            isMetaMask: true,
            isPhantom: true,
            ...config.branding
        };
        // Separate accounts by type
        const evmAccounts = config.accounts.filter(acc => acc.type === 'evm');
        const solanaAccounts = config.accounts.filter(acc => acc.type === 'solana');
        // Create EVM wallet if we have EVM accounts
        if (evmAccounts.length > 0) {
            const evmConfig = {
                privateKeys: evmAccounts.map(acc => acc.privateKey),
                defaultChain: config.evm?.defaultChain,
                transports: config.evm?.transports,
                rpcUrl: config.evm?.rpcUrl
            };
            this.evmWallet = new EVMWallet(evmConfig);
            this.evmWalletStandard = new EVMWalletStandard(this.evmWallet, {
                name: this.branding.name,
                icon: this.branding.icon,
                rdns: this.branding.rdns
            });
        }
        // Create Solana wallet if we have Solana accounts
        if (solanaAccounts.length > 0) {
            const solanaConfig = {
                secretKeys: solanaAccounts.map(acc => acc.privateKey),
                cluster: config.solana?.cluster,
                rpcUrl: config.solana?.rpcUrl
            };
            this.solanaWallet = new SolanaWallet(solanaConfig);
            const walletIcon = this.branding.icon || DEFAULT_WALLET_ICON_SVG;
            this.solanaWalletStandard = new SolanaWalletStandard(this.solanaWallet, this.branding.name || 'Arena Headless Wallet', walletIcon);
        }
    }
    // EVM Provider interface (for window.ethereum)
    getEthereumProvider() {
        if (!this.evmWallet) {
            throw new Error('No EVM accounts configured');
        }
        // Return the enhanced EVM wallet standard provider
        return {
            isMetaMask: this.branding.isMetaMask,
            request: (args) => {
                return this.evmWalletStandard.request(args);
            },
            on: (event, handler) => {
                this.evmWalletStandard.on(event, handler);
            },
            removeListener: (event, handler) => {
                this.evmWalletStandard.removeListener(event, handler);
            },
            disconnect: () => {
                this.evmWallet.disconnect();
            },
            // Additional properties for EIP-6963
            _wallet: this.evmWalletStandard,
            // EIP-6963 properties
            uuid: this.evmWalletStandard?.uuid,
            name: this.evmWalletStandard?.name,
            icon: this.evmWalletStandard?.icon,
            rdns: this.evmWalletStandard?.rdns
        };
    }
    // Solana Provider interface (for window.phantom.solana)
    getSolanaProvider() {
        if (!this.solanaWallet) {
            throw new Error('No Solana accounts configured');
        }
        // Create a provider object that properly exposes isConnected and publicKey
        const provider = {
            isPhantom: this.branding.isPhantom,
            get isConnected() {
                return self.solanaWallet?.isConnected() || false;
            },
            get publicKey() {
                const pk = self.solanaWallet?.getPublicKey();
                if (!pk)
                    return null;
                // Create a serializable version that mimics Solana's PublicKey
                return {
                    _bn: pk.toBuffer(),
                    toString: () => pk.toBase58(),
                    toBase58: () => pk.toBase58(),
                    toBytes: () => pk.toBytes(),
                    toBuffer: () => pk.toBuffer()
                };
            },
            connect: () => this.solanaWallet.connect(),
            disconnect: () => this.solanaWallet.disconnect(),
            signTransaction: (transaction) => this.solanaWallet.signTransaction(transaction),
            signAllTransactions: (transactions) => this.solanaWallet.signAllTransactions(transactions),
            signMessage: (message) => this.solanaWallet.signMessage(message),
            signAndSendTransaction: (transaction) => this.solanaWallet.signAndSendTransaction(transaction),
            request: (args) => {
                return this.solanaWallet.request(args);
            },
            on: (event, handler) => {
                this.solanaWallet.on(event, handler);
            },
            removeListener: (event, handler) => {
                this.solanaWallet.removeListener(event, handler);
            }
        };
        const self = this;
        return provider;
    }
    // Direct wallet access for advanced use cases
    getEVMWallet() {
        return this.evmWallet;
    }
    getSolanaWallet() {
        return this.solanaWallet;
    }
    getSolanaWalletStandard() {
        return this.solanaWalletStandard;
    }
    getEVMWalletStandard() {
        return this.evmWalletStandard;
    }
    // Unified request method (for Playwright bridge)
    async request(args) {
        const { method, params, provider } = args;
        // Handle disconnect specially for both providers
        if (method === 'disconnect') {
            if (provider === 'evm' && this.evmWallet) {
                this.evmWallet.disconnect();
                return null;
            }
            else if (provider === 'solana' && this.solanaWallet) {
                this.solanaWallet.disconnect();
                return null;
            }
            throw new Error(`No ${provider} wallet configured`);
        }
        // Auto-detect provider based on method if not specified
        let targetProvider = provider;
        if (!targetProvider) {
            if (method.startsWith('eth_') || method.startsWith('personal_') || method.startsWith('wallet_')) {
                targetProvider = 'evm';
            }
            else {
                targetProvider = 'solana';
            }
        }
        if (targetProvider === 'evm') {
            if (!this.evmWallet) {
                throw new Error('EVM wallet not configured');
            }
            return this.evmWallet.request({ method, params });
        }
        else {
            if (!this.solanaWallet) {
                throw new Error('Solana wallet not configured');
            }
            return this.solanaWallet.request({ method, params });
        }
    }
    // Check what providers are available
    hasEVM() {
        return !!this.evmWallet;
    }
    hasSolana() {
        return !!this.solanaWallet;
    }
    // Get wallet branding
    getBranding() {
        return this.branding;
    }
    // Account switching methods
    switchEVMAccount(index) {
        if (!this.evmWallet) {
            throw new Error('No EVM wallet configured');
        }
        this.evmWallet.switchAccount(index);
    }
    switchSolanaAccount(index) {
        if (!this.solanaWallet) {
            throw new Error('No Solana wallet configured');
        }
        this.solanaWallet.switchAccount(index);
    }
    // Get account information
    getEVMAccountInfo() {
        if (!this.evmWallet) {
            return null;
        }
        return {
            currentIndex: this.evmWallet.getCurrentAccountIndex(),
            accounts: this.evmWallet.getAddresses()
        };
    }
    getSolanaAccountInfo() {
        if (!this.solanaWallet) {
            return null;
        }
        return {
            currentIndex: this.solanaWallet.getCurrentKeypairIndex(),
            accounts: this.solanaWallet.getPublicKeys().map(pk => pk.toString())
        };
    }
}
// Default wallet icon
const DEFAULT_WALLET_ICON_SVG = `<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="1080" height="1080" fill="black"/>
<path d="M203 830.128L470.486 230H607.658L876.001 830.128H730.255L510.78 300.301H565.649L345.316 830.128H203ZM336.743 701.529L373.608 596.078H682.245L719.968 701.529H336.743Z" fill="url(#paint0_linear_436_3860)"/>
<defs>
<linearGradient id="paint0_linear_436_3860" x1="539.5" y1="830.128" x2="539.5" y2="230" gradientUnits="userSpaceOnUse">
<stop stop-color="#07D102"/>
<stop offset="1" stop-color="#046B01"/>
</linearGradient>
</defs>
</svg>`;
// Browser-compatible base64 encoding
function toBase64(str) {
    if (typeof btoa !== 'undefined') {
        return btoa(str);
    }
    // Fallback for Node.js environments
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str).toString('base64');
    }
    throw new Error('Base64 encoding not available');
}
// Helper function to get wallet icon as data URL
function getWalletIcon(customIcon) {
    if (!customIcon) {
        return `data:image/svg+xml;base64,${toBase64(DEFAULT_WALLET_ICON_SVG)}`;
    }
    // If it's already a data URL, return as-is
    if (customIcon.startsWith('data:')) {
        return customIcon;
    }
    // If it's raw SVG, encode it
    if (customIcon.includes('<svg')) {
        return `data:image/svg+xml;base64,${toBase64(customIcon)}`;
    }
    // Assume it's already base64 encoded
    return `data:image/svg+xml;base64,${customIcon}`;
}
// Browser injection function (for Vue/React plugins)
export function injectHeadlessWallet(config) {
    if (typeof window === 'undefined') {
        throw new Error('injectHeadlessWallet can only be used in browser environment');
    }
    if (process.env.NODE_ENV === 'production') {
        console.warn('Headless wallet should not be used in production');
    }
    const wallet = new HeadlessWallet(config);
    // Inject EVM provider
    if (wallet.hasEVM()) {
        window.ethereum = wallet.getEthereumProvider();
        // EIP-6963 wallet discovery with proper compliance
        const walletUuid = generateUUID(); // Generate proper UUIDv4
        const walletIcon = getWalletIcon(config.branding?.icon);
        const walletName = config.branding?.name || 'Arena Headless Wallet';
        const walletRdns = config.branding?.rdns || 'com.arenaentertainment.headless-wallet';
        const announceProvider = () => {
            window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
                detail: Object.freeze({
                    info: {
                        uuid: walletUuid,
                        name: walletName,
                        icon: walletIcon,
                        rdns: walletRdns
                    },
                    provider: wallet.getEthereumProvider()
                })
            }));
        };
        // Announce immediately and on request
        announceProvider();
        window.addEventListener('eip6963:requestProvider', announceProvider);
    }
    // Inject Solana provider
    if (wallet.hasSolana()) {
        if (!window.phantom) {
            window.phantom = {};
        }
        window.phantom.solana = wallet.getSolanaProvider();
        // Use the new Solana Wallet Standard implementation
        const solanaWalletStandard = wallet.getSolanaWalletStandard();
        if (solanaWalletStandard) {
            // Register using the official wallet-standard package
            try {
                registerWalletStandard(solanaWalletStandard);
                console.log('✅ Solana wallet registered with wallet-standard');
            }
            catch (error) {
                console.error('Failed to register Solana wallet:', error);
            }
            // Also dispatch event for compatibility
            const registerWallet = (callback) => {
                if (typeof callback === 'function') {
                    callback(solanaWalletStandard);
                }
                return solanaWalletStandard;
            };
            window.dispatchEvent(new CustomEvent('wallet-standard:register-wallet', {
                detail: registerWallet
            }));
        }
    }
    return wallet;
}
// Backward compatibility aliases
export const injectMockWallet = injectHeadlessWallet;
export const MockWallet = HeadlessWallet;
// Export wallet classes for advanced usage
export { EVMWallet, SolanaWallet };
// Export wallet standard implementations
export { EVMWalletStandard } from './evm/wallet-standard.js';
export { SolanaWalletStandard } from './solana/wallet-standard.js';
