<template>
  <nav class="relative bg-slate-900 text-white px-4 py-3 shadow-lg rounded-b-2xl z-50">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <!-- LEFT -->
      <div class="flex items-center gap-3">
        <img src="../assets/Fail2ban_logo.png" class="w-8 h-8 rounded-lg" />
        <span class="font-bold text-lg">Fail2Ban Panel</span>
      </div>

      <!-- DESKTOP MENU -->
      <div class="hidden md:flex items-center gap-2">
        <button class="nav-btn">📊 Dashboard</button>

        <button class="nav-btn">
          🔒 Jails
          <span class="badge">{{ store.activeJails }}</span>
        </button>

        <button class="nav-btn">
          🚨 Alertas
          <span v-if="store.alerts > 0" class="badge-red">
            {{ store.alerts }}
          </span>
        </button>

        <button class="nav-btn">⚙️ Config</button>
        <button class="nav-btn">📄 Logs</button>
      </div>

      <!-- RIGHT -->
      <div class="flex items-center gap-2">
        <button
          class="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-xl transition"
          @click="handleRefresh"
        >
          🔄
        </button>

        <!-- HAMBURGER -->
        <button
          class="md:hidden text-2xl px-3 py-1 rounded-xl hover:bg-slate-800"
          @click="toggleMenu"
        >
          ☰
        </button>
      </div>
    </div>

    <!-- MOBILE MENU -->
    <div
      v-if="mobileOpen"
      class="md:hidden mt-3 bg-slate-800 rounded-2xl p-3 space-y-2 shadow-2xl border border-slate-700"
    >
      <button class="mobile-btn">📊 Dashboard</button>

      <button class="mobile-btn flex items-center justify-between">
        <span>🔒 Jails</span>
        <span class="badge">{{ store.activeJails }}</span>
      </button>

      <button class="mobile-btn flex items-center justify-between">
        <span>🚨 Alertas</span>
        <span v-if="store.alerts > 0" class="badge-red">
          {{ store.alerts }}
        </span>
      </button>

      <button class="mobile-btn">⚙️ Config</button>
      <button class="mobile-btn">📄 Logs</button>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useFail2BanStore } from "../stores/fail2ban";

const store = useFail2BanStore();
const mobileOpen = ref(false);

// Debug: verificar que el store tiene los datos correctos
onMounted(() => {
  console.log('NavBar mounted, store.alerts:', store.alerts);
  console.log('NavBar mounted, store.activeJails:', store.activeJails);
});

const toggleMenu = () => {
  mobileOpen.value = !mobileOpen.value;
};

const handleRefresh = () => {
  store.refresh();
  window.location.reload();
};
</script>

<style scoped>
.nav-btn {
  @apply px-3 py-1 rounded-xl text-sm hover:bg-slate-700 transition;
}

.mobile-btn {
  @apply w-full text-left px-3 py-2 rounded-xl hover:bg-slate-700 transition;
}

.badge {
  @apply ml-2 bg-slate-700 text-xs px-2 py-0.5 rounded-full;
}

.badge-red {
  @apply ml-2 bg-red-600 text-xs px-2 py-0.5 rounded-full;
}
</style>
