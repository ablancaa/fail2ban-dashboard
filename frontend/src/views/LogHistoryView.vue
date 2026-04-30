<script setup>
import { ref, onMounted, watch } from "vue";
import NavBar from "@/components/NavBar.vue";
import LogsHistory from "@/components/LogsHistory.vue";
</script>
<template>
  <div <div class="max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">📄 Historial de Bans</h1>
    <LogsHistory />
  </div>
</template>
