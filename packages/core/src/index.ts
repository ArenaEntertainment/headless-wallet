import { EVMWallet, type EVMWalletConfig } from './evm/wallet.js';
import { SolanaWallet, type SolanaWalletConfig } from './solana/wallet.js';
import type { Chain, Transport } from 'viem';
// Browser-compatible UUID generation
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation for browsers without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface Account {
  privateKey: string | Uint8Array;
  type: 'evm' | 'solana';
}

export interface WalletBranding {
  /** Name displayed in wallet connection UIs */
  name?: string;
  /** Base64 data URL or SVG string for wallet icon */
  icon?: string;
  /** Reverse domain name (e.g. 'com.company.wallet') */
  rdns?: string;
  /** Whether to identify as MetaMask for EVM (default: true) */
  isMetaMask?: boolean;
  /** Whether to identify as Phantom for Solana (default: true) */
  isPhantom?: boolean;
}

export interface HeadlessWalletConfig {
  accounts: Account[];
  /** Optional wallet branding customization */
  branding?: WalletBranding;
  evm?: {
    defaultChain?: Chain;
    transports?: Record<number, Transport>;
    rpcUrl?: string;
  };
  solana?: {
    cluster?: 'devnet' | 'testnet' | 'mainnet-beta';
    rpcUrl?: string;
  };
}

export class HeadlessWallet {
  private evmWallet?: EVMWallet;
  private solanaWallet?: SolanaWallet;
  private branding: WalletBranding;

  constructor(config: HeadlessWalletConfig) {
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
      const evmConfig: EVMWalletConfig = {
        privateKeys: evmAccounts.map(acc => acc.privateKey as string),
        defaultChain: config.evm?.defaultChain,
        transports: config.evm?.transports,
        rpcUrl: config.evm?.rpcUrl
      };
      this.evmWallet = new EVMWallet(evmConfig);
    }

