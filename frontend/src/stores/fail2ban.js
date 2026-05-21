import { defineStore } from "pinia";
import { ref } from "vue";
import { io } from "socket.io-client";
import axios from "axios";

export const useFail2BanStore = defineStore("fail2ban", () => {
  let socket;

  const servers = ref([]);
  const bans = ref([]);
  
  function connectSocket() {
    if (socket) return;

    socket = io("http://192.168.1.137:3000");

    socket.on("status", (data) => {
      servers.value = data || [];
    });

    // 🔥 HISTÓRICO EN TIEMPO REAL
    socket.on("bans-history", (data) => {
      bans.value = data || [];
    });
  }

  function refresh() {
    socket?.emit("refresh");
  }

   async function fetchBans() {
    try {
      const res = await axios.get(
        "http://192.168.1.137:3000/api/bans-history"
      );

      bans.value = res.data || [];
    } catch (err) {
      console.error("Error cargando bans:", err);
    }
  }

  async function control(serverId, action) {
    await axios.post(`http://192.168.1.137:3000/api/fail2ban/${action}`, {
      serverId,
    });
  }

  return {
    servers,
    bans,
    connectSocket,
    refresh,
    fetchBans,
    control,
  };
});
