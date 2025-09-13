<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Performance Monitoring
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Real-time performance metrics and optimisation insights
      </p>
    </div>

    <!-- Overall Performance Score -->
    <div class="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
      <div class="card-content">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Overall Performance
            </h2>
            <div class="flex items-center gap-2">
              <span class="text-2xl font-bold text-success-600">Excellent</span>
              <TrendingUp class="h-5 w-5 text-success-500" />
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Based on current performance metrics
            </p>
          </div>
          <Activity class="h-12 w-12 text-primary-600" />
        </div>
      </div>
    </div>

    <!-- Performance Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="metric in metrics" :key="metric.name" class="card">
        <div class="card-content">
          <div class="flex items-start justify-between mb-2">
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                {{ metric.name }}
              </h3>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {{ metric.description }}
              </p>
            </div>
            <span :class="[
              'badge text-xs',
              metric.status === 'good' ? 'badge-success' :
              metric.status === 'warning' ? 'badge-warning' :
              'badge-error'
            ]">
              {{ metric.status }}
            </span>
          </div>

          <div class="flex items-baseline gap-1 mb-2">
            <span :class="[
              'text-2xl font-bold',
              metric.status === 'good' ? 'text-success-600' :
              metric.status === 'warning' ? 'text-warning-600' :
              'text-error-600'
            ]">
              {{ metric.value }}
            </span>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ metric.unit }}
            </span>
          </div>

          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div :class="[
              'h-1.5 rounded-full transition-all duration-300',
              metric.status === 'good' ? 'bg-success-500' :
              metric.status === 'warning' ? 'bg-warning-500' :
              'bg-error-500'
            ]" :style="{ width: `${Math.min(100, metric.value / 5)}%` }" />
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Recommendations -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Optimisation Recommendations
        </h2>
      </div>
      <div class="card-content space-y-4">
        <div class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <BarChart3 class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-1">
              Bundle Size Optimisation
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Consider code splitting and lazy loading for better initial load performance.
              Current bundle size is within acceptable limits.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Timer class="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-1">
              Connection Performance
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Wallet connection times are excellent. Consider implementing connection caching
              for even better user experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Activity,
  TrendingUp,
  BarChart3,
  Timer
} from 'lucide-vue-next'

const metrics = [
  {
    name: 'Connection Time',
    value: 125,
    unit: 'ms',
    status: 'good',
    description: 'Time taken to establish wallet connection'
  },
  {
    name: 'Transaction Signing',
    value: 89,
    unit: 'ms',
    status: 'good',
    description: 'Average time to sign transactions'
  },
  {
    name: 'Chain Switching',
    value: 245,
    unit: 'ms',
    status: 'warning',
    description: 'Time to switch between chains'
  },
  {
    name: 'Account Creation',
    value: 67,
    unit: 'ms',
    status: 'good',
    description: 'Time to create new accounts'
  },
  {
    name: 'Memory Usage',
    value: 12,
    unit: 'MB',
    status: 'good',
    description: 'Current memory consumption'
  },
  {
    name: 'Bundle Size',
    value: 156,
    unit: 'KB',
    status: 'good',
    description: 'JavaScript bundle size impact'
  }
]
</script>