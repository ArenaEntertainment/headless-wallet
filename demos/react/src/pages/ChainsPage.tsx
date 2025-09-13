import React, { useState } from 'react'
import { useWallet, useChain, useChains } from '@arenaentertainment/wallet-mock-react'
import {
  Network,
  Globe,
  Zap,
  Settings,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Activity
} from 'lucide-react'
import { clsx } from 'clsx'

const ChainsPage: React.FC = () => {
  const { isConnected } = useWallet()
  const { chain: activeChain, switchChain } = useChain()
  const { chains } = useChains()
  const [switching, setSwitching] = useState<string | null>(null)

  const handleSwitchChain = async (chainId: string) => {
    setSwitching(chainId)
    try {
      await switchChain(chainId)
    } catch (error) {
      console.error('Failed to switch chain:', error)
    } finally {
      setSwitching(null)
    }
  }

  const getChainIcon = (type: string) => {
    switch (type) {
      case 'evm':
        return <Globe className="h-5 w-5 text-blue-600" />
      case 'solana':
        return <Zap className="h-5 w-5 text-purple-600" />
      default:
        return <Network className="h-5 w-5 text-gray-600" />
    }
  }

  const getChainStatus = (chainId: string) => {
    if (activeChain?.chainId === chainId || activeChain?.cluster === chainId) {
      return { status: 'active', label: 'Active', color: 'text-success-600' }
    }
    return { status: 'available', label: 'Available', color: 'text-gray-600' }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Network className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Wallet Not Connected
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to manage chains.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Chain Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and switch between different blockchain networks
        </p>
      </div>

      {/* Current Chain Info */}
      {activeChain && (
        <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Currently Active Chain
              </h2>
            </div>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chain Name
                  </label>
                  <div className="flex items-center gap-2">
                    {getChainIcon(activeChain.type)}
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {activeChain.name}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chain Type
                  </label>
                  <span className={clsx(
                    'badge',
                    activeChain.type === 'evm' ? 'badge-primary' : 'badge-warning'
                  )}>
                    {activeChain.type.toUpperCase()}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {activeChain.type === 'evm' ? 'Chain ID' : 'Cluster'}
                  </label>
                  <span className="font-mono text-gray-900 dark:text-gray-100">
                    {activeChain.type === 'evm' ? activeChain.chainId : activeChain.cluster}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RPC Endpoint
                </label>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <code className="text-sm text-gray-900 dark:text-gray-100 break-all">
                    {activeChain.rpcUrl || 'Default RPC'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Chains */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Available Networks
        </h2>

        {chains.length === 0 ? (
          <div className="card">
            <div className="card-content text-center py-8">
              <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Chains Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No blockchain networks are currently configured.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {/* EVM Chains */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                EVM Networks
              </h3>
              <div className="grid gap-3">
                {chains
                  .filter(chain => chain.type === 'evm')
                  .map((chain) => {
                    const chainStatus = getChainStatus(chain.chainId!)
                    const isActive = chainStatus.status === 'active'
                    const isSwitching = switching === chain.chainId

                    return (
                      <div
                        key={chain.chainId}
                        className={clsx(
                          'card transition-all',
                          isActive && 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        )}
                      >
                        <div className="card-content">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Globe className="h-5 w-5 text-blue-600" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {chain.name}
                                  </h4>
                                  {isActive && (
                                    <CheckCircle className="h-4 w-4 text-success-500" />
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <span>Chain ID: {chain.chainId}</span>
                                  <span>•</span>
                                  <span className={chainStatus.color}>{chainStatus.label}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {chain.rpcUrl && (
                                <button
                                  className="btn-ghost btn-sm"
                                  title="View RPC details"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                              )}

                              {!isActive && (
                                <button
                                  onClick={() => handleSwitchChain(chain.chainId!)}
                                  disabled={isSwitching}
                                  className="btn-primary btn-sm"
                                >
                                  {isSwitching ? 'Switching...' : 'Switch'}
                                </button>
                              )}

                              {isActive && (
                                <span className="btn-success btn-sm cursor-default">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Solana Chains */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                Solana Networks
              </h3>
              <div className="grid gap-3">
                {chains
                  .filter(chain => chain.type === 'solana')
                  .map((chain) => {
                    const chainStatus = getChainStatus(chain.cluster!)
                    const isActive = chainStatus.status === 'active'
                    const isSwitching = switching === chain.cluster

                    return (
                      <div
                        key={chain.cluster}
                        className={clsx(
                          'card transition-all',
                          isActive && 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        )}
                      >
                        <div className="card-content">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <Zap className="h-5 w-5 text-purple-600" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {chain.name}
                                  </h4>
                                  {isActive && (
                                    <CheckCircle className="h-4 w-4 text-success-500" />
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <span>Cluster: {chain.cluster}</span>
                                  <span>•</span>
                                  <span className={chainStatus.color}>{chainStatus.label}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {chain.rpcUrl && (
                                <button
                                  className="btn-ghost btn-sm"
                                  title="View RPC details"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                              )}

                              {!isActive && (
                                <button
                                  onClick={() => handleSwitchChain(chain.cluster!)}
                                  disabled={isSwitching}
                                  className="btn-primary btn-sm"
                                >
                                  {isSwitching ? 'Switching...' : 'Switch'}
                                </button>
                              )}

                              {isActive && (
                                <span className="btn-success btn-sm cursor-default">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chain Configuration Help */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="card-content">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Chain Configuration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                The available chains are configured through the wallet provider. In a real application,
                you would configure these based on your supported networks.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                <strong>EVM:</strong> Ethereum, Polygon, BSC, etc. •{' '}
                <strong>Solana:</strong> Mainnet, Devnet, Testnet
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChainsPage