<script setup>
import { ref, onMounted, watch } from "vue";
import { useFail2BanStore } from "../stores/fail2ban";

const store = useFail2BanStore();
const open = ref(false);

// Usar store directamente en lugar de computed
let logs = ref([]);
let jails = ref([]);

onMounted(() => {
  store.fetchBans();
});

// Sincronizar con el store
const syncLogs = () => {
  logs.value = store.logs;
  jails.value = store.jails;
};

// Watch para detectar cambios en los logs y actualizar automáticamente
watch(
  () => store.logs,
  (newLogs) => {
    logs.value = [...newLogs]; // Forzar nueva referencia
  },
  { deep: true }
);

// Sincronización inicial
syncLogs();

const toggle = () => {
  open.value = !open.value;
};

// 📅 Formateo seguro de fecha Fail2Ban
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Fecha no disponible";

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return timestamp; // fallback si no parsea
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

// 🌍 bandera
const getFlagEmoji = (code) => {
  if (!code) return "🌍";
  return code
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0))
    .reduce((a, b) => String.fromCodePoint(a, b));
};

// Unban IP
const unbanLoading = ref({});

const handleUnban = async (log) => {
  if (!log.jail) {
    alert("No hay información del jail");
    return;
  }

  unbanLoading.value[log.ip] = true;
  try {
    await store.unbanIP(log.jail, log.ip);
    alert(`IP ${log.ip} liberada del jail ${log.jail}`);
    // Sincronizar después del unban
    syncLogs();
    await store.refresh();
    await store.fetchBans();
  } catch (err) {
    alert("Error al hacer unban");
  } finally {
    unbanLoading.value[log.ip] = false;
  }
};
</script>

<template>
  <div class="w-full max-w-6xl mx-auto">
    <div
      class="flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-xl shadow-md cursor-pointer"
      @click="toggle"
    >
      <div class="flex items-center gap-2">
        <span>🚫</span>
        <h2 class="font-semibold">IPs baneadas (logs)</h2>
        <span class="bg-red-500 text-xs px-2 py-0.5 rounded-full">
          {{ logs.length }}
        </span>
      </div>
      <div :style="{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)' }">▼</div>
    </div>

    <div
      v-if="open"
      class="bg-white white:bg-slate-900 border rounded-xl mt-2 shadow-sm overflow-hidden"
    >
      <div v-if="logs.length > 0">
        <div
          v-for="b in logs"
          :key="b.ip + b.timestamp"
          class="flex items-center justify-between px-4 py-3 border-b"
        >
          <div class="flex flex-col gap-1 grid grid-flow-col-2 grid-rows-1 gap-1">
            <!-- IP + bandera + país -->
            <div class="flex items-center gap-2 font-mono text-sm">
              <span class="text-lg"
                ><img
                  :src="`https://flagcdn.com/24x18/${b.geo.countryCode.toLowerCase()}.png`"
                />
                <!-- {{ getFlagEmoji(b.geo?.countryCode) }} -->
              </span>

              <span class="text-slate-900"
                >{{ b.ip }}<br />
                <span class="text-xs text-slate-600">
                  {{ b.geo?.country || "Unknown" }} ({{ b.geo?.city || "Unknown" }})
                  <!-- {{ b.geo?.country || "Unknown" }} -->
                </span>
              </span>
            </div>

            <!-- FECHA + JAIL -->
            <div class="flex items-center gap-2">
              <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {{ b.jail }}
              </span>
              <span class="text-xs text-slate-500">
                🕒 {{ formatTimestamp(b.timestamp) }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Botón Unban -->
            <button
              @click="handleUnban(b)"
              :disabled="unbanLoading[b.ip] || !b.jail"
              class="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ unbanLoading[b.ip] ? "..." : "Unban" }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="p-4 text-gray-500 text-sm">No hay IPs baneadas</div>
    </div>
  </div>
</template>
