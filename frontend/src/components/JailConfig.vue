<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mt-6">
    <div class="flex justify-between items-center mb-3">
      <h2 class="text-lg font-semibold">Configuraci&oacute;n jail.local</h2>
      <button
        @click="fetchConfig"
        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
      >
        Recargar
      </button>
    </div>

    <div v-if="loading" class="text-gray-500">Cargando...</div>

    <pre
      v-else
      class="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap"
    >{{ config }}</pre>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const config = ref('')
const loading = ref(false)

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
