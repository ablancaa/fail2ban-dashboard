<script setup>
import NavBar from "./components/NavBar.vue";
import Footer from "./components/Footer.vue";
import { useFail2BanStore } from "@/stores/fail2ban";
import { ref } from "vue";

import fondo from "/src/assets/fondo.jpg";

const bgImage = ref(fondo);
const store = useFail2BanStore();
</script>

<template>
  <div
    class="min-h-screen bg-cover bg-center relative"
    :style="{ backgroundImage: `url(${bgImage})` }"
  >
    <!-- overlay -->
    <div class="absolute inset-0 bg-blue-900/10"></div>

    <!-- CONTENIDO (ENCIMA DEL FONDO) -->
    <div class="relative z-10 min-h-screen flex flex-col">
      <NavBar :jails="store.jails" />

      <!-- ❌ QUITAR bg-gray-100 -->
      <div class="flex-1 p-4">
        <router-view />
      </div>

      <Footer />
    </div>
  </div>
</template>
