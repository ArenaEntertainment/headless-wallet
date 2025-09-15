import {
  createWalletClient,
  createPublicClient,
  http,
  type WalletClient,
  type PublicClient,
  type Chain,
  type Transport,
  type LocalAccount,
  type Hex,
  fromHex
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as chains from 'viem/chains';

export interface EVMWalletConfig {
  privateKeys: string[];
  defaultChain?: Chain;
  transports?: Record<number, Transport>;
  rpcUrl?: string;
}

export class EVMWallet {
  private accounts: LocalAccount[] = [];
  private currentAccountIndex: number = 0;
  private currentChain: Chain;
  private transports: Record<number, Transport>;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private isConnected: boolean = false;

  constructor(config: EVMWalletConfig) {
    // Create real accounts from private keys
    this.accounts = config.privateKeys.map(privateKey =>
      privateKeyToAccount(privateKey as `0x${string}`)
    );

    this.currentChain = config.defaultChain || chains.mainnet;
    this.transports = config.transports || {};

    // Default to HTTP transport if none provided
    if (!this.transports[this.currentChain.id]) {
      const rpcUrl = config.rpcUrl || this.currentChain.rpcUrls.default.http[0];
      this.transports[this.currentChain.id] = http(rpcUrl);
    }
  }

  private createWalletClient(account: LocalAccount): WalletClient {
    return createWalletClient({
      account,
      chain: this.currentChain,
      transport: this.transports[this.currentChain.id] || http()
    });
  }

  private createPublicClient(): PublicClient {
    return createPublicClient({
      chain: this.currentChain,
      transport: this.transports[this.currentChain.id] || http()
    });
  }

  async request({ method, params }: { method: string; params?: any[] }): Promise<any> {
    const normalizedParams = params || [];

    switch (method) {
      case 'eth_requestAccounts':
        // Connect if not connected
        if (!this.isConnected) {
          this.isConnected = true;
          this.emit('connect', { chainId: `0x${this.currentChain.id.toString(16)}` });
        }
        // Return all account addresses with current account first (modern approach)
        const requestAddresses = this.getAddresses();
        const requestReorderedAddresses = [requestAddresses[this.currentAccountIndex], ...requestAddresses.filter((_, i) => i !== this.currentAccountIndex)];
        return requestReorderedAddresses;

      case 'eth_accounts':
        // Return empty array if not connected
        if (!this.isConnected) {
          return [];
        }
        // Return all account addresses with current account first (modern approach)
        const addresses = this.getAddresses();
        const reorderedAddresses = [addresses[this.currentAccountIndex], ...addresses.filter((_, i) => i !== this.currentAccountIndex)];
        return reorderedAddresses;

      case 'eth_chainId':
        return `0x${this.currentChain.id.toString(16)}`;

      case 'eth_getBalance': {
        const [address, blockTag = 'latest'] = normalizedParams;
        const publicClient = this.createPublicClient();
        const balance = await publicClient.getBalance({
          address,
          blockTag: blockTag as any
        });
        return `0x${balance.toString(16)}`;
      }

      case 'eth_blockNumber': {
        const publicClient = this.createPublicClient();
        const blockNumber = await publicClient.getBlockNumber();
        return `0x${blockNumber.toString(16)}`;
      }

      case 'eth_getTransactionReceipt': {
        const [transactionHash] = normalizedParams;
        const publicClient = this.createPublicClient();
        const receipt = await publicClient.getTransactionReceipt({
          hash: transactionHash as Hex
        });
        if (!receipt) {
          return null;
        }
        // Convert to hex format for RPC compatibility
        return {
          ...receipt,
          blockNumber: `0x${receipt.blockNumber.toString(16)}`,
          cumulativeGasUsed: `0x${receipt.cumulativeGasUsed.toString(16)}`,
          effectiveGasPrice: receipt.effectiveGasPrice ? `0x${receipt.effectiveGasPrice.toString(16)}` : undefined,
          gasUsed: `0x${receipt.gasUsed.toString(16)}`,
          status: receipt.status === 'success' ? '0x1' : '0x0',
          transactionIndex: `0x${receipt.transactionIndex.toString(16)}`
        };
      }

      case 'eth_estimateGas': {
        const [transaction] = normalizedParams;
        const publicClient = this.createPublicClient();
        const estimate = await publicClient.estimateGas({
          account: transaction.from,
          to: transaction.to,
          value: transaction.value ? BigInt(transaction.value) : undefined,
          data: transaction.data
        });
        return `0x${estimate.toString(16)}`;
      }

      case 'eth_gasPrice': {
        const publicClient = this.createPublicClient();
        const gasPrice = await publicClient.getGasPrice();
        return `0x${gasPrice.toString(16)}`;
      }

      case 'eth_getCode': {
        const [address, blockTag = 'latest'] = normalizedParams;
        const publicClient = this.createPublicClient();
        const code = await publicClient.getBytecode({
          address,
          blockTag: blockTag as any
        });
        return code || '0x';
      }

      case 'eth_getLogs': {
        const [filter] = normalizedParams;
        const publicClient = this.createPublicClient();
        const logsParams: any = {
          address: filter.address,
          fromBlock: filter.fromBlock ? BigInt(filter.fromBlock) : undefined,
          toBlock: filter.toBlock ? BigInt(filter.toBlock) : undefined
        };
        // Add topics if present
        if (filter.topics) {
          logsParams.event = undefined; // Ensure we're using the raw filter mode
          logsParams.args = filter.topics;
        }
        const logs = await publicClient.getLogs(logsParams);
        // Convert logs to hex format
        return logs.map(log => ({
          ...log,
          blockNumber: log.blockNumber ? `0x${log.blockNumber.toString(16)}` : null,
          transactionIndex: log.transactionIndex ? `0x${log.transactionIndex.toString(16)}` : null,
          logIndex: log.logIndex ? `0x${log.logIndex.toString(16)}` : null
        }));
      }

      case 'personal_sign': {
        const [message, address] = normalizedParams;
        const account = this.accounts.find(acc => acc.address.toLowerCase() === address.toLowerCase());
        if (!account) {
          throw new Error(`Account ${address} not found`);
        }

        const walletClient = this.createWalletClient(account);

        // Handle both plain text and hex-encoded messages
        // Ethers v6 sends messages as hex-encoded strings that should be decoded
        let messageToSign: string | { raw: Hex };
        if (typeof message === 'string' && message.startsWith('0x')) {
          // Check if it's a valid hex string
          const hexRegex = /^0x[0-9a-fA-F]*$/;
          if (hexRegex.test(message) && message.length % 2 === 0) {
            // Valid hex - decode it to text for ethers v6 compatibility
            try {
              const hex = message.slice(2);
              if (hex.length === 0) {
                // Empty hex string
                messageToSign = '';
              } else {
                const bytes = hex.match(/.{2}/g) || [];
                const decoded = bytes.map(b => {
                  const code = parseInt(b, 16);
                  return String.fromCharCode(code);
                }).join('');
                messageToSign = decoded;
              }
            } catch (error) {
              // If decoding fails, treat as raw hex
              console.warn('Failed to decode hex message:', error);
              messageToSign = { raw: message as Hex };
            }
          } else {
            // Starts with 0x but not valid hex - treat as plain text
            messageToSign = message;
          }
        } else {
          // Plain text or non-string
          messageToSign = typeof message === 'string' ? message : { raw: message as Hex };
        }

        const signature = await walletClient.signMessage({
          account,
          message: messageToSign
        });
        return signature;
      }

      case 'eth_sign': {
        const [address, message] = normalizedParams;
        return this.request({ method: 'personal_sign', params: [message, address] });
      }

      case 'eth_signTypedData_v4': {
        const [address, typedDataString] = normalizedParams;
        const account = this.accounts.find(acc => acc.address.toLowerCase() === address.toLowerCase());
        if (!account) {
          throw new Error(`Account ${address} not found`);
        }

        const typedData = typeof typedDataString === 'string'
          ? JSON.parse(typedDataString)
          : typedDataString;

        const walletClient = this.createWalletClient(account);
        const signature = await walletClient.signTypedData({
          ...typedData,
          account
        });
        return signature;
      }

      case 'eth_sendTransaction': {
        const [transaction] = normalizedParams;
        const account = this.accounts.find(acc =>
          acc.address.toLowerCase() === transaction.from?.toLowerCase()
        );
        if (!account) {
          throw new Error(`Account ${transaction.from} not found`);
        }

        const walletClient = this.createWalletClient(account);

        // Build transaction parameters - avoid gasPrice with EIP-1559 params
        const txParams: any = {
          account,
          to: transaction.to,
          value: transaction.value ? BigInt(transaction.value) : undefined,
          data: transaction.data,
          gas: transaction.gas ? BigInt(transaction.gas) : undefined
        };

        // Use either legacy gasPrice OR EIP-1559 maxFeePerGas/maxPriorityFeePerGas, not both
        if (transaction.maxFeePerGas || transaction.maxPriorityFeePerGas) {
          if (transaction.maxFeePerGas) txParams.maxFeePerGas = BigInt(transaction.maxFeePerGas);
          if (transaction.maxPriorityFeePerGas) txParams.maxPriorityFeePerGas = BigInt(transaction.maxPriorityFeePerGas);
        } else if (transaction.gasPrice) {
          txParams.gasPrice = BigInt(transaction.gasPrice);
        }

        const hash = await walletClient.sendTransaction(txParams);
        return hash;
      }

      case 'wallet_switchEthereumChain': {
        const [{ chainId }] = normalizedParams;
        const newChain = this.getChainById(chainId);
        if (!newChain) {
          throw new Error(`Chain ${chainId} not supported`);
        }

        this.currentChain = newChain;

        // Set up transport for new chain if not exists
        if (!this.transports[newChain.id]) {
          this.transports[newChain.id] = http(newChain.rpcUrls.default.http[0]);
        }

        this.emit('chainChanged', chainId);
        return null;
      }

      case 'wallet_addEthereumChain': {
        const [chainData] = normalizedParams;

        // Validate required fields per EIP-3085
        if (!chainData?.chainId) {
          throw new Error('Missing required parameter: chainId');
        }

        if (!chainData.chainName) {
          throw new Error('Missing required parameter: chainName');
        }

        if (!chainData.rpcUrls || !Array.isArray(chainData.rpcUrls) || chainData.rpcUrls.length === 0) {
          throw new Error('Missing required parameter: rpcUrls must be a non-empty array');
        }

        // Check if we already support this chain
        const existingChain = this.getChainById(chainData.chainId);
        if (existingChain) {
          // Chain already exists, just switch to it
          return this.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainData.chainId }]
          });
        }

        // For unsupported chains, we currently reject
        // In a real implementation, you might add the chain dynamically
        throw new Error(`Chain ${chainData.chainId} (${chainData.chainName}) is not supported by this mock wallet`);
      }

      case 'wallet_requestPermissions':
      case 'wallet_revokePermissions':
        return [{ parentCapability: 'eth_accounts' }];

      case 'wallet_getPermissions':
        return [];

      case 'wallet_getCapabilities': {
        // EIP-5792: Expose wallet capabilities for multi-chain support
        const capabilities: Record<string, any> = {};

        // Add capabilities for each chain we support transport for
        for (const chainId of Object.keys(this.transports)) {
          const numericChainId = parseInt(chainId);
          capabilities[`0x${numericChainId.toString(16)}`] = {
            // Standard wallet capabilities
            accounts: {
              supported: true
            },
            methods: {
              supported: [
                'eth_accounts',
                'eth_requestAccounts',
                'eth_chainId',
                'eth_getBalance',
                'eth_blockNumber',
                'eth_getTransactionReceipt',
                'eth_estimateGas',
                'eth_gasPrice',
                'eth_getCode',
                'eth_getLogs',
                'personal_sign',
                'eth_sign',
                'eth_signTypedData_v4',
                'eth_sendTransaction',
                'wallet_switchEthereumChain',
                'wallet_addEthereumChain',
                'wallet_watchAsset'
              ]
            },
            // Indicate multi-chain switching support
            chainSwitching: {
              supported: true
            }
          };
        }

        // Always include current chain
        const currentChainHex = `0x${this.currentChain.id.toString(16)}`;
        if (!capabilities[currentChainHex]) {
          capabilities[currentChainHex] = {
            accounts: { supported: true },
            methods: {
              supported: [
                'eth_accounts',
                'eth_requestAccounts',
                'eth_chainId',
                'eth_getBalance',
                'eth_blockNumber',
                'eth_getTransactionReceipt',
                'eth_estimateGas',
                'eth_gasPrice',
                'eth_getCode',
                'eth_getLogs',
                'personal_sign',
                'eth_sign',
                'eth_signTypedData_v4',
                'eth_sendTransaction',
                'wallet_switchEthereumChain',
                'wallet_addEthereumChain',
                'wallet_watchAsset'
              ]
            },
            chainSwitching: { supported: true }
          };
        }

        return capabilities;
      }

      case 'wallet_watchAsset': {
        const [assetParams] = normalizedParams;

        // Validate asset type (only ERC20 is supported)
        if (assetParams?.type !== 'ERC20') {
          throw new Error('Asset type must be ERC20');
        }

        // Validate required options
        const { address, symbol, decimals } = assetParams.options || {};
        if (!address) {
          throw new Error('Token address is required');
        }
        if (!symbol) {
          throw new Error('Token symbol is required');
        }
        if (decimals === undefined || decimals === null) {
          throw new Error('Token decimals is required');
        }

        // In a real wallet, this would add the token to the wallet's token list
        // For testing purposes, we just return success
        console.log(`Adding token: ${symbol} (${address}) with ${decimals} decimals`);

        // Return true to indicate the token was successfully added
        return true;
      }

      default:
        // For other methods, try to forward to the wallet client
        try {
          const walletClient = this.createWalletClient(this.accounts[0]);
          return await walletClient.request({
            method: method as any,
            params: normalizedParams as any
          });
        } catch (error) {
          throw new Error(`Unsupported method: ${method}`);
        }
    }
  }

  private getChainById(chainId: string): Chain | null {
    const id = fromHex(chainId as Hex, 'number');

    for (const chain of Object.values(chains)) {
      if ('id' in chain && chain.id === id) {
        return chain as Chain;
      }
    }
    return null;
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
  disconnect(): void {
    // Clear connection state
    this.isConnected = false;

    // Emit disconnect event
    this.emit('disconnect', {
      code: 4900,
      message: 'User disconnected'
    });

    // Emit empty accounts changed to signal disconnection
    this.emit('accountsChanged', []);
  }

  // Utility methods
  getAccounts(): LocalAccount[] {
    return [...this.accounts];
  }

  getAddresses(): string[] {
    return this.accounts.map(account => account.address);
  }

  getCurrentChain(): Chain {
    return this.currentChain;
  }

  addTransport(chainId: number, transport: Transport): void {
    this.transports[chainId] = transport;
  }

  // Account switching methods
  switchAccount(index: number): void {
    if (index >= 0 && index < this.accounts.length && index !== this.currentAccountIndex) {
      this.currentAccountIndex = index;

      // Emit accountsChanged with all addresses, current account first
      const addresses = this.getAddresses();
      const reorderedAddresses = [addresses[index], ...addresses.filter((_, i) => i !== index)];
      this.emit('accountsChanged', reorderedAddresses);
    }
  }

  getCurrentAccountIndex(): number {
    return this.currentAccountIndex;
  }

  getCurrentAccount(): LocalAccount {
    return this.accounts[this.currentAccountIndex];
  }
}