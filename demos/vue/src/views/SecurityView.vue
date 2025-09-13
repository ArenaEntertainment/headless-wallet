<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Security Overview
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Monitor and manage security features and threats
      </p>
    </div>

    <!-- Security Score -->
    <div class="card bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800">
      <div class="card-content">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Security Score
            </h2>
            <div class="flex items-center gap-4">
              <div class="text-3xl font-bold text-primary-600">85%</div>
              <div class="flex-1">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="h-2 rounded-full bg-success-500 transition-all duration-500" style="width: 85%" />
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Excellent security posture
                </p>
              </div>
            </div>
          </div>
          <Shield class="h-12 w-12 text-primary-600" />
        </div>
      </div>
    </div>

    <!-- Security Features -->
    <div class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Security Features
      </h2>

      <div class="grid gap-4">
        <div v-for="feature in securityFeatures" :key="feature.name" class="card">
          <div class="card-content">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3">
                <CheckCircle class="h-4 w-4 text-success-500" />
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                      {{ feature.name }}
                    </h3>
                    <span :class="[
                      'badge text-xs',
                      feature.importance === 'critical' ? 'badge-error' :
                      feature.importance === 'high' ? 'badge-warning' :
                      feature.importance === 'medium' ? 'badge-primary' :
                      'badge-gray'
                    ]">
                      {{ feature.importance }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ feature.description }}
                  </p>
                </div>
              </div>

              <span class="text-sm font-medium text-success-600 dark:text-success-400">
                Enabled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Environment Info -->
    <div class="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <div class="card-header">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Environment Information
        </h2>
      </div>
      <div class="card-content space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Environment
            </label>
            <span class="badge-primary">Development</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Host
            </label>
            <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
              localhost:3001
            </span>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Security Level
            </label>
            <span class="badge-success">Development</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Warnings
            </label>
            <span class="badge-warning">Enabled</span>
          </div>
        </div>

        <div class="pt-4 border-t border-blue-200 dark:border-blue-700">
          <div class="flex items-start gap-3">
            <AlertTriangle class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Development Mode Active
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                This wallet is running in development mode with relaxed security settings.
                In production, strict security policies would be enforced automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Shield,
  CheckCircle,
  AlertTriangle
} from 'lucide-vue-next'

const securityFeatures = [
  {
    name: 'Environment Detection',
    description: 'Automatically detects production environments and applies appropriate restrictions',
    status: 'enabled',
    importance: 'critical'
  },
  {
    name: 'Host Validation',
    description: 'Validates allowed hosts to prevent unauthorised usage',
    status: 'enabled',
    importance: 'high'
  },
  {
    name: 'Threat Pattern Detection',
    description: 'Monitors for common attack patterns and suspicious activity',
    status: 'enabled',
    importance: 'high'
  },
  {
    name: 'Secure Logging',
    description: 'Sanitises sensitive data in logs and error messages',
    status: 'enabled',
    importance: 'medium'
  }
]
</script>