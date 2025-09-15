import React from 'react'
import { useWallet, useAccount, useChain } from '@arenaentertainment/headless-wallet-react'
import {
  Wallet,
  Users,
  Network,
  Shield,
  Activity,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  Lock
} from 'lucide-react'
import { clsx } from 'clsx'
import { Link } from 'react-router-dom'

const HomePage: React.FC = () => {
  const { isConnected, accounts, connect } = useWallet()
  const { account } = useAccount()
  const { chain } = useChain()

  const features = [
    {
      title: 'Multi-Chain Support',
      description: 'Support for both EVM and Solana chains in a single wallet interface',
      icon: Globe,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      link: '/chains'
    },
    {
      title: 'Account Management',
      description: 'Create and manage multiple accounts across different blockchain networks',
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900',
      link: '/accounts'
    },
    {
      title: 'Security First',
      description: 'Production-grade security with environment detection and threat protection',
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900',
      link: '/security'
    },
    {
      title: 'Performance Monitoring',
      description: 'Real-time performance metrics and monitoring for optimal user experience',
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      link: '/performance'
    }
  ]

  const stats = [
    {
      label: 'Total Accounts',
      value: accounts.length,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Active Chain',
      value: chain?.name || 'None',
      icon: Network,
      color: 'text-green-600'
    },
    {
      label: 'Status',
      value: isConnected ? 'Connected' : 'Disconnected',
      icon: isConnected ? CheckCircle : Wallet,
      color: isConnected ? 'text-success-600' : 'text-gray-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary-100 dark:bg-primary-900 rounded-full">
            <Wallet className="h-12 w-12 text-primary-600" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Welcome to <span className="gradient-text">Wallet Mock</span>
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
          A comprehensive demonstration of the wallet-mock library featuring multi-chain support,
          advanced security, and production-ready components for React applications.
        </p>

        {!isConnected ? (
          <button
            onClick={connect}
            className="btn-primary btn-lg inline-flex items-center gap-2"
          >
            <Zap className="h-5 w-5" />
            Get Started - Connect Wallet
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 text-success-600 dark:text-success-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Wallet Connected Successfully!</span>
          </div>
        )}
      </div>

      {/* Stats Section */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="card-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {stat.value}
                      </p>
                    </div>
                    <div className={clsx('p-3 rounded-full bg-gray-100 dark:bg-gray-800', stat.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Current Account Info */}
      {isConnected && account && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Active Account
            </h2>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Details
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Label:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {account.label || `Account ${account.id}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                    <span className={clsx(
                      'badge',
                      account.type === 'evm' ? 'badge-primary' :
                      account.type === 'solana' ? 'badge-warning' :
                      'badge-success'
                    )}>
                      {account.type === 'dual_chain' ? 'Multi-Chain' : account.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">ID:</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                      {account.id}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <code className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                    {account.address}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Explore Features
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discover the powerful capabilities of the wallet-mock library
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Link
                key={index}
                to={feature.link}
                className="card hover:shadow-lg transition-shadow group"
              >
                <div className="card-content">
                  <div className="flex items-start gap-4">
                    <div className={clsx('p-3 rounded-lg', feature.bgColor)}>
                      <Icon className={clsx('h-6 w-6', feature.color)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {feature.description}
                      </p>
                      <div className="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                        Learn More
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Get Started Section */}
      {!isConnected && (
        <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <div className="card-content text-center">
            <Lock className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Ready to Explore?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect your mock wallet to start exploring all the features and capabilities
              of the wallet-mock library.
            </p>
            <button
              onClick={connect}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              Connect Mock Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage