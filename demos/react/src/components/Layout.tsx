import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useWallet } from '@arenaentertainment/wallet-mock-react'
import {
  Menu,
  X,
  Home,
  Users,
  Network,
  Send,
  Shield,
  Activity,
  Code,
  Wallet,
  Sun,
  Moon,
  Settings
} from 'lucide-react'
import { clsx } from 'clsx'
import { WalletStatus } from './WalletStatus'
import { useTheme } from '../hooks/useTheme'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Overview', href: '/', icon: Home },
  { name: 'Accounts', href: '/accounts', icon: Users },
  { name: 'Chains', href: '/chains', icon: Network },
  { name: 'Transactions', href: '/transactions', icon: Send },
  { name: 'Security', href: '/security', icon: Shield },
  { name: 'Performance', href: '/performance', icon: Activity },
  { name: 'Playground', href: '/playground', icon: Code },
]

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isConnected } = useWallet()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const currentPage = navigation.find(item => item.href === location.pathname)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Wallet className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Wallet Mock
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  React Demo
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Wallet status */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <WalletStatus />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    )}
                  />
                  {item.name}
                </NavLink>
              )
            })}
          </nav>

          {/* Theme toggle and settings */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              <button
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Page title */}
            <div className="flex items-center gap-2">
              {currentPage && (
                <>
                  <currentPage.icon className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {currentPage.name}
                  </h2>
                </>
              )}
            </div>

            {/* Connection status indicator */}
            <div className="flex items-center gap-2">
              <div className={clsx(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-success-500' : 'bg-gray-400'
              )} />
              <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}