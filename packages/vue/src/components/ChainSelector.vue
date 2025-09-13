<template>
  <div
    :class="[
      'chain-selector',
      customClass
    ]"
  >
    <label
      v-if="$slots.label"
      class="chain-selector__label"
    >
      <slot name="label">Select Chain</slot>
    </label>

    <select
      v-model="selectedChainId"
      :disabled="!isConnected || isSwitching || filteredChains.length === 0"
      class="chain-selector__select"
      @change="handleChainChange"
    >
      <option
        v-if="filteredChains.length === 0"
        disabled
        value=""
      >
        No chains available
      </option>

      <option
        v-for="chain in filteredChains"
        :key="chain.id"
        :value="chain.id"
        :selected="chain.id === currentChain?.id"
      >
        {{ formatChainOption(chain) }}
      </option>
    </select>

    <!-- Loading indicator -->
    <div
      v-if="isSwitching"
      class="chain-selector__loading"
    >
      <span class="chain-selector__spinner" aria-hidden="true">⚙️</span>
      <span>Switching chain...</span>
    </div>

    <!-- Error display -->
    <div
      v-if="switchError"
      class="chain-selector__error"
      role="alert"
    >
      <span class="chain-selector__error-icon" aria-hidden="true">⚠️</span>
      <span>{{ switchError.message }}</span>
    </div>

    <!-- Chain details -->
    <div
      v-if="currentChain && (showStatus || showLogos)"
      class="chain-selector__details"
    >
      <div
        v-if="showLogos"
        class="chain-selector__logo"
      >
        <span class="chain-selector__logo-placeholder">{{ getChainEmoji(currentChain) }}</span>
        <span class="chain-selector__name">{{ currentChain.name }}</span>
      </div>

      <div
        v-if="showStatus"
        class="chain-selector__status"
      >
        <span class="chain-selector__status-label">Type:</span>
        <span class="chain-selector__status-value">{{ currentChain.type.toUpperCase() }}</span>
        <span
          v-if="isTestnet()"
          class="chain-selector__testnet-badge"
        >
          Testnet
        </span>
      </div>

      <div
        v-if="showStatus"
        class="chain-selector__currency"
      >
        <span class="chain-selector__currency-label">Native:</span>
        <span class="chain-selector__currency-value">{{ getNativeCurrency() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useWallet, useChain } from '../composables/index.js';
import type { ChainSelectorProps } from '../types.js';
import type { SupportedChain } from '@arenaentertainment/wallet-mock';

// Props
interface Props extends ChainSelectorProps {}

const props = withDefaults(defineProps<Props>(), {
  showLogos: true,
  showStatus: true,
  filterByType: 'all',
  class: ''
});

// Composables
const { isConnected } = useWallet();
const {
  currentChain,
  supportedChains,
  switchChain,
  isSwitching,
  switchError,
  isTestnet,
  getNativeCurrency
} = useChain();

// Local state
const selectedChainId = ref(currentChain.value?.id || '');

// Computed
const customClass = computed(() => props.class);

const filteredChains = computed(() => {
  let chains = supportedChains.value;

  if (props.filterByType !== 'all') {
    chains = chains.filter(chain => chain.type === props.filterByType);
  }

  return chains;
});

// Methods
const formatChainOption = (chain: SupportedChain): string => {
  const emoji = getChainEmoji(chain);
  const testnetSuffix = isTestnet(chain.id) ? ' (Testnet)' : '';
  return `${emoji} ${chain.name}${testnetSuffix}`;
};

const getChainEmoji = (chain: SupportedChain): string => {
  switch (chain.id) {
    case '1':
    case 'ethereum':
      return '🔷';
    case '137':
    case 'polygon':
      return '🟣';
    case '56':
    case 'bsc':
      return '🟡';
    case 'mainnet-beta':
    case 'testnet':
    case 'devnet':
      return '🌞';
    default:
      return chain.type === 'evm' ? '⚪' : '🌞';
  }
};

const handleChainChange = async () => {
  if (selectedChainId.value && selectedChainId.value !== currentChain.value?.id) {
    try {
      await switchChain(selectedChainId.value);
    } catch (error) {
      // Error is handled by the composable
      console.error('Chain switch failed:', error);
      // Reset selection on error
      selectedChainId.value = currentChain.value?.id || '';
    }
  }
};

// Watchers
watch(currentChain, (chain) => {
  selectedChainId.value = chain?.id || '';
});

// Lifecycle
onMounted(() => {
  selectedChainId.value = currentChain.value?.id || '';
});

// Emits
const emit = defineEmits<{
  chainChanged: [SupportedChain];
  error: [Error];
}>();

// Watch for chain changes and emit events
watch(currentChain, (chain) => {
  if (chain) {
    emit('chainChanged', chain);
  }
});

watch(switchError, (error) => {
  if (error) {
    emit('error', error);
  }
});
</script>

<style scoped>
.chain-selector {
  @apply space-y-2;
}

.chain-selector__label {
  @apply block text-sm font-medium text-gray-700;
}

.chain-selector__select {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed;
}

.chain-selector__loading {
  @apply flex items-center space-x-2 text-sm text-blue-600;
}

.chain-selector__spinner {
  @apply animate-spin;
}

.chain-selector__error {
  @apply flex items-center space-x-2 text-sm text-red-600;
}

.chain-selector__error-icon {
  @apply flex-shrink-0;
}

.chain-selector__details {
  @apply bg-gray-50 rounded-md p-3 space-y-2;
}

.chain-selector__logo {
  @apply flex items-center space-x-2;
}

.chain-selector__logo-placeholder {
  @apply text-lg;
}

.chain-selector__name {
  @apply font-medium text-gray-900;
}

.chain-selector__status,
.chain-selector__currency {
  @apply flex justify-between items-center;
}

.chain-selector__status-label,
.chain-selector__currency-label {
  @apply text-sm text-gray-500;
}

.chain-selector__status-value,
.chain-selector__currency-value {
  @apply text-sm font-medium text-gray-900 flex items-center space-x-2;
}

.chain-selector__testnet-badge {
  @apply inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800;
}

/* Fallback styles for non-Tailwind environments */
@media not (tailwind) {
  .chain-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .chain-selector__label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .chain-selector__select {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background-color: white;
    font-size: 14px;
    color: #111827;
  }

  .chain-selector__select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }

  .chain-selector__select:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  .chain-selector__loading {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #2563eb;
  }

  .chain-selector__spinner {
    animation: spin 1s linear infinite;
  }

  .chain-selector__error {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #dc2626;
  }

  .chain-selector__details {
    background-color: #f9fafb;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .chain-selector__logo {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chain-selector__logo-placeholder {
    font-size: 18px;
  }

  .chain-selector__name {
    font-weight: 500;
    color: #111827;
  }

  .chain-selector__status,
  .chain-selector__currency {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chain-selector__status-label,
  .chain-selector__currency-label {
    font-size: 14px;
    color: #6b7280;
  }

  .chain-selector__status-value,
  .chain-selector__currency-value {
    font-size: 14px;
    font-weight: 500;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chain-selector__testnet-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    background-color: #fef3c7;
    color: #92400e;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}
</style>