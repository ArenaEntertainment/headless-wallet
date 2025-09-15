import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { HeadlessWalletPlugin } from '@arenaentertainment/headless-wallet-vue'
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

// Headless wallet plugin configuration
const walletPluginOptions = {
  // Test accounts for both EVM and Solana
  accounts: [
    // EVM test accounts (Hardhat keys)
    {
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      type: 'evm' as const
    },
    {
      privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      type: 'evm' as const
    },
    {
      privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
      type: 'evm' as const
    },
    // Solana test accounts (generated keypairs)
    {
      privateKey: '[68,27,251,159,65,135,176,118,184,67,112,62,75,233,225,211,249,54,192,133,140,49,235,192,177,204,64,180,171,118,150,246,220,231,108,99,12,156,207,126,172,247,217,239,249,133,49,94,143,133,48,117,228,226,185,8,191,39,148,111,103,170,229,180]',
      type: 'solana' as const
    },
    {
      privateKey: '[109,52,131,38,179,64,7,72,38,102,205,174,220,176,191,180,42,194,186,211,183,72,15,139,255,246,24,122,70,205,74,83,141,138,45,207,187,224,51,48,86,242,17,12,46,36,22,87,84,7,216,112,72,221,111,31,55,217,7,112,237,83,26,18]',
      type: 'solana' as const
    },
    {
      privateKey: '[197,199,162,254,4,56,181,112,208,223,153,131,59,49,155,119,237,103,205,71,68,122,44,77,123,23,225,62,244,122,220,195,151,160,200,125,125,125,85,197,171,45,129,237,63,212,178,106,40,26,20,96,44,155,255,21,221,76,37,22,93,157,181,216]',
      type: 'solana' as const
    }
  ],

  // Wallet branding
  branding: {
    name: 'Arena Headless Wallet',
    icon: 'data:image/svg+xml,<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1080" rx="320" fill="black"/><path d="M203 830.128L470.486 230H607.658L876.001 830.128H730.255L510.78 300.301H565.649L345.316 830.128H203ZM336.743 701.529L373.608 596.078H682.245L719.968 701.529H336.743Z" fill="url(%23paint0_linear_436_3860)"/><defs><linearGradient id="paint0_linear_436_3860" x1="539.5" y1="830.128" x2="539.5" y2="230" gradientUnits="userSpaceOnUse"><stop stop-color="%2307D102"/><stop offset="1" stop-color="%23046B01"/></linearGradient></defs></svg>',
    rdns: 'com.arenaentertainment.headless-wallet'
  },

  // Chain configurations
  evm: {
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo'
  },
  solana: {
    cluster: 'devnet' as const,
    rpcUrl: 'https://api.devnet.solana.com'
  },

  // Enable for development
  enabled: true
}

const app = createApp(App)

app.use(router)
app.use(HeadlessWalletPlugin, walletPluginOptions)

app.mount('#app')