<template>
  <!-- Contenedor principal con fondo gris y padding -->
  <div class="min-h-screen bg-gray-100 p-4">
    <!-- Contenedor centrado con ancho máximo -->
    <div class="max-w-6xl mx-auto">
      <!-- NavBar: componente de navegación con los jails -->
      <NavBar :jails="jails" />
      <br />

      <!-- Título principal con logo -->
      <h1 class="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2">
        <img src="../src/assets/Fail2ban_logo.png" class="w-20 h-20" />
        Fail2Ban Dashboard
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

      <!-- ==================== TABLA DE JAILS ==================== -->
      <!-- Tabla que muestra los jails y sus IPs bloqueadas -->
      <div class="bg-white rounded-xl shadow p-4 mb-6 overflow-x-auto">
        <table class="w-full text-sm md:text-base">
          <!-- Encabezados de la tabla -->
          <thead>
            <tr class="border-b">
              <th class="text-left p-2">Jail</th>
              <th class="text-left p-2">IPs bloqueadas</th>
              <th class="text-left p-2">Lista IPs</th>
            </tr>
          </thead>
          <!-- Cuerpo de la tabla: fila por cada jail -->
          <tbody>
            <tr v-for="jail in jails" :key="jail.jail" class="border-b">
              <!-- Nombre del jail -->
              <td class="p-2 font-medium">{{ jail.jail }}</td>
              <!-- Cantidad de IPs baneadas -->
              <td class="p-2">{{ jail.bannedCount }}</td>
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
                    <OctagonMinus size="16" class="mr-1" />
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Total de IPs baneadas -->
        <div class="mb-4 text-lg font-semibold">
          <br />
          Total de IPs baneadas: {{ totalBanned }}
        </div>
      </div>

      <!-- ==================== GRÁFICO ==================== -->
      <!-- Gráfico de barras con las IPs bloqueadas por cada jail -->
      <div class="bg-white rounded-xl shadow p-4">
        <h2 class="font-semibold mb-2">IPs bloqueadas por Jail</h2>
        <div class="h-64">
          <canvas id="chart"></canvas>
        </div>
      </div>
      <br />

      <!-- ==================== COMPONENTES ADICIONALES ==================== -->
      <!-- Grid de 2 columnas: Logs y Configuración -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <!-- Componente Logs: muestra el historial de logs -->
        <div class="bg-white rounded-xl shadow p-4">
          <Logs />
        </div>
        <!-- Componente JailConfig: muestra la configuración de los jails -->
        <div class="bg-white rounded-xl shadow p-4">
          <JailConfig />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ==================== IMPORTACIONES ====================
// Vue: funciones reactivas para gestionar estado
import { ref, onMounted, onUnmounted, reactive, computed, watch, nextTick } from "vue";

// Iconos de Lucide (biblioteca de iconos)
import { Play, RotateCw, Square, OctagonMinus } from "lucide-vue-next";

// Socket.io: cliente WebSocket para comunicación en tiempo real
import io from "socket.io-client";

// Chart.js: librería para generar gráficos
import Chart from "chart.js/auto";

// Axios: cliente HTTP para hacer peticiones REST
import axios from "axios";

// Pinia: store para gestionar estado global
import { useFail2BanStore } from "./stores/fail2ban";

// Componentes Vue
import NavBar from "./components/NavBar.vue";
import Logs from "./components/Logs.vue";
import JailConfig from "./components/JailConfig.vue";

// ==================== VARIABLES REACTIVAS ====================
// alerts: contador de alertas recibidas
const alerts = ref(0);
// store: instancia del store de Pinia
const store = useFail2BanStore();
// serviceStatus: estado actual del servicio (loading/running/stopped/error)
const serviceStatus = ref("loading");
// uptimeChart: referencia al gráfico de uptime
const uptimeChart = ref(null);
// uptimeData: datos históricos del uptime
const uptimeData = ref([]);
// clock: cadena con la fecha/hora actual
const clock = ref("");
// timer: referencia al intervalo del reloj
let timer = null;
// cache: almacenamiento temporal para resultados de geolocalización IP
const cache = {};

// ==================== FUNCIONES AUXILIARES ====================
// getCountry: obtiene información del país de una IP usando ip-api.com
async function getCountry(ip) {
  if (cache[ip]) return cache[ip]; // Si ya está en cache, retorna

  const res = await axios.get(`http://ip-api.com/json/${ip}`);
  cache[ip] = res.data; // Guarda en cache para futuras consultas

  return res.data;
}

// ==================== CICLO DE VIDA ====================
// onMounted: se ejecuta cuando el componente se monta en el DOM
onMounted(() => {
  // Conecta al store de Pinia (WebSocket)
  store.connectSocket();

  // Destruye gráfico anterior si existe
  if (chart.value) {
    chart.value.destroy();
  }

  // Obtiene estado inicial del servicio
  fetchServiceStatus();

  // Actualiza estado del servicio cada 5 segundos
  setInterval(fetchServiceStatus, 5000);

  // Inicializa gráfico de uptime
  updateUptimeChart();

  // Inicia el reloj
  updateClock();
  timer = setInterval(updateClock, 1000);
});

// onUnmounted: se ejecuta cuando el componente se desmonta
onUnmounted(() => {
  clearInterval(timer); // Limpia el intervalo del reloj
});

// watch: observa cambios en serviceStatus para notificar al usuario
watch(serviceStatus, (newVal) => {
  if (newVal === "stopped") {
    new Notification("Fail2Ban parado", {
      body: "El servicio fail2ban se ha detenido",
    });
  }
});

// ==================== ACTUALIZACIÓN DEL RELOJ ====================
// updateClock: actualiza la variable clock con la fecha/hora actual
const updateClock = () => {
  const now = new Date();
  clock.value = now.toLocaleString();
};

// ==================== CONSULTA DE ESTADO DEL SERVICIO ====================
// fetchServiceStatus: obtiene el estado de Fail2Ban desde el backend
const fetchServiceStatus = async () => {
  try {
    // Petición GET al endpoint del backend
    const res = await axios.get("http://192.168.1.137:3000/api/service-status");

    // Normaliza el estado: limpia espacios y convierte a minúsculas
    const status = (res.data.status || "").toLowerCase().trim();

    // Actualiza la variable reactiva según el estado recibido
    if (status === "running" || status === "active") {
      serviceStatus.value = "running";
    } else if (status === "stopped" || status === "inactive") {
      serviceStatus.value = "stopped";
    } else {
      serviceStatus.value = "error";
    }
  } catch (e) {
    console.error(e);
    serviceStatus.value = "error";
  }
};

// ==================== DATOS DE JAILS ====================
// jails: array reactivo que almacena los jails y sus IPs baneadas
const jails = ref([]);
// chart: referencia al gráfico de Chart.js
const chart = ref(null);
// newlyBanned: objeto reactivo para rastrear IPs recientemente baneadas (efecto visual)
const newlyBanned = reactive({});
// notifiedIPs: Set para rastrear IPs ya notificadas (evita duplicados)
const notifiedIPs = ref(new Set());

// ==================== CONEXIÓN WEBSOCKET ====================
// socket: conexión WebSocket al servidor backend
const socket = io("http://192.168.1.137:3000");

// Solicita permiso para notificaciones del navegador si no está concedido
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// ==================== FUNCIÓN DE DESBANEO ====================
// unbanIP: envía solicitud al backend para desbloquear una IP
const unbanIP = async (jail, ip) => {
  try {
    const res = await axios.post("http://192.168.1.137:3000/api/unban", { jail, ip });
    if (res.data.success) {
      alert(`IP ${ip} desbloqueada en jail ${jail}`);
      socket.emit("refresh"); // Solicita actualización inmediata
    }
  } catch (err) {
    console.error(err);
    alert("Error al desbloquear IP");
  }
};

// ==================== COMPUTED PROPERTIES ====================
// totalBanned: calcula el total de IPs baneadas sumando todos los jails
const totalBanned = computed(() => {
  return jails.value.reduce((acc, jail) => acc + jail.bannedCount, 0);
});

