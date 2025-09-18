import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  sendAndConfirmTransaction,
  sendAndConfirmRawTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  SimulateTransactionConfig,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  SignatureStatus,
  TransactionSignature,
  SystemProgram
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getMint,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} from '@solana/spl-token';
import * as nacl from 'tweetnacl';
import { createKeypairFromKey } from './utils.js';

export interface SolanaWalletConfig {
  secretKeys: (string | Uint8Array)[];
  cluster?: 'devnet' | 'testnet' | 'mainnet-beta';
  rpcUrl?: string;
}

export class SolanaWallet {
  private keypairs: Keypair[] = [];
  private connection: Connection;
  private currentKeypairIndex = 0;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private connected = false;
  private cluster: 'devnet' | 'testnet' | 'mainnet-beta';

  constructor(config: SolanaWalletConfig) {
    // Create real keypairs from secret keys (supports multiple formats)
    this.keypairs = config.secretKeys.map(secretKey =>
      createKeypairFromKey(secretKey)
    );

    // Store cluster configuration
    this.cluster = config.cluster || 'devnet';

    // Set up connection
    const rpcUrl = config.rpcUrl || clusterApiUrl(this.cluster);
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async connect(): Promise<{ publicKey: any }> {
    if (this.keypairs.length === 0) {
      throw new Error('No keypairs available');
    }

    this.connected = true;
    const publicKey = this.keypairs[this.currentKeypairIndex].publicKey;
    const publicKeyString = publicKey.toBase58();

    // Create a plain object that can be serialized
    // This will be enhanced on the browser side with methods
    const serializablePublicKey = {
      _bn: publicKey.toBuffer(),
      _base58: publicKeyString
    };

    this.emit('connect', serializablePublicKey);
    return { publicKey: serializablePublicKey };
  }


  isConnected(): boolean {
    return this.connected;
  }

  getCluster(): 'devnet' | 'testnet' | 'mainnet-beta' {
    return this.cluster;
  }

  /**
   * Duck typing to detect VersionedTransaction across module boundaries
   * This works when instanceof fails due to different web3.js versions
   */
  private isVersionedTransaction(transaction: any): boolean {
    return transaction &&
           typeof transaction.version === 'number' &&
           transaction.version === 0 &&
           transaction.message &&
           typeof transaction.serialize === 'function' &&
           Array.isArray(transaction.signatures);
  }

  /**
   * Duck typing to detect legacy Transaction across module boundaries
   */
  private isLegacyTransaction(transaction: any): boolean {
    return transaction &&
           transaction.version === undefined &&
           Array.isArray(transaction.instructions) &&
           typeof transaction.serialize === 'function' &&
           Array.isArray(transaction.signatures);
  }

  async signTransaction(transaction: any): Promise<Transaction | VersionedTransaction> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    const keypair = this.keypairs[this.currentKeypairIndex];
    let tx: Transaction | VersionedTransaction;

    // Debug logging to understand the transaction format
    console.log('[Solana Wallet] Transaction debug info:', {
      constructorName: transaction.constructor?.name,
      isUint8Array: transaction instanceof Uint8Array,
      isBuffer: Buffer.isBuffer(transaction),
      hasSerialize: typeof transaction.serialize === 'function',
      hasMessage: !!transaction.message,
      hasSignatures: !!transaction.signatures,
      hasInstructions: !!transaction.instructions,
      keys: Object.keys(transaction)
    });

    // Handle serialized transactions (Uint8Array/Buffer) from Wallet Standard
    if (transaction instanceof Uint8Array || Buffer.isBuffer(transaction)) {
      console.log('[Solana Wallet] Detected serialized transaction (Uint8Array/Buffer)');
      try {
        // Try VersionedTransaction first (modern format)
        tx = VersionedTransaction.deserialize(transaction);
        console.log('[Solana Wallet] Successfully deserialized as VersionedTransaction');
      } catch (versionedError) {
        try {
          // Fall back to legacy Transaction
          tx = Transaction.from(transaction);
          console.log('[Solana Wallet] Successfully deserialized as legacy Transaction');
        } catch (legacyError) {
          throw new Error(`Failed to deserialize Uint8Array transaction. VersionedTransaction error: ${versionedError}. Transaction error: ${legacyError}`);
        }
      }
    }
    // Handle transaction objects that come from the browser and lose their prototype
    // Note: Don't use instanceof - it fails across module boundaries!
    else if (this.isVersionedTransaction(transaction)) {
      console.log('[Solana Wallet] Detected VersionedTransaction via duck typing');
      tx = transaction;
    } else if (this.isLegacyTransaction(transaction)) {
      console.log('[Solana Wallet] Detected legacy Transaction via duck typing');
      tx = transaction;
    } else if (transaction.constructor?.name === 'VersionedTransaction' || transaction.constructor?.name === '_VersionedTransaction') {
      // VersionedTransaction that lost prototype - reconstruct it
      try {
        // Try to access the message directly if it exists
        if (transaction.message && transaction.signatures) {
          const serialized = transaction.serialize();
          tx = VersionedTransaction.deserialize(serialized);
        } else {
          throw new Error('Invalid VersionedTransaction structure');
        }
      } catch (error) {
        throw new Error(`Failed to reconstruct VersionedTransaction: ${error}`);
      }
    } else if (transaction.constructor?.name === 'Transaction' || transaction.constructor?.name === '_Transaction') {
      // Legacy Transaction that lost prototype - reconstruct it
      try {
        if (transaction.serialize && typeof transaction.serialize === 'function') {
          const serialized = transaction.serialize({ requireAllSignatures: false });
          tx = Transaction.from(serialized);
        } else {
          throw new Error('Invalid Transaction structure');
        }
      } catch (error) {
        throw new Error(`Failed to reconstruct Transaction: ${error}`);
      }
    } else if (transaction.serialize && typeof transaction.serialize === 'function') {
      // Has serialize method but lost class prototype - try to call it
      try {
        const serialized = transaction.serialize({ requireAllSignatures: false });
        tx = Transaction.from(serialized);
      } catch (error) {
        throw new Error(`Failed to deserialize transaction: ${error}`);
      }
    } else if (transaction.serializedMessage) {
      // VersionedTransaction format
      try {
        tx = VersionedTransaction.deserialize(Buffer.from(transaction.serializedMessage));
      } catch (error) {
        throw new Error(`Failed to deserialize versioned transaction: ${error}`);
      }
    } else if (transaction._serialized) {
      // Already serialized buffer
      try {
        tx = Transaction.from(Buffer.from(transaction._serialized));
      } catch (error) {
        throw new Error(`Failed to deserialize from buffer: ${error}`);
      }
    } else if (transaction.instructions && Array.isArray(transaction.instructions)) {
      // Plain object - reconstruct Transaction
      try {
        tx = new Transaction();

        // Copy basic properties
        if (transaction.recentBlockhash) {
          tx.recentBlockhash = transaction.recentBlockhash;
        }
        if (transaction.feePayer) {
          tx.feePayer = new PublicKey(transaction.feePayer);
        }

        // Reconstruct instructions
        for (const inst of transaction.instructions) {
          tx.add({
            keys: inst.keys.map((k: any) => ({
              pubkey: new PublicKey(k.pubkey),
              isSigner: k.isSigner,
              isWritable: k.isWritable
            })),
            programId: new PublicKey(inst.programId),
            data: Buffer.from(inst.data)
          });
        }

        // Copy existing signatures if any
        if (transaction.signatures) {
          tx.signatures = transaction.signatures;
        }
      } catch (error) {
        throw new Error(`Failed to reconstruct transaction from plain object: ${error}`);
      }
    } else if (transaction.message && transaction.message.header) {
      // Looks like a VersionedTransaction structure - try to reconstruct
      try {
        console.log('[Solana Wallet] Attempting VersionedTransaction reconstruction from message structure');
        // Create a new VersionedTransaction from the message
        const versionedTx = new VersionedTransaction(transaction.message);
        // Copy over any existing signatures
        if (transaction.signatures && Array.isArray(transaction.signatures)) {
          transaction.signatures.forEach((sig: any, index: number) => {
            if (sig && sig.length > 0) {
              versionedTx.signatures[index] = sig;
            }
          });
        }
        tx = versionedTx;
      } catch (error) {
        throw new Error(`Failed to reconstruct from message structure: ${error}`);
      }
    } else {
      console.error('[Solana Wallet] Unsupported transaction format. Available properties:', Object.keys(transaction));
      console.error('[Solana Wallet] Constructor name:', transaction.constructor?.name);
      console.error('[Solana Wallet] Transaction object:', transaction);
      throw new Error(`Unsupported transaction format: ${transaction.constructor?.name || 'unknown'}`);
    }

    // Now sign the properly reconstructed transaction
    if (tx instanceof Transaction) {
      tx.partialSign(keypair);
      return tx;
    } else {
      // VersionedTransaction
      tx.sign([keypair]);
      return tx;
    }
  }

