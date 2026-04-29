<script setup>
import { ref, computed, onMounted } from "vue";
import { useFail2BanStore } from "../stores/fail2ban";

const store = useFail2BanStore();
const open = ref(true);

const bans = computed(() => store.bans || []);

onMounted(() => {
  store.fetchBans();
});

const toggle = () => {
  open.value = !open.value;
};

// 📅 fecha segura
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Fecha no disponible";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;

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
  <div class="w-full max-w-4xl mx-auto mt-6">
    <!-- HEADER -->
    <div
      class="flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-xl cursor-pointer"
      @click="toggle"
    >
      <div class="flex items-center gap-2">
        <span>📜</span>
        <h2 class="font-semibold">Histórico de ataques</h2>

        <span class="bg-blue-500 text-xs px-2 py-0.5 rounded-full">
          {{ bans.length }}
        </span>
      </div>

      <div :style="{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)' }">▼</div>
    </div>

    <!-- LISTA -->
    <div v-if="open" class="bg-white border rounded-xl mt-2 shadow-sm">
      <div v-if="bans.length > 0">
        <div
          v-for="b in bans"
          :key="b.ip + b.timestamp"
          class="flex items-center justify-between px-4 py-3 border-b"
        >
          <!-- INFO -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 font-mono text-sm">
              <!-- bandera -->
              <span class="text-lg">
                <img
                  :src="`https://flagcdn.com/24x18/${b.geo.countryCode.toLowerCase()}.png`"
                />
                <!-- {{ getFlagEmoji(b.geo?.countryCode) }} -->
              </span>

              <!-- IP -->
              <span>{{ b.ip }}</span>

              <!-- país -->
              <span class="text-xs text-gray-500">
                {{ b.geo?.country || "Unknown" }}
              </span>
            </div>

            <!-- fecha -->
            <span class="text-xs text-gray-500">
              🕒 {{ formatTimestamp(b.timestamp) }}
            </span>
          </div>

          <!-- etiqueta -->
          <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"> BAN </span>
        </div>
      </div>

      <div v-else class="p-4 text-gray-500 text-sm">No hay histórico disponible</div>
    </div>
  </div>
</template>
