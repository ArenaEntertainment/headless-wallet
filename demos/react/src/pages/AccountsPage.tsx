import React, { useState } from 'react'
import { useWallet, useAccount, useAccounts } from '@arenaentertainment/headless-wallet-react'
import {
  Users,
  Plus,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  User,
  Wallet,
  Switch
} from 'lucide-react'
import { clsx } from 'clsx'

const AccountsPage: React.FC = () => {
  const { isConnected } = useWallet()
  const { account: activeAccount, switchAccount } = useAccount()
  const { accounts, createAccount, deleteAccount } = useAccounts()
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const handleCreateAccount = async (type: 'evm' | 'solana' | 'dual_chain') => {
    try {
      await createAccount({ type, label: `${type.toUpperCase()} Account` })
    } catch (error) {
      console.error('Failed to create account:', error)
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      try {
        await deleteAccount(accountId)
      } catch (error) {
        console.error('Failed to delete account:', error)
      }
    }
  }

  const handleSwitchAccount = async (accountId: string) => {
    try {
      await switchAccount(accountId)
    } catch (error) {
      console.error('Failed to switch account:', error)
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Wallet Not Connected
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to manage accounts.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Account Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, manage, and switch between multiple blockchain accounts
          </p>
        </div>

        {/* Create Account Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCreateAccount('evm')}
            className="btn-primary btn-sm inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            EVM Account
          </button>
          <button
            onClick={() => handleCreateAccount('solana')}
            className="btn-secondary btn-sm inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Solana Account
          </button>
          <button
            onClick={() => handleCreateAccount('dual_chain')}
            className="btn-success btn-sm inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Multi-Chain
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {accounts.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Account</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {activeAccount ? activeAccount.label || 'Unnamed' : 'None'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Account Types</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {new Set(accounts.map(acc => acc.type)).size}
                </p>
              </div>
              <Eye className="h-8 w-8 text-warning-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Your Accounts ({accounts.length})
        </h2>

        {accounts.length === 0 ? (
          <div className="card">
            <div className="card-content text-center py-12">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Accounts Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first account to get started with blockchain interactions.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleCreateAccount('dual_chain')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Multi-Chain Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {accounts.map((account) => {
              const isActive = activeAccount?.id === account.id

              return (
                <div
                  key={account.id}
                  className={clsx(
                    'card transition-all',
                    isActive && 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  <div className="card-content">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Account Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={clsx(
                            'p-2 rounded-lg',
                            account.type === 'evm' ? 'bg-blue-100 dark:bg-blue-900' :
                            account.type === 'solana' ? 'bg-purple-100 dark:bg-purple-900' :
                            'bg-green-100 dark:bg-green-900'
                          )}>
                            <User className={clsx(
                              'h-5 w-5',
                              account.type === 'evm' ? 'text-blue-600' :
                              account.type === 'solana' ? 'text-purple-600' :
                              'text-green-600'
                            )} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {account.label || `Account ${account.id}`}
                              </h3>
                              {isActive && (
                                <span className="badge-success text-xs">Active</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={clsx(
                                'badge text-xs',
                                account.type === 'evm' ? 'badge-primary' :
                                account.type === 'solana' ? 'badge-warning' :
                                'badge-success'
                              )}>
                                {account.type === 'dual_chain' ? 'Multi-Chain' : account.type.toUpperCase()}
                              </span>

                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {account.id}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Address
                              </p>
                              <code className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                                {account.address}
                              </code>
                            </div>

                            <button
                              onClick={() => handleCopyAddress(account.address)}
                              className="ml-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              title="Copy address"
                            >
                              {copiedAddress === account.address ? (
                                <CheckCircle className="h-4 w-4 text-success-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {!isActive && (
                              <button
                                onClick={() => handleSwitchAccount(account.id)}
                                className="btn-primary btn-sm inline-flex items-center gap-2"
                              >
                                <Switch className="h-3 w-3" />
                                Switch To
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="btn-error btn-sm inline-flex items-center gap-2"
                            disabled={isActive}
                            title={isActive ? 'Cannot delete active account' : 'Delete account'}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountsPage