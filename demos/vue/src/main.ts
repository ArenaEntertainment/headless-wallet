import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { HeadlessWalletPlugin } from '@arenaentertainment/wallet-mock-vue'
import App from './App.vue'
import './style.css'

// Lazy load views for better performance
const HomeView = () => import('./views/HomeView.vue')
const AccountsView = () => import('./views/AccountsView.vue')
const ChainsView = () => import('./views/ChainsView.vue')
const TransactionsView = () => import('./views/TransactionsView.vue')
const SecurityView = () => import('./views/SecurityView.vue')
const PerformanceView = () => import('./views/PerformanceView.vue')
const PlaygroundView = () => import('./views/PlaygroundView.vue')

// Router configuration
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: HomeView },
    { path: '/accounts', name: 'Accounts', component: AccountsView },
    { path: '/chains', name: 'Chains', component: ChainsView },
    { path: '/transactions', name: 'Transactions', component: TransactionsView },
    { path: '/security', name: 'Security', component: SecurityView },
    { path: '/performance', name: 'Performance', component: PerformanceView },
    { path: '/playground', name: 'Playground', component: PlaygroundView },
  ]
})

// Mock wallet plugin configuration
const walletPluginOptions = {
  // Create account with actual private key
  accounts: [
    { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', type: 'evm' },
  ],

  // Auto-connect for demo purposes (disable in production)
  autoConnect: true,
}

const app = createApp(App)

app.use(router)
app.use(HeadlessWalletPlugin, walletPluginOptions)

app.mount('#app')