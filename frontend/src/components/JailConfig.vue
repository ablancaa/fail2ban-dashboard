<template>
  <div class="w-full max-w-6xl mx-auto">
    <!-- Header desplegable -->
    <button
      @click="toggle"
      class="flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-xl shadow-md cursor-pointer w-full"
    >
      <h2 class="text-lg font-semibold">Configuración jail.local</h2>

      <span
        class="transform transition-transform duration-300 text-gray-500"
        :class="{ 'rotate-180': open }"
      >
        ▼
      </span>
    </button>

    <!-- CONTENIDO -->
    <div
      class="overflow-hidden transition-all duration-300 ease-in-out"
      :class="open ? 'max-h-[600px] mt-3 opacity-100' : 'max-h-0 opacity-0'"
    >
      <!-- 🔄 Botón SOLO cuando está abierto -->
      <div v-if="open" class="flex justify-end mb-2">
        <button
          @click="fetchConfig"
          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition"
        >
          Recargar
        </button>
      </div>

      <div v-if="loading" class="text-gray-500 text-sm">Cargando...</div>

      <pre
        v-else
        class="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap"
        >{{ config }}
      </pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const config = ref("");
const loading = ref(false);
const open = ref(false);

const toggle = () => {
  open.value = !open.value;
};

const fetchConfig = async () => {
  loading.value = true;
  try {
    const res = await axios.get("http://192.168.1.137:3000/api/jail-config");
    config.value = res.data.config;
  } catch (e) {
    config.value = "Error cargando configuración";
  }
  loading.value = false;
};

onMounted(fetchConfig);
</script>
