<template>
  <div class="dashboard-container">
    <div class="header">
      <h2>Mapa de Amenazas Globales (Fail2Ban)</h2>
      <p>Actualizando en tiempo real mediante Sockets</p>
    </div>
    <div id="map"></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
window.L = L; // 👈 Registramos L en la ventana del navegador inmediatamente

// Ahora que window.L existe de forma garantizada, importamos el JS del plugin
import "leaflet.markercluster/dist/leaflet.markercluster.js";

// ✅ 1. Restauramos correctamente las imágenes físicas de los iconos para Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let map = null;
let socket = null;
let markerClusterGroup = null;

onMounted(() => {
  // Configuración del Icono por defecto
  let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  // 1. Inicializar el mapa con estilo oscuro
  map = L.map("map", {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  }).addTo(map);

  // Inicializar el grupo de clusters y añadirlo al mapa
  markerClusterGroup = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
  });
  map.addLayer(markerClusterGroup);

  // 4. Conectar al WebSocket del backend agregador
  socket = io("http://localhost:3000");

  socket.on("status", (allServersData) => {
    // Limpiamos los clusters anteriores de forma eficiente
    markerClusterGroup.clearLayers();

    const batchMarkers = [];

    // Recorrer la estructura del agregador multi-servidor
    Object.values(allServersData).forEach((server) => {
      if (server.status !== "running") return;

      server.jails.forEach((jail) => {
        if (jail.geoBannedIPs && Array.isArray(jail.geoBannedIPs)) {
          jail.geoBannedIPs.forEach((geo) => {
            if (!geo.lat || !geo.lon) return;

            const popupInfo = `
              <div class="map-popup">
                <h4>🚨 IP Baneada</h4>
                <p><strong>Origen:</strong> ${server.serverName} (${server.serverIp})</p>
                <p><strong>IP:</strong> <span class="highlight">${geo.ip}</span></p>
                <p><strong>Ubicación:</strong> ${geo.city ? geo.city + ", " : ""}${
              geo.country
            } (${geo.countryCode})</p>
                <p><strong>Jail afectada:</strong> <span class="jail-badge">${
                  jail.name || "Desconocida"
                }</span></p>
              </div>
            `;

            const marker = L.marker([geo.lat, geo.lon]).bindPopup(popupInfo);
            batchMarkers.push(marker);
          });
        }
      });
    });

    if (batchMarkers.length > 0) {
      markerClusterGroup.addLayers(batchMarkers);
    }
  });
});

onUnmounted(() => {
  if (socket) socket.disconnect();
  if (map) map.remove();
});
</script>

<style scoped>
/* ✅ Dejar que el compilador de CSS de Vite maneje las rutas del plugin */
@import "leaflet.markercluster/dist/MarkerCluster.css";
@import "leaflet.markercluster/dist/MarkerCluster.Default.css";

.dashboard-container {
  width: 100%;
  height: 100vh;
  display: flex;
}

.dashboard-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #121212;
  color: #e0e0e0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  padding: 15px;
  box-sizing: border-box;
}

.header {
  margin-bottom: 15px;
}

.header h2 {
  margin: 0;
  color: #ff5252;
}

.header p {
  margin: 5px 0 0 0;
  font-size: 0.9rem;
  color: #888;
}

#map {
  flex-grow: 1;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  border: 1px solid #2c2c2c;
}

/* Estilos para el interior del Popup de Leaflet */
:deep(.map-popup) {
  color: #333;
  font-size: 0.85rem;
}
:deep(.map-popup h4) {
  margin: 0 0 8px 0;
  color: #d32f2f;
}
:deep(.map-popup p) {
  margin: 4px 0;
}
:deep(.highlight) {
  font-weight: bold;
  color: #111;
}
:deep(.jail-badge) {
  background-color: #ffeb3b;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.75rem;
}
</style>
