/**
 * Vue composable for chain management
 */

import {
  ref,
  computed,
  onUnmounted,
  type Ref,
  type ComputedRef
} from 'vue';
import type { SupportedChain } from '@arenaentertainment/wallet-mock';
import type { ReactiveChainState, WalletComposableOptions } from '../types.js';
import { useWallet } from './useWallet.js';

/**
 * Composable for reactive chain management
 */
export function useChain(options: WalletComposableOptions = {}): ReactiveChainState {
  const { throwOnError = false } = options;
  const { wallet, isConnected } = useWallet(options);

  // Reactive state
  const isSwitching = ref(false);
  const switchError = ref<Error | null>(null);

  // Computed values
  const currentChain = computed(() => {
    if (!wallet.value) return null;

    const walletState = wallet.value.getState();
    return walletState.currentChain || null;
  });

  const supportedChains = computed(() => {
    if (!wallet.value) return [];

    const walletState = wallet.value.getState();
    return walletState.supportedChains || [];
  });

  const isEVM = computed(() => {
    const chain = currentChain.value;
    return chain ? chain.type === 'evm' : false;
  });

  const isSolana = computed(() => {
    const chain = currentChain.value;
    return chain ? chain.type === 'solana' : false;
  });

  /**
   * Switch to a specific chain
   */
  const switchChain = async (chainId: string): Promise<void> => {
    if (!wallet.value) {
      const error = new Error('Wallet not available');
      switchError.value = error;
      if (throwOnError) throw error;
      return;
    }

    if (!isConnected.value) {
      const error = new Error('Wallet not connected');
      switchError.value = error;
      if (throwOnError) throw error;
      return;
    }

    try {
      isSwitching.value = true;
      switchError.value = null;

      // Find the target chain
      const targetChain = supportedChains.value.find(chain => chain.id === chainId);
      if (!targetChain) {
        throw new Error(`Chain ${chainId} not supported`);
      }

      // Switch chain based on type
      if (targetChain.type === 'evm') {
        await switchEVMChain(chainId);
      } else if (targetChain.type === 'solana') {
        await switchSolanaChain(chainId);
      } else {
        throw new Error(`Unsupported chain type: ${targetChain.type}`);
      }

      isSwitching.value = false;
    } catch (error) {
      const chainError = error instanceof Error ? error : new Error('Chain switch failed');
      switchError.value = chainError;
      isSwitching.value = false;

      if (throwOnError) {
        throw chainError;
      }
    }
  };

  /**
   * Switch EVM chain
   */
  const switchEVMChain = async (chainId: string): Promise<void> => {
    if (!wallet.value) return;

    const provider = (wallet.value as any).getEthereumProvider();
    if (!provider) {
      throw new Error('EVM provider not available');
    }

    try {
      // Try to switch to the chain
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainId.startsWith('0x') ? chainId : `0x${parseInt(chainId).toString(16)}` }]
      });
    } catch (error: any) {
      // If chain doesn't exist, we might need to add it
      if (error.code === 4902) {
        const chainInfo = getChainInfo(chainId);
        if (chainInfo) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [chainInfo]
          });
        } else {
          throw new Error(`Chain ${chainId} configuration not found`);
        }
      } else {
        throw error;
      }
    }
  };

  /**
   * Switch Solana chain
   */
  const switchSolanaChain = async (chainId: string): Promise<void> => {
    if (!wallet.value) return;

    // For Solana, we just emit the chain change event
    // since Solana wallets typically connect to one cluster at a time
    wallet.value.emit('chainChanged', { chainId });
  };

  /**
   * Get chain information for adding to wallet
   */
  const getChainInfo = (chainId: string) => {
    const chainConfigs: Record<string, any> = {
      '1': {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io/']
      },
      '137': {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/']
      },
      '56': {
        chainId: '0x38',
        chainName: 'BSC Mainnet',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: ['https://bsc-dataseed1.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com/']
      }
    };

    return chainConfigs[chainId];
  };

  /**
   * Get chain display name
   */
  const getChainName = (chainId?: string): string => {
    const chain = chainId ?
      supportedChains.value.find(c => c.id === chainId) :
      currentChain.value;

    return chain?.name || 'Unknown Chain';
  };

  /**
   * Get chain native currency
   */
  const getNativeCurrency = (chainId?: string): string => {
    const chain = chainId ?
      supportedChains.value.find(c => c.id === chainId) :
      currentChain.value;

    if (!chain) return 'Unknown';

    // Return native currency based on chain
    switch (chain.id) {
      case '1':
      case 'ethereum':
        return 'ETH';
      case '137':
      case 'polygon':
        return 'MATIC';
      case '56':
      case 'bsc':
        return 'BNB';
      case 'mainnet-beta':
      case 'testnet':
      case 'devnet':
        return 'SOL';
      default:
        return chain.type === 'evm' ? 'ETH' : 'SOL';
    }
  };

  /**
   * Check if chain is testnet
   */
  const isTestnet = (chainId?: string): boolean => {
    const chain = chainId ?
      supportedChains.value.find(c => c.id === chainId) :
      currentChain.value;

    if (!chain) return false;

    const testnetChains = ['testnet', 'devnet', 'goerli', 'sepolia', 'mumbai'];
    return testnetChains.some(testnet => chain.id.includes(testnet));
  };

  /**
   * Get chain by ID
   */
  const getChain = (chainId: string): SupportedChain | undefined => {
    return supportedChains.value.find(chain => chain.id === chainId);
  };

  /**
   * Check if chain is supported
   */
  const isChainSupported = (chainId: string): boolean => {
    return getChain(chainId) !== undefined;
  };

  /**
   * Get EVM chains only
   */
  const getEVMChains = (): SupportedChain[] => {
    return supportedChains.value.filter(chain => chain.type === 'evm');
  };

  /**
   * Get Solana chains only
   */
  const getSolanaChains = (): SupportedChain[] => {
    return supportedChains.value.filter(chain => chain.type === 'solana');
  };

  /**
   * Format chain ID for display
   */
  const formatChainId = (chainId?: string): string => {
    const id = chainId || currentChain.value?.id;
    if (!id) return '';

    // For EVM chains, show hex format
    if (id.match(/^\d+$/)) {
      const num = parseInt(id);
      return `${id} (0x${num.toString(16)})`;
    }

    return id;
  };

  return {
    currentChain,
    supportedChains,
    switchChain,
    isSwitching,
    switchError,
    isEVM,
    isSolana,
    // Additional utility methods
    getChainName,
    getNativeCurrency,
    isTestnet,
    getChain,
    isChainSupported,
    getEVMChains,
    getSolanaChains,
    formatChainId
  };
}

