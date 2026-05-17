<script setup>
import { ref, onMounted, computed } from "vue";
import { useFail2BanStore } from "@/stores/fail2ban";

const store = useFail2BanStore();

const open = ref({});
const jails = computed(() => store.jails);

onMounted(() => {
  store.connectSocket();
});

const toggleJail = (jailName) => {
  open.value[jailName] = !open.value[jailName];
};

const isOpen = (jailName) => open.value[jailName] || false;
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <h1
      class="text-2xl font-bold mb-4 bg-slate-900 text-white px-4 py-2 rounded-xl shadow"
    >
      🔒 Jails
    </h1>

    <div v-if="jails.length === 0" class="text-gray-500">No hay jails disponibles</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="jail in jails"
        :key="jail.jail"
        class="bg-white border rounded-xl shadow-sm overflow-hidden"
      >
        <!-- HEADER -->
        <div
          class="flex items-center justify-between px-4 py-3 bg-slate-900 text-white cursor-pointer"
          @click="toggleJail(jail.jail)"
        >
          <div class="flex flex-col">
            <span
              class="text-[11px] px-2 py-[2px] bg-blue-600 text-white rounded-md min-w-24 text-center inline-block font-mono"
            >
              {{ jail.server }}
            </span>
            <span class="font-semibold">{{ jail.jail }}</span>
          </div>

          <span class="bg-red-500 text-xs px-2 py-0.5 rounded-full">
            {{ jail.bannedCount }}
          </span>
        </div>

        <!-- SUMMARY -->
        <div class="p-4">
          <div class="flex items-center gap-2 text-sm">
            <span
              class="w-3 h-3 rounded-full"
              :class="jail.bannedCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'"
            ></span>

            <span class="text-gray-600"> IPs bloqueadas: {{ jail.bannedCount }} </span>
          </div>
        </div>

        <!-- DETAILS -->
        <div v-if="isOpen(jail.jail)" class="border-t p-4">
          <!-- IP LIST -->
          <div v-if="jail.bannedIPs?.length">
            <h4 class="font-semibold text-red-600 mb-2">🚫 IPs baneadas</h4>

            <ul class="space-y-1 max-h-40 overflow-y-auto pr-2">
              <li
                v-for="ip in jail.bannedIPs"
                :key="ip"
                class="font-mono text-sm bg-gray-100 px-2 py-1 rounded"
              >
                {{ ip }}
              </li>
            </ul>
          </div>

          <div v-else class="text-gray-500 text-sm">Sin IPs baneadas</div>

          <!-- GEO LIST -->
          <div v-if="jail.geoBannedIPs?.length" class="mt-4">
            <h4 class="font-semibold text-purple-600 mb-2">🌍 Geolocalización</h4>

            <ul class="space-y-1 max-h-40 overflow-y-auto">
              <li
                v-for="ip in jail.geoBannedIPs"
                :key="ip.ip"
                class="flex items-center gap-2 bg-white px-2 py-1 rounded border"
              >
                <img
                  :src="`https://flagcdn.com/24x18/${
                    ip.countryCode?.toLowerCase() || 'xx'
                  }.png`"
                  class="w-6 h-4"
                />

                <span class="font-mono text-xs">{{ ip.ip }}</span>

                <span class="text-xs text-gray-500">
                  {{ ip.country }} {{ ip.city ? `, ${ip.city}` : "" }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
