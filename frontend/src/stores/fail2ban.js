import { defineStore } from "pinia"
import { ref, computed } from "vue"
import axios from "axios"
import { io } from "socket.io-client"

export const useFail2BanStore = defineStore("fail2ban", () => {

  let socket = null

  const jails = ref([])
  const alerts = ref(0)
  const serviceStatus = ref("loading")
  const newlyBanned = ref({})
  const logs = ref([])
  const bans = ref([])

  const totalBanned = computed(() =>
    jails.value.reduce((a, j) => a + (j.bannedCount || 0), 0)
  )

  const activeJails = computed(() =>
    jails.value.filter(j => !j.error).length
  )

  function connectSocket() {
    if (socket) return

    socket = io(import.meta.env.VITE_API_URL || "http://192.168.1.137:3000")

    socket.on("status", (data) => {
      jails.value = data
      alerts.value = data.reduce((a, j) => a + (j.bannedCount || 0), 0)
    })

    socket.on("alert", (data) => {
      alerts.value = data.ips?.length || 0

      if (!data.jail || !Array.isArray(data.ips)) return

      const cleanIPs = data.ips.map(i => i.ip).filter(Boolean)

      newlyBanned.value[data.jail] = cleanIPs

      data.ips.forEach(item => {
        logs.value.unshift({
          ip: item.ip,
          geo: item.geo || { country: "Unknown", countryCode: "XX" },
          jail: data.jail,
          timestamp: new Date().toISOString(),
        })
      })

      if (logs.value.length > 200) {
        logs.value.length = 200
      }
    })
  }

  function refresh() {
    socket?.emit("refresh")
  }

  const fetchBans = async () => {
    try {
      const res = await axios.get("http://192.168.1.137:3000/api/fail2ban-bans")
      bans.value = res.data.bans
    } catch (err) {
      console.error(err)
    }
  }

  const unbanIP = async (jail, ip) => {
    try {
      await axios.post("http://192.168.1.137:3000/api/unban", { jail, ip })
      logs.value = logs.value.filter(l => l.ip !== ip)
      socket?.emit("refresh")
    } catch (err) {
      console.error(err)
    }
  }

  return {
    jails,
    alerts,
    serviceStatus,
    newlyBanned,
    logs,
    bans,

    totalBanned,
    activeJails,

    connectSocket,
    refresh,
    fetchBans,
    unbanIP
  }
})