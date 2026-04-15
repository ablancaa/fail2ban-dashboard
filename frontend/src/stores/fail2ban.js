import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import io from 'socket.io-client'

export const useFail2BanStore = defineStore('fail2ban', () => {

  const socket = io('http://192.168.1.137:3000')

  const jails = ref([])
  const alerts = ref(0)
  const serviceStatus = ref('loading')

  const totalBanned = computed(() =>
    jails.value.reduce((a, j) => a + (j.bannedCount || 0), 0)
  )

  const activeJails = computed(() =>
    jails.value.filter(j => !j.error).length
  )

  function connectSocket() {

    socket.on('status', (data) => {
      jails.value = data
    })

    socket.on('alert', () => {
      alerts.value++
    })
  }

  function refresh() {
    socket.emit('refresh')
  }

  return {
    socket,
    jails,
    alerts,
    serviceStatus,
    totalBanned,
    activeJails,
    connectSocket,
    refresh
  }
})