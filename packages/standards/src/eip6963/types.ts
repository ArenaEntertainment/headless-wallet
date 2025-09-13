import type { EthereumProvider } from '../eip1193/types.js';

/**
 * EIP-6963 Wallet Discovery Types
 * https://eips.ethereum.org/EIPS/eip-6963
 */

/**
 * Wallet info structure as defined by EIP-6963
 */
export interface EIP6963ProviderInfo {
  /** Unique identifier for the wallet */
  uuid: string;
  /** Human-readable name of the wallet */
  name: string;
  /** URL-safe string for the wallet icon */
  icon: string;
  /** Optional description or additional info */
  rdns: string;
}

/**
 * Wallet provider detail combining provider and info
 */
export interface EIP6963ProviderDetail {
  /** The wallet provider info */
  info: EIP6963ProviderInfo;
  /** The actual EIP-1193 provider */
  provider: EthereumProvider;
}

/**
 * Event interfaces for EIP-6963
 */
export interface EIP6963AnnounceProviderEvent extends CustomEvent<EIP6963ProviderDetail> {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

export interface EIP6963RequestProviderEvent extends Event {
  type: 'eip6963:requestProvider';
}

/**
 * Window interface extension for EIP-6963 events
 */
declare global {
  interface WindowEventMap {
    'eip6963:requestProvider': EIP6963RequestProviderEvent;
    'eip6963:announceProvider': EIP6963AnnounceProviderEvent;
  }
}

/**
 * Configuration for wallet announcer
 */
export interface WalletAnnouncerConfig {
  /** Provider info */
  info: EIP6963ProviderInfo;
  /** EIP-1193 provider instance */
  provider: EthereumProvider;
  /** Whether to automatically respond to requests */
  autoRespond?: boolean;
  /** Custom event target (defaults to window) */
  eventTarget?: EventTarget;
}