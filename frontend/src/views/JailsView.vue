<script setup>
import { ref, onMounted, computed } from "vue";
import { useFail2BanStore } from "@/stores/fail2ban";

const store = useFail2BanStore();
const open = ref({});

/* ---------------- SOCKET ---------------- */
onMounted(() => {
  store.connectSocket();
});

/* ---------------- EXTRAER JAILS ---------------- */
const jails = computed(() => {
  return (store.servers || []).flatMap((server) =>
    (server.jails || []).map((jail) => ({
      ...jail,
      serverName: server.serverName,

      // NORMALIZAR DATOS
      jailName: jail.name || "unknown",
      bannedCount: jail.bannedIPs?.length || 0,
    }))
  );
});

/* ---------------- TOGGLE ---------------- */
const toggleJail = (key) => {
  open.value[key] = !open.value[key];
};

const isOpen = (key) => open.value[key] || false;

/* ---------------- FLAGS ---------------- */
const flagUrl = (code) =>
  code && code !== "XX" ? `https://flagcdn.com/24x18/${code.toLowerCase()}.png` : "";
</script>

<template>
  <div class="max-w-7xl mx-auto p-4">
    <!-- TITLE -->
    <h1
      class="text-2xl font-bold mb-4 bg-slate-900 text-white px-4 py-3 rounded-xl shadow"
    >
      🔒 Fail2Ban Jails
    </h1>

    <!-- EMPTY -->
    <div v-if="jails.length === 0" class="bg-white rounded-xl p-6 text-gray-500 shadow">
      No hay jails disponibles
    </div>

    <!-- GRID -->
    <div v-else class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
      <!-- CARD -->
      <div
        v-for="jail in jails"
        :key="jail.serverName + '-' + jail.jailName"
        class="bg-white rounded-xl shadow border overflow-hidden"
      >
        <!-- HEADER -->
        <div
          class="bg-slate-900 text-white px-4 py-3 cursor-pointer"
          @click="toggleJail(jail.serverName + jail.jailName)"
        >
          <div class="flex items-center justify-between">
            <!-- LEFT -->
            <div class="flex flex-col gap-1">
              <!-- SERVER -->
              <span
                class="text-[10px] bg-blue-600 px-2 py-0.5 rounded-md font-mono w-fit"
              >
                {{ jail.serverName }}
              </span>

              <!-- JAIL -->
              <span class="font-semibold text-sm"> 🔒 {{ jail.jailName }} </span>
            </div>

            <!-- COUNT -->
            <div class="flex items-center gap-2">
              <span
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                :class="
                  jail.bannedCount === 0
                    ? 'bg-green-500'
                    : jail.bannedCount <= 80
                    ? 'bg-yellow-500'
                    : 'bg-red-500 animate-pulse'
                "
              >
                {{ jail.bannedCount }}
              </span>
            </div>
          </div>
        </div>

        <!-- SUMMARY -->
        <div class="p-4 border-b">
          <div class="flex items-center gap-2 text-sm">
            <span
              class="w-3 h-3 rounded-full"
              :class="jail.bannedCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'"
            ></span>

            <span class="text-gray-700"> {{ jail.bannedCount }} IPs baneadas </span>
          </div>
        </div>

        <!-- DETAILS -->
        <div v-if="isOpen(jail.serverName + jail.jailName)" class="p-4 space-y-4">
          <!-- NO IPS -->
          <div v-if="!jail.geoBannedIPs?.length" class="text-sm text-gray-500">
            No hay IPs baneadas
          </div>

          <!-- IPS -->
          <div v-else class="space-y-2 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="ip in jail.geoBannedIPs"
              :key="ip.ip"
              class="border rounded-lg p-3 bg-slate-50"
            >
              <!-- TOP -->
              <div class="flex items-center justify-between">
                <!-- IP -->
                <div class="font-mono text-sm font-semibold">
                  {{ ip.ip }}
                </div>

                <!-- STATUS -->
                <div class="flex items-center gap-2 text-xs font-semibold text-red-600">
                  <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  BANNED
                </div>
              </div>

              <!-- GEO -->
              <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <img :src="flagUrl(ip.countryCode)" class="w-5 h-4 rounded-sm border" />

                <span>
                  {{ ip.country }}
                  <template v-if="ip.city"> · {{ ip.city }} </template>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