  async signAllTransactions(
    transactions: any[]
  ): Promise<(Transaction | VersionedTransaction)[]> {
    const signedTransactions = [];
    for (const transaction of transactions) {
      const signed = await this.signTransaction(transaction);
      signedTransactions.push(signed);
    }
    return signedTransactions;
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array; publicKey: any }> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    const keypair = this.keypairs[this.currentKeypairIndex];
    const signature = nacl.sign.detached(message, keypair.secretKey);
    const publicKeyString = keypair.publicKey.toBase58();

    // Create a plain object that can be serialized
    const serializablePublicKey = {
      _bn: keypair.publicKey.toBuffer(),
      _base58: publicKeyString
    };

    return {
      signature,
      publicKey: serializablePublicKey
    };
  }

  async signAndSendTransaction(transaction: any): Promise<{ signature: string }> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    // Use our fixed signTransaction method to handle deserialization
    const signedTx = await this.signTransaction(transaction) as Transaction;

    // Then send it
    const keypair = this.keypairs[this.currentKeypairIndex];
    const signature = await sendAndConfirmTransaction(
      this.connection,
      signedTx,
      [keypair]
    );

    return { signature };
  }

  // Send a pre-signed transaction
  async sendTransaction(transaction: Transaction | VersionedTransaction): Promise<{ signature: string }> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    // Transaction should already be signed
    const serialized = transaction.serialize();
    const signature = await sendAndConfirmRawTransaction(
      this.connection,
      Buffer.from(serialized)
    );

    return { signature };
  }

  // Get balance for current account or specified public key
  async getBalance(publicKey?: PublicKey | string): Promise<number> {
    const pubKey = publicKey
      ? (typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey)
      : this.keypairs[this.currentKeypairIndex]?.publicKey;

    if (!pubKey) {
      throw new Error('No public key available');
    }

    const balance = await this.connection.getBalance(pubKey);
    return balance / LAMPORTS_PER_SOL; // Return balance in SOL
  }

  // Get balance in lamports
  async getBalanceLamports(publicKey?: PublicKey | string): Promise<number> {
    const pubKey = publicKey
      ? (typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey)
      : this.keypairs[this.currentKeypairIndex]?.publicKey;

    if (!pubKey) {
      throw new Error('No public key available');
    }

    return await this.connection.getBalance(pubKey);
  }

  // Get latest blockhash for transaction building
  async getLatestBlockhash(commitment?: 'processed' | 'confirmed' | 'finalized'): Promise<{
    blockhash: string;
    lastValidBlockHeight: number;
  }> {
    const result = await this.connection.getLatestBlockhash(commitment || 'confirmed');
    return result;
  }

  // Simulate a transaction without sending it
  async simulateTransaction(
    transaction: Transaction | VersionedTransaction,
    config?: SimulateTransactionConfig
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    // Sign the transaction if it's not already signed
    const keypair = this.keypairs[this.currentKeypairIndex];

    if (transaction instanceof Transaction) {
      if (!transaction.signature) {
        transaction.sign(keypair);
      }
      return await this.connection.simulateTransaction(transaction);
    } else {
      // VersionedTransaction
      if (!transaction.signatures[0]) {
        const signature = nacl.sign.detached(transaction.message.serialize(), keypair.secretKey);
        transaction.addSignature(keypair.publicKey, signature);
      }
      return await this.connection.simulateTransaction(transaction, config);
    }
  }

  // Get account info
  async getAccountInfo(publicKey?: PublicKey | string): Promise<any> {
    const pubKey = publicKey
      ? (typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey)
      : this.keypairs[this.currentKeypairIndex]?.publicKey;

    if (!pubKey) {
      throw new Error('No public key available');
    }

    return await this.connection.getAccountInfo(pubKey);
  }

  // Get signature status
  async getSignatureStatuses(
    signatures: TransactionSignature[]
  ): Promise<RpcResponseAndContext<(SignatureStatus | null)[]>> {
    return await this.connection.getSignatureStatuses(signatures);
  }

  // Request airdrop (for devnet/testnet)
  async requestAirdrop(amount: number = 1): Promise<string> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    const publicKey = this.keypairs[this.currentKeypairIndex].publicKey;
    const signature = await this.connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );

    // Wait for confirmation
    await this.connection.confirmTransaction(signature);
    return signature;
  }

  // Sign In with Solana (SIWS) - for authentication
  async signIn(input?: {
    domain?: string;
    address?: string;
    statement?: string;
    uri?: string;
    version?: string;
    chainId?: string;
    nonce?: string;
    issuedAt?: string;
    expirationTime?: string;
    notBefore?: string;
    requestId?: string;
    resources?: string[];
  }): Promise<{
    account: {
      address: string;
      publicKey: string;
    };
    signedMessage: {
      signature: Uint8Array;
      signatureBase64: string;
    };
    signature: Uint8Array;
    signatureBase64: string;
  }> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    const keypair = this.keypairs[this.currentKeypairIndex];
    const address = keypair.publicKey.toBase58();

    // Build SIWS message
    const domain = input?.domain || 'localhost';
    const statement = input?.statement || 'Sign in with Solana to the app.';
    const uri = input?.uri || 'http://localhost';
    const version = input?.version || '1';
    // Use actual cluster for chain ID, with fallback mapping
    const chainIdMap = {
      'mainnet-beta': 'solana:mainnet',
      'testnet': 'solana:testnet',
      'devnet': 'solana:devnet'
    };
    const chainId = input?.chainId || chainIdMap[this.cluster];
    const nonce = input?.nonce || Math.random().toString(36).substring(2, 15);
    const issuedAt = input?.issuedAt || new Date().toISOString();

    // Construct the message according to SIWS spec
    let message = `${domain} wants you to sign in with your Solana account:\n`;
    message += `${address}\n\n`;
    if (statement) message += `${statement}\n\n`;
    message += `URI: ${uri}\n`;
    message += `Version: ${version}\n`;
    message += `Chain ID: ${chainId}\n`;
    message += `Nonce: ${nonce}\n`;
    message += `Issued At: ${issuedAt}`;

    if (input?.expirationTime) message += `\nExpiration Time: ${input.expirationTime}`;
    if (input?.notBefore) message += `\nNot Before: ${input.notBefore}`;
    if (input?.requestId) message += `\nRequest ID: ${input.requestId}`;
    if (input?.resources && input.resources.length > 0) {
      message += '\nResources:';
      input.resources.forEach(resource => {
        message += `\n- ${resource}`;
      });
    }

    // Sign the message
    const encodedMessage = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(encodedMessage, keypair.secretKey);
    const signatureBase64 = Buffer.from(signature).toString('base64');

    return {
      account: {
        address,
        publicKey: address
      },
      signedMessage: {
        signature,
        signatureBase64
      },
      signature, // For backward compatibility
      signatureBase64 // For backward compatibility
    };
  }

  // ================ SPL Token Methods ================

  // Get token balance for a specific mint
  async getTokenBalance(
    mint: PublicKey | string,
    owner?: PublicKey | string
  ): Promise<{ amount: string; decimals: number; uiAmount: number | null }> {
    const mintPubKey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    const ownerPubKey = owner
      ? (typeof owner === 'string' ? new PublicKey(owner) : owner)
      : this.keypairs[this.currentKeypairIndex]?.publicKey;

    if (!ownerPubKey) {
      throw new Error('No owner public key available');
    }

    try {
      // Get the associated token account address
      const tokenAccount = await getAssociatedTokenAddress(
        mintPubKey,
        ownerPubKey
      );

      // Get the token account balance
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return balance.value;
    } catch (error: any) {
      // If token account doesn't exist, return 0 balance
      if (error instanceof TokenAccountNotFoundError || error.message?.includes('could not find account')) {
        const mintInfo = await getMint(this.connection, mintPubKey);
        return {
          amount: '0',
          decimals: mintInfo.decimals,
          uiAmount: 0
        };
      }
      throw error;
    }
  }

  // Get all token accounts for the current wallet
  async getTokenAccounts(owner?: PublicKey | string): Promise<any[]> {
    const ownerPubKey = owner
      ? (typeof owner === 'string' ? new PublicKey(owner) : owner)
      : this.keypairs[this.currentKeypairIndex]?.publicKey;

    if (!ownerPubKey) {
      throw new Error('No owner public key available');
    }

    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      ownerPubKey,
      { programId: TOKEN_PROGRAM_ID }
    );

    return tokenAccounts.value.map(account => ({
      pubkey: account.pubkey.toBase58(),
      account: account.account,
      mint: account.account.data.parsed.info.mint,
      amount: account.account.data.parsed.info.tokenAmount.amount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals,
      uiAmount: account.account.data.parsed.info.tokenAmount.uiAmount
    }));
  }

  // Transfer SPL tokens
  async transferToken(
    mint: PublicKey | string,
    recipient: PublicKey | string,
    amount: number,
    decimals?: number
  ): Promise<{ signature: string }> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    const keypair = this.keypairs[this.currentKeypairIndex];
    const mintPubKey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    const recipientPubKey = typeof recipient === 'string' ? new PublicKey(recipient) : recipient;

    // Get mint info to get decimals if not provided
    let tokenDecimals = decimals;
    if (tokenDecimals === undefined) {
      const mintInfo = await getMint(this.connection, mintPubKey);
      tokenDecimals = mintInfo.decimals;
    }

    // Get or create associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPubKey,
      keypair.publicKey
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      mintPubKey,
      recipientPubKey
    );

    // Create transaction
    const transaction = new Transaction();

    // Check if recipient token account exists
    try {
      await getAccount(this.connection, toTokenAccount);
    } catch (error: any) {
      // If account doesn't exist, add instruction to create it
      if (error instanceof TokenAccountNotFoundError) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            keypair.publicKey, // payer
            toTokenAccount, // ata
            recipientPubKey, // owner
            mintPubKey // mint
          )
        );
      } else {
        throw error;
      }
    }

    // Add transfer instruction
    const transferAmount = amount * Math.pow(10, tokenDecimals);
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        keypair.publicKey,
        transferAmount
      )
    );

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;

    // Sign and send transaction
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [keypair]
    );

    return { signature };
  }

  // Create a new associated token account
  async createTokenAccount(
    mint: PublicKey | string,
    owner?: PublicKey | string
  ): Promise<{ address: string; signature: string }> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    const keypair = this.keypairs[this.currentKeypairIndex];
    const mintPubKey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    const ownerPubKey = owner
      ? (typeof owner === 'string' ? new PublicKey(owner) : owner)
      : keypair.publicKey;

    // Get associated token account address
    const tokenAccount = await getAssociatedTokenAddress(
      mintPubKey,
      ownerPubKey
    );

    // Check if account already exists
    try {
      await getAccount(this.connection, tokenAccount);
      // Account already exists
      return {
        address: tokenAccount.toBase58(),
        signature: ''
      };
    } catch (error: any) {
      if (!(error instanceof TokenAccountNotFoundError)) {
        throw error;
      }
    }

    // Create the account
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        keypair.publicKey, // payer
        tokenAccount, // ata
        ownerPubKey, // owner
        mintPubKey // mint
      )
    );

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;

    // Sign and send transaction
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [keypair]
    );

    return {
      address: tokenAccount.toBase58(),
      signature
    };
  }

  // Get mint info
  async getMintInfo(mint: PublicKey | string): Promise<any> {
    const mintPubKey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    const mintInfo = await getMint(this.connection, mintPubKey);
    return {
      address: mintPubKey.toBase58(),
      decimals: mintInfo.decimals,
      supply: mintInfo.supply.toString(),
      mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
      freezeAuthority: mintInfo.freezeAuthority?.toBase58() || null,
      isInitialized: mintInfo.isInitialized
    };
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

      case 'sendTransaction':
        return this.sendTransaction(normalizedParams[0]);

      case 'getBalance':
        return this.getBalance(normalizedParams[0]);

      case 'getBalanceLamports':
        return this.getBalanceLamports(normalizedParams[0]);

      case 'getLatestBlockhash':
        return this.getLatestBlockhash(normalizedParams[0]);

      case 'simulateTransaction':
        return this.simulateTransaction(normalizedParams[0], normalizedParams[1]);

      case 'getAccountInfo':
        return this.getAccountInfo(normalizedParams[0]);

      case 'getSignatureStatuses':
        return this.getSignatureStatuses(normalizedParams[0]);

      case 'requestAirdrop':
        return this.requestAirdrop(normalizedParams[0]);

      case 'signIn':
        return this.signIn(normalizedParams[0]);

      // SPL Token methods
      case 'getTokenBalance':
        return this.getTokenBalance(normalizedParams[0], normalizedParams[1]);

      case 'getTokenAccounts':
        return this.getTokenAccounts(normalizedParams[0]);

      case 'transferToken':
        return this.transferToken(
          normalizedParams[0],
          normalizedParams[1],
          normalizedParams[2],
          normalizedParams[3]
        );

      case 'createTokenAccount':
        return this.createTokenAccount(normalizedParams[0], normalizedParams[1]);

      case 'getMintInfo':
        return this.getMintInfo(normalizedParams[0]);

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
    if (!this.connected || this.keypairs.length === 0) {
      return null;
    }
    // Return the actual PublicKey instance - it will be serialized properly when needed
    return this.keypairs[this.currentKeypairIndex].publicKey;
  }

  switchAccount(index: number): void {
    if (index >= 0 && index < this.keypairs.length) {
      this.currentKeypairIndex = index;
      const newPublicKey = this.keypairs[index].publicKey;
      // Emit both events for compatibility
      this.emit('accountChanged', newPublicKey);
      // AppKit expects 'accountsChanged' with the publicKey as parameter
      this.emit('accountsChanged', newPublicKey);
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