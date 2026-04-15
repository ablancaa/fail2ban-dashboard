<template>
  <nav class="bg-slate-900 text-white px-4 py-3 shadow-md">

    <div class="max-w-6xl mx-auto flex items-center justify-between">

      <!-- LEFT -->
      <div class="flex items-center gap-3">
        <img src="../assets/Fail2ban_logo.png" class="w-8 h-8" />

        <span class="font-bold text-lg">
          Fail2Ban Panel
        </span>
      </div>

      <!-- DESKTOP MENU -->
      <div class="hidden md:flex items-center gap-2">

        <button class="nav-btn active">📊 Dashboard</button>

        <button class="nav-btn">
          🔒 Jails activas
          <span class="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
            {{ store.activeJails }}
          </span>
        </button>

        <button class="nav-btn">
          🚨 Alertas
          <span v-if="store.alerts > 0" class="ml-2 bg-red-500 px-2 rounded text-xs">
            {{ store.alerts }}
          </span>
        </button>

        <button class="nav-btn">⚙️ Config</button>
        <button class="nav-btn">📜 Logs</button>

      </div>

      <!-- RIGHT -->
      <div class="flex items-center gap-2">

        <button class="bg-blue-600 px-3 py-1 rounded" @click="store.refresh">
          🔄 Refresh
        </button>

        <!-- HAMBURGER -->
        <button class="md:hidden text-2xl" @click="mobileOpen = !mobileOpen">
          ☰
        </button>

      </div>
    </div>

    <!-- MOBILE MENU -->
    <div v-if="mobileOpen" class="md:hidden mt-3 space-y-2">

      <button class="nav-btn w-full text-left">📊 Dashboard</button>

      <button class="nav-btn w-full text-left">
        🔒 Jails activas
        <span class="ml-2 bg-blue-600 text-xs px-2 py-0.5 rounded-full">
          {{ store.activeJails }}
        </span>
      </button>

      <button class="nav-btn w-full text-left">
        🚨 Alertas
        <span v-if="store.alerts > 0" class="ml-2 bg-red-500 px-2 rounded text-xs">
          {{ store.alerts }}
        </span>
      </button>

      <button class="nav-btn w-full text-left">⚙️ Config</button>
      <button class="nav-btn w-full text-left">📜 Logs</button>

    </div>

  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useFail2BanStore } from '../stores/fail2ban'

const store = useFail2BanStore()
const mobileOpen = ref(false)
</script>

<style scoped>
.nav-btn {
  @apply px-3 py-2 rounded-lg text-sm hover:bg-slate-700 transition;
}

.nav-btn.active {
  @apply bg-blue-600;
}
</style>