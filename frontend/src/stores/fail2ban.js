import { defineStore } from "pinia";
import { ref } from "vue";
import { io } from "socket.io-client";
import axios from "axios";

export const useFail2BanStore = defineStore("fail2ban", () => {
  let socket;

  const servers = ref([]);



  function connectSocket() {
    if (socket) return;

    socket = io("http://192.168.1.137:3000");

    socket.on("status", data => {
      servers.value = data || [];
    });
  }



  function refresh() {
    socket?.emit("refresh");
  }

  async function control(serverId, action) {
    await axios.post(`http://192.168.1.137:3000/api/fail2ban/${action}`, {
      serverId
    });
  }

  return {
    servers,
    connectSocket,
    refresh,
    control
  };
});