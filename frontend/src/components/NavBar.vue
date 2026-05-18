<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useFail2BanStore } from "../stores/fail2ban";

const store = useFail2BanStore();

const mobileOpen = ref(false);
const aboutOpenDesktop = ref(false);
const aboutOpenMobile = ref(false);

const route = useRoute();

/* TOGGLES */
const toggleMenu = () => {
  mobileOpen.value = !mobileOpen.value;
};

const toggleAboutDesktop = () => {
  aboutOpenDesktop.value = !aboutOpenDesktop.value;
};

const toggleAboutMobile = () => {
  aboutOpenMobile.value = !aboutOpenMobile.value;
};

const handleRefresh = () => {
  store.refresh();
};

/* AUTO CLOSE ON ROUTE CHANGE */
watch(route, () => {
  mobileOpen.value = false;
  aboutOpenDesktop.value = false;
  aboutOpenMobile.value = false;
});

/* DATA */
const servers = computed(() => store.servers || []);

const configCount = computed(() => servers.value.length);

const activeJails = computed(() =>
  servers.value.reduce((acc, s) => acc + (s.jails?.length || 0), 0)
);

const alertsCount = computed(() =>
  servers.value.reduce((acc, s) => {
    return (
      acc + (s.jails || []).reduce((jacc, j) => jacc + (j.geoBannedIPs?.length || 0), 0)
    );
  }, 0)
);

const bansCount = computed(() => 0);
</script>
<template>
  <nav class="relative bg-slate-900 text-white px-4 py-3 shadow-lg rounded-b-2xl z-50">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <!-- LEFT -->
      <div class="flex items-center gap-3">
        <router-link to="/">
          <img src="../assets/Fail2ban_logo.png" class="w-8 h-8 rounded-lg" />
        </router-link>
        <span class="font-bold text-lg">Fail2Ban Panel</span>
      </div>

      <!-- DESKTOP MENU -->
      <div class="hidden md:flex items-center gap-2">
        <router-link to="/">
          <button class="nav-btn">📊 Dashboard</button>
        </router-link>

        <router-link to="/JailsView">
          <button class="nav-btn">
            🔒 Jails
            <span class="badge">{{ activeJails }}</span>
          </button>
        </router-link>

        <router-link to="/BannedIpView">
          <button class="nav-btn">
            🚨 Alertas
            <span v-if="alertsCount > 0" class="badge-red">
              {{ alertsCount }}
            </span>
          </button>
        </router-link>

        <router-link to="/JailConfigView">
          <button class="nav-btn">
            ⚙️ Config
            <span v-if="configCount > 0" class="badge">
              {{ configCount }}
            </span>
          </button>
        </router-link>

        <router-link to="/LogHistoryView">
          <button class="nav-btn">
            📄 Logs History
            <span v-if="bansCount > 0" class="badge">
              {{ bansCount }}
            </span>
          </button>
        </router-link>

        <router-link to="/MapaView">
          <button class="nav-btn flex items-center gap-2">
            🗺️ Mapa
            <span v-if="alertsCount > 0" class="badge-red">
              {{ alertsCount }}
            </span>
          </button>
        </router-link>

        <!-- ABOUT DESKTOP -->
        <div class="relative">
          <button class="nav-btn" @click="toggleAboutDesktop">ℹ️ About</button>

          <div
            v-if="aboutOpenDesktop"
            class="absolute right-0 mt-2 w-40 bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden"
          >
            <router-link to="/about">
              <div class="px-3 py-2 hover:bg-slate-700 cursor-pointer">About us</div>
            </router-link>

            <router-link to="/version">
              <div class="px-3 py-2 hover:bg-slate-700 cursor-pointer">Version</div>
            </router-link>
          </div>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="flex items-center gap-2">
        <button
          class="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-xl transition"
          @click="handleRefresh"
        >
          🔄
        </button>

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
      <router-link to="/">
        <button class="mobile-btn">📊 Dashboard</button>
      </router-link>

      <router-link to="/JailsView">
        <button class="mobile-btn flex justify-between">
          <span>🔒 Jails</span>
          <span class="badge">{{ activeJails }}</span>
        </button>
      </router-link>

      <router-link to="/BannedIpView">
        <button class="mobile-btn flex justify-between">
          <span>🚨 Alertas</span>
          <span v-if="alertsCount > 0" class="badge-red">
            {{ alertsCount }}
          </span>
        </button>
      </router-link>

      <router-link to="/JailConfigView">
        <button class="mobile-btn flex justify-between">
          ⚙️ Config
          <span class="badge">{{ configCount }}</span>
        </button>
      </router-link>

      <router-link to="/LogHistoryView">
        <button class="mobile-btn flex justify-between">
          📄 Logs History
          <span class="badge">{{ bansCount }}</span>
        </button>
      </router-link>

      <router-link to="/MapaView">
        <button class="mobile-btn flex justify-between">
          🗺️ Mapa
          <span v-if="alertsCount > 0" class="badge-red">
            {{ alertsCount }}
          </span>
        </button>
      </router-link>

      <!-- ABOUT MOBILE -->
      <div>
        <button class="mobile-btn" @click="toggleAboutMobile">ℹ️ About</button>

        <div v-if="aboutOpenMobile" class="ml-3 space-y-1">
          <router-link to="/about">
            <div class="mobile-btn">About us</div>
          </router-link>

          <router-link to="/version">
            <div class="mobile-btn">Version</div>
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>
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
  @apply ml-2 bg-red-600 text-xs px-2 py-0.5 rounded-full animate-pulse;
}
</style>
