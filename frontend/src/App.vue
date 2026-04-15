<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-6xl mx-auto">

      <h1 class="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2">
        <img src="../src/assets/Fail2ban_logo.png" class="w-20 h-20" />
        Fail2Ban Dashboard
      </h1>
      <!-- Control Fail2Ban -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4 flex items-center justify-between flex-wrap gap-3">

        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full animate-pulse" :class="{
            'bg-green-500': serviceStatus === 'running',
            'bg-red-500': serviceStatus === 'stopped',
            'bg-yellow-400': serviceStatus === 'error',
            'bg-gray-400': serviceStatus === 'loading'
          }"></div>

          <span class="font-semibold text-gray-700 dark:text-gray-200">
            Estado Fail2Ban:
            <span v-if="serviceStatus === 'running'">Activo</span>
            <span v-if="serviceStatus === 'stopped'">Parado</span>
            <span v-if="serviceStatus === 'error'">Problema</span>
            <span v-if="serviceStatus === 'loading'">Comprobando...</span>
          </span>
           <!-- ⏰ reloj -->

        </div>

        <div class="flex gap-2">

          <button @click="startService"
            class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1">
            <Play size="16" /> Iniciar
          </button>

          <button @click="restartService"
            class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded flex items-center gap-1">
            <RotateCw size="16" /> Reiniciar
          </button>

          <button @click="stopService"
            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1">
            <Square size="16" /> Parar
          </button>
        </div>

      </div>

      <!-- Total de IPs baneadas -->
      <div class="mb-4 text-lg font-semibold">
        Total de IPs baneadas: {{ totalBanned }}
         <!-- ⏰ reloj -->
  <div class="mt-2 text-sm text-gray-500 flex items-center gap-2">
    <span class="animate-pulse">🕒</span>
    {{ clock }}
  </div>
      </div>

      <!-- Tabla de jails -->
      <div class="bg-white rounded-xl shadow p-4 mb-6 overflow-x-auto">
        <table class="w-full text-sm md:text-base">
          <thead>
            <tr class="border-b">
              <th class="text-left p-2">Jail</th>
              <th class="text-left p-2">IPs bloqueadas</th>
              <th class="text-left p-2">Lista IPs</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="jail in jails" :key="jail.jail" class="border-b">
              <td class="p-2 font-medium">{{ jail.jail }}</td>
              <td class="p-2">{{ jail.bannedCount }}</td>
              <td class="p-2">
                <div class="flex flex-wrap gap-1">
                  <span v-for="ip in jail.banned" :key="ip" :class="[
                    'bg-red-100 text-red-700 px-2 py-1 rounded text-xs flex items-center transition',
                    newlyBanned[jail.jail]?.includes(ip) ? 'bg-yellow-200 text-yellow-800 animate-pulse' : ''
                  ]">
                    {{ ip }}
                    <button @click="unbanIP(jail.jail, ip)"
                      class="ml-1 bg-red-500 text-white rounded px-1 py-0.5 text-[0.65rem] hover:bg-red-600">
                      Unban
                    </button>
                  </span>
                  <span v-if="jail.banned.length === 0" class="text-gray-500 text-xs">
                    <OctagonMinus size="16" class="mr-1" />
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Gráfico de IPs baneadas -->
      <div class="bg-white rounded-xl shadow p-4">
        <h2 class="font-semibold mb-2">IPs bloqueadas por Jail</h2>
        <div class="h-64">
          <canvas id="chart"></canvas>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mt-6">
        <h2 class="font-semibold mb-2">Uptime Fail2Ban</h2>
        <canvas id="uptimeChart" height="100"></canvas>
      </div>
      <JailConfig />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed, watch } from 'vue'
import io from 'socket.io-client'
import Chart from 'chart.js/auto'
import axios from 'axios'
import { Play, RotateCw, Square, OctagonMinus } from 'lucide-vue-next'
import JailConfig from './components/JailConfig.vue'
//import { toRaw } from 'vue'
import { nextTick } from 'vue'

const serviceStatus = ref('loading')
const uptimeChart = ref(null)
const uptimeData = ref([])
const clock = ref('')
let timer = null

