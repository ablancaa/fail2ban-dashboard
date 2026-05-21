<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

import { useFail2BanStore } from "@/stores/fail2ban";

const store = useFail2BanStore();

const openServers = ref({});
const isDesktop = ref(false);
const loadingAction = ref({});

/* ---------------- RESPONSIVE ---------------- */
const checkScreen = () => {
  isDesktop.value = window.innerWidth >= 1024;
};

/* ---------------- INIT ---------------- */
onMounted(() => {
  store.connectSocket();

  checkScreen();

  window.addEventListener("resize", checkScreen);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkScreen);
});

/* ---------------- SERVERS ---------------- */
const servers = computed(() => store.servers || []);

const isOpen = (id) => {
  return isDesktop.value ? true : openServers.value[id];
};

const toggleServer = (id) => {
  if (isDesktop.value) return;

  openServers.value[id] = !openServers.value[id];
};

/* ---------------- FLAGS ---------------- */
const flagUrl = (code) =>
  code && code !== "XX" ? `https://flagcdn.com/24x18/${code.toLowerCase()}.png` : "";

/* ---------------- STATUS COLORS ---------------- */
const getJailStatusColor = (count) => {
  if (count === 0) return "bg-green-500";

  if (count <= 80) return "bg-yellow-400";

  return "bg-red-500";
};

/* ---------------- SERVER STATUS ---------------- */
const getServerStatusText = (status) => {
  if (status === "active") return "RUNNING";

  if (status === "inactive") return "STOPPED";

  return "ERROR";
};

const getServerStatusColor = (status) => {
  if (status === "active") return "text-green-400";

  if (status === "inactive") return "text-yellow-400";

  return "text-red-400";
};

/* ---------------- ALERTAS ---------------- */
const getServerAlerts = (server) =>
  (server.jails || []).reduce((acc, jail) => acc + (jail.geoBannedIPs?.length || 0), 0);

/* ---------------- ACTIONS ---------------- */
const sendAction = async (server, action) => {
  try {
    loadingAction.value[server.serverId] = action;

    await store.control(server.serverId, action);

    setTimeout(() => {
      store.refresh();
    }, 1000);
  } catch (e) {
    console.error(e);

    alert(`Error ejecutando ${action}`);
  } finally {
    loadingAction.value[server.serverId] = null;
  }
};
</script>

<template>
  <!-- GRID SERVERS -->
  <div
    class="w-full max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  >
    <!-- SERVER CARD -->
    <div
      v-for="server in servers"
      :key="server.serverId"
      class="bg-slate-900 text-white rounded-xl border border-slate-700 flex flex-col"
    >
      <!-- HEADER -->
      <div class="p-4 border-b border-slate-700">
        <div class="flex justify-between items-start gap-4">
          <!-- LEFT -->
          <div class="flex items-start gap-3">
            <span class="text-xl">🖥️</span>

            <div>
              <!-- SERVER NAME -->
              <div class="font-semibold text-sm">
                {{ server.serverName }}
              </div>

              <!-- STATUS -->
              <div class="text-xs text-slate-400 flex items-center gap-2 mt-1">
                Estado:

                <span
                  :class="getServerStatusColor(server.status)"
                  class="flex items-center gap-2 font-semibold"
                >
                  <span class="w-2 h-2 rounded-full bg-current animate-ping"></span>

                  {{ getServerStatusText(server.status) }}
                </span>
              </div>

              <!-- CONTENEDOR PRINCIPAL: Forzamos línea horizontal con flex-row y evitamos que se rompa con no-wrap -->
              <div class="mt-2 flex flex-row flex-nowrap items-center gap-4">
                <!-- Bloque 1: Alertas (🚨) -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="text-red-400 text-base">🚨</span>
                  <span
                    class="px-2 py-0.5 rounded-full font-bold text-[10px] animate-pulse text-white"
                    :class="getJailStatusColor(getServerAlerts(server))"
                  >
                    {{ getServerAlerts(server) }} alerts
                  </span>
                </div>

                <!-- Bloque 2: Jails (🔒) - Ahora correctamente DENTRO del contenedor horizontal -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="text-amber-500 text-base">🔒</span>
                  <!-- Icono también a juego si quieres -->
                  <span
                    class="px-2 py-0.5 rounded-full font-bold text-[10px] text-white bg-amber-500"
                  >
                    {{ server.jails?.length || 0 }} jails
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- ACTIONS -->
          <div class="flex gap-1 flex-wrap justify-end">
            <!-- START -->
            <button
              class="bg-green-600 hover:bg-green-500 transition px-2 py-1 rounded text-xs disabled:opacity-50"
              :disabled="loadingAction[server.serverId]"
              @click="sendAction(server, 'start')"
            >
              {{ loadingAction[server.serverId] === "start" ? "..." : "Start" }}
            </button>

            <!-- STOP -->
            <button
              class="bg-red-600 hover:bg-red-500 transition px-2 py-1 rounded text-xs disabled:opacity-50"
              :disabled="loadingAction[server.serverId]"
              @click="sendAction(server, 'stop')"
            >
              {{ loadingAction[server.serverId] === "stop" ? "..." : "Stop" }}
            </button>

            <!-- RESTART -->
            <button
              class="bg-yellow-500 hover:bg-yellow-400 transition px-2 py-1 rounded text-xs disabled:opacity-50"
              :disabled="loadingAction[server.serverId]"
              @click="sendAction(server, 'restart')"
            >
              {{ loadingAction[server.serverId] === "restart" ? "..." : "Restart" }}
            </button>
          </div>
        </div>

        <!-- TOGGLE MOBILE -->
        <div v-if="!isDesktop" class="flex justify-end mt-3">
          <button
            class="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-xs transition"
            @click="toggleServer(server.serverId)"
          >
            {{ isOpen(server.serverId) ? "Ocultar ▲" : "Ver ▼" }}
          </button>
        </div>
      </div>

      <!-- CONTENT -->
      <div v-if="isOpen(server.serverId)" class="p-3 space-y-3">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <!-- JAIL -->
          <div
            v-for="jail in server.jails"
            :key="jail.name"
            class="bg-slate-800 rounded-lg p-3 border border-slate-700"
          >
            <!-- JAIL HEADER -->
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-semibold text-slate-300">
                🔒 {{ jail.name }}
              </span>

              <div class="flex items-center gap-2">
                <span
                  class="w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-full text-white animate-pulse"
                  :class="getJailStatusColor(jail.geoBannedIPs?.length || 0)"
                >
                  {{ jail.geoBannedIPs?.length || 0 }}
                </span>

                <span class="text-[10px] text-slate-400"> IPs </span>
              </div>
            </div>

            <!-- IPS -->
            <div class="max-h-40 overflow-y-auto space-y-2 pr-1">
              <div
                v-for="ip in jail.geoBannedIPs"
                :key="ip.ip"
                class="bg-slate-900 border border-slate-700 rounded-md p-2"
              >
                <div class="font-mono text-white text-xs break-all">
                  {{ ip.ip }}
                </div>

                <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                  <img
                    v-if="ip.countryCode"
                    :src="flagUrl(ip.countryCode)"
                    class="w-4 h-3 rounded-sm"
                  />

                  <span> {{ ip.country }} · {{ ip.city }} </span>
                </div>
              </div>

              <!-- SIN IPS -->
              <div
                v-if="!jail.geoBannedIPs?.length"
                class="text-xs text-slate-500 italic"
              >
                No banned IPs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- EMPTY -->
    <div
      v-if="servers.length === 0"
      class="text-slate-400 text-sm col-span-full text-center py-10"
    >
      No hay servidores conectados
    </div>
  </div>
</template>
