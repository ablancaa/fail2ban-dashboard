div
<script setup>
import { ref, onMounted, watch } from "vue";
import NavBar from "@/components/NavBar.vue";
import BannedIp from "@/components/BannedIp.vue";
</script>
<template>
  <div class="max-w-6xl mx-auto">
    <h1
      class="text-2xl font-bold mb-4 bg-slate-900 text-white px-4 py-2 rounded-xl shadow"
    >
      🚨 Ips Banneadas
    </h1>

    <BannedIp />
  </div>
</template>
