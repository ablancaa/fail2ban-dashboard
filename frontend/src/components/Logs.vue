<script setup>
import { ref, onMounted } from 'vue'
import { useFail2BanStore } from '../stores/fail2ban'

const store = useFail2BanStore()

const open = ref(true)

onMounted(() => {
  store.fetchBans()
})
</script>

<template>
  <div class="w-full max-w-3xl mx-auto">

    <!-- HEADER -->
    <div
      class="flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-xl shadow-md cursor-pointer hover:bg-slate-800 transition"
      @click="open = !open"
    >
      <div class="flex items-center gap-2">
        <span class="text-lg">🚫</span>
        <h2 class="font-semibold">IPs baneadas (logs)</h2>

        <span class="ml-2 bg-red-500 text-xs px-2 py-0.5 rounded-full">
          {{ store.bans.length }}
        </span>
      </div>

      <!-- icono colapsar -->
      <span class="text-sm">
        {{ open ? '▲' : '▼' }}
      </span>
    </div>

    <!-- CONTENIDO -->
    <transition name="fade">
      <div
        v-show="open"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mt-2 shadow-sm"
      >

        <!-- LISTA -->
        <div class="divide-y divide-slate-200 dark:divide-slate-700">

          <div
            v-for="b in store.bans"
            :key="b.ip"
            class="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >

            <!-- IP -->
            <div class="flex items-center gap-2">
              <span class="text-red-500">🚫</span>
              <span class="font-mono text-sm text-slate-700 dark:text-slate-200">
                {{ b.ip }}
              </span>
            </div>

            <!-- badge -->
            <span class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
              ATTACK
            </span>

          </div>

          <!-- empty state -->
          <div
            v-if="store.bans.length === 0"
            class="p-6 text-center text-slate-500 text-sm"
          >
            No hay IPs baneadas
          </div>

        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>