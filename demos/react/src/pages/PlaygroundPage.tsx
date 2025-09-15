import React, { useState } from 'react'
import { useWallet, useAccount, useChain } from '@arenaentertainment/headless-wallet-react'
import {
  Code,
  Play,
  Copy,
  CheckCircle,
  Terminal,
  Book,
  Lightbulb
} from 'lucide-react'
import { clsx } from 'clsx'

const PlaygroundPage: React.FC = () => {
  const { isConnected, connect, disconnect, accounts } = useWallet()
  const { account, switchAccount } = useAccount()
  const { chain, switchChain, chains } = useChain()
  const [activeExample, setActiveExample] = useState('basic')
  const [executionResult, setExecutionResult] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState<string>('')

  const examples = {
    basic: {
      title: 'Basic Wallet Connection',
      description: 'Connect and disconnect wallet, check connection status',
      code: `// Connect to wallet
await connect()

// Check connection status
console.log('Connected:', isConnected)
console.log('Accounts:', accounts.length)

// Disconnect wallet
await disconnect()`,
      execute: async () => {
        if (isConnected) {
          await disconnect()
          return 'Wallet disconnected'
        } else {
          await connect()
          return `Wallet connected with ${accounts.length} accounts`
        }
      }
    },
    accounts: {
      title: 'Account Management',
      description: 'Create, switch, and manage multiple accounts',
      code: `// Get current account
const currentAccount = account

// Switch to different account
if (accounts.length > 1) {
  await switchAccount(accounts[1].id)
}

// Account information
console.log('Active account:', currentAccount?.address)
console.log('Account type:', currentAccount?.type)`,
      execute: async () => {
        if (!account) return 'No active account'

        if (accounts.length > 1) {
          const nextAccount = accounts.find(acc => acc.id !== account.id)
          if (nextAccount) {
            await switchAccount(nextAccount.id)
            return `Switched to account: ${nextAccount.address.slice(0, 10)}...`
          }
        }
        return `Current account: ${account.address.slice(0, 10)}... (${account.type})`
      }
    },
    chains: {
      title: 'Chain Operations',
      description: 'Switch between different blockchain networks',
      code: `// Get current chain
const currentChain = chain

// Switch chain
const evmChains = chains.filter(c => c.type === 'evm')
if (evmChains.length > 0) {
  await switchChain(evmChains[0].chainId!)
}

console.log('Active chain:', currentChain?.name)
console.log('Chain type:', currentChain?.type)`,
      execute: async () => {
        if (!chain) return 'No active chain'

        const otherChains = chains.filter(c =>
          (c.chainId && c.chainId !== chain.chainId) ||
          (c.cluster && c.cluster !== chain.cluster)
        )

        if (otherChains.length > 0) {
          const nextChain = otherChains[0]
          const identifier = nextChain.chainId || nextChain.cluster
          if (identifier) {
            await switchChain(identifier)
            return `Switched to chain: ${nextChain.name}`
          }
        }
        return `Current chain: ${chain.name} (${chain.type})`
      }
    },
    signing: {
      title: 'Message Signing',
      description: 'Sign messages and transactions',
      code: `// Sign a message
const message = "Hello, blockchain!"
const signature = await wallet.signMessage(message)

// Sign transaction (mock)
const transaction = {
  to: "0x742d35Cc4e7c1b5CaE7b2eF0F8d7D3a5b8a1f9c0",
  value: "0.1",
  data: "0x"
}
const txSignature = await wallet.signTransaction(transaction)

console.log('Message signature:', signature)
console.log('Transaction signature:', txSignature)`,
      execute: async () => {
        // Mock signing operation
        const message = "Hello from wallet-mock playground!"
        const mockSignature = `0x${'a'.repeat(64)}` // Mock signature

        return `Signed message: "${message}"\nSignature: ${mockSignature.slice(0, 20)}...`
      }
    },
    events: {
      title: 'Event Handling',
      description: 'Listen to wallet events and state changes',
      code: `// Listen to account changes
wallet.on('accountsChanged', (accounts) => {
  console.log('Accounts changed:', accounts)
})

// Listen to chain changes
wallet.on('chainChanged', (chainId) => {
  console.log('Chain changed:', chainId)
})

// Listen to connection changes
wallet.on('connect', ({ chainId }) => {
  console.log('Connected to chain:', chainId)
})

wallet.on('disconnect', (error) => {
  console.log('Disconnected:', error)
})`,
      execute: async () => {
        return 'Event listeners are set up. Try switching accounts or chains to see events in the console.'
      }
    }
  }

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(''), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleExecuteExample = async () => {
    const example = examples[activeExample as keyof typeof examples]
    try {
      const result = await example.execute()
      setExecutionResult(result)
    } catch (error) {
      setExecutionResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Interactive Playground
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore wallet-mock features with interactive code examples
        </p>
      </div>

      {/* Connection Status */}
      <div className={clsx(
        'card',
        isConnected
          ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
          : 'bg-gray-50 dark:bg-gray-800'
      )}>
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={clsx(
                'h-3 w-3 rounded-full',
                isConnected ? 'bg-success-500' : 'bg-gray-400'
              )} />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
              </span>
            </div>
            <button
              onClick={isConnected ? disconnect : connect}
              className={clsx(
                'btn-sm',
                isConnected ? 'btn-secondary' : 'btn-primary'
              )}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Examples List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Book className="h-5 w-5" />
                Examples
              </h2>
            </div>
            <div className="card-content p-0">
              <nav className="space-y-1">
                {Object.entries(examples).map(([key, example]) => (
                  <button
                    key={key}
                    onClick={() => setActiveExample(key)}
                    className={clsx(
                      'w-full text-left px-4 py-3 transition-colors',
                      activeExample === key
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-r-2 border-primary-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    <div className="font-medium">{example.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {example.description}
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Code and Execution */}
        <div className="lg:col-span-2 space-y-4">
          {/* Code Example */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {examples[activeExample as keyof typeof examples].title}
                </h3>
                <button
                  onClick={() => handleCopyCode(examples[activeExample as keyof typeof examples].code)}
                  className="btn-ghost btn-sm flex items-center gap-2"
                >
                  {copiedCode === examples[activeExample as keyof typeof examples].code ? (
                    <CheckCircle className="h-4 w-4 text-success-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </button>
              </div>
            </div>
            <div className="card-content">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {examples[activeExample as keyof typeof examples].description}
              </p>

              <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{examples[activeExample as keyof typeof examples].code}</code>
                </pre>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleExecuteExample}
                  disabled={!isConnected && activeExample !== 'basic'}
                  className="btn-primary flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Run Example
                </button>
              </div>
            </div>
          </div>

          {/* Execution Result */}
          {executionResult && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Execution Result
                </h3>
              </div>
              <div className="card-content">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {executionResult}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="card-content">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Playground Tips
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Open browser console to see detailed logs and events</li>
                    <li>• Try different examples to explore various wallet features</li>
                    <li>• Connect your wallet first to run most examples</li>
                    <li>• Check the Network tab to see mock API calls</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaygroundPage