import express from 'express';        // Framework web para crear el servidor
import { exec } from 'child_process';  // Permite ejecutar comandos del sistema
import { createServer } from 'http';    // Crea el servidor HTTP
import { Server } from 'socket.io';     // WebSocket para comunicación en tiempo real
import cors from 'cors';               // Permite solicitudes Cross-Origin

// Inicialización de Express y servidor HTTP
const app = express();
app.use(cors());  // Habilita CORS para permitir conexiones desde el frontend

const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });  // WebSocket con CORS abierto

/* Obtener lista de jails (parser robusto) */
// getJails: Ejecuta 'fail2ban-client status' y extrae la lista de jails activos
const getJails = (callback) => {
  exec('fail2ban-client status', (err, stdout) => {
    if (err) {
      callback([]);  // Si hay error, retorna array vacío
      return;
    }

    // Extrae la línea "Jail list: jail1, jail2, jail3"
    const match = stdout.match(/Jail list:\s*(.*)/);
    if (!match) {
      callback([]);
      return;
    }

    // Divide por coma, limpia espacios y filtra vacíos
    const jails = match[1]
      .split(',')
      .map(j => j.trim())
      .filter(Boolean);

    callback(jails);
  });
};

/* Endpoint REST */
// GET /api/jails - Retorna la lista de todos los jails configurados
app.get('/api/jails', (req, res) => {
  getJails((jails) => {
    res.json(jails);
  });
});

/* Obtener estado de un jail */
// getJailStatus: Ejecuta 'fail2ban-client status <jail>' y extrae las IPs baneadas
const getJailStatus = (jail, callback) => {
  exec(`fail2ban-client status ${jail}`, (err, stdout) => {
    if (err) {
      callback({ jail, error: err.message });
      return;
    }

    // Extrae la línea "Banned IP list: ip1 ip2 ip3"
    const match = stdout.match(/Banned IP list:\s*(.*)/);
    const banned = match && match[1]
      ? match[1].split(/\s+/).filter(Boolean)  // Divide por espacios
      : [];

    callback({
      jail,
      bannedCount: banned.length,  // Cantidad de IPs bloqueadas
      banned                      // Array con las IPs
    });
  });
};

// Endpoint para desbanear una IP
// POST /api/unban - Recibe { jail, ip } y ejecuta fail2ban-client set <jail> unbanip <ip>
app.post('/api/unban', express.json(), (req, res) => {
  const { jail, ip } = req.body;
  if (!jail || !ip) return res.status(400).json({ error: "Falta jail o IP" });

  exec(`fail2ban-client set ${jail} unbanip ${ip}`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ success: true, jail, ip });
  });
});

// Iniciar servicio Fail2Ban
// POST /api/service-start - Ejecuta 'systemctl start fail2ban'
app.post('/api/service-start', (req, res) => {
  exec('systemctl start fail2ban', () => {
    res.json({ success: true })
  })
})

// Detener servicio Fail2Ban
// POST /api/service-stop - Ejecuta 'systemctl stop fail2ban'
app.post('/api/service-stop', (req, res) => {
  exec('systemctl stop fail2ban', () => {
    res.json({ success: true })
  })
})

// Reiniciar servicio Fail2Ban
// POST /api/service-restart - Ejecuta 'systemctl restart fail2ban'
app.post('/api/service-restart', (req, res) => {
  exec('systemctl restart fail2ban', () => {
    res.json({ success: true })
  })
})

// Estado Fail2Ban con detalle
// GET /api/service-status - Retorna el estado del servicio (running/stopped/error)
app.get('/api/service-status', (req, res) => {

  // Verifica si el servicio está activo
  exec('systemctl is-active fail2ban', (err, stdout) => {

    const state = stdout?.trim()

    // Servicio funcionando correctamente
    if (state === 'active') {
      return res.json({ status: 'running', message: '' })
    }

    // Servicio detenido
    if (state === 'inactive') {
      return res.json({ status: 'stopped', message: 'Servicio detenido' })
    }

    // Estado desconocido o error - obtener logs para diagnóstico
    exec('journalctl -u fail2ban -n 20 --no-pager', (err2, log) => {
      return res.json({
        status: 'error',
        message: log || err2?.message || 'Error desconocido en Fail2Ban'
      })
    })

  })

})
exec('fail2ban-client status', (err, stdout) => {
  if (err) {
    return res.json({
      status: 'error',
      message: err.message
    })
  }
})
// Obtener configuración del jail desde /etc/fail2ban/jail.local
// GET /api/jail-config - Retorna el contenido del archivo de configuración
app.get('/api/jail-config', (req, res) => {
  exec('cat /etc/fail2ban/jail.local', (err, stdout, stderr) => {

    if (err) {
      return res.status(500).json({
        config: '',
        error: stderr || err.message
      })
    }

    res.json({
      config: stdout
    })
  })
})

/* WebSocket tiempo real */
// globalNotifiedIPs: Set global para rastrear IPs ya notificadas (evita notificaciones duplicadas)
const globalNotifiedIPs = new Set();

// Configuración de Socket.io para comunicación en tiempo real
io.on('connection', (socket) => {

// lastBanned: Almacena las IPs del ciclo anterior para comparar y detectar nuevas
const lastBanned = {}; 

// sendStatus: Función principal que obtiene el estado de todos los jails y lo envía al cliente
const sendStatus = () => {
  getJails((jails) => {

    if (jails.length === 0) {
      socket.emit('status', []);
      return;
    }

    const statusArray = [];
    let remaining = jails.length;

    // Itera sobre cada jail para obtener su estado
    jails.forEach(jail => {
      getJailStatus(jail, (data) => {

        // Comprobar IPs nuevas (solo las que no se han notificado antes)
        // 1. Verifica contra el Set global (notificaciones previas)
        // 2. Verifica contra lastBanned (ciclo anterior)
        const prev = lastBanned[jail.jail] || [];
        const newIPs = data.banned.filter(ip => {
          const alreadyNotified = globalNotifiedIPs.has(`${jail.jail}:${ip}`);
          if (!alreadyNotified) {
            globalNotifiedIPs.add(`${jail.jail}:${ip}`);
          }
          return !alreadyNotified && !prev.includes(ip);
        });
        
        // Si hay nuevas IPs, emite evento de alerta al cliente
        if (newIPs.length > 0) {
          socket.emit('alert', { jail: jail.jail, ips: newIPs });
        }

        // Actualiza el estado anterior para el próximo ciclo
        lastBanned[jail.jail] = data.banned;

        statusArray.push(data);
        remaining--;

        // Cuando todas las consultas terminan, envía el array completo
        if (remaining === 0) {
          socket.emit('status', statusArray);
        }

      });
    });

  });
};

// Número de jails activos
// GET /api/jails-count - Retorna la cantidad de jails configurados
app.get('/api/jails-count', (req, res) => {
  exec('fail2ban-client status', (err, stdout) => {
    if (err) return res.json({ count: 0 })

    const match = stdout.match(/Jail list:\s*(.*)/)

    const count = match?.[1]
      ? match[1].split(',').filter(Boolean).length
      : 0

    res.json({ count })
  })
})

// Función auxiliar: formatea fecha a formato "YYYY-MM-DD HH:mm:ss"
const formatDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// Función auxiliar: normaliza timestamps de diferentes formatos a formato ISO
// Soporta formatos: ISO (2026-04-15 00:22:33) y syslog (Apr 15 00:22:33)
const normalizeTimestamp = (raw) => {
  if (!raw) return null

  const line = raw.replace(/^[^:]+:/, '').trim()

  // Intenta parsear formato ISO: 2026-04-15 00:22:33
  const isoMatch = line.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})(?:[ T]([0-9]{2}:[0-9]{2}:[0-9]{2})(?:[.,][0-9]+)?)?/) 
  if (isoMatch) {
    const date = new Date(`${isoMatch[1]}T${isoMatch[2] || '00:00:00'}`)
    if (!Number.isNaN(date.valueOf())) {
      return formatDateTime(date)
    }
  }

  // Intenta parsear formato syslog: Apr 15 00:22:33
  const syslogMatch = line.match(/([A-Za-z]{3})\s+(\d{1,2})\s+([0-9]{2}:[0-9]{2}:[0-9]{2})/)
  if (syslogMatch) {
    const months = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    }
    const month = months[syslogMatch[1]]
    const day = Number(syslogMatch[2])
    const [hours, minutes, seconds] = syslogMatch[3].split(':').map(Number)
    const year = new Date().getFullYear()
    const date = new Date(year, month, day, hours, minutes, seconds)
    if (!Number.isNaN(date.valueOf())) {
      return formatDateTime(date)
    }
  }

  return null
}

// Obtener historial de baneos desde los logs de Fail2Ban
// GET /api/fail2ban-bans - Lee /var/log/fail2ban.log* y extrae registros de Bans
app.get('/api/fail2ban-bans', (req, res) => {

  // Ejecuta zgrep para buscar líneas con "Ban" en los archivos de log comprimidos
  exec(`zgrep "Ban" /var/log/fail2ban.log*`, (err, stdout) => {

    if (err) {
      return res.status(500).json({
        error: err.message,
        data: []
      })
    }

    // Parseo básico de logs - divide por líneas
    const lines = stdout.split('\n').filter(Boolean)

    // Mapea cada línea a un objeto con IP, timestamp y línea original
    const bans = lines.map(line => {

      // Ejemplos de formato de línea:
      // 2026-04-15 00:22:33,123 fail2ban.actions [1234]: NOTICE [sshd] Ban 1.2.3.4
      // Apr 15 00:22:33 hostname fail2ban.actions [1234]: NOTICE [sshd] Ban 1.2.3.4

      // Extrae la IP del patrón "Ban <ip>"
      const ipMatch = line.match(/Ban\s+(\d+\.\d+\.\d+\.\d+)/)
      const timestamp = normalizeTimestamp(line)

      return ipMatch ? {
        ip: ipMatch[1],
        timestamp,
        raw: line
      } : null

    }).filter(Boolean)

    res.json({
      total: bans.length,
      bans
    })

  })
})


  // Evento: Cuando un cliente se conecta, envía el estado inmediatamente
  sendStatus();

  // Evento: Envía actualizaciones cada 5 segundos automáticamente
  const interval = setInterval(sendStatus, 5000);
  
  // Evento: Cuando el cliente solicita refresh, envía el estado inmediatamente
  socket.on('refresh', () => sendStatus());
  
  // Evento: Cuando el cliente se desconecta, limpia el intervalo
  socket.on('disconnect', () => clearInterval(interval));
});

// Inicia el servidor HTTP en el puerto 3000
server.listen(3000, () => {
  console.log('Fail2Ban API corriendo en puerto 3000');
});