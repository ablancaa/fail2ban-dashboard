<script setup>
import NavBar from "./components/NavBar.vue";
import Footer from "./components/Footer.vue";
import { useFail2BanStore } from "@/stores/fail2ban";

const store = useFail2BanStore();
store.jails.length;
</script>
<template>
  <!-- Contenedor principal con fondo gris y padding -->
  <NavBar :jails="store.jails" />
  <div class="min-h-screen bg-gray-100 p-4">
    <router-view />
    <Footer />
  </div>
</template>
