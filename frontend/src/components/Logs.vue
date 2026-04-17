<script setup>
import { ref, onMounted, computed } from 'vue'
import { useFail2BanStore } from '../stores/fail2ban'

const store = useFail2BanStore()
const open = ref(false)

onMounted(() => {
  store.fetchBans()
})

const toggle = () => {
  open.value = !open.value
}

/* 🔥 blindaje por si store aún no está listo */
const bans = computed(() => store.bans || [])
</script>

<template>
  <div class="w-full max-w-3xl mx-auto">

    <!-- HEADER -->
    <div
      class="flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-xl shadow-md cursor-pointer"
      @click="toggle"
    >
      <div class="flex items-center gap-2">
        <span>🚫</span>

        <h2 class="font-semibold">
          IPs baneadas (logs)
        </h2>

        <span class="bg-red-500 text-xs px-2 py-0.5 rounded-full">
          {{ bans.length }}
        </span>
      </div>

      <div class="transition-transform duration-200"
           :style="{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)' }">
        ▼
      </div>
    </div>

    <!-- CONTENT (SIN TRANSITION PARA DEBUG) -->
    <div
      v-if="open"
      class="bg-white dark:bg-slate-900 border rounded-xl mt-2 shadow-sm overflow-hidden"
    >

      <div v-if="bans.length > 0">

        <div
          v-for="b in bans"
          :key="b.ip"
          class="flex items-center justify-between px-4 py-3 border-b hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <span class="font-mono text-sm">
            🚫 {{ b.ip }}
          </span>

          <span class="text-xs bg-slate-200 px-2 py-1 rounded">
            ATTACK
          </span>
        </div>

      </div>

      <div v-else class="p-4 text-gray-500 text-sm">
        No hay IPs baneadas
      </div>

    </div>

  </div>
</template>