<template>
  <client-only>
    <div class="demo-container">
      <div class="header">
        <h1>🎮 Arena Headless Wallet + Reown AppKit Nuxt</h1>
        <p>Demonstrating seamless integration between Arena's mock wallet and Reown's AppKit using Nuxt 3</p>
      </div>

      <div class="card">
        <h2>🔗 Connection</h2>
        <div class="connection-section">
          <appkit-button />
        </div>
      </div>

      <div class="card">
        <h2>📊 Components</h2>
        <div class="button-group">
          <appkit-connect-button />
          <appkit-account-button />
          <appkit-network-button />
        </div>
      </div>
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('Simple demo page mounted')
})
</script>

<style scoped>
.demo-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #333;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.connection-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>