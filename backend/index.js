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
  cors: { origin: "*", methods: ["GET", "POST"] },
});

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
// 🚫 GEO ENDPOINT (FIXED)
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
// FAIL2BAN HELPERS
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
          newIPs.map(async (ip) => ({
            ip,
            geo: await getGeo(ip),
          }))
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

// =========================
// 📦 JAIL CONFIG
// =========================
app.get("/api/jail-config", async (req, res) => {
  const { jail } = req.query;

  // 📁 Config global si no hay jail
  if (!jail) {
    exec("cat /etc/fail2ban/jail.local", (err, stdout) => {
      if (err) {
        exec("cat /etc/fail2ban/jail.conf", (err2, stdout2) => {
          if (err2) {
            return res.status(500).json({ error: "No se encontró configuración" });
          }
          res.json({ config: stdout2 });
        });
      } else {
        res.json({ config: stdout });
      }
    });
    return;
  }

  // 📊 Config de un jail concreto
  exec(`fail2ban-client get ${jail} ban-time`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });

    const banTime = parseInt(stdout.match(/(\d+)/)?.[1] || 0);

    exec(`fail2ban-client get ${jail} maxretry`, (err2, stdout2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const maxRetry = parseInt(stdout2.match(/(\d+)/)?.[1] || 0);

      res.json({
        jail,
        banTime,
        maxRetry,
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

    const uniqueIPs = new Set();
    lines.forEach((line) => {
      const ipMatch = line.match(/Ban\s+(\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch) uniqueIPs.add(ipMatch[1]);
    });

    const geoResults = {};
    for (const ip of uniqueIPs) {
      geoResults[ip] = await getGeo(ip);
    }

    const bans = lines
      .map((line) => {
        const ipMatch = line.match(/Ban\s+(\d+\.\d+\.\d+\.\d+)/);

        const timeMatch = line.match(
          /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/
        );

        if (!ipMatch) return null;

        const ip = ipMatch[1];

        return {
          ip,
          geo: geoResults[ip],
          timestamp: timeMatch ? timeMatch[1] : null,
          raw: line,
        };
      })
      .filter(Boolean)
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