const updateClock = () => {
  const now = new Date()
  clock.value = now.toLocaleString()
}

onMounted(() => {
   if (chart.value) {
    chart.value.destroy()
  }
  fetchServiceStatus()
  setInterval(fetchServiceStatus, 5000)
  updateUptimeChart()
  updateClock()
  timer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

watch(serviceStatus, (newVal) => {
  if (newVal === 'stopped') {
    new Notification('Fail2Ban parado', {
      body: 'El servicio fail2ban se ha detenido'
    })
  }
})

//Obtener estado servicio (NORMALIZADO)
const fetchServiceStatus = async () => {
  try {
    const res = await axios.get('http://192.168.1.137:3000/api/service-status')

    //console.log('STATUS RAW ?', res.data)

    const status = (res.data.status || '').toLowerCase().trim()

    if (status === 'running' || status === 'active') {
      serviceStatus.value = 'running'
    } else if (status === 'stopped' || status === 'inactive') {
      serviceStatus.value = 'stopped'
    } else {
      serviceStatus.value = 'error'
    }

  } catch (e) {
    console.error(e)
    serviceStatus.value = 'error'
  }
}

// Datos
const jails = ref([])
const chart = ref(null)
const newlyBanned = reactive({})

// Conexi�n Socket.io
const socket = io('http://192.168.1.137:3000')

if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission()
}

const unbanIP = async (jail, ip) => {
  try {
    const res = await axios.post('http://192.168.1.137:3000/api/unban', { jail, ip })
    if (res.data.success) {
      alert(`IP ${ip} desbloqueada en jail ${jail}`)
      socket.emit('refresh')
    }
  } catch (err) {
    console.error(err)
    alert('Error al desbloquear IP')
  }
}

const totalBanned = computed(() => {
  return jails.value.reduce((acc, jail) => acc + jail.bannedCount, 0)
})

const updateChart = async (data) => {
  await nextTick()

  const ctx = document.getElementById('chart')
  if (!ctx) return

  const labels = data.map(d => d.jail)
  const counts = data.map(d => d.bannedCount)

  // 🔥 destruir antes de recrear
  if (chart.value) {
    chart.value.destroy()
    chart.value = null
  }

  chart.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [...labels],
      datasets: [{
        label: 'IPs bloqueadas',
        data: [...counts],
        backgroundColor: 'rgba(220,38,38,0.7)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // importante
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  })
}

socket.on('status', (data) => {
  jails.value = data
  updateChart(data)
})

socket.on('alert', ({ jail, ips }) => {
  newlyBanned[jail] = ips

  if ("Notification" in window && Notification.permission === "granted") {
    ips.forEach(ip => {
      new Notification(`Fail2Ban Alert`, {
        body: `Nueva IP bloqueada: ${ip} en jail ${jail}`,
        icon: '/favicon.ico'
      })
    })
  }

  setTimeout(() => { newlyBanned[jail] = [] }, 5000)
})

const startService = async () => {
  await axios.post('http://192.168.1.137:3000/api/service-start')
  setTimeout(fetchServiceStatus, 500)
}

const stopService = async () => {
  await axios.post('http://192.168.1.137:3000/api/service-stop')
  setTimeout(fetchServiceStatus, 500)
}

const restartService = async () => {
  await axios.post('http://192.168.1.137:3000/api/service-restart')
  setTimeout(fetchServiceStatus, 500)
}

const updateUptimeChart = () => {
  const labels = uptimeData.value.map(d => d.time)
  const values = uptimeData.value.map(d => d.value)

  if (!uptimeChart.value) {
    const ctx = document.getElementById('uptimeChart')
    uptimeChart.value = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          label: 'Activo',
          data: values,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        scales: {
          y: {
            ticks: {
              callback: v => v === 1 ? 'Activo' : 'Parado'
            },
            min: 0,
            max: 1
          }
        }
      }
    })
  } else {
    uptimeChart.value.data.labels = labels
    uptimeChart.value.data.datasets[0].data = values
    uptimeChart.value.update()
  }
}

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark')
}
</script>

<style>
.animate-pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

@media (max-width: 640px) {
  table {
    font-size: 0.75rem;
  }
}
</style>
