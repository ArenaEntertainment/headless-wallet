import React, { useState, useEffect } from 'react'
import { useWallet, useAccount } from '@arenaentertainment/wallet-mock-react'
import {
  Send,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  ExternalLink
} from 'lucide-react'
import { clsx } from 'clsx'

interface Transaction {
  id: string
  type: 'sent' | 'received'
  amount: string
  token: string
  to: string
  from: string
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: Date
  hash: string
  gasUsed?: string
  gasPrice?: string
}

const TransactionsPage: React.FC = () => {
  const { isConnected } = useWallet()
  const { account } = useAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  // Mock transaction data for demo
  useEffect(() => {
    if (isConnected && account) {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'sent',
          amount: '0.1',
          token: 'ETH',
          to: '0x742d35Cc4e7c1b5CaE7b2eF0F8d7D3a5b8a1f9c0',
          from: account.address,
          status: 'confirmed',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          gasUsed: '21000',
          gasPrice: '20'
        },
        {
          id: '2',
          type: 'received',
          amount: '50.0',
          token: 'USDC',
          to: account.address,
          from: '0x8ba1f109551bD432803012645Hac136c22bDe436',
          status: 'confirmed',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
        },
        {
          id: '3',
          type: 'sent',
          amount: '1.5',
          token: 'SOL',
          to: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          from: account.address,
          status: 'pending',
          timestamp: new Date(Date.now() - 1000 * 60 * 2),
          hash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456'
        }
      ]
      setTransactions(mockTransactions)
    }
  }, [isConnected, account])

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopiedHash(hash)
      setTimeout(() => setCopiedHash(null), 2000)
    } catch (err) {
      console.error('Failed to copy hash:', err)
    }
  }

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-warning-500 animate-spin" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-success-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-error-500" />
    }
  }

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return 'text-warning-600 dark:text-warning-400'
      case 'confirmed':
        return 'text-success-600 dark:text-success-400'
      case 'failed':
        return 'text-error-600 dark:text-error-400'
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Send className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Wallet Not Connected
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to view transaction history.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Transaction History
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your transaction history and manage blockchain operations
        </p>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {transactions.length}
                </p>
              </div>
              <Send className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {transactions.filter(tx => tx.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {transactions.filter(tx => tx.status === 'confirmed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Transactions
          </h2>
          <button className="btn-primary btn-sm">
            Send Transaction
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="card">
            <div className="card-content text-center py-12">
              <Send className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Transactions Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You haven't made any transactions yet. Send your first transaction to get started.
              </p>
              <button className="btn-primary">
                Send First Transaction
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="card">
                <div className="card-content">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Transaction Type Icon */}
                      <div className={clsx(
                        'p-2 rounded-lg',
                        transaction.type === 'sent'
                          ? 'bg-red-100 dark:bg-red-900'
                          : 'bg-green-100 dark:bg-green-900'
                      )}>
                        {transaction.type === 'sent' ? (
                          <ArrowUpRight className={clsx(
                            'h-5 w-5',
                            transaction.type === 'sent' ? 'text-red-600' : 'text-green-600'
                          )} />
                        ) : (
                          <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {transaction.type === 'sent' ? 'Sent' : 'Received'} {transaction.amount} {transaction.token}
                          </h3>
                          {getStatusIcon(transaction.status)}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            {transaction.type === 'sent' ? 'To:' : 'From:'} {formatAddress(
                              transaction.type === 'sent' ? transaction.to : transaction.from
                            )}
                          </span>
                          <span>•</span>
                          <span className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </span>
                          <span>•</span>
                          <span>{formatTime(transaction.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyHash(transaction.hash)}
                        className="btn-ghost btn-sm"
                        title="Copy transaction hash"
                      >
                        {copiedHash === transaction.hash ? (
                          <CheckCircle className="h-4 w-4 text-success-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        className="btn-ghost btn-sm"
                        title="View on blockchain explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Transaction Hash:</span>
                        <div className="font-mono text-gray-900 dark:text-gray-100 break-all">
                          {formatAddress(transaction.hash)}
                        </div>
                      </div>

                      {transaction.gasUsed && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Gas Used:</span>
                          <div className="text-gray-900 dark:text-gray-100">
                            {transaction.gasUsed} ({transaction.gasPrice} gwei)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionsPage