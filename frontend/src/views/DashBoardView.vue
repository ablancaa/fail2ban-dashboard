<template>
  <!-- Contenedor principal con fondo gris y padding -->

  <!-- Contenedor centrado con ancho máximo -->
  <div class="max-w-6xl mx-auto">
    <!-- NavBar: componente de navegación con los jails -->
    <!-- <NavBar :jails="store.jails" /> -->

    <!-- Título principal con logo -->
    <h1 class="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2">
      <img src="/src/assets/Fail2ban_logo.png" class="w-25 h-20" /> Fail2Ban Dashboard
    </h1>

    <!-- ==================== PANEL DE CONTROL ==================== -->
    <!-- Control Fail2Ban: botones para iniciar/detener/reiniciar el servicio -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4 flex items-center justify-between flex-wrap gap-3"
    >
      <!-- Indicador de estado con color dinámico -->
      <div class="flex items-center gap-2">
        <!-- Círculo de estado: verde (running), rojo (stopped), amarillo (error), gris (loading) -->
        <div
          class="w-3 h-3 rounded-full animate-pulse"
          :class="{
            'bg-green-500': serviceStatus === 'running',
            'bg-red-500': serviceStatus === 'stopped',
            'bg-yellow-400': serviceStatus === 'error',
            'bg-gray-400': serviceStatus === 'loading',
          }"
        ></div>

        <!-- Texto del estado -->
        <span class="font-semibold text-gray-700 dark:text-gray-200">
          Estado Fail2Ban:
          <span v-if="serviceStatus === 'running'">Activo</span>
          <span v-if="serviceStatus === 'stopped'">Parado</span>
          <span v-if="serviceStatus === 'error'">Problema</span>
          <span v-if="serviceStatus === 'loading'">Comprobando...</span>
        </span>
      </div>

      <!-- Botones de control del servicio -->
      <div class="flex gap-2">
        <!-- Botón verde: iniciar servicio -->
        <button
          @click="startService"
          class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"
        >
          <Play size="16" /> Iniciar
        </button>

        <!-- Botón amarillo: reiniciar servicio -->
        <button
          @click="restartService"
          class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded flex items-center gap-1"
        >
          <RotateCw size="16" /> Reiniciar
        </button>

        <!-- Botón rojo: detener servicio -->
        <button
          @click="stopService"
          class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
        >
          <Square size="16" /> Parar
        </button>
      </div>
    </div>

    <!-- ==================== RELOJ ==================== -->
    <!-- Reloj que muestra la fecha/hora actual -->
    <div
      class="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow text-black dark:text-white font-mono text-sm"
    >
      <span class="animate-pulse">🕒</span>
      <span class="text-lg font-bold">{{ clock }} </span>
    </div>
    <br />
    <!-- ==================== COMPONENTES ADICIONALES ==================== -->
    <!-- Grid de 2 columnas: Logs y Configuración -->
    <div class="grid grid-cols-1 gap-2 md:grid-cols-1">
      <!-- Componente Logs: muestra el historial de logs -->
      <div class="grid-cols-1 md:grid-cols-1 rounded-xs shadow p-0">
        <BannedIp />
      </div>
    </div>
    <br />
    <!-- ==================== TABLA DE JAILS ==================== -->
    <!-- Tabla que muestra los jails y sus IPs bloqueadas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-6">
      <!-- TABLA -->
      <div class="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <!-- TU TABLA COMPLETA AQUÍ -->
        <div class="bg-white rounded-xl shadow p-4 mb-6 overflow-x-auto">
          <table class="w-full text-sx md:text-base">
            <!-- Encabezados de la tabla -->
            <thead>
              <tr class="border-b">
                <th class="text-left p-1">Jail</th>
                <!-- <th class="text-left p-1">IPs bloqueadas</th> -->
                <th class="text-left p-1">Lista IPs</th>
              </tr>
            </thead>
            <!-- Cuerpo de la tabla: fila por cada jail -->
            <tbody>
              <tr v-for="jail in store.jails" :key="jail.jail" class="border-b">
                <!-- Nombre del jail -->
                <td class="p-2 font-medium">{{ jail.jail }}</td>
                <!-- Cantidad de IPs baneadas -->
                <!-- <td class="p-2">{{ jail.bannedCount }}</td> -->
                <!-- Lista de IPs con botón para desbloquear -->
                <td class="p-2">
                  <div class="flex flex-wrap gap-1">
                    <!-- Itera sobre cada IP baneada -->
                    <span
                      v-for="ip in jail.banned"
                      :key="ip"
                      :class="[
                        'bg-red-100 text-red-700 px-2 py-1 rounded text-xs flex items-center transition',
                        // Resalta IPs recientemente baneadas con color amarillo
                        newlyBanned[jail.jail]?.includes(ip)
                          ? 'bg-yellow-200 text-yellow-800 animate-pulse'
                          : '',
                      ]"
                    >
                      <!-- Bandera y país -->
                      <span v-if="geoData[ip]" class="mr-1">
                        <img
                          :src="`https://flagcdn.com/24x18/${geoData[
                            ip
                          ].countryCode.toLowerCase()}.png`"
                        />
                        <!-- {{ getFlagEmoji(geoData[ip].countryCode) }} - -->
                        {{ geoData[ip].country }}
                      </span>
                      {{ ip }}
                      <!-- Botón para desbloquear (Unban) -->
                      <button
                        @click="unbanIP(jail.jail, ip)"
                        class="ml-1 bg-red-500 text-white rounded px-1 py-0.5 text-[0.65rem] hover:bg-red-600"
                      >
                        Unban
                      </button>
                    </span>
                    <!-- Mensaje cuando no hay IPs baneadas -->
                    <span v-if="jail.banned.length === 0" class="text-gray-500 text-xs">
                      <OctagonMinus color="#FF2400" size="16" class="mr-1" />
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mb-4 text-lg font-semibold">
          Total de IPs baneadas: {{ totalBanned }}
        </div>
      </div>

      <!-- GRÁFICO -->
      <div class="bg-white rounded-xl shadow p-4">
        <h2 class="font-semibold mb-2">IPs bloqueadas por Jail</h2>

        <div class="h-64">
          <canvas id="chart"></canvas>
        </div>
      </div>
    </div>

    <!-- ==================== COMPONENTES ADICIONALES ==================== -->
    <!-- Grid de 2 columnas: Logs y Configuración -->
    <!-- <div class="grid grid-cols-1 gap-2 md:grid-cols-2"> -->
    <!-- Componente Logs: muestra el historial de logs -->

    <!-- <div class="bg-white rounded-xs shadow p-4"> -->
    <!-- <LogsHistory /> -->
    <!-- </div> -->

    <!-- Componente JailConfig: muestra la configuración de los jails -->
    <!-- <div class="bg-white rounded-xs shadow p-4"> -->
    <!-- <JailConfig /> -->
    <!-- </div> -->
    <!-- </div> -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { Play, RotateCw, Square, OctagonMinus } from "lucide-vue-next";
import Chart from "chart.js/auto";
import axios from "axios";
import { useFail2BanStore } from "@/stores/fail2ban";

import NavBar from "@/components/NavBar.vue";
import BannedIp from "@/components/BannedIp.vue";
import JailConfig from "@/components/JailConfig.vue";
import LogsHistory from "@/components/LogsHistory.vue";
import router from "@/router";

const store = useFail2BanStore();

// ================= STATE =================
const serviceStatus = ref("loading");
const clock = ref("");
let chart = ref(null);

// 🔥 GEO SIMPLE (OBJETO NORMAL, SIN MAP, SIN PROBLEMAS)
const geoData = ref({});

// ================= COMPUTED =================
const jails = computed(() => store.jails || []);
const totalBanned = computed(() => store.totalBanned || 0);
const newlyBanned = computed(() => store.newlyBanned || {});

// ================= INIT =================
onMounted(() => {
  store.connectSocket();

  fetchServiceStatus();
  updateClock();

  const ctx = document.getElementById("chart");

  if (!ctx) return;

  chart = new Chart(ctx, {
    type: "pie", // 🔥 AQUÍ el cambio clave
    data: {
      labels: [],
      datasets: [
        {
          label: "IPs bloqueadas",
          data: [],
          backgroundColor: [
            "#ef4444",
            "#3b82f6",
            "#f59e0b",
            "#10b981",
            "#8b5cf6",
            "#ec4899",
            "#14b8a6",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
  setInterval(updateClock, 1000);
  setInterval(fetchServiceStatus, 5000);
});

watch(
  () => store.jails,
  (newData) => {
    chart.data.labels = newData.map((j) => j.jail);
    chart.data.datasets[0].data = newData.map((j) => j.bannedCount);
    chart.update();
  },
  { deep: true }
);
onUnmounted(() => {
  if (chart.value) chart.value.destroy?.();
});

// ================= CLOCK =================
const updateClock = () => {
  clock.value = new Date().toLocaleString();
};

// ================= GEO =================
async function getCountry(ip) {
  try {
    if (!ip) return { country: "Unknown", countryCode: "XX" };

    // cache simple
    if (geoData.value[ip]) return geoData.value[ip];

    const res = await axios.get(`http://192.168.1.137:3000/api/geo/${ip}`);

    const data = {
      country: res.data?.country || "Unknown",
      countryCode: res.data?.countryCode || "XX",
    };

    geoData.value[ip] = data;

    return data;
  } catch (err) {
    console.error("Geo error backend:", ip);

    return {
      country: "Unknown",
      countryCode: "XX",
    };
  }
}

