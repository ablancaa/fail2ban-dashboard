<script setup>
import { ref, onMounted } from 'vue'
import { useFail2BanStore } from '../stores/fail2ban'

const store = useFail2BanStore()
const open = ref(true)

onMounted(() => {
  store.fetchBans()
})

const toggle = () => {
  open.value = !open.value
}
</script>

<template>
  <div class="w-full max-w-3xl mx-auto">

    <!-- HEADER -->
    <div
      class="flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-xl shadow-md cursor-pointer select-none"
      @click="toggle"
    >
      <div class="flex items-center gap-2">
        <span class="text-lg">🚫</span>

        <h2 class="font-semibold">IPs baneadas (logs)</h2>

        <span class="ml-2 bg-red-500 text-xs px-2 py-0.5 rounded-full">
          {{ store.bans.length }}
        </span>
      </div>

      <!-- ICON -->
      <svg
        class="w-4 h-4 transition-transform duration-200"
        :class="{ 'rotate-180': !open }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <!-- CONTENT -->
    <transition name="fade">
      <div
        v-show="open"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mt-2 shadow-sm overflow-hidden"
      >

        <div class="divide-y divide-slate-200 dark:divide-slate-700">

          <div
            v-for="b in store.bans"
            :key="b.ip"
            class="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <div class="flex items-center gap-2">
              <span class="text-red-500">🚫</span>

              <span class="font-mono text-sm text-slate-700 dark:text-slate-200">
                {{ b.ip }}
              </span>
            </div>

            <span class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
              ATTACK
            </span>
          </div>

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
  transition: all 0.25s ease;
  overflow: hidden;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>