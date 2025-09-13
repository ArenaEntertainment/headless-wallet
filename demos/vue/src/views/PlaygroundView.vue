<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Interactive Playground
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Explore wallet-mock features with interactive code examples
      </p>
    </div>

    <!-- Connection Status -->
    <div :class="[
      'card',
      isConnected
        ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
        : 'bg-gray-50 dark:bg-gray-800'
    ]">
      <div class="card-content">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div :class="[
              'h-3 w-3 rounded-full',
              isConnected ? 'bg-success-500' : 'bg-gray-400'
            ]" />
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ isConnected ? 'Wallet Connected' : 'Wallet Disconnected' }}
            </span>
          </div>
          <button
            @click="isConnected ? disconnect() : connect()"
            :class="[
              'btn-sm',
              isConnected ? 'btn-secondary' : 'btn-primary'
            ]"
          >
            {{ isConnected ? 'Disconnect' : 'Connect' }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Examples List -->
      <div class="lg:col-span-1">
        <div class="card">
          <div class="card-header">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Book class="h-5 w-5" />
              Examples
            </h2>
          </div>
          <div class="card-content p-0">
            <nav class="space-y-1">
              <button
                v-for="(example, key) in examples"
                :key="key"
                @click="activeExample = key"
                :class="[
                  'w-full text-left px-4 py-3 transition-colors',
                  activeExample === key
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-r-2 border-primary-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
              >
                <div class="font-medium">{{ example.title }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ example.description }}
                </div>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <!-- Code and Execution -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Code Example -->
        <div class="card">
          <div class="card-header">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Code class="h-5 w-5" />
                {{ examples[activeExample].title }}
              </h3>
              <button
                @click="copyCode"
                class="btn-ghost btn-sm flex items-center gap-2"
              >
                <CheckCircle v-if="codeCopied" class="h-4 w-4 text-success-500" />
                <Copy v-else class="h-4 w-4" />
                Copy
              </button>
            </div>
          </div>
          <div class="card-content">
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              {{ examples[activeExample].description }}
            </p>

            <div class="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
              <pre class="text-sm text-gray-100">
                <code>{{ examples[activeExample].code }}</code>
              </pre>
            </div>

            <div class="flex justify-end mt-4">
              <button
                @click="executeExample"
                :disabled="!isConnected && activeExample !== 'basic'"
                class="btn-primary flex items-center gap-2"
              >
                <Play class="h-4 w-4" />
                Run Example
              </button>
            </div>
          </div>
        </div>

        <!-- Execution Result -->
        <div v-if="executionResult" class="card">
          <div class="card-header">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Terminal class="h-5 w-5" />
              Execution Result
            </h3>
          </div>
          <div class="card-content">
            <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <pre class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{{ executionResult }}</pre>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div class="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div class="card-content">
            <div class="flex items-start gap-3">
              <Lightbulb class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Playground Tips
                </h3>
                <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWallet, useAccount } from '@arenaentertainment/wallet-mock-vue'
import {
  Code,
  Play,
  Copy,
  CheckCircle,
  Terminal,
  Book,
  Lightbulb
} from 'lucide-vue-next'

const { isConnected, connect, disconnect, accounts } = useWallet()
const { currentAccount } = useAccount()

const activeExample = ref('basic')
const executionResult = ref('')
const codeCopied = ref(false)

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
await disconnect()`
  },
  accounts: {
    title: 'Account Management',
    description: 'Get current account information',
    code: `// Get current account
const currentAccount = account

// Account information
console.log('Active account:', currentAccount?.address)
console.log('Account type:', currentAccount?.type)`
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
})`
  }
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(examples[activeExample.value].code)
    codeCopied.value = true
    setTimeout(() => {
      codeCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}

const executeExample = async () => {
  try {
    let result = ''

    switch (activeExample.value) {
      case 'basic':
        if (isConnected.value) {
          await disconnect()
          result = 'Wallet disconnected'
        } else {
          await connect()
          result = `Wallet connected with ${accounts.value.length} accounts`
        }
        break

      case 'accounts':
        if (!currentAccount.value) {
          result = 'No active account'
        } else {
          result = `Current account: ${currentAccount.value.address.slice(0, 10)}... (${currentAccount.value.type})`
        }
        break

      case 'events':
        result = 'Event listeners are set up. Try switching accounts or chains to see events in the console.'
        break

      default:
        result = 'Example executed successfully'
    }

    executionResult.value = result
  } catch (error) {
    executionResult.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
</script>