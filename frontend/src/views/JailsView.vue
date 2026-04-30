<script setup>
import { ref, onMounted, watch } from "vue";
import { useFail2BanStore } from "@/stores/fail2ban";
import axios from "axios";

const store = useFail2BanStore();
const open = ref({});
const jailDetails = ref({});
const loading = ref({});

// Sincronizar jails
let jails = ref([]);

onMounted(() => {
  store.connectSocket();
});

// Watch para detectar cambios en los jails
watch(
  () => store.jails,
  (newJails) => {
    jails.value = [...newJails];
  },
  { deep: true }
);

// Inicializar
jails.value = store.jails;

const toggleJail = async (jailName) => {
  open.value[jailName] = !open.value[jailName];

  // Cargar detalles si no están cargados
  if (open.value[jailName] && !jailDetails.value[jailName] && !loading.value[jailName]) {
    loading.value[jailName] = true;
    try {
      // Cargar estado actual
      const statusRes = await axios.get(
        `http://192.168.1.137:3000/api/jail-status/${jailName}`
      );
      jailDetails.value[jailName] = statusRes.data;

      // Cargar lista completa de baneos históricos
      const banlistRes = await axios.get(
        `http://192.168.1.137:3000/api/jail-banlist/${jailName}`
      );
      jailDetails.value[jailName].banlist = banlistRes.data.ips;
    } catch (err) {
      console.error("Error loading jail details:", err);
    } finally {
      loading.value[jailName] = false;
    }
  }
};

const isOpen = (jailName) => open.value[jailName] || false;
const isLoading = (jailName) => loading.value[jailName] || false;
const getDetails = (jailName) => jailDetails.value[jailName] || null;
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <h1
      class="text-2xl font-bold mb-4 bg-slate-900 text-white px-4 py-2 rounded-xl shadow"
    >
      🔒 Jails
    </h1>

    <div v-if="jails.length === 0" class="text-gray-500">No hay jails disponibles</div>

    <!-- Grid de cards responsive -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="jail in jails"
        :key="jail.jail"
        class="bg-white border rounded-xl shadow-sm overflow-hidden"
      >
        <!-- Header del jail -->
        <div
          class="flex items-center justify-between px-4 py-3 bg-slate-900 text-white cursor-pointer"
          @click="toggleJail(jail.jail)"
        >
          <div class="flex items-center gap-3">
            <span class="font-semibold">{{ jail.jail }}</span>
            <span class="bg-red-500 text-xs px-2 py-0.5 rounded-full">
              {{ jail.bannedCount || 0 }}
            </span>
          </div>
          <div
            :style="{ transform: isOpen(jail.jail) ? 'rotate(0deg)' : 'rotate(180deg)' }"
          >
            ▼
          </div>
        </div>

        <!-- Resumen siempre visible -->
        <div class="p-4">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <!-- Círculo parpadeante: rojo si hay IPs, verde si no hay -->
              <span
                class="w-3 h-3 rounded-full"
                :class="
                  jail.bannedCount > 0
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-green-500 animate-pulse'
                "
              ></span>
              <span class="text-gray-600">IPs bloqueadas:</span>
            </div>
            <span class="font-bold text-gray-600">{{ jail.bannedCount || 0 }}</span>
          </div>
        </div>

        <!-- Detalles del jail (expandible) -->
        <div v-if="isOpen(jail.jail)" class="border-t p-4">
          <div v-if="jail.error" class="text-red-500">Error: {{ jail.error }}</div>

          <div v-else-if="isLoading(jail.jail)" class="text-gray-500">Cargando...</div>

          <div v-else-if="getDetails(jail.jail)" class="space-y-3">
            <!-- Filter Section -->
            <div class="bg-blue-50 rounded-lg p-3">
              <h4 class="font-semibold text-blue-700 text-sm mb-2">🔍 Filter</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Currently failed:</span>
                  <span class="font-mono">{{
                    getDetails(jail.jail).filter.currentlyFailed || 0
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Total failed:</span>
                  <span class="font-mono">{{
                    getDetails(jail.jail).filter.totalFailed || 0
                  }}</span>
                </div>
                <div v-if="getDetails(jail.jail).filter.journalMatches" class="mt-2">
                  <span class="text-gray-600 text-xs">Journal matches:</span>
                  <p class="text-xs font-mono text-gray-500 break-all">
                    {{ getDetails(jail.jail).filter.journalMatches }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Actions Section -->
            <div class="bg-green-50 rounded-lg p-3">
              <h4 class="font-semibold text-green-700 text-sm mb-2">⚡ Actions</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Currently banned:</span>
                  <span class="font-mono">{{
                    getDetails(jail.jail).actions.currentlyBanned || 0
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Total banned:</span>
                  <span class="font-mono">{{
                    getDetails(jail.jail).actions.totalBanned || 0
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Banned IPs List -->
            <div
              v-if="getDetails(jail.jail).actions.bannedIPs?.length > 0"
              class="bg-red-50 rounded-lg p-3"
            >
              <h4 class="font-semibold text-red-700 text-sm mb-2">🚫 Banned IP list</h4>
              <ul class="space-y-1">
                <li
                  v-for="ip in getDetails(jail.jail).actions.bannedIPs"
                  :key="ip"
                  class="font-mono text-sm bg-white px-2 py-1 rounded"
                >
                  {{ ip }}
                </li>
              </ul>
            </div>

            <!-- Total Ban History -->
            <div
              v-if="getDetails(jail.jail).banlist?.length > 0"
              class="bg-purple-50 rounded-lg p-3"
            >
              <h4 class="font-semibold text-purple-700 text-sm mb-2">
                📜 Total Banned ({{ getDetails(jail.jail).banlist.length }})
              </h4>
              <ul class="space-y-1 max-h-40 overflow-y-auto">
                <li
                  v-for="item in getDetails(jail.jail).banlist"
                  :key="item.ip"
                  class="flex items-center gap-2 bg-white px-2 py-1 rounded"
                >
                  <img
                    :src="`https://flagcdn.com/24x18/${
                      item.geo?.countryCode?.toLowerCase() || 'xx'
                    }.png`"
                    class="w-6 h-4 rounded"
                    :alt="item.geo?.country"
                  />
                  <span class="font-mono text-xs">{{ item.ip }}</span>
                  <span class="text-xs text-gray-500">
                    {{ item.geo?.country || "Unknown"
                    }}{{ item.geo?.city ? `, ${item.geo.city}` : "" }}
                  </span>
                </li>
              </ul>
            </div>

            <div v-else class="text-gray-500 text-sm text-center py-2">
              No hay IPs baneadas
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
