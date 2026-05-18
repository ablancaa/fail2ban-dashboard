<template>
  <div class="w-full max-w-6xl mx-auto space-y-4">
    <div
      v-for="server in servers"
      :key="server.serverId"
      class="rounded-xl overflow-hidden border border-slate-700"
    >
      <!-- HEADER -->
      <button
        @click="toggle(server.serverId)"
        class="flex items-center justify-between bg-slate-900 text-white px-4 py-3 w-full"
      >
        <h2 class="font-semibold">
          {{ server.serverName }}
        </h2>

        <span
          class="transition-transform duration-300 text-gray-400"
          :class="{ 'rotate-180': openMap[server.serverId] }"
        >
          ▼
        </span>
      </button>

      <!-- CONTENT -->
      <div
        class="overflow-hidden transition-all duration-300 bg-gray-950"
        :class="openMap[server.serverId] ? 'max-h-[600px] p-3' : 'max-h-0 p-0'"
      >
        <pre v-if="!openMap[server.serverId]">
  {{ server.config }}
</pre
        >

        <textarea
          class="w-full h-64 bg-black text-green-400 p-2 font-mono"
          v-model="editedConfig[server.serverId]"
        ></textarea>

        <div class="flex gap-2 mt-2">
          <button
            class="bg-green-600 px-3 py-1 rounded"
            @click="saveConfig(server.serverId)"
          >
            Guardar
          </button>

          <button class="bg-gray-600 px-3 py-1 rounded" @click="fetchConfig">
            Recargar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const servers = ref([]);
const openMap = ref({});
const editedConfig = ref({});

const toggle = (id) => {
  openMap.value[id] = !openMap.value[id];
};

const fetchConfig = async () => {
  const res = await axios.get("http://192.168.1.137:3000/api/jail-config");
  servers.value = res.data.config;

  // 👇 inicializa el editor
  res.data.config.forEach((server) => {
    editedConfig.value[server.serverId] = server.config || "";
  });
};

const saveConfig = async (serverId) => {
  await axios.post("http://192.168.1.137:3000/api/jail-config", {
    serverId,
    config: editedConfig.value[serverId],
  });

  alert("Config guardada");
  fetchConfig();
};

const onEdit = (serverId, value) => {
  editedConfig.value[serverId] = value;
};

onMounted(fetchConfig);
</script>
