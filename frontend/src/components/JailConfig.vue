<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mt-6">

    <!-- Header desplegable -->
    <button
      @click="toggle"
      class="w-full flex justify-between items-center mb-2"
    >
      <h2 class="text-lg font-semibold">
        Configuración jail.local
      </h2>

      <span
        class="transform transition-transform duration-300"
        :class="{ 'rotate-180': open }"
      >
        ▼
      </span>
    </button>

    <!-- Botón recargar siempre visible -->
    <div class="flex justify-end mb-3">
      <button
        @click="fetchConfig"
        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
      >
        Recargar
      </button>
    </div>

    <!-- Contenido desplegable -->
    <div
      class="overflow-hidden transition-all duration-300 ease-in-out"
      :class="open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'"
    >

      <div v-if="loading" class="text-gray-500">
        Cargando...
      </div>

      <pre
        v-else
        class="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap"
      >
{{ config }}
      </pre>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const config = ref('')
const loading = ref(false)
const open = ref(false)

const toggle = () => {
  open.value = !open.value
}

const fetchConfig = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://192.168.1.137:3000/api/jail-config')
    config.value = res.data.config
  } catch (e) {
    config.value = 'Error cargando configuración'
  }
  loading.value = false
}

onMounted(fetchConfig)
</script>