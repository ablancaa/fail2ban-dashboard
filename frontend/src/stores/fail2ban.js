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

  const logs = ref([])

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
  socket.on("alert", (data) => {
  console.log("Alert recibida:", data)

  alerts.value = data.ips?.length || 0

  if (!data.jail || !Array.isArray(data.ips)) return

  const cleanIPs = data.ips.map(i => i.ip).filter(Boolean)

  newlyBanned.value[data.jail] = cleanIPs

  data.ips.forEach(item => {
    logs.value.unshift({
      ip: item.ip,
      geo: item.geo || {
        country: "Unknown",
        countryCode: "XX"
      },
      jail: data.jail,
      timestamp: new Date().toISOString(),
      raw: null
    })
  })

  // 🔥 limitar memoria
  if (logs.value.length > 200) {
    logs.value.length = 200
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
  try {
    const res = await axios.get(
      'http://192.168.1.137:3000/api/fail2ban-bans'
    )

    bans.value = res.data.bans.map(b => ({
      ip: b.ip,
      jail: b.jail,
      timestamp: b.timestamp,
      raw: b.raw,

      // 🔥 IMPORTANTE: mantener geo
      geo: b.geo || {
        country: "Unknown",
        countryCode: "XX"
      }
    }))
  } catch (err) {
    console.error("fetchBans error:", err)
  }
}

  // -----------------------------
  // UNBAN IP
  // -----------------------------
  const unbanIP = async (jail, ip) => {
    try {
      await axios.post('http://192.168.1.137:3000/api/unban', { jail, ip })
      
      // Eliminar la IP del array de logs local inmediatamente
      const originalLength = logs.value.length
      logs.value = logs.value.filter(log => log.ip !== ip)
      console.log(`Unban: IP ${ip} eliminada (${originalLength} -> ${logs.value.length})`)
      
      // Refrescar después de unban
      socket.emit('refresh')
    } catch (err) {
      console.error("unban error:", err)
      throw err
    }
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
    logs,

    connectSocket,
    refresh,

    bans,
    fetchBans,

    unbanIP
  }
})