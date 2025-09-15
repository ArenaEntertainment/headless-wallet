/**
 * Session management for persistent wallet connections
 * Handles session storage, restoration, and expiry
 */
export class SessionManager {
  private static STORAGE_KEY = 'arena_wallet_session';
  private static SESSION_VERSION = '1.0.0';
  private sessionData: SessionData | null = null;

  /**
   * Save current session to storage
   */
  saveSession(data: {
    accounts: string[];
    chainId: string;
    permissions: string[];
    origin?: string;
  }): void {
    const session: SessionData = {
      version: SessionManager.SESSION_VERSION,
      accounts: data.accounts,
      chainId: data.chainId,
      permissions: data.permissions,
      origin: data.origin || (typeof window !== 'undefined' ? window.location.origin : ''),
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };

    this.sessionData = session;

    // Store in localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const encrypted = this.encryptSession(session);
        window.localStorage.setItem(SessionManager.STORAGE_KEY, encrypted);
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  }

  /**
   * Load session from storage
   */
  loadSession(): SessionData | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const encrypted = window.localStorage.getItem(SessionManager.STORAGE_KEY);
      if (!encrypted) {
        return null;
      }

      const session = this.decryptSession(encrypted);

      // Check version compatibility
      if (session.version !== SessionManager.SESSION_VERSION) {
        this.clearSession();
        return null;
      }

      // Check expiry
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      // Check origin (security measure)
      if (typeof window !== 'undefined' && session.origin !== window.location.origin) {
        console.warn('Session origin mismatch, clearing session');
        this.clearSession();
        return null;
      }

      this.sessionData = session;
      return session;
    } catch (error) {
      console.error('Failed to load session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.sessionData = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(SessionManager.STORAGE_KEY);
    }
  }

  /**
   * Extend session expiry
   */
  extendSession(hours: number = 24): void {
    if (this.sessionData) {
      this.sessionData.expiresAt = Date.now() + (hours * 60 * 60 * 1000);
      this.saveSession(this.sessionData);
    }
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    if (!this.sessionData) {
      return false;
    }

    return Date.now() < this.sessionData.expiresAt;
  }

  /**
   * Get current session data
   */
  getSession(): SessionData | null {
    if (this.isSessionValid()) {
      return this.sessionData;
    }
    return null;
  }

  /**
   * Simple encryption for session data (XOR with key)
   * Note: For production, use proper encryption like AES
   */
  private encryptSession(session: SessionData): string {
    const json = JSON.stringify(session);
    const key = this.getEncryptionKey();

    // Simple XOR encryption
    let encrypted = '';
    for (let i = 0; i < json.length; i++) {
      encrypted += String.fromCharCode(
        json.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }

    return btoa(encrypted); // Base64 encode
  }

  /**
   * Decrypt session data
   */
  private decryptSession(encrypted: string): SessionData {
    const decoded = atob(encrypted); // Base64 decode
    const key = this.getEncryptionKey();

    // XOR decryption
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }

    return JSON.parse(decrypted);
  }

  /**
   * Get encryption key (derived from origin and user agent)
   */
  private getEncryptionKey(): string {
    if (typeof window === 'undefined') {
      return 'default-key';
    }

    // Use origin and user agent as key components
    const origin = window.location.origin;
    const userAgent = window.navigator.userAgent;

    // Create a deterministic key
    return `${origin}-${userAgent}`.split('').reverse().join('');
  }

  /**
   * Handle permission changes
   */
  updatePermissions(permissions: string[]): void {
    if (this.sessionData) {
      this.sessionData.permissions = permissions;
      this.saveSession(this.sessionData);
    }
  }

  /**
   * Handle account changes
   */
  updateAccounts(accounts: string[]): void {
    if (this.sessionData) {
      this.sessionData.accounts = accounts;
      this.saveSession(this.sessionData);
    }
  }

  /**
   * Handle chain changes
   */
  updateChain(chainId: string): void {
    if (this.sessionData) {
      this.sessionData.chainId = chainId;
      this.saveSession(this.sessionData);
    }
  }
}

interface SessionData {
  version: string;
  accounts: string[];
  chainId: string;
  permissions: string[];
  origin: string;
  timestamp: number;
  expiresAt: number;
}

// Export singleton instance
export const sessionManager = new SessionManager();