    // Create Solana wallet if we have Solana accounts
    if (solanaAccounts.length > 0) {
      const solanaConfig: SolanaWalletConfig = {
        secretKeys: solanaAccounts.map(acc => acc.privateKey as Uint8Array),
        cluster: config.solana?.cluster,
        rpcUrl: config.solana?.rpcUrl
      };
      this.solanaWallet = new SolanaWallet(solanaConfig);
    }
  }

  // EVM Provider interface (for window.ethereum)
  getEthereumProvider() {
    if (!this.evmWallet) {
      throw new Error('No EVM accounts configured');
    }

    return {
      isMetaMask: this.branding.isMetaMask,
      request: (args: { method: string; params?: any[] }) => {
        return this.evmWallet!.request(args);
      },
      on: (event: string, handler: (...args: any[]) => void) => {
        this.evmWallet!.on(event, handler);
      },
      removeListener: (event: string, handler: (...args: any[]) => void) => {
        this.evmWallet!.removeListener(event, handler);
      }
    };
  }

  // Solana Provider interface (for window.phantom.solana)
  getSolanaProvider() {
    if (!this.solanaWallet) {
      throw new Error('No Solana accounts configured');
    }

    return {
      isPhantom: this.branding.isPhantom,
      connect: () => this.solanaWallet!.connect(),
      disconnect: () => this.solanaWallet!.disconnect(),
      signTransaction: (transaction: any) => this.solanaWallet!.signTransaction(transaction),
      signAllTransactions: (transactions: any[]) => this.solanaWallet!.signAllTransactions(transactions),
      signMessage: (message: Uint8Array) => this.solanaWallet!.signMessage(message),
      signAndSendTransaction: (transaction: any) => this.solanaWallet!.signAndSendTransaction(transaction),
      request: (args: { method: string; params?: any[] }) => {
        return this.solanaWallet!.request(args);
      },
      on: (event: string, handler: (...args: any[]) => void) => {
        this.solanaWallet!.on(event, handler);
      },
      removeListener: (event: string, handler: (...args: any[]) => void) => {
        this.solanaWallet!.removeListener(event, handler);
      }
    };
  }

  // Direct wallet access for advanced use cases
  getEVMWallet(): EVMWallet | undefined {
    return this.evmWallet;
  }

  getSolanaWallet(): SolanaWallet | undefined {
    return this.solanaWallet;
  }

  // Unified request method (for Playwright bridge)
  async request(args: { method: string; params?: any[]; provider?: 'evm' | 'solana' }): Promise<any> {
    const { method, params, provider } = args;

    // Auto-detect provider based on method if not specified
    let targetProvider = provider;
    if (!targetProvider) {
      if (method.startsWith('eth_') || method.startsWith('personal_') || method.startsWith('wallet_')) {
        targetProvider = 'evm';
      } else {
        targetProvider = 'solana';
      }
    }

    if (targetProvider === 'evm') {
      if (!this.evmWallet) {
        throw new Error('EVM wallet not configured');
      }
      return this.evmWallet.request({ method, params });
    } else {
      if (!this.solanaWallet) {
        throw new Error('Solana wallet not configured');
      }
      return this.solanaWallet.request({ method, params });
    }
  }

  // Check what providers are available
  hasEVM(): boolean {
    return !!this.evmWallet;
  }

  hasSolana(): boolean {
    return !!this.solanaWallet;
  }

  // Account switching methods
  switchEVMAccount(index: number): void {
    if (!this.evmWallet) {
      throw new Error('No EVM wallet configured');
    }
    this.evmWallet.switchAccount(index);
  }

  switchSolanaAccount(index: number): void {
    if (!this.solanaWallet) {
      throw new Error('No Solana wallet configured');
    }
    this.solanaWallet.switchAccount(index);
  }

  // Get account information
  getEVMAccountInfo(): { currentIndex: number; accounts: string[] } | null {
    if (!this.evmWallet) {
      return null;
    }
    return {
      currentIndex: this.evmWallet.getCurrentAccountIndex(),
      accounts: this.evmWallet.getAddresses()
    };
  }

  getSolanaAccountInfo(): { currentIndex: number; accounts: string[] } | null {
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
<rect width="1080" height="1080" rx="320" fill="black"/>
<path d="M203 830.128L470.486 230H607.658L876.001 830.128H730.255L510.78 300.301H565.649L345.316 830.128H203ZM336.743 701.529L373.608 596.078H682.245L719.968 701.529H336.743Z" fill="url(#paint0_linear_436_3860)"/>
<defs>
<linearGradient id="paint0_linear_436_3860" x1="539.5" y1="830.128" x2="539.5" y2="230" gradientUnits="userSpaceOnUse">
<stop stop-color="#07D102"/>
<stop offset="1" stop-color="#046B01"/>
</linearGradient>
</defs>
</svg>`;

// Browser-compatible base64 encoding
function toBase64(str: string): string {
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
function getWalletIcon(customIcon?: string): string {
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
export function injectHeadlessWallet(config: HeadlessWalletConfig): HeadlessWallet {
  if (typeof window === 'undefined') {
    throw new Error('injectHeadlessWallet can only be used in browser environment');
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('Headless wallet should not be used in production');
  }

  const wallet = new HeadlessWallet(config);

  // Inject EVM provider
  if (wallet.hasEVM()) {
    (window as any).ethereum = wallet.getEthereumProvider();

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
    if (!(window as any).phantom) {
      (window as any).phantom = {};
    }
    (window as any).phantom.solana = wallet.getSolanaProvider();

    // Solana Wallet Standard registration (simplified)
    const solanaWalletName = config.branding?.name ? `${config.branding.name} (Solana)` : 'Arena Headless Wallet (Solana)';
    const solanaWalletIcon = getWalletIcon(config.branding?.icon);

    window.dispatchEvent(new CustomEvent('wallet-standard:register-wallet', {
      detail: {
        wallet: {
          version: '1.0.0',
          name: solanaWalletName,
          icon: solanaWalletIcon,
          chains: ['solana:mainnet', 'solana:devnet', 'solana:testnet'],
          features: {
            'standard:connect': {
              version: '1.0.0',
              connect: wallet.getSolanaProvider().connect
            },
            'standard:disconnect': {
              version: '1.0.0',
              disconnect: wallet.getSolanaProvider().disconnect
            },
            'solana:signTransaction': {
              version: '1.0.0',
              signTransaction: wallet.getSolanaProvider().signTransaction
            },
            'solana:signMessage': {
              version: '1.0.0',
              signMessage: wallet.getSolanaProvider().signMessage
            }
          }
        }
      }
    }));
  }

  return wallet;
}

// Backward compatibility aliases
export const injectMockWallet = injectHeadlessWallet;
export const MockWallet = HeadlessWallet;
export type MockWalletConfig = HeadlessWalletConfig;

// Export wallet classes for advanced usage
export { EVMWallet, SolanaWallet };
export type { EVMWalletConfig, SolanaWalletConfig };