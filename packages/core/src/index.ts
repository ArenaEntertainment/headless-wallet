import { EVMWallet, type EVMWalletConfig } from './evm/wallet.js';
import { SolanaWallet, type SolanaWalletConfig } from './solana/wallet.js';
import type { Chain, Transport } from 'viem';
import { randomUUID } from 'crypto';

export interface Account {
  privateKey: string | Uint8Array;
  type: 'evm' | 'solana';
}

export interface MockWalletConfig {
  accounts: Account[];
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

export class MockWallet {
  private evmWallet?: EVMWallet;
  private solanaWallet?: SolanaWallet;

  constructor(config: MockWalletConfig) {
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
      isMetaMask: true,
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
      isPhantom: true,
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
}

// Create a proper wallet icon
const WALLET_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="96" height="96" fill="url(#bg)" rx="20"/>
  <rect x="20" y="32" width="56" height="40" fill="white" rx="4" opacity="0.9"/>
  <circle cx="64" cy="52" r="4" fill="#6366f1"/>
  <text x="48" y="78" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">MOCK</text>
</svg>`;

// Browser injection function (for Vue/React plugins)
export function injectMockWallet(config: MockWalletConfig): MockWallet {
  if (typeof window === 'undefined') {
    throw new Error('injectMockWallet can only be used in browser environment');
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('Mock wallet should not be used in production');
  }

  const wallet = new MockWallet(config);

  // Inject EVM provider
  if (wallet.hasEVM()) {
    (window as any).ethereum = wallet.getEthereumProvider();

    // EIP-6963 wallet discovery with proper compliance
    const walletUuid = randomUUID(); // Generate proper UUIDv4
    const walletIcon = `data:image/svg+xml;base64,${Buffer.from(WALLET_ICON_SVG).toString('base64')}`;

    const announceProvider = () => {
      window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
        detail: Object.freeze({
          info: {
            uuid: walletUuid,
            name: 'Arena Mock Wallet',
            icon: walletIcon,
            rdns: 'com.arenaentertainment.wallet-mock'
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
    window.dispatchEvent(new CustomEvent('wallet-standard:register-wallet', {
      detail: {
        wallet: {
          version: '1.0.0',
          name: 'Arena Mock Wallet (Solana)',
          icon: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
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

// Export wallet classes for advanced usage
export { EVMWallet, SolanaWallet };
export type { EVMWalletConfig, SolanaWalletConfig };