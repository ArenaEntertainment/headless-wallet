/**
 * @fileoverview Wallet helper utilities for Playwright tests
 *
 * This module provides helper functions for common wallet operations
 * and test scenarios in Playwright tests.
 */

import type { Page, Locator } from '@playwright/test';
import type { AccountConfig, ChainType } from '@arenaentertainment/wallet-mock-shared';

/**
 * Common wallet interaction helpers
 */
export class WalletHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for wallet to be available in the page
   */
  async waitForWallet(chainType: ChainType = 'evm', timeout: number = 5000): Promise<void> {
    const checkWallet = (type: ChainType) => {
      if (type === 'evm') {
        return window.ethereum && typeof window.ethereum.request === 'function';
      } else if (type === 'solana') {
        return window.solana && typeof window.solana.connect === 'function';
      }
      return false;
    };

    await this.page.waitForFunction(checkWallet, chainType, { timeout });
  }

  /**
   * Connect to wallet from the page
   */
  async connectWallet(chainType: ChainType = 'evm'): Promise<void> {
    if (chainType === 'evm') {
      await this.page.evaluate(async () => {
        if (window.ethereum) {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
      });
    } else if (chainType === 'solana') {
      await this.page.evaluate(async () => {
        if (window.solana && window.solana.connect) {
          await window.solana.connect();
        }
      });
    }
  }

  /**
   * Disconnect wallet from the page
   */
  async disconnectWallet(chainType: ChainType = 'evm'): Promise<void> {
    if (chainType === 'evm') {
      // Most EVM wallets don't have a disconnect method, but we can simulate it
      await this.page.evaluate(() => {
        if (window.ethereum && (window.ethereum as any).__WALLET_MOCK__) {
          (window.ethereum as any).disconnect?.();
        }
      });
    } else if (chainType === 'solana') {
      await this.page.evaluate(async () => {
        if (window.solana && window.solana.disconnect) {
          await window.solana.disconnect();
        }
      });
    }
  }

  /**
   * Switch to a different chain
   */
  async switchChain(chainId: string, chainType: ChainType = 'evm'): Promise<void> {
    if (chainType === 'evm') {
      await this.page.evaluate(async (id) => {
        if (window.ethereum) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: id }],
          });
        }
      }, chainId);
    } else if (chainType === 'solana') {
      // Solana chain switching would be implementation-specific
      await this.page.evaluate((cluster) => {
        if (window.solana && (window.solana as any).switchCluster) {
          (window.solana as any).switchCluster(cluster);
        }
      }, chainId);
    }
  }

  /**
   * Get current account address
   */
  async getCurrentAccount(chainType: ChainType = 'evm'): Promise<string | null> {
    if (chainType === 'evm') {
      return await this.page.evaluate(async () => {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          return accounts[0] || null;
        }
        return null;
      });
    } else if (chainType === 'solana') {
      return await this.page.evaluate(() => {
        if (window.solana && window.solana.publicKey) {
          return window.solana.publicKey.toString();
        }
        return null;
      });
    }
    return null;
  }

  /**
   * Sign a message
   */
  async signMessage(message: string, chainType: ChainType = 'evm'): Promise<string> {
    if (chainType === 'evm') {
      return await this.page.evaluate(async (msg) => {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length === 0) {
            throw new Error('No accounts available');
          }
          return await window.ethereum.request({
            method: 'personal_sign',
            params: [msg, accounts[0]],
          });
        }
        throw new Error('Ethereum wallet not available');
      }, message);
    } else if (chainType === 'solana') {
      return await this.page.evaluate(async (msg) => {
        if (window.solana && window.solana.signMessage) {
          const encodedMessage = new TextEncoder().encode(msg);
          const signature = await window.solana.signMessage(encodedMessage, 'utf8');
          return Array.from(signature.signature).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        throw new Error('Solana wallet not available');
      }, message);
    }
    throw new Error(`Unsupported chain type: ${chainType}`);
  }

  /**
   * Send a transaction
   */
  async sendTransaction(
    to: string,
    value: string,
    chainType: ChainType = 'evm'
  ): Promise<string> {
    if (chainType === 'evm') {
      return await this.page.evaluate(async (params) => {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length === 0) {
            throw new Error('No accounts available');
          }
          return await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: accounts[0],
              to: params.to,
              value: params.value,
            }],
          });
        }
        throw new Error('Ethereum wallet not available');
      }, { to, value });
    } else if (chainType === 'solana') {
      // Solana transaction sending would be more complex and specific to the transaction type
      return await this.page.evaluate(async (params) => {
        if (window.solana && window.solana.signAndSendTransaction) {
          // This is a simplified example - real Solana transactions need proper transaction objects
          throw new Error('Solana transaction sending not implemented in this example');
        }
        throw new Error('Solana wallet not available');
      }, { to, value });
    }
    throw new Error(`Unsupported chain type: ${chainType}`);
  }

  /**
   * Check if wallet is connected
   */
  async isWalletConnected(chainType: ChainType = 'evm'): Promise<boolean> {
    if (chainType === 'evm') {
      return await this.page.evaluate(async () => {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          return accounts.length > 0;
        }
        return false;
      });
    } else if (chainType === 'solana') {
      return await this.page.evaluate(() => {
        return !!(window.solana && window.solana.isConnected);
      });
    }
    return false;
  }

  /**
   * Get wallet balance (simplified)
   */
  async getBalance(chainType: ChainType = 'evm'): Promise<string> {
    if (chainType === 'evm') {
      return await this.page.evaluate(async () => {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length === 0) {
            throw new Error('No accounts available');
          }
          return await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest'],
          });
        }
        throw new Error('Ethereum wallet not available');
      });
    } else if (chainType === 'solana') {
      return await this.page.evaluate(async () => {
        if (window.solana && window.solana.getBalance) {
          return await window.solana.getBalance();
        }
        throw new Error('Solana wallet not available or getBalance not supported');
      });
    }
    throw new Error(`Unsupported chain type: ${chainType}`);
  }

  /**
   * Listen for wallet events
   */
  async onWalletEvent(
    eventName: string,
    chainType: ChainType = 'evm'
  ): Promise<void> {
    if (chainType === 'evm') {
      await this.page.evaluate((event) => {
        if (window.ethereum) {
          window.ethereum.on(event, (...args: any[]) => {
            console.log(`Wallet event ${event}:`, args);
          });
        }
      }, eventName);
    } else if (chainType === 'solana') {
      await this.page.evaluate((event) => {
        if (window.solana && window.solana.on) {
          window.solana.on(event, (...args: any[]) => {
            console.log(`Solana wallet event ${event}:`, args);
          });
        }
      }, eventName);
    }
  }
}