watch(
  () => store.jails,
  async (val) => {
    if (!val) return;

    const clean = JSON.parse(JSON.stringify(val));

    const ips = new Set();

    clean.forEach((jail) => {
      jail.banned?.forEach((ip) => {
        if (ip) ips.add(ip);
      });
    });

    for (const ip of ips) {
      await getCountry(ip);
    }
  },
  { deep: true }
);

async function fetchGeoData(jailsData) {
  const ips = new Set();

  jailsData.forEach((jail) => {
    jail.banned?.forEach((ip) => {
      if (typeof ip === "string") ips.add(ip);
    });
  });

  for (const ip of ips) {
    if (!geoData.value[ip]) {
      await getCountry(ip);
    }
  }
}

// ================= WATCH =================
watch(
  () => store.jails,
  async (val) => {
    if (!val) return;
    await fetchGeoData(JSON.parse(JSON.stringify(val)));
  },
  { deep: false }
);

// ================= FLAGS =================
function getFlagEmoji(code) {
  if (!code || typeof code !== "string") return "🌍";

  if (code.length !== 2) return "🌍";

  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))
  );
}

// ================= SERVICE =================
const fetchServiceStatus = async () => {
  try {
    const res = await axios.get("http://192.168.1.137:3000/api/service-status");

    const status = res.data?.status;

    serviceStatus.value =
      status === "running" ? "running" : status === "stopped" ? "stopped" : "error";
  } catch {
    serviceStatus.value = "error";
  }
};

// ================= UNBAN =================
const unbanIP = async (jail, ip) => {
  try {
    const res = await axios.post("http://192.168.1.137:3000/api/unban", {
      jail,
      ip,
    });

    if (res.data?.success) {
      store.socket?.emit("refresh");
    }
  } catch (e) {
    console.error(e);
  }
};
</script>

<style>
/* ==================== ANIMACIONES ==================== */
/* Animación de pulso para indicadores visuales */
.animate-pulse {
  animation: pulse 1.5s infinite;
}

/* Definición de keyframes para la animación pulse */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* ==================== RESPONSIVE ==================== */
/* Ajusta el tamaño de fuente en dispositivos pequeños */
@media (max-width: 640px) {
  table {
    font-size: 0.75rem;
  }
}
</style>
