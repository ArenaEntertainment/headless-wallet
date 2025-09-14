import { EVMWallet, type EVMWalletConfig } from './evm/wallet.js';
import { SolanaWallet, type SolanaWalletConfig } from './solana/wallet.js';
import type { Chain, Transport } from 'viem';
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
export declare class HeadlessWallet {
    private evmWallet?;
    private solanaWallet?;
    private branding;
    constructor(config: HeadlessWalletConfig);
    getEthereumProvider(): {
        isMetaMask: boolean | undefined;
        request: (args: {
            method: string;
            params?: any[];
        }) => Promise<any>;
        on: (event: string, handler: (...args: any[]) => void) => void;
        removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
    getSolanaProvider(): {
        isPhantom: boolean | undefined;
        connect: () => Promise<{
            publicKey: import("@solana/web3.js").PublicKey;
        }>;
        disconnect: () => Promise<void>;
        signTransaction: (transaction: any) => Promise<import("@solana/web3.js").Transaction | import("@solana/web3.js").VersionedTransaction>;
        signAllTransactions: (transactions: any[]) => Promise<(import("@solana/web3.js").Transaction | import("@solana/web3.js").VersionedTransaction)[]>;
        signMessage: (message: Uint8Array) => Promise<{
            signature: Uint8Array;
            publicKey: import("@solana/web3.js").PublicKey;
        }>;
        signAndSendTransaction: (transaction: any) => Promise<{
            signature: string;
        }>;
        request: (args: {
            method: string;
            params?: any[];
        }) => Promise<any>;
        on: (event: string, handler: (...args: any[]) => void) => void;
        removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
    getEVMWallet(): EVMWallet | undefined;
    getSolanaWallet(): SolanaWallet | undefined;
    request(args: {
        method: string;
        params?: any[];
        provider?: 'evm' | 'solana';
    }): Promise<any>;
    hasEVM(): boolean;
    hasSolana(): boolean;
    switchEVMAccount(index: number): void;
    switchSolanaAccount(index: number): void;
    getEVMAccountInfo(): {
        currentIndex: number;
        accounts: string[];
    } | null;
    getSolanaAccountInfo(): {
        currentIndex: number;
        accounts: string[];
    } | null;
}
export declare function injectHeadlessWallet(config: HeadlessWalletConfig): HeadlessWallet;
export declare const injectMockWallet: typeof injectHeadlessWallet;
export declare const MockWallet: typeof HeadlessWallet;
export type MockWalletConfig = HeadlessWalletConfig;
export { EVMWallet, SolanaWallet };
export type { EVMWalletConfig, SolanaWalletConfig };
