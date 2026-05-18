<script setup>
import { onMounted, onUnmounted, ref, nextTick } from "vue";
import { io } from "socket.io-client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const API_BASE = "http://192.168.1.137:3000";

const mapDiv = ref(null);

let map;
let socket;
let cluster;

/* ---------------- ICON FIX ---------------- */
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

/* ---------------- FLAG CDN (PRO FIX) ---------------- */
function getFlagUrl(code) {
  if (!code || code === "Unknown") {
    return "https://flagcdn.com/24x18/un.png";
  }

  return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;
}

/* ---------------- INIT ---------------- */
onMounted(async () => {
  await nextTick();

  if (!mapDiv.value) {
    console.error("❌ Map container no encontrado");
    return;
  }

  /* MAP */
  map = L.map(mapDiv.value, {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  }).addTo(map);

  /* CLUSTER */
  cluster = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
  });

  map.addLayer(cluster);

  /* SOCKET */
  socket = io(API_BASE);

  socket.on("status", (data) => {
    cluster.clearLayers();

    const markers = [];

    for (const server of data || []) {
      for (const jail of server.jails || []) {
        for (const geo of jail.geoBannedIPs || []) {
          if (geo.lat == null || geo.lon == null) continue;

          const marker = L.circleMarker([geo.lat, geo.lon], {
            radius: 6,
            color: "#fff",
            weight: 1,
            fillColor: "#ff3b3b",
            fillOpacity: 0.9,
          });

          const flagImg = getFlagUrl(geo.countryCode);

          marker.bindPopup(`
            <div class="popup-card">

              <div class="popup-header">
                <img 
                  src="${flagImg}" 
                  style="width:18px;height:12px;border-radius:2px;border:1px solid #444;margin-right:6px;"
                  onerror="this.src='https://flagcdn.com/24x18/un.png'"
                />
                <strong>IP bloqueada</strong>
              </div>

              <div class="popup-body">
                <div><b>IP:</b> <code>${geo.ip}</code></div>

                <div><b>País:</b> ${geo.country || "Unknown"}</div>
                <div><b>Ciudad:</b> ${geo.city || "Unknown"}</div>

                <div><b>Coordenadas:</b> ${geo.lat.toFixed(4)}, ${geo.lon.toFixed(
            4
          )}</div>

                <div><b>Servidor:</b> ${server.serverName}</div>
                <div><b>Jail:</b> ${jail.name}</div>
              </div>

            </div>
          `);

          markers.push(marker);
        }
      }
    }

    cluster.addLayers(markers);
  });
});

/* ---------------- CLEAN ---------------- */
onUnmounted(() => {
  socket?.disconnect();
  map?.remove();
});
</script>

<template>
  <div class="dashboard-container">
    <div class="header">
      <h2>Mapa de Amenazas Globales (Fail2Ban)</h2>
      <p>Actualización en tiempo real</p>
    </div>

    <div ref="mapDiv" id="map"></div>
  </div>
</template>

<style scoped>
.dashboard-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

#map {
  flex: 1;
  width: 100%;
  min-height: 500px;
}

/* POPUP */
:deep(.popup-card) {
  font-family: Arial, sans-serif;
  min-width: 230px;
  background: #111;
  color: #eee;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #333;
}

:deep(.popup-header) {
  display: flex;
  align-items: center;
  font-size: 14px;
  margin-bottom: 8px;
  border-bottom: 1px solid #333;
  padding-bottom: 5px;
}

:deep(.popup-body div) {
  margin: 4px 0;
  font-size: 12px;
}

:deep(code) {
  background: #222;
  padding: 2px 4px;
  border-radius: 4px;
}
</style>
