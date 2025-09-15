import React from 'react'
import { useWallet, useAccount, useChain } from '@arenaentertainment/headless-wallet-react'
import {
  Wallet,
  User,
  Network,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { clsx } from 'clsx'

export const WalletStatus: React.FC = () => {
  const { isConnected, isConnecting, connect, disconnect, accounts } = useWallet()
  const { account } = useAccount()
  const { chain } = useChain()

  const getStatusIcon = () => {
    if (isConnecting) return <Clock className="h-4 w-4 text-warning-500 animate-spin" />
    if (isConnected) return <CheckCircle className="h-4 w-4 text-success-500" />
    return <XCircle className="h-4 w-4 text-gray-400" />
  }

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...'
    if (isConnected) return 'Connected'
    return 'Disconnected'
  }

  const getStatusColor = () => {
    if (isConnecting) return 'text-warning-600 dark:text-warning-400'
    if (isConnected) return 'text-success-600 dark:text-success-400'
    return 'text-gray-500 dark:text-gray-400'
  }

  return (
    <div className="space-y-3">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={clsx('text-sm font-medium', getStatusColor())}>
            {getStatusText()}
          </span>
        </div>

        {isConnected ? (
          <button
            onClick={disconnect}
            className="btn-sm btn-secondary"
            title="Disconnect wallet"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="btn-sm btn-primary"
            title="Connect wallet"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        )}
      </div>

      {/* Account Info */}
      {isConnected && account && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <User className="h-3 w-3" />
            <span>Active Account</span>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {account.label || `Account ${account.id}`}
              </span>
              <span className={clsx(
                'badge text-xs',
                account.type === 'evm' ? 'badge-primary' :
                account.type === 'solana' ? 'badge-warning' :
                'badge-success'
              )}>
                {account.type === 'dual_chain' ? 'Multi-Chain' : account.type.toUpperCase()}
              </span>
            </div>
            <div className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
              {account.address}
            </div>
          </div>
        </div>
      )}

      {/* Chain Info */}
      {isConnected && chain && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Network className="h-3 w-3" />
            <span>Active Chain</span>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {chain.name}
              </span>
              <span className="badge-gray text-xs">
                {chain.type === 'evm' ? `Chain ${chain.chainId}` : chain.cluster}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Summary */}
      {isConnected && accounts.length > 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Total Accounts: {accounts.length}</span>
            <Wallet className="h-3 w-3" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!isConnected && !isConnecting && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <AlertCircle className="h-3 w-3" />
          <span>Connect wallet to get started</span>
        </div>
      )}
    </div>
  )
}