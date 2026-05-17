import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

console.log("🔥 BACKEND MULTI-SERVER AGGREGATOR LOADED");

// =========================
// APP SETUP
// =========================
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// =========================
// 📋 CARGAR CONFIGURACIÓN DE SERVIDORES
// =========================
let serverConfig = [];
try {
  const configPath = path.join(__dirname, "servers.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  serverConfig = config.servers || [];
  console.log(`✅ Cargados ${serverConfig.length} servidores desde servers.json`);
} catch (err) {
  console.error("❌ Error cargando servers.json:", err.message);
  process.exit(1);
}

// =========================
// 🌍 GEO CACHE
// =========================
const geoCache = new Map();

async function getGeo(ip) {
  if (!ip) {
    return { ip, country: "Unknown", countryCode: "XX", city: "" };
  }

  if (geoCache.has(ip)) {
    return geoCache.get(ip);
  }

  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 3000,
    });

    if (!res.data || res.data.status !== "success") {
      throw new Error("Geo failed");
    }

    const data = {
      ip,
      country: res.data.country || "Unknown",
      countryCode: res.data.countryCode || "XX",
      city: res.data.city || "",
      lat: res.data.lat || 0,
      lon: res.data.lon || 0
    };

    geoCache.set(ip, data);
    return data;
  } catch (err) {
    console.warn("⚠️ Geo fallback for:", ip);

    const fallback = {
      ip,
      country: "Unknown",
      countryCode: "XX",
      city: "",
    };

    geoCache.set(ip, fallback);
    return fallback;
  }
}

// =========================
// 🚫 GEO ENDPOINT
// =========================
app.get("/api/geo/:ip", async (req, res) => {
  try {
    const geo = await getGeo(req.params.ip);
    res.json(geo);
  } catch (error) {
    console.error("Geo error backend:", error.message);

    res.json({
      ip: req.params.ip,
      country: "Unknown",
      countryCode: "XX",
      city: "",
    });
  }
});

// =========================
// 📡 FUNCIONES PARA CONECTAR A SERVIDORES REMOTOS
// =========================
async function getServerData(serverId, endpoint) {
  try {
    const srv = serverConfig.find(s => s.id === serverId);
    if (!srv) throw new Error(`Servidor ${serverId} no encontrado`);

    const url = `http://${srv.ip}:${srv.port}${endpoint}`;
    const res = await axios.get(url, { timeout: 5000 });
    return res.data;
  } catch (err) {
    console.error(`❌ Error conectando a ${serverId}:`, err.message);
    throw err;
  }
}

async function postServerData(serverId, endpoint, data) {
  try {
    const srv = serverConfig.find(s => s.id === serverId);
    if (!srv) throw new Error(`Servidor ${serverId} no encontrado`);

    const url = `http://${srv.ip}:${srv.port}${endpoint}`;
    const res = await axios.post(url, data, { timeout: 5000 });
    return res.data;
  } catch (err) {
    console.error(`❌ Error conectando a ${serverId}:`, err.message);
    throw err;
  }
}

// =========================
// 📡 SOCKET - AGREGAR DATOS DE MÚLTIPLES SERVIDORES
// =========================
io.on("connection", (socket) => {
  console.log("✅ Cliente conectado");

  const lastBanned = {};

  async function sendAggregatedStatus() {
    try {
      const allServersData = {};

      // Conectar a cada servidor y agregar datos
      for (const srv of serverConfig) {
        if (!srv.enabled) continue;

        try {
          const jails = await getServerData(srv.id, "/api/jails");
          
          if (!jails || jails.length === 0) {
            allServersData[srv.id] = {
              serverId: srv.id,
              serverName: srv.name,
              serverHostname: srv.hostname,
              serverIp: srv.ip,
              status: "error",
              jails: [],
              error: "No jails found"
            };
            continue;
          }

          const jailsWithStatus = [];
          for (const jail of jails) {
            const jailData = await getServerData(srv.id, `/api/jails/${jail}`);
            jailsWithStatus.push(jailData);
          }

          allServersData[srv.id] = {
            serverId: srv.id,
            serverName: srv.name,
            serverHostname: srv.hostname,
            serverIp: srv.ip,
            status: "running",
            jails: jailsWithStatus
          };
        } catch (err) {
          console.warn(`⚠️ Error obteniendo datos de ${srv.id}:`, err.message);
          allServersData[srv.id] = {
            serverId: srv.id,
            serverName: srv.name,
            serverHostname: srv.hostname,
            serverIp: srv.ip,
            status: "error",
            jails: [],
            error: err.message
          };
        }
      }

      socket.emit("status", allServersData);
    } catch (err) {
      console.error("Error en sendAggregatedStatus:", err);
    }
  }

  sendAggregatedStatus();
  const interval = setInterval(sendAggregatedStatus, 5000);

  socket.on("refresh", sendAggregatedStatus);
  socket.on("disconnect", () => {
    clearInterval(interval);
    console.log("🔌 Cliente desconectado");
  });
});

