<template>
  <button
    :class="[
      'wallet-connect-button',
      {
        'wallet-connect-button--connected': isConnected,
        'wallet-connect-button--loading': isConnecting || loading,
        'wallet-connect-button--disabled': disabled
      },
      customClass
    ]"
    :disabled="disabled || isConnecting"
    @click="handleClick"
  >
    <span
      v-if="isConnecting || loading"
      class="wallet-connect-button__spinner"
      aria-hidden="true"
    >
      ⚙️
    </span>

    <span class="wallet-connect-button__text">
      {{ buttonText }}
    </span>

    <!-- Account display when connected -->
    <div
      v-if="isConnected && showAccount && currentAccount"
      class="wallet-connect-button__account"
    >
      <span class="wallet-connect-button__address">
        {{ formatAddress(currentAccount.address) }}
      </span>
      <span
        v-if="showChain && currentChain"
        class="wallet-connect-button__chain"
      >
        {{ currentChain.name }}
      </span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWallet, useAccount, useChain } from '../composables/index.js';
import type { WalletConnectButtonProps } from '../types.js';

// Props
interface Props extends WalletConnectButtonProps {}

const props = withDefaults(defineProps<Props>(), {
  connectText: 'Connect Wallet',
  disconnectText: 'Disconnect',
  showAccount: true,
  showChain: false,
  class: '',
  disabled: false,
  loading: false
});

// Composables
const { isConnected, isConnecting, connect, disconnect, connectionError } = useWallet();
const { currentAccount, formatAddress } = useAccount();
const { currentChain } = useChain();

// Computed
const customClass = computed(() => props.class);

const buttonText = computed(() => {
  if (props.loading || isConnecting.value) {
    return 'Connecting...';
  }

  if (isConnected.value) {
    return props.disconnectText;
  }

  return props.connectText;
});

// Methods
const handleClick = async () => {
  if (props.disabled || isConnecting.value) {
    return;
  }

  try {
    if (isConnected.value) {
      await disconnect();
    } else {
      await connect();
    }
  } catch (error) {
    console.error('Wallet connection error:', error);
  }
};

// Emits
const emit = defineEmits<{
  connect: [void];
  disconnect: [void];
  error: [Error];
}>();

// Watch for connection state changes and emit events
import { watch } from 'vue';

watch(isConnected, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    emit('connect');
  } else if (!newValue && oldValue) {
    emit('disconnect');
  }
});

watch(connectionError, (error) => {
  if (error) {
    emit('error', error);
  }
});
</script>

<style scoped>
.wallet-connect-button {
  @apply inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200;
}

.wallet-connect-button--connected {
  @apply bg-green-600 hover:bg-green-700 focus:ring-green-500;
}

.wallet-connect-button--loading {
  @apply cursor-not-allowed;
}

.wallet-connect-button--disabled {
  @apply opacity-50 cursor-not-allowed;
}

.wallet-connect-button__spinner {
  @apply mr-2 animate-spin;
}

.wallet-connect-button__text {
  @apply flex-shrink-0;
}

.wallet-connect-button__account {
  @apply ml-3 flex flex-col items-start text-xs;
}

.wallet-connect-button__address {
  @apply font-mono opacity-90;
}

.wallet-connect-button__chain {
  @apply text-xs opacity-75;
}

/* Fallback styles for non-Tailwind environments */
@media not (tailwind) {
  .wallet-connect-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    font-weight: 500;
    color: white;
    background-color: #2563eb;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .wallet-connect-button:hover {
    background-color: #1d4ed8;
  }

  .wallet-connect-button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
  }

  .wallet-connect-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .wallet-connect-button--connected {
    background-color: #16a34a;
  }

  .wallet-connect-button--connected:hover {
    background-color: #15803d;
  }

  .wallet-connect-button__spinner {
    margin-right: 8px;
    animation: spin 1s linear infinite;
  }

  .wallet-connect-button__account {
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-size: 12px;
  }

  .wallet-connect-button__address {
    font-family: monospace;
    opacity: 0.9;
  }

  .wallet-connect-button__chain {
    font-size: 11px;
    opacity: 0.75;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}
</style>