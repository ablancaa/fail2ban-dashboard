<script setup>
import { ref, computed, onMounted } from "vue";
import { useFail2BanStore } from "../stores/fail2ban";

const store = useFail2BanStore();
const open = ref(false);

const bans = computed(() => store.bans || []);
const logs = computed(() => store.logs || []);
onMounted(() => {
  store.fetchBans();
});

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
          <div class="flex flex-col gap-1">
            <!-- IP + bandera + país -->
            <div class="flex items-center gap-2 font-mono text-sm">
              <span class="text-lg"
                ><img
                  :src="`https://flagcdn.com/24x18/${b.geo.countryCode.toLowerCase()}.png`"
                />
                <!-- {{ getFlagEmoji(b.geo?.countryCode) }} -->
              </span>

              <span class="text-slate-900">{{ b.ip }}</span>

              <span class="text-xs text-slate-600">
                - {{ b.geo?.country || "Unknown" }}
                <!-- {{ b.geo?.country || "Unknown" }} -->
              </span>
            </div>

            <!-- FECHA -->
            <span class="text-xs text-slate-500">
              🕒 {{ formatTimestamp(b.timestamp) }}
            </span>
          </div>

          <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"> ATTACK </span>
        </div>
      </div>

      <div v-else class="p-4 text-gray-500 text-sm">No hay IPs baneadas</div>
    </div>
  </div>
</template>
