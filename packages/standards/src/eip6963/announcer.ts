import { logger } from '@arenaentertainment/wallet-mock-shared';
import type {
  EIP6963ProviderInfo,
  EIP6963ProviderDetail,
  EIP6963AnnounceProviderEvent,
  EIP6963RequestProviderEvent,
  WalletAnnouncerConfig
} from './types.js';
import type { EthereumProvider } from '../eip1193/types.js';

/**
 * EIP-6963 Wallet Announcer
 * Handles wallet discovery according to EIP-6963 standard
 */
export class EIP6963WalletAnnouncer {
  private config: WalletAnnouncerConfig;
  private eventTarget: EventTarget;
  private isAnnouncing = false;

  constructor(config: WalletAnnouncerConfig) {
    this.config = config;
    this.eventTarget = config.eventTarget || (typeof window !== 'undefined' ? window : global);

    if (config.autoRespond !== false) {
      this.startListening();
    }
  }

  /**
   * Start listening for provider requests
   */
  startListening(): void {
    if (this.isAnnouncing) return;

    this.isAnnouncing = true;
    this.eventTarget.addEventListener(
      'eip6963:requestProvider',
      this.handleProviderRequest.bind(this) as EventListener
    );

    // Announce immediately when starting
    this.announce();

    logger.info('EIP-6963 wallet announcer started', {
      name: this.config.info.name,
      uuid: this.config.info.uuid
    });
  }

  /**
   * Stop listening for provider requests
   */
  stopListening(): void {
    if (!this.isAnnouncing) return;

    this.isAnnouncing = false;
    this.eventTarget.removeEventListener(
      'eip6963:requestProvider',
      this.handleProviderRequest.bind(this) as EventListener
    );

    logger.info('EIP-6963 wallet announcer stopped', {
      name: this.config.info.name
    });
  }

  /**
   * Announce the wallet provider
   */
  announce(): void {
    const detail: EIP6963ProviderDetail = {
      info: { ...this.config.info },
      provider: this.config.provider
    };

    const announceEvent = new CustomEvent('eip6963:announceProvider', {
      detail
    }) as EIP6963AnnounceProviderEvent;

    this.eventTarget.dispatchEvent(announceEvent);

    logger.debug('EIP-6963 wallet announced', {
      name: this.config.info.name,
      uuid: this.config.info.uuid
    });
  }

  /**
   * Update provider info
   */
  updateInfo(info: Partial<EIP6963ProviderInfo>): void {
    this.config.info = { ...this.config.info, ...info };

    if (this.isAnnouncing) {
      this.announce();
    }

    logger.info('EIP-6963 provider info updated', { info: this.config.info });
  }

  /**
   * Update the provider instance
   */
  updateProvider(provider: EthereumProvider): void {
    this.config.provider = provider;

    if (this.isAnnouncing) {
      this.announce();
    }

    logger.info('EIP-6963 provider instance updated');
  }

  /**
   * Get current provider detail
   */
  getProviderDetail(): EIP6963ProviderDetail {
    return {
      info: { ...this.config.info },
      provider: this.config.provider
    };
  }

  /**
   * Handle provider request events
   */
  private handleProviderRequest(event: EIP6963RequestProviderEvent): void {
    logger.debug('EIP-6963 provider request received');
    this.announce();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopListening();
    logger.info('EIP-6963 wallet announcer destroyed');
  }
}

/**
 * Utility function to create a standard wallet announcer
 */
export function createWalletAnnouncer(
  info: EIP6963ProviderInfo,
  provider: EthereumProvider,
  options: Partial<WalletAnnouncerConfig> = {}
): EIP6963WalletAnnouncer {
  return new EIP6963WalletAnnouncer({
    info,
    provider,
    autoRespond: true,
    ...options
  });
}

/**
 * Utility function to generate a UUID for wallet identification
 */
export function generateWalletUUID(): string {
  // Simple UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Predefined wallet info templates
 */
export const WalletInfoTemplates = {
  mockWallet: (uuid?: string): EIP6963ProviderInfo => ({
    uuid: uuid || generateWalletUUID(),
    name: 'Mock Wallet',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwN0FGRiIvPgo8cGF0aCBkPSJNOCAxMkgyNFYyMEg4VjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
    rdns: 'com.arenaentertainment.wallet-mock'
  }),

  metamaskMock: (uuid?: string): EIP6963ProviderInfo => ({
    uuid: uuid || generateWalletUUID(),
    name: 'MetaMask Mock',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGNjY1MkEiLz4KPHBhdGggZD0iTTggMTJIMjRWMjBIOFYxMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    rdns: 'io.metamask.mock'
  })
};