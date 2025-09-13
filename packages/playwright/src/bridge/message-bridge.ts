/**
 * @fileoverview Message bridge for secure communication between Node.js and browser
 *
 * This module handles the secure message passing between the Node.js test environment
 * and the browser context where the mock wallet is installed.
 */

import type { Page } from '@playwright/test';
import {
  generateSecureToken,
  generateSessionId,
  validateSecurityToken,
  createMessageHash,
  validateMessageIntegrity,
  sanitiseSensitiveData,
  securityRateLimiter,
  validateEnvironment
} from './security.js';
import type {
  BridgeMessage,
  BridgeResponse,
  BridgeMessageType,
  BridgeSetupConfig,
  PlaywrightSecurityConfig,
  BridgeError
} from '../types.js';

/**
 * Default bridge configuration
 */
const DEFAULT_BRIDGE_CONFIG: BridgeSetupConfig = {
  security: {
    level: 'testing' as const,
    checkProduction: true,
    validateContext: true,
    secureCleanup: true,
    maxInstances: 10,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },
  sessionTimeout: 30 * 60 * 1000,
  maxMessageSize: 10 * 1024 * 1024, // 10MB
  enableLogging: true,
  logLevel: 'info',
};

/**
 * Message bridge class for secure communication
 */
export class MessageBridge {
  private page: Page;
  private config: BridgeSetupConfig;
  private sessionId: string;
  private securityToken: string;
  private messageCounter = 0;
  private pendingMessages = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(page: Page, config: Partial<BridgeSetupConfig> = {}) {
    this.page = page;
    this.config = { ...DEFAULT_BRIDGE_CONFIG, ...config };
    this.sessionId = generateSessionId();
    this.securityToken = generateSecureToken();

    // Validate environment security
    validateEnvironment(this.config.security);
  }

  /**
   * Initialize the message bridge
   */
  async initialize(): Promise<void> {
    try {
      await this.setupBrowserBridge();
      await this.performHandshake();
      this.log('info', 'Message bridge initialized successfully', {
        sessionId: this.sessionId,
        securityLevel: this.config.security.level
      });
    } catch (error) {
      this.log('error', 'Failed to initialize message bridge', { error });
      throw new BridgeError('Bridge initialization failed', { error });
    }
  }

