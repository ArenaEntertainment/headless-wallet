import { logger } from '@arenaentertainment/wallet-mock-shared';
import type {
  EIP6963ProviderDetail,
  EIP6963AnnounceProviderEvent,
  EIP6963RequestProviderEvent
} from './types.js';

/**
 * EIP-6963 Wallet Discovery Client
 * Discovers available wallets according to EIP-6963 standard
 */
export class EIP6963WalletDiscovery {
  private eventTarget: EventTarget;
  private discoveredWallets: Map<string, EIP6963ProviderDetail> = new Map();
  private isListening = false;
  private listeners: Set<(wallets: EIP6963ProviderDetail[]) => void> = new Set();

  constructor(eventTarget?: EventTarget) {
    this.eventTarget = eventTarget || (typeof window !== 'undefined' ? window : global);
  }

  /**
   * Start discovering wallets
   */
  startDiscovery(): void {
    if (this.isListening) return;

    this.isListening = true;

    // Listen for wallet announcements
    this.eventTarget.addEventListener(
      'eip6963:announceProvider',
      this.handleWalletAnnouncement.bind(this) as EventListener
    );

    // Request all available wallets
    this.requestProviders();

    logger.info('EIP-6963 wallet discovery started');
  }

  /**
   * Stop discovering wallets
   */
  stopDiscovery(): void {
    if (!this.isListening) return;

    this.isListening = false;

    this.eventTarget.removeEventListener(
      'eip6963:announceProvider',
      this.handleWalletAnnouncement.bind(this) as EventListener
    );

    logger.info('EIP-6963 wallet discovery stopped');
  }

  /**
   * Request providers to announce themselves
   */
  requestProviders(): void {
    const requestEvent = new Event('eip6963:requestProvider') as EIP6963RequestProviderEvent;
    this.eventTarget.dispatchEvent(requestEvent);

    logger.debug('EIP-6963 provider request dispatched');
  }

  /**
   * Get all discovered wallets
   */
  getDiscoveredWallets(): EIP6963ProviderDetail[] {
    return Array.from(this.discoveredWallets.values());
  }

  /**
   * Get a specific wallet by UUID
   */
  getWallet(uuid: string): EIP6963ProviderDetail | undefined {
    return this.discoveredWallets.get(uuid);
  }

  /**
   * Get a wallet by name
   */
  getWalletByName(name: string): EIP6963ProviderDetail | undefined {
    for (const wallet of this.discoveredWallets.values()) {
      if (wallet.info.name === name) {
        return wallet;
      }
    }
    return undefined;
  }

  /**
   * Get a wallet by RDNS
   */
  getWalletByRDNS(rdns: string): EIP6963ProviderDetail | undefined {
    for (const wallet of this.discoveredWallets.values()) {
      if (wallet.info.rdns === rdns) {
        return wallet;
      }
    }
    return undefined;
  }

  /**
   * Add a listener for wallet discoveries
   */
  onWalletsChanged(listener: (wallets: EIP6963ProviderDetail[]) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove a wallet discovery listener
   */
  removeWalletsListener(listener: (wallets: EIP6963ProviderDetail[]) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Clear all discovered wallets
   */
  clearWallets(): void {
    this.discoveredWallets.clear();
    this.notifyListeners();
    logger.info('Discovered wallets cleared');
  }

  /**
   * Handle wallet announcement events
   */
  private handleWalletAnnouncement(event: EIP6963AnnounceProviderEvent): void {
    const { detail } = event;
    const { info } = detail;

    logger.debug('Wallet announced', {
      name: info.name,
      uuid: info.uuid,
      rdns: info.rdns
    });

    // Store or update the wallet
    const existingWallet = this.discoveredWallets.get(info.uuid);

    if (!existingWallet || JSON.stringify(existingWallet.info) !== JSON.stringify(info)) {
      this.discoveredWallets.set(info.uuid, detail);
      this.notifyListeners();

      logger.info('Wallet discovered', {
        name: info.name,
        uuid: info.uuid,
        isUpdate: !!existingWallet
      });
    }
  }

  /**
   * Notify all listeners of wallet changes
   */
  private notifyListeners(): void {
    const wallets = this.getDiscoveredWallets();
    this.listeners.forEach(listener => {
      try {
        listener(wallets);
      } catch (error) {
        logger.error('Error in wallet discovery listener:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopDiscovery();
    this.clearWallets();
    this.listeners.clear();
    logger.info('EIP-6963 wallet discovery destroyed');
  }
}

/**
 * Utility function to discover wallets with a timeout
 */
export async function discoverWallets(
  timeout: number = 1000,
  eventTarget?: EventTarget
): Promise<EIP6963ProviderDetail[]> {
  const discovery = new EIP6963WalletDiscovery(eventTarget);

  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout;

    const cleanup = () => {
      discovery.destroy();
      if (timeoutId) clearTimeout(timeoutId);
    };

    // Start discovery
    discovery.startDiscovery();

    // Set timeout to resolve
    timeoutId = setTimeout(() => {
      const wallets = discovery.getDiscoveredWallets();
      cleanup();
      resolve(wallets);
    }, timeout);

    // Also resolve immediately if we find wallets quickly
    discovery.onWalletsChanged((wallets) => {
      if (wallets.length > 0) {
        cleanup();
        resolve(wallets);
      }
    });
  });
}

/**
 * Utility function to find a specific wallet by name
 */
export async function findWallet(
  name: string,
  timeout: number = 1000,
  eventTarget?: EventTarget
): Promise<EIP6963ProviderDetail | null> {
  const wallets = await discoverWallets(timeout, eventTarget);
  return wallets.find(wallet => wallet.info.name === name) || null;
}