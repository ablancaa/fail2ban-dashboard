<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const now = ref(new Date());
let interval = null;

onMounted(() => {
  interval = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(interval);
});

// Formateo bonito
const formatDate = (date) => {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (date) => {
  return date.toLocaleTimeString("es-ES");
};
</script>

<template>
  <footer class="bg-gray-800 text-white mt-4 rounded-2xl shadow-lg mb-2">
    <div
      class="max-w-6xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2"
    >
      <!-- Nombre -->
      <div class="text-sm md:text-base font-medium">
        © {{ new Date().getFullYear() }} Alberto Blanca Alcaide
      </div>

      <!-- Fecha y hora -->
      <div class="text-sm md:text-base text-gray-300 text-center md:text-right">
        <div>{{ formatDate(now) }}</div>
        <div class="font-mono">{{ formatTime(now) }}</div>
      </div>
    </div>
  </footer>
</template>
<style scoped></style>
