/**
 * Logger utility for displaying formatted logs in the demo interface
 */
export class Logger {
  private container: HTMLElement | null
  private logs: Array<{ timestamp: Date; level: string; message: string }> = []

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)
  }

  /**
   * Log an info message
   */
  log(message: string, ...args: unknown[]): void {
    this.addLog('INFO', message, ...args)
    console.log(`[Wallet Demo] ${message}`, ...args)
  }

  /**
   * Log an error message
   */
  error(message: string, error?: unknown): void {
    this.addLog('ERROR', message, error)
    console.error(`[Wallet Demo] ${message}`, error)
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: unknown[]): void {
    this.addLog('WARN', message, ...args)
    console.warn(`[Wallet Demo] ${message}`, ...args)
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: unknown[]): void {
    this.addLog('DEBUG', message, ...args)
    console.debug(`[Wallet Demo] ${message}`, ...args)
  }

  /**
   * Add a log entry to the display and internal storage
   */
  private addLog(level: string, message: string, ...args: unknown[]): void {
    const timestamp = new Date()
    const logEntry = { timestamp, level, message }
    this.logs.push(logEntry)

    // Keep only the last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50)
    }

    this.updateDisplay()
  }

  /**
   * Update the log display in the DOM
   */
  private updateDisplay(): void {
    if (!this.container) return

    // Clear existing content
    this.container.innerHTML = ''

    // Add each log entry
    this.logs.forEach(log => {
      const logElement = document.createElement('div')
      logElement.className = 'flex items-start gap-2 py-1'

      const timestamp = this.formatTimestamp(log.timestamp)
      const levelColor = this.getLevelColor(log.level)

      logElement.innerHTML = `
        <span class="text-gray-500 text-xs">${timestamp}</span>
        <span class="text-xs font-medium ${levelColor}">[${log.level}]</span>
        <span class="text-gray-300 text-xs flex-1">${this.escapeHtml(log.message)}</span>
      `

      this.container.appendChild(logElement)
    })

    // Scroll to bottom
    this.container.scrollTop = this.container.scrollHeight
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * Get CSS class for log level color
   */
  private getLevelColor(level: string): string {
    switch (level) {
      case 'ERROR':
        return 'text-red-400'
      case 'WARN':
        return 'text-yellow-400'
      case 'INFO':
        return 'text-blue-400'
      case 'DEBUG':
        return 'text-gray-400'
      default:
        return 'text-gray-300'
    }
  }

  /**
   * Escape HTML characters in log messages
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = []
    this.updateDisplay()
    console.clear()
    this.log('📝 Logs cleared')
  }

  /**
   * Export logs as JSON
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Get logs count by level
   */
  getStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {}

    this.logs.forEach(log => {
      stats[log.level] = (stats[log.level] || 0) + 1
    })

    return stats
  }
}