<script setup>
import { useFail2BanStore } from '../stores/fail2ban'
import { onMounted } from 'vue'

const store = useFail2BanStore()

onMounted(() => {
  store.fetchBans()
})
</script>

<template>
  <div class="card">
    <h2>IPs baneadas (logs)</h2>

    <div v-for="b in store.bans" :key="b.ip">
      🚫 {{ b.ip }}
    </div>
  </div>
</template>