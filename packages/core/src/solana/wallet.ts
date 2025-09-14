import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  sendAndConfirmTransaction,
  clusterApiUrl
} from '@solana/web3.js';
import * as nacl from 'tweetnacl';

export interface SolanaWalletConfig {
  secretKeys: Uint8Array[];
  cluster?: 'devnet' | 'testnet' | 'mainnet-beta';
  rpcUrl?: string;
}

export class SolanaWallet {
  private keypairs: Keypair[] = [];
  private connection: Connection;
  private currentKeypairIndex = 0;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private connected = false;

  constructor(config: SolanaWalletConfig) {
    // Create real keypairs from secret keys
    this.keypairs = config.secretKeys.map(secretKey =>
      Keypair.fromSecretKey(secretKey)
    );

    // Set up connection
    const rpcUrl = config.rpcUrl || clusterApiUrl(config.cluster || 'devnet');
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    if (this.keypairs.length === 0) {
      throw new Error('No keypairs available');
    }

    this.connected = true;
    const publicKey = this.keypairs[this.currentKeypairIndex].publicKey;

    this.emit('connect', publicKey);
    return { publicKey };
  }


  isConnected(): boolean {
    return this.connected;
  }

  async signTransaction(transaction: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    const keypair = this.keypairs[this.currentKeypairIndex];

    if (transaction instanceof Transaction) {
      // Legacy transaction
      transaction.sign(keypair);
      return transaction;
    } else {
      // Versioned transaction
      const signature = nacl.sign.detached(transaction.message.serialize(), keypair.secretKey);
      transaction.addSignature(keypair.publicKey, signature);
      return transaction;
    }
  }

  async signAllTransactions(
    transactions: (Transaction | VersionedTransaction)[]
  ): Promise<(Transaction | VersionedTransaction)[]> {
    const signedTransactions = [];
    for (const transaction of transactions) {
      const signed = await this.signTransaction(transaction);
      signedTransactions.push(signed);
    }
    return signedTransactions;
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array; publicKey: PublicKey }> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    const keypair = this.keypairs[this.currentKeypairIndex];
    const signature = nacl.sign.detached(message, keypair.secretKey);

    return {
      signature,
      publicKey: keypair.publicKey
    };
  }

  async signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    const keypair = this.keypairs[this.currentKeypairIndex];
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [keypair]
    );

    return { signature };
  }

  // Simulate other Solana wallet methods
  async request({ method, params }: { method: string; params?: any[] }): Promise<any> {
    const normalizedParams = params || [];

    switch (method) {
      case 'connect':
        return this.connect();

      case 'disconnect':
        return this.disconnect();

      case 'signTransaction':
        return this.signTransaction(normalizedParams[0]);

      case 'signAllTransactions':
        return this.signAllTransactions(normalizedParams[0]);

      case 'signMessage':
        return this.signMessage(normalizedParams[0]);

      case 'signAndSendTransaction':
        return this.signAndSendTransaction(normalizedParams[0]);

      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  // Event handling
  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  removeListener(event: string, handler: (...args: any[]) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(handler => handler(...args));
  }

  // Disconnect functionality
  async disconnect(): Promise<void> {
    this.connected = false;
    this.emit('disconnect');
  }

  // Utility methods
  getPublicKeys(): PublicKey[] {
    return this.keypairs.map(keypair => keypair.publicKey);
  }

  getPublicKey(): PublicKey | null {
    if (this.keypairs.length === 0) return null;
    return this.keypairs[this.currentKeypairIndex].publicKey;
  }

  switchAccount(index: number): void {
    if (index >= 0 && index < this.keypairs.length) {
      this.currentKeypairIndex = index;
      this.emit('accountChanged', this.keypairs[index].publicKey);
    }
  }

  getCurrentKeypairIndex(): number {
    return this.currentKeypairIndex;
  }

  getConnection(): Connection {
    return this.connection;
  }

  setConnection(rpcUrl: string): void {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }
}