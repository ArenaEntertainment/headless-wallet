import { EVMWallet, type EVMWalletConfig } from './evm/wallet.js';
import { SolanaWallet, type SolanaWalletConfig } from './solana/wallet.js';
import type { Chain, Transport } from 'viem';
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
export declare class MockWallet {
    private evmWallet?;
    private solanaWallet?;
    constructor(config: MockWalletConfig);
    getEthereumProvider(): {
        isMetaMask: boolean;
        request: (args: {
            method: string;
            params?: any[];
        }) => Promise<any>;
        on: (event: string, handler: (...args: any[]) => void) => void;
        removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
    getSolanaProvider(): {
        isPhantom: boolean;
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
}
export declare function injectMockWallet(config: MockWalletConfig): MockWallet;
export { EVMWallet, SolanaWallet };
export type { EVMWalletConfig, SolanaWalletConfig };
