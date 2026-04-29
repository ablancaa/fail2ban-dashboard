// Importa Pinia para crear stores (gestión de estado global en Vue)
import { defineStore } from 'pinia'

// Importa reactividad de Vue 3
import { ref, computed } from 'vue'

// Cliente HTTP para peticiones al backend
import axios from 'axios'

// Cliente de WebSockets (Socket.IO)
import io from 'socket.io-client'

// Definición del store principal de Fail2Ban
export const useFail2BanStore = defineStore('fail2ban', () => {

  // Conexión WebSocket al servidor backend
  const socket = io('http://192.168.1.137:3000')

  // Lista de jails (servicios monitorizados por Fail2Ban)
  const jails = ref([])

  // Contador de alertas (IPs baneadas o eventos)
  const alerts = ref(0)

  // Estado del servicio (loading, ok, error, etc.)
  const serviceStatus = ref('loading')

  // Objeto para guardar IPs recién baneadas por jail (efecto visual)
  const newlyBanned = ref({})

  // Computed: total de IPs baneadas sumando todos los jails
  const totalBanned = computed(() =>
    jails.value.reduce((a, j) => a + (j.bannedCount || 0), 0)
  )

  // Computed: número de jails activos (sin error)
  const activeJails = computed(() =>
    jails.value.filter(j => !j.error).length
  )

  // -----------------------------
  // CONEXIÓN Y EVENTOS SOCKET.IO
  // -----------------------------
  function connectSocket() {

    // Evento: estado general recibido desde el backend
    socket.on('status', (data) => {
      // Actualiza lista de jails
      jails.value = data
      
      // Calcula total de IPs baneadas en todos los jails
      const total = data.reduce((a, j) => a + (j.bannedCount || 0), 0)

      // Guarda el total en alertas

      alerts.value = total
    })

    // Evento: alerta en tiempo real (nuevo ban detectado)
  socket.on('alert', (data) => {
  console.log('Store: Alerta recibida', data)

  alerts.value = data.ips?.length || 0

  if (data.jail && Array.isArray(data.ips)) {

    const cleanIPs = data.ips.map(item => {
      if (typeof item === "string") return item
      if (typeof item === "object") return item.ip
      return null
    }).filter(Boolean)

    newlyBanned.value[data.jail] = cleanIPs

    // 🔥 AQUÍ ESTÁ LA CLAVE: APLANAR
    data.ips.forEach(ipData => {
      logs.value.unshift({
        ip: ipData.ip,
        geo: ipData.geo || null,
        jail: data.jail,
        timestamp: new Date().toISOString(),
        country: ipData.geo?.country || "Unknown",
        countryCode: ipData.geo?.countryCode || "XX"
      })
    })
  }
})
  }
  function normalizeIP(item) {
  if (!item) return null
  if (typeof item === "string") return item
  if (typeof item === "object") return item.ip || null
  return null
}

  // -----------------------------
  // REFRESH MANUAL
  // -----------------------------
  function refresh() {
    // Pide al backend que reenvíe datos actualizados
    socket.emit('refresh')
  }

  // -----------------------------
  // HISTORIAL DE BANEOS (REST API)
  // -----------------------------

  // Lista reactiva de baneos históricos
  const bans = ref([])

  // Función para obtener el historial desde el backend HTTP
  const fetchBans = async () => {
    const res = await axios.get('http://192.168.1.137:3000/api/fail2ban-bans')

    // Normaliza los datos recibidos
    bans.value = res.data.bans.map(b => ({
      ip: b.ip,
      timestamp: b.timestamp,
      raw: b.raw
    }))
  } 

  // -----------------------------
  // EXPOSICIÓN DEL STORE
  // -----------------------------
  return {
    socket,
    jails,
    alerts,
    serviceStatus,

    totalBanned,
    activeJails,
    newlyBanned,

    connectSocket,
    refresh,

    bans,
    fetchBans
  }
})