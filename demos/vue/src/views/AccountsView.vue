<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Account Management
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Create, manage, and switch between multiple blockchain accounts
      </p>
    </div>

    <div v-if="!isConnected" class="text-center py-12">
      <Wallet class="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Wallet Not Connected
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Please connect your wallet to manage accounts.
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- Account Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card">
          <div class="card-content">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Total Accounts</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {{ accounts.length }}
                </p>
              </div>
              <Users class="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-content">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Active Account</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {{ currentAccount ? currentAccount.label || 'Unnamed' : 'None' }}
                </p>
              </div>
              <CheckCircle class="h-8 w-8 text-success-600" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-content">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Account Types</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {{ new Set(accounts.map(acc => acc.type)).size }}
                </p>
              </div>
              <Eye class="h-8 w-8 text-warning-600" />
            </div>
          </div>
        </div>
      </div>

      <!-- Accounts List -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Your Accounts ({{ accounts.length }})
        </h2>

        <div v-if="accounts.length === 0" class="card">
          <div class="card-content text-center py-12">
            <User class="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Accounts Yet
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Create your first account to get started with blockchain interactions.
            </p>
          </div>
        </div>

        <div v-else class="grid gap-4">
          <div
            v-for="account in accounts"
            :key="account.id"
            :class="[
              'card transition-all',
              currentAccount?.id === account.id && 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
            ]"
          >
            <div class="card-content">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-3">
                    <div :class="[
                      'p-2 rounded-lg',
                      account.type === 'evm' ? 'bg-blue-100 dark:bg-blue-900' :
                      account.type === 'solana' ? 'bg-purple-100 dark:bg-purple-900' :
                      'bg-green-100 dark:bg-green-900'
                    ]">
                      <User :class="[
                        'h-5 w-5',
                        account.type === 'evm' ? 'text-blue-600' :
                        account.type === 'solana' ? 'text-purple-600' :
                        'text-green-600'
                      ]" />
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {{ account.label || `Account ${account.id}` }}
                        </h3>
                        <span v-if="currentAccount?.id === account.id" class="badge-success text-xs">
                          Active
                        </span>
                      </div>

                      <div class="flex items-center gap-2">
                        <span :class="[
                          'badge text-xs',
                          account.type === 'evm' ? 'badge-primary' :
                          account.type === 'solana' ? 'badge-warning' :
                          'badge-success'
                        ]">
                          {{ account.type === 'dual_chain' ? 'Multi-Chain' : account.type.toUpperCase() }}
                        </span>

                        <span class="text-xs text-gray-500 dark:text-gray-400">
                          ID: {{ account.id }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-3">
                    <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Address
                    </p>
                    <code class="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                      {{ account.address }}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWallet, useAccount } from '@arenaentertainment/wallet-mock-vue'
import {
  Users,
  CheckCircle,
  Eye,
  User,
  Wallet
} from 'lucide-vue-next'

const { isConnected, accounts } = useWallet()
const { currentAccount } = useAccount()
</script>