<template>
  <div class="space-y-8">
    <!-- Hero Section -->
    <div class="text-center py-12">
      <div class="flex justify-center mb-6">
        <div class="p-4 bg-primary-100 dark:bg-primary-900 rounded-full">
          <Wallet class="h-12 w-12 text-primary-600" />
        </div>
      </div>

      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Welcome to <span class="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Wallet Mock</span>
      </h1>

      <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
        A comprehensive demonstration of the wallet-mock library featuring multi-chain support,
        advanced security, and production-ready components for Vue.js applications.
      </p>

      <button
        v-if="!isConnected"
        @click="connect()"
        class="btn-primary btn-lg inline-flex items-center gap-2"
      >
        <Zap class="h-5 w-5" />
        Get Started - Connect Wallet
        <ArrowRight class="h-4 w-4" />
      </button>

      <div v-else class="inline-flex items-center gap-2 text-success-600 dark:text-success-400">
        <CheckCircle class="h-5 w-5" />
        <span class="font-medium">Wallet Connected Successfully!</span>
      </div>
    </div>

    <!-- Stats Section -->
    <div v-if="isConnected" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="card"
      >
        <div class="card-content">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ stat.label }}
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {{ stat.value }}
              </p>
            </div>
            <div :class="['p-3 rounded-full bg-gray-100 dark:bg-gray-800', stat.color]">
              <component :is="stat.icon" class="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Current Account Info -->
    <div v-if="isConnected && currentAccount" class="card">
      <div class="card-header">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Active Account
        </h2>
      </div>
      <div class="card-content">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Details
            </label>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Label:</span>
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ currentAccount.label || `Account ${currentAccount.id}` }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                <span :class="[
                  'badge',
                  currentAccount.type === 'evm' ? 'badge-primary' :
                  currentAccount.type === 'solana' ? 'badge-warning' :
                  'badge-success'
                ]">
                  {{ currentAccount.type === 'dual_chain' ? 'Multi-Chain' : currentAccount.type.toUpperCase() }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">ID:</span>
                <span class="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {{ currentAccount.id }}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <code class="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                {{ currentAccount.address }}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="space-y-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Explore Features
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          Discover the powerful capabilities of the wallet-mock library
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <router-link
          v-for="feature in features"
          :key="feature.title"
          :to="feature.link"
          class="card hover:shadow-lg transition-shadow group"
        >
          <div class="card-content">
            <div class="flex items-start gap-4">
              <div :class="['p-3 rounded-lg', feature.bgColor]">
                <component :is="feature.icon" :class="['h-6 w-6', feature.color]" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 transition-colors">
                  {{ feature.title }}
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  {{ feature.description }}
                </p>
                <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                  Learn More
                  <ArrowRight class="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Get Started Section -->
    <div v-if="!isConnected" class="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
      <div class="card-content text-center">
        <Lock class="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Ready to Explore?
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Connect your mock wallet to start exploring all the features and capabilities
          of the wallet-mock library.
        </p>
        <button
          @click="connect()"
          class="btn-primary inline-flex items-center gap-2"
        >
          <Wallet class="h-4 w-4" />
          Connect Mock Wallet
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWallet, useAccount, useChain } from '@arenaentertainment/wallet-mock-vue'
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
} from 'lucide-vue-next'

const { isConnected, accounts, connect } = useWallet()
const { currentAccount } = useAccount()
const { currentChain } = useChain()

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

const stats = computed(() => [
  {
    label: 'Total Accounts',
    value: accounts.value.length,
    icon: Users,
    color: 'text-blue-600'
  },
  {
    label: 'Active Chain',
    value: currentChain.value?.name || 'None',
    icon: Network,
    color: 'text-green-600'
  },
  {
    label: 'Status',
    value: isConnected.value ? 'Connected' : 'Disconnected',
    icon: isConnected.value ? CheckCircle : Wallet,
    color: isConnected.value ? 'text-success-600' : 'text-gray-600'
  }
])
</script>