// =========================
// 🌐 REST API - MÚLTIPLES SERVIDORES
// =========================

// Obtener lista de servidores configurados
app.get("/api/servers", (req, res) => {
  const servers = serverConfig.map(s => ({
    id: s.id,
    name: s.name,
    hostname: s.hostname,
    ip: s.ip,
    enabled: s.enabled,
    description: s.description
  }));
  res.json({ servers });
});

// Agregar nuevo servidor
app.post("/api/servers", (req, res) => {
  try {
    const { name, hostname, ip, port, description } = req.body;
    
    if (!name || !hostname || !ip) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const newServer = {
      id: hostname.split(".")[0].toLowerCase(),
      name,
      hostname,
      ip,
      port: port || 3000,
      enabled: true,
      description: description || ""
    };

    serverConfig.push(newServer);
    
    // Guardar en archivo
    const configPath = path.join(__dirname, "servers.json");
    fs.writeFileSync(configPath, JSON.stringify({ servers: serverConfig }, null, 2));

    res.json({ success: true, server: newServer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar servidor
app.put("/api/servers/:id", (req, res) => {
  try {
    const { enabled, description } = req.body;
    const server = serverConfig.find(s => s.id === req.params.id);
    
    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    if (enabled !== undefined) server.enabled = enabled;
    if (description !== undefined) server.description = description;

    const configPath = path.join(__dirname, "servers.json");
    fs.writeFileSync(configPath, JSON.stringify({ servers: serverConfig }, null, 2));

    res.json({ success: true, server });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar servidor
app.delete("/api/servers/:id", (req, res) => {
  try {
    const idx = serverConfig.findIndex(s => s.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    const removed = serverConfig.splice(idx, 1)[0];

    const configPath = path.join(__dirname, "servers.json");
    fs.writeFileSync(configPath, JSON.stringify({ servers: serverConfig }, null, 2));

    res.json({ success: true, removed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todos los jails de todos los servidores
app.get("/api/jails", async (req, res) => {
  try {
    const result = {};

    for (const srv of serverConfig) {
      if (!srv.enabled) continue;

      try {
        const data = await getServerData(srv.id, "/api/jails");
        result[srv.id] = {
          server: srv,
          jails: data || []
        };
      } catch (err) {
        result[srv.id] = {
          server: srv,
          error: err.message,
          jails: []
        };
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener jails de un servidor específico
app.get("/api/servers/:serverId/jails", async (req, res) => {
  try {
    const data = await getServerData(req.params.serverId, "/api/jails");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener estado de un jail específico de un servidor
app.get("/api/servers/:serverId/jails/:jail", async (req, res) => {
  try {
    const data = await getServerData(req.params.serverId, `/api/jails/${req.params.jail}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unban IP en un servidor específico
app.post("/api/servers/:serverId/unban", async (req, res) => {
  try {
    const data = await postServerData(req.params.serverId, "/api/unban", req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener configuración de jail de un servidor específico
app.get("/api/servers/:serverId/jail-config", async (req, res) => {
  try {
    const data = await getServerData(req.params.serverId, "/api/jail-config?" + new URLSearchParams(req.query).toString());
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener status del servicio en un servidor específico
app.get("/api/servers/:serverId/service-status", async (req, res) => {
  try {
    const data = await getServerData(req.params.serverId, "/api/service-status");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener bans históricos de un servidor específico
app.get("/api/servers/:serverId/fail2ban-bans", async (req, res) => {
  try {
    const data = await getServerData(req.params.serverId, "/api/fail2ban-bans");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener estado de jail específico de un servidor
app.get("/api/servers/:serverId/jail-status/:name", async (req, res) => {
  try {
    const data = await getServerData(req.params.serverId, `/api/jail-status/${req.params.name}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener lista de bans de un jail en un servidor
app.get("/api/servers/:serverId/jail-banlist/:name", async (req, res) => {
  try {
    const data = await getServerData(req.params.serverId, `/api/jail-banlist/${req.params.name}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// 🚀 START SERVER
// =========================
server.listen(3000, () => {
  console.log("🚀 Fail2Ban Multi-Server Aggregator running on port 3000");
  console.log(`📡 Conectado a ${serverConfig.filter(s => s.enabled).length} servidores`);
  serverConfig.forEach(srv => {
    console.log(`   ${srv.enabled ? "✅" : "❌"} ${srv.name} (${srv.hostname}:${srv.ip})`);
  });
});