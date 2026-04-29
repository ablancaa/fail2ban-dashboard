import express from "express";
import { exec } from "child_process";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import axios from "axios";

console.log("🔥 BACKEND GEO LOADED CORRECTLY");
// =========================
// APP SETUP
// =========================
const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// =========================
// 🌍 GEO CACHE
// =========================
const geoCache = new Map();

async function getGeo(ip) {
  if (!ip) return { ip, country: "Unknown", countryCode: "XX" };

  if (geoCache.has(ip)) return geoCache.get(ip);

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
    };

    geoCache.set(ip, data);
    return data;

  } catch (err) {

    // 🔥 DETECTAR RATE LIMIT
    if (err.response?.status === 429) {
      console.warn("⚠️ Rate limit alcanzado, usando fallback");
    }

    const fallback = {
      ip,
      country: "Unknown",
      countryCode: "XX",
      city: "",
    };

    geoCache.set(ip, fallback); // 👈 IMPORTANTE: cache también errores
    return fallback;
  }
}
// =========================
// 🌍 GEO ENDPOINT
// =========================
app.get("/api/geo/:ip", async (req, res) => {
  try {
    const { ip } = req.params;
 
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 3000,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Geo error backend:", error.message);
    res.status(500).json({ error: "Geo lookup failed" });
  }
});

// =========================
// 🚀 START SERVER
// =========================
function getJails() {
  return new Promise((resolve) => {
    exec("fail2ban-client status", (err, stdout) => {
      if (err) return resolve([]);

      const match = stdout.match(/Jail list:\s*(.*)/);
      if (!match) return resolve([]);

      const jails = match[1].split(/\s*,\s*/).filter(Boolean);
      resolve(jails);
    });
  });
}

function getJailStatus(jail) {
  return new Promise((resolve) => {
    exec(`fail2ban-client status ${jail}`, (err, stdout) => {
      if (err) return resolve({ jail, error: err.message });

      const match = stdout.match(/Banned IP list:\s*(.*)/);

      const banned = match?.[1]
        ? match[1].split(/\s+/).filter(Boolean)
        : [];

      resolve({
        jail,
        bannedCount: banned.length,
        banned,
      });
    });
  });
}

// =========================
// 📡 SOCKET
// =========================
io.on("connection", (socket) => {
  const lastBanned = {};

  async function sendStatus() {
    const jails = await getJails();

    if (!jails.length) {
      socket.emit("status", []);
      return;
    }

    const result = [];

    for (const jail of jails) {
      const data = await getJailStatus(jail);

      const prev = lastBanned[jail] || [];
      const newIPs = data.banned.filter((ip) => !prev.includes(ip));

      if (newIPs.length > 0) {
        const enriched = await Promise.all(
          newIPs.map(async (ip) => {
            const geo = await getGeo(ip);
            return { ip, geo };
          })
        );

        socket.emit("alert", {
          jail,
          ips: enriched,
        });
      }

      lastBanned[jail] = data.banned;
      result.push(data);
    }

    socket.emit("status", result);
  }

  sendStatus();
  const interval = setInterval(sendStatus, 5000);

  socket.on("refresh", sendStatus);
  socket.on("disconnect", () => clearInterval(interval));
});

// =========================
// 🌐 REST API
// =========================

// Jails
app.get("/api/jails", async (req, res) => {
  const jails = await getJails();
  res.json(jails);
});

// Jail config
app.get("/api/jail-config", async (req, res) => {
  const { jail } = req.query;
  
  // Si no se especifica jail, devolver configuración de jail.local
  if (!jail) {
    exec("cat /etc/fail2ban/jail.local", (err, stdout) => {
      if (err) {
        // Intentar con jail.conf si no existe jail.local
        exec("cat /etc/fail2ban/jail.conf", (err2, stdout2) => {
          if (err2) return res.status(500).json({ error: "No se encontró configuración" });
          res.json({ config: stdout2 });
        });
      } else {
        res.json({ config: stdout });
      }
    });
    return;
  }

  exec(`fail2ban-client get ${jail} ban-time`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const banTimeMatch = stdout.match(/(\d+)/);
    const banTime = banTimeMatch ? parseInt(banTimeMatch[1]) : 0;
    
    exec(`fail2ban-client get ${jail} maxretry`, (err2, stdout2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      
      const maxRetryMatch = stdout2.match(/(\d+)/);
      const maxRetry = maxRetryMatch ? parseInt(maxRetryMatch[1]) : 0;
      
      res.json({
        jail,
        banTime,
        maxRetry
      });
    });
  });
});

// Unban IP
app.post("/api/unban", (req, res) => {
  const { jail, ip } = req.body;

  if (!jail || !ip) {
    return res.status(400).json({ error: "Falta jail o IP" });
  }

  exec(`fail2ban-client set ${jail} unbanip ${ip}`, (err) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ success: true });
  });
});

// Service status
app.get("/api/service-status", (req, res) => {
  exec("systemctl is-active fail2ban", (err, stdout) => {
    const state = stdout?.trim();

    if (state === "active") return res.json({ status: "running" });
    if (state === "inactive") return res.json({ status: "stopped" });

    return res.json({ status: "error" });
  });
});

// Logs bans
app.get("/api/fail2ban-bans", async (req, res) => {
  exec(`zgrep "Ban" /var/log/fail2ban.log*`, async (err, stdout) => {
    if (err) {
      return res.status(500).json({ error: err.message, bans: [] });
    }

    const lines = stdout.split("\n").filter(Boolean);

    // 🔥 1. Obtener IPs únicas
    const uniqueIPs = new Set();
    lines.forEach((line) => {
      const ipMatch = line.match(/Ban\s+(\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch) uniqueIPs.add(ipMatch[1]);
    });

    // 🔥 2. Obtener GEO (con cache interno)
    const geoResults = {};
    for (const ip of uniqueIPs) {
      geoResults[ip] = await getGeo(ip);
    }

    // 🔥 3. Construir respuesta final
    const bans = lines
      .map((line) => {
        const ipMatch = line.match(/Ban\s+(\d+\.\d+\.\d+\.\d+)/);

        // ✅ FORMATO REAL FAIL2BAN: 2026-04-08 02:46:31,044
        const timeMatch = line.match(
          /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/
        );

        if (!ipMatch) return null;

        const ip = ipMatch[1];
        const timestamp = timeMatch ? timeMatch[1] : null;

        return {
          ip,
          geo: geoResults[ip] || null,
          timestamp,
          raw: line,
        };
      })
      .filter(Boolean)
      // 🔥 4. Ordenar por fecha (más reciente primero)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      total: bans.length,
      bans,
    });
  });
});

// =========================
// 🚀 START SERVER
// =========================
server.listen(3000, () => {
  console.log("🚀 Fail2Ban backend running on port 3000");
});