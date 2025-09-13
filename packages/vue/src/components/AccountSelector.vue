<template>
  <div
    :class="[
      'account-selector',
      customClass
    ]"
  >
    <label
      v-if="$slots.label"
      class="account-selector__label"
    >
      <slot name="label">Select Account</slot>
    </label>

    <select
      v-model="selectedAccountIndex"
      :disabled="!isConnected || isSwitching || accounts.length === 0"
      class="account-selector__select"
      @change="handleAccountChange"
    >
      <option
        v-if="accounts.length === 0"
        disabled
        value=""
      >
        No accounts available
      </option>

      <option
        v-for="(account, index) in accounts"
        :key="account.address"
        :value="index"
        :selected="index === currentAccountIndex"
      >
        {{ formatAccountOption(account, index) }}
      </option>
    </select>

    <!-- Loading indicator -->
    <div
      v-if="isSwitching"
      class="account-selector__loading"
    >
      <span class="account-selector__spinner" aria-hidden="true">⚙️</span>
      <span>Switching account...</span>
    </div>

    <!-- Error display -->
    <div
      v-if="switchError"
      class="account-selector__error"
      role="alert"
    >
      <span class="account-selector__error-icon" aria-hidden="true">⚠️</span>
      <span>{{ switchError.message }}</span>
    </div>

    <!-- Account details -->
    <div
      v-if="currentAccount && (showBalances || showChains)"
      class="account-selector__details"
    >
      <div
        v-if="showChains"
        class="account-selector__chain-info"
      >
        <span class="account-selector__chain-label">Type:</span>
        <span class="account-selector__chain-value">{{ getAccountTypeDisplay(currentAccount) }}</span>
      </div>

      <div
        v-if="showBalances"
        class="account-selector__balance-info"
      >
        <span class="account-selector__balance-label">Balance:</span>
        <span class="account-selector__balance-value">{{ accountBalance || 'Loading...' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useWallet, useAccount } from '../composables/index.js';
import type { AccountSelectorProps } from '../types.js';
import type { Account } from '@arenaentertainment/wallet-mock';

// Props
interface Props extends AccountSelectorProps {}

const props = withDefaults(defineProps<Props>(), {
  showBalances: false,
  showChains: true,
  class: ''
});

// Composables
const { isConnected } = useWallet();
const {
  currentAccount,
  accounts,
  currentAccountIndex,
  switchAccount,
  isSwitching,
  switchError,
  formatAddress,
  getAccountBalance,
  getAccountTypeDisplay
} = useAccount();

// Local state
const selectedAccountIndex = ref(currentAccountIndex.value);
const accountBalance = ref<string | null>(null);

// Computed
const customClass = computed(() => props.class);

// Methods
const formatAccountOption = (account: Account, index: number): string => {
  if (props.itemRenderer) {
    return props.itemRenderer(account);
  }

  const address = formatAddress(account.address, 12);
  const type = getAccountTypeDisplay(account);

  return `${address} (${type})`;
};

const handleAccountChange = async () => {
  if (selectedAccountIndex.value !== currentAccountIndex.value) {
    try {
      await switchAccount(selectedAccountIndex.value);
    } catch (error) {
      // Error is handled by the composable
      console.error('Account switch failed:', error);
      // Reset selection on error
      selectedAccountIndex.value = currentAccountIndex.value;
    }
  }
};

const loadAccountBalance = async () => {
  if (currentAccount.value && props.showBalances) {
    try {
      const balance = await getAccountBalance();
      accountBalance.value = balance;
    } catch (error) {
      console.warn('Failed to load account balance:', error);
      accountBalance.value = 'Error';
    }
  }
};

// Watchers
watch(currentAccountIndex, (newIndex) => {
  selectedAccountIndex.value = newIndex;
});

watch(currentAccount, () => {
  loadAccountBalance();
}, { immediate: true });

// Lifecycle
onMounted(() => {
  selectedAccountIndex.value = currentAccountIndex.value;
  loadAccountBalance();
});

// Emits
const emit = defineEmits<{
  accountChanged: [Account];
  error: [Error];
}>();

// Watch for account changes and emit events
watch(currentAccount, (account) => {
  if (account) {
    emit('accountChanged', account);
  }
});

watch(switchError, (error) => {
  if (error) {
    emit('error', error);
  }
});
</script>

<style scoped>
.account-selector {
  @apply space-y-2;
}

.account-selector__label {
  @apply block text-sm font-medium text-gray-700;
}

.account-selector__select {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed;
}

.account-selector__loading {
  @apply flex items-center space-x-2 text-sm text-blue-600;
}

.account-selector__spinner {
  @apply animate-spin;
}

.account-selector__error {
  @apply flex items-center space-x-2 text-sm text-red-600;
}

.account-selector__error-icon {
  @apply flex-shrink-0;
}

.account-selector__details {
  @apply bg-gray-50 rounded-md p-3 space-y-2;
}

.account-selector__chain-info,
.account-selector__balance-info {
  @apply flex justify-between items-center;
}

.account-selector__chain-label,
.account-selector__balance-label {
  @apply text-sm text-gray-500;
}

.account-selector__chain-value,
.account-selector__balance-value {
  @apply text-sm font-medium text-gray-900;
}

/* Fallback styles for non-Tailwind environments */
@media not (tailwind) {
  .account-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .account-selector__label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .account-selector__select {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background-color: white;
    font-size: 14px;
    color: #111827;
  }

  .account-selector__select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }

  .account-selector__select:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  .account-selector__loading {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #2563eb;
  }

  .account-selector__spinner {
    animation: spin 1s linear infinite;
  }

  .account-selector__error {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #dc2626;
  }

  .account-selector__details {
    background-color: #f9fafb;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .account-selector__chain-info,
  .account-selector__balance-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .account-selector__chain-label,
  .account-selector__balance-label {
    font-size: 14px;
    color: #6b7280;
  }

  .account-selector__chain-value,
  .account-selector__balance-value {
    font-size: 14px;
    font-weight: 500;
    color: #111827;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}
</style>