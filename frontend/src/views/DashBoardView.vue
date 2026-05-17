<template>
  <div class="max-w-6xl mx-auto p-4">
    <h1 class="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2">
      <img src="/src/assets/Fail2ban_logo.png" class="w-25 h-20" />
      Fail2Ban Dashboard
    </h1>

    <!-- STATUS BAR -->
    <div
      class="bg-white rounded-xl shadow p-4 mb-4 flex justify-between items-center flex-wrap gap-3"
    >
      <div class="flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full animate-pulse"
          :class="{
            'bg-green-500': serviceStatus === 'running',
            'bg-red-500': serviceStatus === 'stopped',
            'bg-yellow-400': serviceStatus === 'error',
            'bg-gray-400': serviceStatus === 'loading',
          }"
        />
        <span class="font-semibold">
          Fail2Ban:
          {{
            serviceStatus === "running"
              ? "Activo"
              : serviceStatus === "stopped"
              ? "Parado"
              : serviceStatus === "error"
              ? "Error"
              : "Cargando..."
          }}
        </span>
      </div>
    </div>

    <!-- CLOCK -->
    <div class="mb-4 font-mono text-sm bg-white p-2 rounded shadow w-fit">
      🕒 {{ clock }}
    </div>

    <!-- TABLE -->
    <div class="bg-white rounded-xl shadow p-4 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b">
            <th class="text-left p-2">Jail</th>
            <th class="text-left p-2">IPs baneadas</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="jail in store.jails" :key="jail.jail" class="border-b">
            <td class="p-2 font-semibold">
              {{ jail.jail }}
              <span class="text-xs text-gray-500">({{ jail.server }})</span>
            </td>

            <!-- IP LIST -->
            <td class="p-2">
              <div class="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-2">
                <div
                  v-for="ip in jail.bannedIPs"
                  :key="ip"
                  class="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs"
                >
                  <!-- FLAG -->
                  <img
                    :src="`https://flagcdn.com/24x18/${
                      getGeo(ip)?.countryCode?.toLowerCase() || 'xx'
                    }.png`"
                    class="w-4 h-3"
                  />

                  <span class="font-mono">{{ ip }}</span>

                  <button
                    class="ml-1 text-[10px] bg-red-500 text-white px-1 rounded"
                    @click="unbanIP(jail.jail, ip)"
                  >
                    unBan
                  </button>
                </div>

                <span v-if="!jail.bannedIPs?.length" class="text-gray-400 text-xs">
                  Sin IPs
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TOTAL -->
    <div class="mt-4 font-semibold">Total IPs: {{ totalBanned }}</div>
    <div class="mt-6 bg-white rounded-xl shadow p-4">
      <h2 class="font-semibold mb-2">IPs bloqueadas por Jail</h2>

      <div class="h-64">
        <canvas id="chart"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useFail2BanStore } from "@/stores/fail2ban";
import axios from "axios";
import Chart from "chart.js/auto";

const store = useFail2BanStore();

const API = "http://192.168.1.137:3000";

const serviceStatus = ref("loading");
const clock = ref("");
let chart = null;

const geoCache = ref({});

/* ---------------- CLOCK ---------------- */
setInterval(() => {
  clock.value = new Date().toLocaleString();
}, 1000);

/* ---------------- GEO ---------------- */
const getGeo = (ip) => geoCache.value[ip] || null;

const loadGeo = async () => {
  const ips = new Set();

  store.jails.forEach((j) => j.bannedIPs?.forEach((ip) => ips.add(ip)));

  for (const ip of ips) {
    if (!geoCache.value[ip]) {
      try {
        const res = await axios.get(`${API}/api/geo/${ip}`);
        geoCache.value[ip] = res.data;
      } catch {}
    }
  }
};

/* ---------------- STATUS ---------------- */
const fetchStatus = async () => {
  try {
    const res = await axios.get(`${API}/api/service-status`);
    serviceStatus.value = res.data.status || "error";
  } catch {
    serviceStatus.value = "error";
  }
};

/* ---------------- TOTAL ---------------- */
const totalBanned = computed(() =>
  store.jails.reduce((a, j) => a + (j.bannedIPs?.length || 0), 0)
);

/* ---------------- CHART ---------------- */
const initChart = () => {
  const ctx = document.getElementById("chart");

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            "#ef4444",
            "#3b82f6",
            "#f59e0b",
            "#10b981",
            "#8b5cf6",
            "#ec4899",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

/* 🔥 UPDATE CHART */
const updateChart = () => {
  if (!chart || !store.jails) return;

  chart.data.labels = store.jails.map((j) => j.jail);
  chart.data.datasets[0].data = store.jails.map((j) => j.bannedIPs?.length || 0);
  chart.update();
};

/* ---------------- UNBAN ---------------- */
const unbanIP = async (jail, ip) => {
  try {
    await axios.post(`${API}/api/unban`, { jail, ip });
    store.socket?.emit("refresh");
  } catch (e) {
    console.error(e);
  }
};

/* ---------------- INIT ---------------- */
onMounted(() => {
  store.connectSocket();
  fetchStatus();

  setInterval(fetchStatus, 5000);

  setTimeout(() => {
    loadGeo();
    initChart();
    updateChart();
  }, 800);
});

/* 🔥 REACTIVITY FIX FOR CHART */
store.$subscribe(() => {
  updateChart();
});
</script>
