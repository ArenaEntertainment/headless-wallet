<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile sidebar backdrop -->
    <Teleport to="body">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 lg:hidden"
        @click="sidebarOpen = false"
      >
        <div class="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" />
      </div>
    </Teleport>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="flex flex-col h-full">
        <!-- Logo and close button -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <Wallet class="h-8 w-8 text-primary-600" />
            <div>
              <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Wallet Mock
              </h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Vue Demo
              </p>
            </div>
          </div>
          <button
            @click="sidebarOpen = false"
            class="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Wallet status -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <WalletStatus />
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.path"
            @click="sidebarOpen = false"
            :class="[
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
              $route.path === item.path
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            <component
              :is="item.icon"
              :class="[
                'mr-3 h-5 w-5 flex-shrink-0',
                $route.path === item.path
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
              ]"
            />
            {{ item.name }}
          </router-link>
        </nav>

        <!-- Theme toggle -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <button
              @click="toggleTheme"
              class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              :title="`Switch to ${isDark ? 'light' : 'dark'} theme`"
            >
              <Sun v-if="isDark" class="h-5 w-5" />
              <Moon v-else class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="lg:ml-64">
      <!-- Top bar -->
      <div class="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between px-4 py-3">
          <!-- Mobile menu button -->
          <button
            @click="sidebarOpen = true"
            class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu class="h-5 w-5" />
          </button>

          <!-- Page title -->
          <div class="flex items-center gap-2">
            <component
              v-if="currentPage"
              :is="currentPage.icon"
              class="h-5 w-5 text-primary-600"
            />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ currentPage?.name || 'Wallet Mock' }}
            </h2>
          </div>

          <!-- Connection status indicator -->
          <div class="flex items-center gap-2">
            <div :class="[
              'h-2 w-2 rounded-full',
              isConnected ? 'bg-success-500' : 'bg-gray-400'
            ]" />
            <span class="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">
              {{ isConnected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Page content -->
      <main class="p-4">
        <div class="mx-auto max-w-7xl">
          <Suspense>
            <router-view />
            <template #fallback>
              <div class="flex items-center justify-center min-h-[50vh]">
                <div class="spinner h-8 w-8"></div>
              </div>
            </template>
          </Suspense>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHeadlessWallet } from '@arenaentertainment/wallet-mock-vue'
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
  Moon
} from 'lucide-vue-next'
import WalletStatus from './components/WalletStatus.vue'

const router = useRouter()
const route = useRoute()
const headlessWallet = useHeadlessWallet()

const sidebarOpen = ref(false)
const isDark = ref(false)

const navigation = [
  { name: 'Overview', path: '/', icon: Home },
  { name: 'Accounts', path: '/accounts', icon: Users },
  { name: 'Chains', path: '/chains', icon: Network },
  { name: 'Transactions', path: '/transactions', icon: Send },
  { name: 'Security', path: '/security', icon: Shield },
  { name: 'Performance', path: '/performance', icon: Activity },
  { name: 'Playground', path: '/playground', icon: Code },
]

const currentPage = computed(() => {
  return navigation.find(item => item.path === route.path)
})

const isConnected = computed(() => {
  return wallet.value?.isConnected || false
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  const root = document.documentElement
  if (isDark.value) {
    root.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    root.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  // Initialize theme from localStorage or system preference
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})
</script>