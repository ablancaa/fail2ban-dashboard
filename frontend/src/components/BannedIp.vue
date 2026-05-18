<script setup>
import { ref, computed, onMounted } from "vue";
import { useFail2BanStore } from "../stores/fail2ban";
//import { AlertTriangle } from "lucide-vue-next";

const store = useFail2BanStore();

const openServers = ref({});
const unbanLoading = ref({});

onMounted(() => {
  store.connectSocket();
});

// 📦 datos
const servers = computed(() => store.servers);

// 🔥 flatten IPs por servidor (SIN jails visibles)
const getServerIps = (server) => {
  const ips = [];

  for (const jail of server.jails || []) {
    for (const ip of jail.geoBannedIPs || []) {
      ips.push({
        ...ip,
        jail: jail.name,
        server: server.serverName,
      });
    }
  }

  return ips;
};

// 🔢 contador por servidor
const getTotalIps = (server) => getServerIps(server).length;

// toggle
const toggleServer = (id) => {
  openServers.value[id] = !openServers.value[id];
};

// 🌍 bandera real (imagen)
const flagUrl = (code) =>
  code ? `https://flagcdn.com/24x18/${code.toLowerCase()}.png` : "";

// 🚫 unban
const handleUnban = async (item) => {
  if (!item.jail) return;

  unbanLoading.value[item.ip] = true;

  try {
    await store.unbanIP(item.jail, item.ip);
    await store.refresh();
  } finally {
    unbanLoading.value[item.ip] = false;
  }
};
</script>

<template>
  <div class="w-full max-w-7xl mx-auto space-y-4">
    <!-- SERVIDORES -->
    <div
      v-for="server in servers"
      :key="server.serverId"
      class="bg-slate-900 text-white rounded-xl border border-slate-700"
    >
      <!-- HEADER -->
      <div
        class="flex justify-between items-center px-4 py-3 cursor-pointer"
        @click="toggleServer(server.serverId)"
      >
        <div class="flex items-center gap-3">
          🖥️
          <span class="font-semibold">
            {{ server.serverName }}
          </span>

          <!-- 🔴 contador -->
          <span
            class="bg-red-600 text-white text-xs font-bold w-9 h-7 flex items-center justify-center rounded-full"
          >
            {{ getTotalIps(server) }}
          </span>
        </div>

        <div>
          {{ openServers[server.serverId] ? "▲" : "▼" }}
        </div>
      </div>

      <!-- CONTENT -->
      <div v-if="openServers[server.serverId]" class="p-4">
        <!-- GRID IPS -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <div
            v-for="ip in getServerIps(server)"
            :key="ip.id"
            class="bg-slate-800 rounded-xl p-3 border border-slate-700"
          >
            <!-- IP + FLAG -->
            <div class="flex items-center gap-2 mb-2">
              <img
                v-if="ip.countryCode"
                :src="flagUrl(ip.countryCode)"
                class="w-5 h-4 rounded-sm"
              />

              <span class="font-mono text-sm">
                {{ ip.ip }}
              </span>
            </div>

            <!-- DATOS -->
            <div class="text-xs text-slate-300 space-y-1">
              <div>🌍 {{ ip.country }} ({{ ip.city }})</div>
              <div>📍 {{ ip.lat?.toFixed(2) }}, {{ ip.lon?.toFixed(2) }}</div>
              <div>🔒 Jail: {{ ip.jail }}</div>
              <div>🖥️ Server: {{ ip.server }}</div>
            </div>

            <!-- UNBAN -->
            <button
              @click="handleUnban(ip)"
              :disabled="unbanLoading[ip.ip]"
              class="mt-2 w-full bg-red-600 hover:bg-red-700 text-xs py-1 rounded disabled:opacity-50"
            >
              {{ unbanLoading[ip.ip] ? "..." : "UNBAN" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