/**
 * Composable for chain-specific operations
 */
export function useChainOperations() {
  const { wallet, isConnected } = useWallet();
  const { currentChain, isEVM, isSolana } = useChain();

  /**
   * Get current block number (EVM only)
   */
  const getBlockNumber = async (): Promise<number | null> => {
    if (!wallet.value || !isConnected.value || !isEVM.value) {
      return null;
    }

    try {
      const provider = (wallet.value as any).getEthereumProvider();
      if (provider) {
        const blockNumber = await provider.request({
          method: 'eth_blockNumber'
        });
        return parseInt(blockNumber, 16);
      }
    } catch (error) {
      console.warn('Failed to get block number:', error);
    }

    return null;
  };

  /**
   * Get gas price (EVM only)
   */
  const getGasPrice = async (): Promise<string | null> => {
    if (!wallet.value || !isConnected.value || !isEVM.value) {
      return null;
    }

    try {
      const provider = (wallet.value as any).getEthereumProvider();
      if (provider) {
        return await provider.request({
          method: 'eth_gasPrice'
        });
      }
    } catch (error) {
      console.warn('Failed to get gas price:', error);
    }

    return null;
  };

  /**
   * Get network ID
   */
  const getNetworkId = async (): Promise<string | null> => {
    if (!wallet.value || !isConnected.value) {
      return null;
    }

    if (isEVM.value) {
      try {
        const provider = (wallet.value as any).getEthereumProvider();
        if (provider) {
          return await provider.request({
            method: 'net_version'
          });
        }
      } catch (error) {
        console.warn('Failed to get network ID:', error);
      }
    }

    return currentChain.value?.id || null;
  };

  /**
   * Check if chain is connected
   */
  const isChainConnected = (): boolean => {
    return wallet.value !== null &&
           isConnected.value &&
           currentChain.value !== null;
  };

  return {
    getBlockNumber,
    getGasPrice,
    getNetworkId,
    isChainConnected
  };
}