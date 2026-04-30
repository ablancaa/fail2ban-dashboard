<script setup>
import { ref, onMounted, watch } from "vue";
import NavBar from "@/components/NavBar.vue";
import LogsHistory from "@/components/LogsHistory.vue";
import JailConfig from "@/components/JailConfig.vue";
</script>
<template>
  <!-- <NavBar /> -->
  <h1 class="text-2xl font-bold mb-4">⚙️ Jail Config</h1>
  <JailConfig />
</template>