  /**
   * Send a message to the browser and wait for response
   */
  async sendMessage<TPayload, TResponse>(
    type: BridgeMessageType,
    payload: TPayload,
    timeout: number = 5000
  ): Promise<TResponse> {
    // Rate limiting check
    const rateLimitKey = `${this.sessionId}-${type}`;
    if (!securityRateLimiter.isAllowed(rateLimitKey)) {
      throw new BridgeError('Rate limit exceeded for message type', { type });
    }

    const messageId = this.generateMessageId();
    const message: BridgeMessage<TPayload> = {
      id: messageId,
      type,
      payload,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      securityToken: this.securityToken,
    };

    // Validate message size
    const messageSize = JSON.stringify(message).length;
    if (messageSize > this.config.maxMessageSize) {
      throw new BridgeError('Message size exceeds limit', {
        size: messageSize,
        limit: this.config.maxMessageSize
      });
    }

    this.log('debug', 'Sending message', {
      messageId,
      type,
      payload: sanitiseSensitiveData(payload)
    });

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new BridgeError('Message timeout', { messageId, type, timeout }));
      }, timeout);

      this.pendingMessages.set(messageId, {
        resolve,
        reject,
        timeout: timeoutId,
      });

      this.page.evaluate((msg) => {
        // Browser-side message handling
        if (window.__walletMockBridge) {
          window.__walletMockBridge.handleMessage(msg);
        } else {
          throw new Error('Wallet mock bridge not available in browser');
        }
      }, message).catch(error => {
        clearTimeout(timeoutId);
        this.pendingMessages.delete(messageId);
        reject(new BridgeError('Failed to send message to browser', { error, messageId }));
      });
    });
  }

  /**
   * Setup browser-side bridge code
   */
  private async setupBrowserBridge(): Promise<void> {
    await this.page.addInitScript((config) => {
      // Browser-side bridge implementation
      class BrowserBridge {
        private config = config;
        private messageHandlers = new Map();

        constructor() {
          this.setupMessageHandling();
        }

        private setupMessageHandling() {
          // Listen for responses from the page
          window.addEventListener('message', (event) => {
            if (event.data && event.data.__walletMockResponse) {
              this.handleResponse(event.data.response);
            }
          });
        }

        async handleMessage(message) {
          try {
            // Validate message structure
            if (!this.validateMessage(message)) {
              throw new Error('Invalid message structure');
            }

            // Process the message based on type
            const response = await this.processMessage(message);

            // Send response back to Node.js
            this.sendResponse(message.id, { success: true, data: response });
          } catch (error) {
            this.sendResponse(message.id, {
              success: false,
              error: {
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                stack: error.stack,
              }
            });
          }
        }

        private validateMessage(message) {
          if (!message || typeof message !== 'object') return false;
          if (!message.id || !message.type || !message.sessionId) return false;
          if (!message.securityToken || message.securityToken.length < 16) return false;
          return true;
        }

        private async processMessage(message) {
          const { type, payload } = message;

          switch (type) {
            case 'install_wallet':
              return await this.handleInstallWallet(payload);
            case 'remove_wallet':
              return await this.handleRemoveWallet(payload);
            case 'update_config':
              return await this.handleUpdateConfig(payload);
            case 'get_state':
              return await this.handleGetState(payload);
            case 'cleanup_all':
              return await this.handleCleanupAll(payload);
            case 'security_check':
              return await this.handleSecurityCheck(payload);
            case 'heartbeat':
              return { timestamp: Date.now(), status: 'alive' };
            default:
              throw new Error(`Unknown message type: ${type}`);
          }
        }

        private async handleInstallWallet(payload) {
          // Dynamic import of wallet-mock
          const { createWallet } = await import('@arenaentertainment/wallet-mock');

          // Create wallet instance
          const wallet = await createWallet(payload.config);

          // Store wallet instance
          if (!window.__walletMockInstances) {
            window.__walletMockInstances = new Map();
          }

          window.__walletMockInstances.set(payload.instanceId, {
            wallet,
            installedAt: Date.now(),
            config: payload.config,
          });

          // Install wallet providers in window
          await this.installProviders(wallet, payload);

          return {
            instanceId: payload.instanceId,
            installedAt: Date.now(),
            supportedChains: this.getSupportedChains(wallet),
          };
        }

        private async installProviders(wallet, payload) {
          // Install Ethereum provider if EVM chains are supported
          if (payload.chainTypes?.includes('evm') || !payload.chainTypes) {
            const { MockEthereumProvider } = await import('@arenaentertainment/wallet-mock-standards');
            window.ethereum = new MockEthereumProvider(wallet);
          }

          // Install Solana wallet if Solana chains are supported
          if (payload.chainTypes?.includes('solana') || !payload.chainTypes) {
            const { MockSolanaWallet } = await import('@arenaentertainment/wallet-mock-standards');

            if (!window.solana) window.solana = {};

            // Create wallet adapter
            const solanaWallet = new MockSolanaWallet(wallet);

            // Register with Solana wallet registry if available
            if (window.solana) {
              window.solana.isPhantom = true;
              Object.assign(window.solana, solanaWallet);
            }
          }
        }

        private getSupportedChains(wallet) {
          const state = wallet.getState();
          const chainTypes = new Set();

          state.accounts.forEach(account => {
            if ('evm' in account) chainTypes.add('evm');
            if ('solana' in account) chainTypes.add('solana');
          });

          return Array.from(chainTypes);
        }

        private async handleRemoveWallet(payload) {
          const instances = window.__walletMockInstances;
          if (!instances || !instances.has(payload.instanceId)) {
            throw new Error(`Wallet instance not found: ${payload.instanceId}`);
          }

          const instance = instances.get(payload.instanceId);

          // Clean up wallet
          if (instance.wallet && typeof instance.wallet.destroy === 'function') {
            await instance.wallet.destroy();
          }

          // Remove from window if it's the current instance
          if (window.ethereum && window.ethereum.__instanceId === payload.instanceId) {
            delete window.ethereum;
          }

          if (window.solana && window.solana.__instanceId === payload.instanceId) {
            delete window.solana;
          }

          instances.delete(payload.instanceId);

          return { removed: true };
        }

        private async handleUpdateConfig(payload) {
          const instances = window.__walletMockInstances;
          if (!instances || !instances.has(payload.instanceId)) {
            throw new Error(`Wallet instance not found: ${payload.instanceId}`);
          }

          const instance = instances.get(payload.instanceId);

          // Update wallet configuration
          if (instance.wallet && typeof instance.wallet.updateConfig === 'function') {
            await instance.wallet.updateConfig(payload.config);
          }

          return { updated: true };
        }

        private async handleGetState(payload) {
          const instances = window.__walletMockInstances;
          if (!instances || !instances.has(payload.instanceId)) {
            return null;
          }

          const instance = instances.get(payload.instanceId);
          return instance.wallet.getState();
        }

        private async handleCleanupAll() {
          const instances = window.__walletMockInstances;
          if (!instances) return { cleaned: 0 };

          let cleaned = 0;
          for (const [instanceId, instance] of instances.entries()) {
            try {
              if (instance.wallet && typeof instance.wallet.destroy === 'function') {
                await instance.wallet.destroy();
              }
              cleaned++;
            } catch (error) {
              console.warn(`Failed to cleanup wallet instance ${instanceId}:`, error);
            }
          }

          // Clear all instances
          instances.clear();

          // Remove global providers
          delete window.ethereum;
          if (window.solana) {
            delete window.solana;
          }

          return { cleaned };
        }

        private handleSecurityCheck() {
          return {
            origin: window.location.origin,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            hasInstances: !!(window.__walletMockInstances && window.__walletMockInstances.size > 0),
          };
        }

        private sendResponse(messageId, response) {
          // Use postMessage to send response back
          window.postMessage({
            __walletMockResponse: true,
            messageId,
            response: {
              ...response,
              messageId,
              timestamp: Date.now(),
            }
          }, '*');
        }

        private handleResponse(response) {
          // This would be handled by the Node.js side
          console.debug('Bridge response:', response);
        }
      }

      // Initialize browser bridge
      window.__walletMockBridge = new BrowserBridge();
    }, this.config);

    // Setup response listener
    await this.page.exposeFunction('__walletMockResponseHandler', (response: BridgeResponse) => {
      this.handleResponse(response);
    });

    // Inject response handler
    await this.page.addInitScript(() => {
      window.addEventListener('message', (event) => {
        if (event.data && event.data.__walletMockResponse) {
          if (window.__walletMockResponseHandler) {
            window.__walletMockResponseHandler(event.data.response);
          }
        }
      });
    });
  }

  /**
   * Perform initial handshake with browser
   */
  private async performHandshake(): Promise<void> {
    const response = await this.sendMessage('security_check', {}, 3000);

    this.log('debug', 'Handshake completed', { response });
  }

  /**
   * Handle response from browser
   */
  private handleResponse(response: BridgeResponse): void {
    const pending = this.pendingMessages.get(response.messageId);
    if (!pending) {
      this.log('warn', 'Received response for unknown message', { messageId: response.messageId });
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingMessages.delete(response.messageId);

    if (response.success) {
      pending.resolve(response.data);
    } else {
      const error = new BridgeError(
        response.error?.message || 'Unknown error',
        { code: response.error?.code, messageId: response.messageId }
      );
      pending.reject(error);
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${this.sessionId}-${++this.messageCounter}-${Date.now()}`;
  }

  /**
   * Log message with proper level
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: any): void {
    if (!this.config.enableLogging) return;

    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];

    if (messageLevel >= currentLevel) {
      const sanitisedContext = context ? sanitiseSensitiveData(context) : undefined;
      console[level](`[WalletMock Bridge] ${message}`, sanitisedContext);
    }
  }

  /**
   * Cleanup bridge resources
   */
  async cleanup(): Promise<void> {
    try {
      // Cancel pending messages
      for (const [messageId, pending] of this.pendingMessages.entries()) {
        clearTimeout(pending.timeout);
        pending.reject(new BridgeError('Bridge cleanup', { messageId }));
      }
      this.pendingMessages.clear();

      // Send cleanup message to browser
      await this.sendMessage('cleanup_all', {}, 5000);

      this.log('info', 'Bridge cleanup completed');
    } catch (error) {
      this.log('warn', 'Bridge cleanup failed', { error });
    }
  }

  /**
   * Get bridge session information
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      messageCount: this.messageCounter,
      pendingMessages: this.pendingMessages.size,
      config: this.config,
    };
  }
}