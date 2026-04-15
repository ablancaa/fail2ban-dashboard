<template>
  <nav class="sticky top-2 z-50">

    <div
      class="max-w-6xl mx-auto bg-slate-900/70 backdrop-blur-xl
             border border-slate-700/50 rounded-2xl px-4 py-3
             shadow-lg shadow-black/20"
    >

      <div class="flex items-center justify-between">

        <!-- LEFT -->
        <div class="flex items-center gap-3">
          <img
            src="../assets/Fail2ban_logo.png"
            class="w-9 h-9 rounded-xl shadow-md"
          />

          <div class="leading-tight">
            <div class="font-bold text-white">Fail2Ban</div>
            <div class="text-xs text-slate-400">Security Panel</div>
          </div>
        </div>

        <!-- DESKTOP MENU -->
        <div class="hidden md:flex items-center gap-1">

          <button class="nav-btn active">📊 Dashboard</button>

          <button class="nav-btn">
            🔒 Jails
            <span class="badge">{{ store.activeJails }}</span>
          </button>

          <button class="nav-btn">
            🚨 Alerts
            <span v-if="store.alerts" class="badge danger">
              {{ store.alerts }}
            </span>
          </button>

          <button class="nav-btn">⚙️ Config</button>
          <button class="nav-btn">📜 Logs</button>

        </div>

        <!-- RIGHT -->
        <div class="flex items-center gap-2">

          <button
            class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500
                   text-sm font-medium transition active:scale-95"
            @click="store.refresh"
          >
            ↻ Refresh
          </button>

          <!-- HAMBURGER -->
          <button
            class="md:hidden p-2 rounded-xl hover:bg-slate-800 transition"
            @click="mobileOpen = !mobileOpen"
          >
            <span class="text-xl">☰</span>
          </button>

        </div>
      </div>

      <!-- MOBILE MENU -->
      <transition name="slide">
        <div
          v-if="mobileOpen"
          class="md:hidden mt-3 space-y-2 pt-3 border-t border-slate-700/50"
        >

          <button class="mobile-btn">📊 Dashboard</button>

          <button class="mobile-btn">
            🔒 Jails
            <span class="badge">{{ store.activeJails }}</span>
          </button>

          <button class="mobile-btn">
            🚨 Alerts
            <span v-if="store.alerts" class="badge danger">
              {{ store.alerts }}
            </span>
          </button>

          <button class="mobile-btn">⚙️ Config</button>
          <button class="mobile-btn">📜 Logs</button>

        </div>
      </transition>

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
  @apply px-3 py-1.5 rounded-xl text-sm text-slate-300
         hover:bg-slate-800 hover:text-white transition;
}

.nav-btn.active {
  @apply bg-slate-800 text-white;
}

.mobile-btn {
  @apply w-full text-left px-3 py-2 rounded-xl
         text-slate-200 hover:bg-slate-800 transition;
}

.badge {
  @apply ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-white;
}

.badge.danger {
  @apply bg-red-500;
}

/* smooth mobile animation */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>