/**
 * Wallet interaction utilities
 */
export const walletInteractions = {
  /**
   * Click connect button with common selectors
   */
  async clickConnect(page: Page): Promise<void> {
    const connectSelectors = [
      'button:has-text("Connect")',
      'button:has-text("Connect Wallet")',
      '[data-testid="connect-wallet"]',
      '[data-testid="wallet-connect"]',
      '.connect-wallet',
      '.wallet-connect',
      'button[aria-label="Connect wallet"]',
    ];

    for (const selector of connectSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          return;
        }
      } catch {
        // Try next selector
      }
    }

    throw new Error('Connect button not found');
  },

  /**
   * Select wallet from list
   */
  async selectWallet(page: Page, walletName: string = 'MetaMask'): Promise<void> {
    const walletSelectors = [
      `button:has-text("${walletName}")`,
      `[data-testid="${walletName.toLowerCase()}"]`,
      `[data-wallet="${walletName.toLowerCase()}"]`,
      `.wallet-option:has-text("${walletName}")`,
    ];

    for (const selector of walletSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          return;
        }
      } catch {
        // Try next selector
      }
    }

    throw new Error(`Wallet option "${walletName}" not found`);
  },

  /**
   * Handle wallet approval modal
   */
  async approveConnection(page: Page): Promise<void> {
    const approveSelectors = [
      'button:has-text("Connect")',
      'button:has-text("Approve")',
      'button:has-text("Allow")',
      'button:has-text("Confirm")',
      '[data-testid="approve"]',
      '[data-testid="confirm"]',
      '.approve-button',
      '.confirm-button',
    ];

    for (const selector of approveSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          return;
        }
      } catch {
        // Try next selector
      }
    }

    // If no explicit approval button, just wait a bit for auto-approval
    await page.waitForTimeout(1000);
  },

  /**
   * Reject connection
   */
  async rejectConnection(page: Page): Promise<void> {
    const rejectSelectors = [
      'button:has-text("Reject")',
      'button:has-text("Cancel")',
      'button:has-text("Deny")',
      '[data-testid="reject"]',
      '[data-testid="cancel"]',
      '.reject-button',
      '.cancel-button',
    ];

    for (const selector of rejectSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          return;
        }
      } catch {
        // Try next selector
      }
    }

    throw new Error('Reject button not found');
  },

  /**
   * Wait for wallet connection status
   */
  async waitForConnectionStatus(
    page: Page,
    connected: boolean,
    timeout: number = 5000
  ): Promise<void> {
    await page.waitForFunction(
      (expectedConnected) => {
        const isConnected = !!(
          (window.ethereum && window.ethereum.selectedAddress) ||
          (window.solana && window.solana.isConnected)
        );
        return isConnected === expectedConnected;
      },
      connected,
      { timeout }
    );
  },
};

/**
 * Create account configuration helpers
 */
export const accountHelpers = {
  /**
   * Create EVM-only account
   */
  createEVMAccount(chainIds: string[] = ['1'], name?: string): AccountConfig {
    return {
      type: 'evm_only',
      name,
      evm: { chainIds },
    };
  },

  /**
   * Create Solana-only account
   */
  createSolanaAccount(clusters: string[] = ['mainnet-beta'], name?: string): AccountConfig {
    return {
      type: 'solana_only',
      name,
      solana: { clusters },
    };
  },

  /**
   * Create dual-chain account
   */
  createDualChainAccount(
    chainIds: string[] = ['1'],
    clusters: string[] = ['mainnet-beta'],
    name?: string
  ): AccountConfig {
    return {
      type: 'dual_chain',
      name,
      evm: { chainIds },
      solana: { clusters },
    };
  },

  /**
   * Create multiple test accounts
   */
  createTestAccounts(count: number, type: 'evm_only' | 'solana_only' | 'dual_chain' = 'evm_only'): AccountConfig[] {
    const accounts: AccountConfig[] = [];

    for (let i = 0; i < count; i++) {
      const name = `Test Account ${i + 1}`;

      switch (type) {
        case 'evm_only':
          accounts.push(this.createEVMAccount(['1'], name));
          break;
        case 'solana_only':
          accounts.push(this.createSolanaAccount(['mainnet-beta'], name));
          break;
        case 'dual_chain':
          accounts.push(this.createDualChainAccount(['1'], ['mainnet-beta'], name));
          break;
      }
    }

    return accounts;
  },
};