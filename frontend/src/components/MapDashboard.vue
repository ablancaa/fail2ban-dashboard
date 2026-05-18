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
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
window.L = L; // 👈 Registramos L en la ventana del navegador inmediatamente

// Ahora que window.L existe de forma garantizada, importamos el JS del plugin
import "leaflet.markercluster/dist/leaflet.markercluster.js";

// ✅ 1. Restauramos correctamente las imágenes físicas de los iconos para Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
const API_BASE = "http://192.168.1.137:3000";
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
  socket = io(API_BASE);

  // 🔌 Escuchar el WebSocket adaptado al formato plano del backend
  socket.on("status", (flatJailsData) => {
    // 1. Limpiamos los clusters anteriores de forma eficiente
    markerClusterGroup.clearLayers();

    const batchMarkers = [];

    // 2. Como el backend ya envía un array plano de cárceles, iteramos directamente
    if (Array.isArray(flatJailsData)) {
      flatJailsData.forEach((jail) => {
        // Validamos que la cárcel contenga geolocalizaciones válidas
        if (jail.geoBannedIPs && Array.isArray(jail.geoBannedIPs)) {
          jail.geoBannedIPs.forEach((geo) => {
            // Si no hay coordenadas reales de geoip-lite, saltamos la iteración
            if (!geo || isNaN(geo.lat) || isNaN(geo.lon)) return;

            // Construcción del popup enriquecido
            const popupInfo = `
            <div class="map-popup">
              <h4>🚨 IP Baneada</h4>
              <p><strong>Servidor Origen:</strong> ${jail.server || "Desconocido"}</p>
              <p><strong>IP:</strong> <span class="highlight">${geo.ip}</span></p>
              <p>
<strong>Ubicación:</strong>
${countryCodeToFlag(geo.countryCode)}
${geo.city ? geo.city + ", " : ""}
${geo.country || "Desconocido"}
</p>
              <p><strong>Jail afectada:</strong> <span class="jail-badge">${
                jail.jail || "Desconocida"
              }</span></p>
            </div>
          `;

            // Crear marcador e insertarlo al lote
            const marker = L.circleMarker([geo.lat, geo.lon], {
              radius: 8,
              fillColor: "#ff3b3b",
              color: "#ffffff",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8,
            }).bindPopup(popupInfo);
            batchMarkers.push(marker);
          });
        }
      });
    }

    // 3. Añadir todos los marcadores de golpe al mapa
    if (batchMarkers.length > 0) {
      markerClusterGroup.addLayers(batchMarkers);
    }
  });
  // Al final de tu onMounted(), justo debajo de socket.on("status", ...), añade esto:
});

function countryCodeToFlag(code) {
  return code
    ?.toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()));
}

onUnmounted(() => {
  if (socket) socket.disconnect();
  if (map) map.remove();
});
</script>

<style scoped>
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
  width: 100%;
  min-height: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  border: 1px solid #2c2c2c;
  position: relative;
}

/* Estilos internos del Popup (usando :deep porque Leaflet inyecta el HTML fuera de Vue) */
:deep(.map-popup) {
  color: #333;
  font-size: 0.85rem;
  line-height: 1.4;
}
:deep(.map-popup h4) {
  margin: 0 0 8px 0;
  color: #d32f2f;
  font-size: 0.95rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}
:deep(.map-popup p) {
  margin: 4px 0;
}
:deep(.highlight) {
  font-weight: bold;
  color: #111;
  font-family: monospace;
}
:deep(.jail-badge) {
  background-color: #ffeb3b;
  color: #000;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.75rem;
}
</style>
