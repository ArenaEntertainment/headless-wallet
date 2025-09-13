<template>
  <div class="space-y-3">
    <!-- Connection Status -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Clock v-if="isConnecting" class="h-4 w-4 text-warning-500 animate-spin" />
        <CheckCircle v-else-if="isConnected" class="h-4 w-4 text-success-500" />
        <XCircle v-else class="h-4 w-4 text-gray-400" />

        <span :class="[
          'text-sm font-medium',
          isConnecting ? 'text-warning-600 dark:text-warning-400' :
          isConnected ? 'text-success-600 dark:text-success-400' :
          'text-gray-500 dark:text-gray-400'
        ]">
          {{ statusText }}
        </span>
      </div>

      <button
        @click="isConnected ? disconnect() : connect()"
        :disabled="isConnecting"
        :class="[
          'btn-sm',
          isConnected ? 'btn-secondary' : 'btn-primary'
        ]"
        :title="isConnected ? 'Disconnect wallet' : 'Connect wallet'"
      >
        {{ isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect' }}
      </button>
    </div>

    <!-- Account Info -->
    <div v-if="isConnected && currentAccount" class="space-y-2">
      <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <User class="h-3 w-3" />
        <span>Active Account</span>
      </div>
      <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
            {{ currentAccount.label || `Account ${currentAccount.id}` }}
          </span>
          <span :class="[
            'badge text-xs',
            currentAccount.type === 'evm' ? 'badge-primary' :
            currentAccount.type === 'solana' ? 'badge-warning' :
            'badge-success'
          ]">
            {{ currentAccount.type === 'dual_chain' ? 'Multi-Chain' : currentAccount.type.toUpperCase() }}
          </span>
        </div>
        <div class="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
          {{ currentAccount.address }}
        </div>
      </div>
    </div>

    <!-- Chain Info -->
    <div v-if="isConnected && currentChain" class="space-y-2">
      <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <Network class="h-3 w-3" />
        <span>Active Chain</span>
      </div>
      <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
            {{ currentChain.name }}
          </span>
          <span class="badge-gray text-xs">
            {{ currentChain.type === 'evm' ? `Chain ${currentChain.chainId}` : currentChain.cluster }}
          </span>
        </div>
      </div>
    </div>

    <!-- Accounts Summary -->
    <div v-if="isConnected && accounts.length > 0" class="pt-2 border-t border-gray-200 dark:border-gray-600">
      <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>Total Accounts: {{ accounts.length }}</span>
        <Wallet class="h-3 w-3" />
      </div>
    </div>

    <!-- Error State -->
    <div v-if="!isConnected && !isConnecting" class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <AlertCircle class="h-3 w-3" />
      <span>Connect wallet to get started</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHeadlessWallet, useEvmWallet } from '@arenaentertainment/wallet-mock-vue'
import {
  Wallet,
  User,
  Network,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-vue-next'

const headlessWallet = useHeadlessWallet()
const evmWallet = useEvmWallet()
const isConnecting = ref(false)

const isConnected = computed(() => headlessWallet.isConnected)

const statusText = computed(() => {
  if (isConnecting.value) return 'Connecting...'
  if (isConnected.value) return 'Connected'
  return 'Disconnected'
})

const currentAccount = computed(() => {
  if (headlessWallet.activeEvmAccount) {
    return {
      id: 1,
      address: headlessWallet.activeEvmAccount,
      type: 'evm',
      label: 'EVM Account'
    }
  }
  if (headlessWallet.activeSolanaAccount) {
    return {
      id: 1,
      address: headlessWallet.activeSolanaAccount,
      type: 'solana',
      label: 'Solana Account'
    }
  }
  return null
})

const currentChain = computed(() => {
  if (headlessWallet.hasEVM && headlessWallet.chainId) {
    return {
      name: 'Ethereum',
      type: 'evm',
      chainId: headlessWallet.chainId
    }
  }
  return null
})

const accounts = computed(() => {
  const allAccounts = []
  if (headlessWallet.evmAccounts) {
    allAccounts.push(...headlessWallet.evmAccounts.map(addr => ({ address: addr, type: 'evm' })))
  }
  if (headlessWallet.solanaAccounts) {
    allAccounts.push(...headlessWallet.solanaAccounts.map(addr => ({ address: addr, type: 'solana' })))
  }
  return allAccounts
})

const connect = async () => {
  isConnecting.value = true
  try {
    if (headlessWallet.hasEVM) {
      await evmWallet.connect()
    }
  } catch (error) {
    console.error('Failed to connect:', error)
  } finally {
    isConnecting.value = false
  }
}

const disconnect = async () => {
  // For now, we'll just set isConnected to false
  // In a real implementation, you'd call the disconnect methods
  console.log('Disconnect not implemented in demo')
}
</script>