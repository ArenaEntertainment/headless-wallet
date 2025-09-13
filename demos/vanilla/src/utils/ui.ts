/**
 * UI utility class for managing DOM elements and interactions
 */
export class WalletUI {
  /**
   * Update connection status indicator
   */
  updateConnectionStatus(status: 'connecting' | 'connected' | 'disconnected', text: string): void {
    const indicator = document.getElementById('status-indicator')
    const statusText = document.getElementById('status-text')
    const connectBtn = document.getElementById('connect-btn')

    if (indicator && statusText) {
      // Update indicator color
      indicator.className = `w-2 h-2 rounded-full ${
        status === 'connected' ? 'bg-green-500' :
        status === 'connecting' ? 'bg-yellow-500 pulse' :
        'bg-gray-400'
      }`

      // Update status text
      statusText.textContent = text
      statusText.className = `text-sm ${
        status === 'connected' ? 'text-green-600 dark:text-green-400' :
        status === 'connecting' ? 'text-yellow-600 dark:text-yellow-400' :
        'text-gray-600 dark:text-gray-400'
      }`
    }

    // Update connect button
    if (connectBtn) {
      if (status === 'connected') {
        connectBtn.textContent = 'Connected'
        connectBtn.className = 'inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg cursor-default'
        ;(connectBtn as HTMLButtonElement).disabled = true
      } else if (status === 'connecting') {
        connectBtn.textContent = 'Connecting...'
        connectBtn.className = 'inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white font-medium rounded-lg cursor-wait'
        ;(connectBtn as HTMLButtonElement).disabled = true
      } else {
        connectBtn.textContent = 'Connect Wallet'
        connectBtn.className = 'inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors'
        ;(connectBtn as HTMLButtonElement).disabled = false
      }
    }
  }

  /**
   * Show wallet information section
   */
  showWalletInfo(): void {
    const walletInfo = document.getElementById('wallet-info')
    if (walletInfo) {
      walletInfo.classList.remove('hidden')
      walletInfo.classList.add('fade-in')
    }
  }

  /**
   * Hide wallet information section
   */
  hideWalletInfo(): void {
    const walletInfo = document.getElementById('wallet-info')
    if (walletInfo) {
      walletInfo.classList.add('hidden')
      walletInfo.classList.remove('fade-in')
    }
  }

  /**
   * Show demo actions section
   */
  showDemoActions(): void {
    const demoActions = document.getElementById('demo-actions')
    if (demoActions) {
      demoActions.classList.remove('hidden')
      demoActions.classList.add('fade-in')
    }
  }

  /**
   * Hide demo actions section
   */
  hideDemoActions(): void {
    const demoActions = document.getElementById('demo-actions')
    if (demoActions) {
      demoActions.classList.add('hidden')
      demoActions.classList.remove('fade-in')
    }
  }

  /**
   * Show demo logs section
   */
  showDemoLogs(): void {
    const demoLogs = document.getElementById('demo-logs')
    if (demoLogs) {
      demoLogs.classList.remove('hidden')
      demoLogs.classList.add('fade-in')
    }
  }

  /**
   * Update account information display
   */
  updateAccountInfo(account: { type: string; id: string; address: string }): void {
    this.updateElement('account-type', this.formatAccountType(account.type))
    this.updateElement('account-id', account.id)
    this.updateElement('account-address', account.address)
  }

  /**
   * Format account type for display
   */
  private formatAccountType(type: string): string {
    switch (type) {
      case 'evm':
        return 'EVM'
      case 'solana':
        return 'Solana'
      case 'dual_chain':
        return 'Multi-Chain'
      default:
        return type.toUpperCase()
    }
  }

  /**
   * Update text content of an element by ID
   */
  updateElement(elementId: string, content: string): void {
    const element = document.getElementById(elementId)
    if (element) {
      element.textContent = content
    }
  }

  /**
   * Create a notification element
   */
  createNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): HTMLDivElement {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`

    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${message}</span>
        <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 5000)

    return notification
  }

  /**
   * Show a notification
   */
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = this.createNotification(message, type)
    document.body.appendChild(notification)

    // Trigger animation
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)'
      notification.style.opacity = '1'
    })
  }

  /**
   * Add loading state to a button
   */
  addLoadingState(buttonId: string): void {
    const button = document.getElementById(buttonId) as HTMLButtonElement
    if (button) {
      button.disabled = true
      const originalText = button.textContent
      button.textContent = 'Loading...'

      // Store original text for restoration
      button.dataset.originalText = originalText || ''

      // Add loading spinner
      const spinner = document.createElement('div')
      spinner.className = 'inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2'
      button.prepend(spinner)
    }
  }

  /**
   * Remove loading state from a button
   */
  removeLoadingState(buttonId: string): void {
    const button = document.getElementById(buttonId) as HTMLButtonElement
    if (button) {
      button.disabled = false

      // Remove spinner
      const spinner = button.querySelector('.animate-spin')
      if (spinner) {
        spinner.remove()
      }

      // Restore original text
      const originalText = button.dataset.originalText
      if (originalText) {
        button.textContent = originalText
        delete button.dataset.originalText
      }
    }
  }
}