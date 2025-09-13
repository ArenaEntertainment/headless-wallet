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
  private currentChain: Chain;
  private transports: Record<number, Transport>;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

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
      case 'eth_accounts':
        // Return all account addresses
        const addresses = this.accounts.map(account => account.address);
        if (addresses.length > 0) {
          this.emit('connect', { chainId: `0x${this.currentChain.id.toString(16)}` });
        }
        return addresses;

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

      case 'personal_sign': {
        const [message, address] = normalizedParams;
        const account = this.accounts.find(acc => acc.address.toLowerCase() === address.toLowerCase());
        if (!account) {
          throw new Error(`Account ${address} not found`);
        }

        const walletClient = this.createWalletClient(account);
        const signature = await walletClient.signMessage({
          account,
          message: typeof message === 'string' ? message : { raw: message as Hex }
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
                'personal_sign',
                'eth_sign',
                'eth_signTypedData_v4',
                'eth_sendTransaction',
                'wallet_switchEthereumChain',
                'wallet_addEthereumChain'
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
                'personal_sign',
                'eth_sign',
                'eth_signTypedData_v4',
                'eth_sendTransaction',
                'wallet_switchEthereumChain',
                'wallet_addEthereumChain'
              ]
            },
            chainSwitching: { supported: true }
          };
        }

        return capabilities;
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
}