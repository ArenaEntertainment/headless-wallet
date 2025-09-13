<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Chain Management
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Manage and switch between different blockchain networks
      </p>
    </div>

    <div v-if="!isConnected" class="text-center py-12">
      <Network class="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Wallet Not Connected
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Please connect your wallet to manage chains.
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- Current Chain Info -->
      <div v-if="currentChain" class="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
        <div class="card-header">
          <div class="flex items-center gap-2">
            <Activity class="h-5 w-5 text-primary-600" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Currently Active Chain
            </h2>
          </div>
        </div>
        <div class="card-content">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chain Name
                </label>
                <div class="flex items-center gap-2">
                  <Globe v-if="currentChain.type === 'evm'" class="h-5 w-5 text-blue-600" />
                  <Zap v-else class="h-5 w-5 text-purple-600" />
                  <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ currentChain.name }}
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chain Type
                </label>
                <span :class="[
                  'badge',
                  currentChain.type === 'evm' ? 'badge-primary' : 'badge-warning'
                ]">
                  {{ currentChain.type.toUpperCase() }}
                </span>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ currentChain.type === 'evm' ? 'Chain ID' : 'Cluster' }}
                </label>
                <span class="font-mono text-gray-900 dark:text-gray-100">
                  {{ currentChain.type === 'evm' ? currentChain.chainId : currentChain.cluster }}
                </span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                RPC Endpoint
              </label>
              <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <code class="text-sm text-gray-900 dark:text-gray-100 break-all">
                  {{ currentChain.rpcUrl || 'Default RPC' }}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chain Information -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chain Information
          </h2>
        </div>
        <div class="card-content">
          <div class="text-center py-8">
            <Network class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Chain Management
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Chain switching and network management features are available through the wallet interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWallet, useChain } from '@arenaentertainment/wallet-mock-vue'
import {
  Network,
  Activity,
  Globe,
  Zap
} from 'lucide-vue-next'

const { isConnected } = useWallet()
const { currentChain } = useChain()
</script>