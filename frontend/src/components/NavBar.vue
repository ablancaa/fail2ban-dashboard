<template>
  <nav class="relative bg-slate-900 text-white px-4 py-3 shadow-lg rounded-b-2xl z-50">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <!-- LEFT -->
      <div class="flex items-center gap-3">
        <router-link to="/">
          <img src="../assets/Fail2ban_logo.png" class="w-8 h-8 rounded-lg"
        /></router-link>
        <span class="font-bold text-lg">Fail2Ban Panel</span>
      </div>

      <!-- DESKTOP MENU -->
      <div class="hidden md:flex items-center gap-2">
        <button class="nav-btn">📊 <router-link to="/">Dashboard</router-link></button>

        <button class="nav-btn">
          🔒 <Router-link to="/JailsView">Jails</Router-link>
          <span class="badge">{{ store.activeJails }}</span>
        </button>

        <button class="nav-btn">
          🚨 <router-link to="/BannedIpView">Alertas</router-link>
          <span v-if="store.alerts > 0" class="badge-red">
            {{ store.alerts }}
          </span>
        </button>

        <button class="nav-btn">
          ⚙️ <router-link to="/JailConfigView">Config</router-link>
        </button>
        <button class="nav-btn">
          📄 <router-link to="/LogHistoryView">Logs History</router-link>
          <span class="badge">{{ store.bans.length }}</span>
        </button>
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
      <button class="mobile-btn">📊 <router-link to="/">Dashboard</router-link></button>

      <button class="mobile-btn flex items-center justify-between">
        <span>🔒 <router-link to="/JailsView">Jails</router-link></span>
        <span class="badge">{{ store.activeJails }}</span>
      </button>

      <button class="mobile-btn flex items-center justify-between">
        <span>🚨 <router-link to="/BannedIpView">Alertas</router-link></span>
        <span v-if="store.alerts > 0" class="badge-red">
          {{ store.alerts }}
        </span>
      </button>

      <button class="mobile-btn">
        ⚙️ <router-link to="/JailConfigView">Config</router-link>
      </button>
      <button class="mobile-btn flex items-center justify-between">
        <span>📄 <router-link to="/LogHistoryView">Logs History</router-link></span>
        <span class="badge">{{ store.bans.length }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useFail2BanStore } from "../stores/fail2ban";
import router from "@/router";
import { routerKey, routerViewLocationKey } from "vue-router";
import { Router } from "lucide-vue-next";

const store = useFail2BanStore();
const mobileOpen = ref(false);

// Debug: verificar que el store tiene los datos correctos
onMounted(() => {
  console.log("NavBar mounted, store.alerts:", store.alerts);
  console.log("NavBar mounted, store.activeJails:", store.activeJails);
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