// ==================== GRÁFICOS ====================
// updateChart: crea o actualiza el gráfico de barras con las IPs baneadas por jail
const updateChart = async (data) => {
  await nextTick(); // Espera a que el DOM esté actualizado

  const ctx = document.getElementById("chart");
  if (!ctx) return;

  // Extrae labels y datos para el gráfico
  const labels = data.map((d) => d.jail);
  const counts = data.map((d) => d.bannedCount);

  // Verificar si ya existe un gráfico en este canvas y destruirlo
  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }

  // Destruye gráfico anterior si existe en nuestra referencia
  if (chart.value) {
    chart.value.destroy();
    chart.value = null;
  }

  // Crea nuevo gráfico de barras
  chart.value = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [...labels],
      datasets: [
        {
          label: "IPs bloqueadas",
          data: [...counts],
          backgroundColor: "rgba(220,38,38,0.7)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: true, // Desactiva animaciones para mejor rendimiento
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    },
  });
};

// ==================== EVENTOS WEBSOCKET ====================
// Evento 'status': recibe actualización del estado de todos los jails
socket.on("status", (data) => {
  jails.value = data;
  updateChart(data);
});

// Evento 'alert': recibe notificación de nuevas IPs bloqueadas
socket.on("alert", ({ jail, ips }) => {
  // Filtra solo IPs que no han sido notificadas previamente
  const newAlertIPs = ips.filter((ip) => {
    const key = `${jail}:${ip}`;
    if (notifiedIPs.value.has(key)) return false;
    notifiedIPs.value.add(key);
    return true;
  });

  // Si no hay nuevas IPs, no hace nada
  if (newAlertIPs.length === 0) return;

  // Actualiza estado para mostrar efecto visual
  newlyBanned[jail] = ips;
  alerts.value = newAlertIPs.length;
  store.alerts = newAlertIPs.length;
  console.log(`Alerta recibida para jail ${jail}:`, newAlertIPs);

  // Muestra notificación del navegador si hay permiso
  if ("Notification" in window && Notification.permission === "granted") {
    newAlertIPs.forEach((ip) => {
      new Notification(`Fail2Ban Alert`, {
        body: `Nueva IP bloqueada: ${ip} en jail ${jail}`,
        icon: "/favicon.ico",
      });
    });
  }

  // Limpia el efecto visual después de 5 segundos
  setTimeout(() => {
    newlyBanned[jail] = [];
  }, 5000);
});

// ==================== CONTROL DEL SERVICIO ====================
// startService: inicia el servicio de Fail2Ban
const startService = async () => {
  await axios.post("http://192.168.1.137:3000/api/service-start");
  setTimeout(fetchServiceStatus, 500);
};

// stopService: detiene el servicio de Fail2Ban
const stopService = async () => {
  await axios.post("http://192.168.1.137:3000/api/service-stop");
  setTimeout(fetchServiceStatus, 500);
};

// restartService: reinicia el servicio de Fail2Ban
const restartService = async () => {
  await axios.post("http://192.168.1.137:3000/api/service-restart");
  setTimeout(fetchServiceStatus, 500);
};

// ==================== GRÁFICO DE UPTIME ====================
// updateUptimeChart: crea o actualiza el gráfico de estado del servicio
const updateUptimeChart = () => {
  const ctx = document.getElementById("uptimeChart");
  if (!ctx) return;

  const labels = uptimeData.value.map((d) => d.time);
  const values = uptimeData.value.map((d) => d.value);

  if (!uptimeChart.value) {
    uptimeChart.value = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            label: "Activo",
            data: values,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        scales: {
          y: {
            ticks: {
              callback: (v) => (v === 1 ? "Activo" : "Parado"),
            },
            min: 0,
            max: 1,
          },
        },
      },
    });
  } else {
    uptimeChart.value.data.labels = labels;
    uptimeChart.value.data.datasets[0].data = values;
    uptimeChart.value.update();
  }
};

// ==================== MODO OSCURO ====================
// Detecta preferencia del sistema y aplica clase 'dark' si corresponde
if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.classList.add("dark");
}
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
