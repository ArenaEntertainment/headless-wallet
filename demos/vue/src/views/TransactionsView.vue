<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Transaction History
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        View your transaction history and manage blockchain operations
      </p>
    </div>

    <div v-if="!isConnected" class="text-center py-12">
      <Send class="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Wallet Not Connected
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Please connect your wallet to view transaction history.
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- Transaction Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card">
          <div class="card-content">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
              </div>
              <Send class="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-content">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
              </div>
              <Clock class="h-8 w-8 text-warning-600" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-content">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
              </div>
              <CheckCircle class="h-8 w-8 text-success-600" />
            </div>
          </div>
        </div>
      </div>

      <!-- No Transactions State -->
      <div class="card">
        <div class="card-content text-center py-12">
          <Send class="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Transactions Yet
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            You haven't made any transactions yet. Send your first transaction to get started.
          </p>
          <button class="btn-primary">
            Send First Transaction
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWallet } from '@arenaentertainment/wallet-mock-vue'
import {
  Send,
  Clock,
  CheckCircle
} from 'lucide-vue-next'

const { isConnected } = useWallet()
</script>