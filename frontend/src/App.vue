<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">

    <div class="max-w-6xl mx-auto">

      <!-- HEADER PRO -->
      <div class="header">

        <div class="title-row">
          <div class="flex items-center gap-3">
            <img src="../src/assets/Fail2ban_logo.png" class="w-14 h-14" />
            <h1 class="title">Fail2Ban Dashboard</h1>
          </div>

          <div class="clock">
            🕒 {{ clock }}
          </div>
        </div>

        <!-- NAVBAR PRO -->
        <nav class="navbar">
          <button :class="{ active: view === 'dashboard' }" @click="view = 'dashboard'">
            📊 Dashboard
          </button>

          <button :class="{ active: view === 'jails' }" @click="view = 'jails'">
            🔒 Jails
            <span class="badge">{{ totalBanned }}</span>
          </button>

          <button :class="{ active: view === 'alerts' }" @click="view = 'alerts'">
            🚨 Alertas
            <span v-if="alerts > 0" class="badge red">{{ alerts }}</span>
          </button>

          <button :class="{ active: view === 'config' }" @click="view = 'config'">
            ⚙️ Config
          </button>

          <button class="right" @click="socket.emit('refresh')">
            🔄 Recargar
          </button>
        </nav>

      </div>

      <!-- STATUS CARD -->
      <div class="card flex items-center justify-between">

        <div class="flex items-center gap-3">
          <div class="dot" :class="statusColor"></div>

          <div>
            <div class="font-semibold">Estado Fail2Ban</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ serviceStatus }}
            </div>
          </div>
        </div>

      </div>

      <!-- TOTAL -->
      <div class="card">
        <div class="text-lg font-semibold">
          Total de IPs baneadas: {{ totalBanned }}
        </div>
      </div>

      <!-- TABLE -->
      <div class="card overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Jail</th>
              <th>IPs</th>
              <th>Lista</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="jail in jails" :key="jail.jail">
              <td>{{ jail.jail }}</td>
              <td>{{ jail.bannedCount }}</td>

              <td>
                <div class="flex flex-wrap gap-1">
                  <span v-for="ip in jail.banned" :key="ip" class="ip">
                    {{ ip }}
                    <button class="unban" @click="unbanIP(jail.jail, ip)">
                      ✕
                    </button>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>

        </table>
      </div>

      <!-- CHART -->
      <div class="card">
        <h2 class="font-semibold mb-2">IPs bloqueadas por Jail</h2>
        <div class="h-64">
          <canvas id="chart"></canvas>
        </div>
      </div>

    </div>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import io from 'socket.io-client'
import Chart from 'chart.js/auto'
import axios from 'axios'

const view = ref('dashboard')
const alerts = ref(0)

const serviceStatus = ref('loading')
const jails = ref([])
const clock = ref('')
const chart = ref(null)

const socket = io('http://192.168.1.137:3000')

let clockInterval = null

/* ---------------- CLOCK ---------------- */
const updateClock = () => {
  clock.value = new Date().toLocaleTimeString()
}

/* ---------------- STATUS COLOR (FIX CLAVE) ---------------- */
const statusColor = computed(() => {
  switch (serviceStatus.value) {
    case 'running':
      return 'running'
    case 'stopped':
      return 'stopped'
    case 'error':
      return 'error'
    default:
      return 'loading'
  }
})

/* ---------------- TOTAL ---------------- */
const totalBanned = computed(() =>
  jails.value.reduce((a, b) => a + b.bannedCount, 0)
)

/* ---------------- CHART SAFE ---------------- */
const updateChart = (data) => {
  const ctx = document.getElementById('chart')
  if (!ctx) return

  if (chart.value) {
    chart.value.destroy()
    chart.value = null
  }

  chart.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.jail),
      datasets: [{
        label: 'IPs bloqueadas',
        data: data.map(d => d.bannedCount),
        backgroundColor: '#dc2626'
      }]
    }
  })
}

/* ---------------- SOCKET ---------------- */
socket.on('status', (data) => {
  jails.value = data
  updateChart(data)
})

socket.on('alert', () => {
  alerts.value++
})

/* ---------------- LIFECYCLE ---------------- */
onMounted(() => {
  updateClock()
  clockInterval = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  clearInterval(clockInterval)
  socket.disconnect()
})
</script>
<style scoped>
.dot.loading { background: #94a3b8; }
.dot.running { background: #22c55e; }
.dot.stopped { background: #ef4444; }
.dot.error { background: #f59e0b; }

.header {
  margin-bottom: 16px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.title {
  font-size: 22px;
  font-weight: bold;
}

.clock {
  font-family: monospace;
  color: #64748b;
}

/* NAVBAR */
.navbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.navbar button {
  background: #1e293b;
  color: white;
  border: 1px solid #334155;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.navbar button.active {
  background: #2563eb;
}

.navbar .right {
  margin-left: auto;
  background: #0ea5e9;
}

/* CARDS */
.card {
  background: white;
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 12px;
}

/* DARK */
.dark .card {
  background: #111827;
  color: white;
}

/* STATUS DOT */
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.running { background: #22c55e; }
.dot.stopped { background: #ef4444; }
.dot.error { background: #f59e0b; }

/* TABLE */
.table {
  width: 100%;
  font-size: 14px;
}

.ip {
  background: #fee2e2;
  padding: 2px 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
}

.unban {
  margin-left: 6px;
  background: #ef4444;
  color: white;
  border-radius: 4px;
  padding: 1px 4px;
  cursor: pointer;
}
</style>