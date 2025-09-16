import type {
  Wallet,
  WalletAccount,
  WalletVersion,
  WalletIcon,
} from '@wallet-standard/base';
import type {
  StandardConnectFeature,
  StandardDisconnectFeature,
  StandardEventsFeature,
  StandardConnectMethod,
  StandardDisconnectMethod,
  StandardEventsOnMethod,
  StandardEventsListeners,
  StandardEventsNames,
} from '@wallet-standard/features';
import {
  SolanaSignAndSendTransaction,
  SolanaSignTransaction,
  SolanaSignMessage,
  SolanaSignIn,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignTransactionFeature,
  type SolanaSignMessageFeature,
  type SolanaSignInFeature,
  type SolanaSignAndSendTransactionMethod,
  type SolanaSignTransactionMethod,
  type SolanaSignMessageMethod,
  type SolanaSignInMethod,
  type SolanaSignInInput,
  type SolanaSignInOutput,
} from '@solana/wallet-standard-features';
import {
  Transaction,
  VersionedTransaction,
  PublicKey,
  Keypair,
  Connection,
} from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import { SolanaWallet } from './wallet.js';

/**
 * Wallet Standard implementation for Solana
 * Provides full compatibility with wallet-standard protocol
 */
export class SolanaWalletStandard implements Wallet {
  readonly #version: WalletVersion = '1.0.0' as const;
  readonly #name: string;
  readonly #icon: WalletIcon;
  readonly #chains = [
    'solana:mainnet',
    'solana:devnet',
    'solana:testnet',
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Mainnet-beta
  ] as const;

  private wallet: SolanaWallet;
  private connectedAccounts: WalletAccount[] = [];
  private listeners: Map<string, Function[]> = new Map();

  constructor(wallet: SolanaWallet, name: string, icon: string) {
    this.wallet = wallet;
    this.#name = name;
    this.#icon = icon as WalletIcon;

    // Set up internal wallet event listeners
    this.wallet.on('connect', () => this.#handleConnect());
    this.wallet.on('disconnect', () => this.#handleDisconnect());
    this.wallet.on('accountChanged', () => this.#handleAccountChange());
  }

  get version() {
    return this.#version;
  }

  get name() {
    return this.#name;
  }

  get icon() {
    return this.#icon;
  }

  get chains() {
    return this.#chains.slice();
  }

  get accounts(): readonly WalletAccount[] {
    return this.connectedAccounts.slice();
  }

  get features(): StandardConnectFeature &
    StandardDisconnectFeature &
    StandardEventsFeature &
    SolanaSignAndSendTransactionFeature &
    SolanaSignTransactionFeature &
    SolanaSignMessageFeature &
    SolanaSignInFeature {
    return {
      'standard:connect': {
        version: '1.0.0',
        connect: this.#connect,
      },
      'standard:disconnect': {
        version: '1.0.0',
        disconnect: this.#disconnect,
      },
      'standard:events': {
        version: '1.0.0',
        on: this.#on,
      },
      'solana:signAndSendTransaction': {
        version: '1.0.0',
        supportedTransactionVersions: ['legacy', 0],
        signAndSendTransaction: this.#signAndSendTransaction,
      },
      'solana:signTransaction': {
        version: '1.0.0',
        supportedTransactionVersions: ['legacy', 0],
        signTransaction: this.#signTransaction,
      },
      'solana:signMessage': {
        version: '1.0.0',
        signMessage: this.#signMessage,
      },
      'solana:signIn': {
        version: '1.0.0',
        signIn: this.#signIn,
      },
    } as any;
  }

  // Standard Connect
  #connect: StandardConnectMethod = async (input?: any) => {
    if (this.connectedAccounts.length === 0) {
      if (input?.silent) {
        // Silent connect should only work if previously connected
        return { accounts: [] };
      }

      await this.wallet.connect();
      this.#updateAccounts();
    }

    return { accounts: this.connectedAccounts };
  };

  // Standard Disconnect
  #disconnect: StandardDisconnectMethod = async () => {
    await this.wallet.disconnect();
    this.connectedAccounts = [];
    this.#emit('change', { accounts: this.connectedAccounts });
  };

  // Standard Events
  #on: StandardEventsOnMethod = (event: any, listener: any) => {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);

    // Return unsubscribe function
    return (): void => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  };

  #emit(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in wallet standard ${event} listener:`, error);
        }
      });
    }
  }

  // Solana Sign and Send Transaction
  #signAndSendTransaction: SolanaSignAndSendTransactionMethod = async (
    ...inputs
  ) => {
    if (this.connectedAccounts.length === 0) {
      throw new Error('Wallet not connected');
    }

    const outputs = [];

    for (const input of inputs) {
      const { transaction, account, chain, options } = input;

      // Validate account
      const walletAccount = this.connectedAccounts.find(
        (acc) => acc.address === account?.address
      );
      if (!walletAccount && account) {
        throw new Error('Account not found');
      }

      // Sign and send transaction
      const result = await this.wallet.signAndSendTransaction(
        transaction as any as Transaction
      );

      outputs.push({
        signature: Buffer.from(result.signature, 'hex'),
      });
    }

    return outputs;
  };

  // Solana Sign Transaction
  #signTransaction: SolanaSignTransactionMethod = async (...inputs) => {
    if (this.connectedAccounts.length === 0) {
      throw new Error('Wallet not connected');
    }

    const outputs = [];

    for (const input of inputs) {
      const { transaction, account, chain } = input;

      // Validate account
      const walletAccount = this.connectedAccounts.find(
        (acc) => acc.address === account?.address
      );
      if (!walletAccount && account) {
        throw new Error('Account not found');
      }

      // Sign transaction
      const signedTx = await this.wallet.signTransaction(
        transaction as any as Transaction | VersionedTransaction
      );

      outputs.push({
        signedTransaction: signedTx as any,
      });
    }

    return outputs;
  };

  // Solana Sign Message
  #signMessage: SolanaSignMessageMethod = async (...inputs) => {
    if (this.connectedAccounts.length === 0) {
      throw new Error('Wallet not connected');
    }

    const outputs = [];

    for (const input of inputs) {
      const { message, account } = input;

      // Validate account
      const walletAccount = this.connectedAccounts.find(
        (acc) => acc.address === account?.address
      );
      if (!walletAccount && account) {
        throw new Error('Account not found');
      }

      // Sign message
      const result = await this.wallet.signMessage(message);

      outputs.push({
        signedMessage: message,
        signature: result.signature,
        signatureType: 'ed25519' as const,
      });
    }

    return outputs;
  };

  // Solana Sign In (SIWS - Sign In With Solana)
  #signIn: SolanaSignInMethod = async (...inputs) => {
    if (this.connectedAccounts.length === 0) {
      // Auto-connect if not connected
      await this.#connect();
    }

    const outputs: SolanaSignInOutput[] = [];

    for (const input of inputs) {
      const message = this.#createSignInMessage(input);
      const messageBytes = new TextEncoder().encode(message);

      // Sign the message
      const result = await this.wallet.signMessage(messageBytes);

      outputs.push({
        account: this.connectedAccounts[0],
        signedMessage: messageBytes,
        signature: result.signature,
        signatureType: 'ed25519',
      });
    }

    return outputs;
  };

  // Helper to create SIWS message (EIP-4361 compatible)
  #createSignInMessage(input: SolanaSignInInput): string {
    const {
      domain = window.location.host,
      address = this.wallet.getPublicKey()?.toBase58(),
      statement,
      uri = window.location.origin,
      version = '1',
      chainId = this.#getChainId(),
      nonce = this.#generateNonce(),
      issuedAt = new Date().toISOString(),
      expirationTime,
      notBefore,
      requestId,
      resources,
    } = input;

    // Build message parts
    const parts = [
      `${domain} wants you to sign in with your Solana account:`,
      address,
    ];

    if (statement) {
      parts.push('', statement);
    }

    parts.push('');

    if (uri) {
      parts.push(`URI: ${uri}`);
    }

    parts.push(`Version: ${version}`);
    parts.push(`Chain ID: ${chainId}`);
    parts.push(`Nonce: ${nonce}`);
    parts.push(`Issued At: ${issuedAt}`);

    if (expirationTime) {
      parts.push(`Expiration Time: ${expirationTime}`);
    }

    if (notBefore) {
      parts.push(`Not Before: ${notBefore}`);
    }

    if (requestId) {
      parts.push(`Request ID: ${requestId}`);
    }

    if (resources && resources.length > 0) {
      parts.push('Resources:');
      resources.forEach((resource) => {
        parts.push(`- ${resource}`);
      });
    }

    return parts.join('\n');
  }

  #generateNonce(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString('hex');
  }

  #getChainId(): string {
    const cluster = this.wallet.getCluster();
    const chainIdMap = {
      'mainnet-beta': 'solana:mainnet',
      'testnet': 'solana:testnet',
      'devnet': 'solana:devnet'
    };
    return chainIdMap[cluster];
  }

  // Internal event handlers
  #handleConnect(): void {
    this.#updateAccounts();
  }

  #handleDisconnect(): void {
    this.connectedAccounts = [];
    this.#emit('change', { accounts: this.connectedAccounts });
  }

  #handleAccountChange(): void {
    this.#updateAccounts();
  }

  #updateAccounts(): void {
    const publicKey = this.wallet.getPublicKey();
    if (!publicKey) {
      this.connectedAccounts = [];
    } else {
      const address = publicKey.toBase58();
      const publicKeyBytes = publicKey.toBytes();

      // Check if account already exists
      const existingAccount = this.connectedAccounts[0];
      if (existingAccount?.address === address) {
        return; // No change
      }

      // Create new account
      this.connectedAccounts = [
        {
          address,
          publicKey: publicKeyBytes,
          chains: this.#chains.slice(),
          features: [
            'solana:signAndSendTransaction',
            'solana:signTransaction',
            'solana:signMessage',
            'solana:signIn',
          ],
        },
      ];
    }

    this.#emit('change', { accounts: this.connectedAccounts });
  }
}