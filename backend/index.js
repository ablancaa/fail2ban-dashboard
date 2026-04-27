import express from 'express';
import { exec } from 'child_process';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

/* Obtener lista de jails (parser robusto) */
const getJails = (callback) => {
  exec('fail2ban-client status', (err, stdout) => {
    if (err) {
      callback([]);
      return;
    }

    const match = stdout.match(/Jail list:\s*(.*)/);
    if (!match) {
      callback([]);
      return;
    }

    const jails = match[1]
      .split(',')
      .map(j => j.trim())
      .filter(Boolean);

    callback(jails);
  });
};

/* Endpoint REST */
app.get('/api/jails', (req, res) => {
  getJails((jails) => {
    res.json(jails);
  });
});

/* Obtener estado de un jail */
const getJailStatus = (jail, callback) => {
  exec(`fail2ban-client status ${jail}`, (err, stdout) => {
    if (err) {
      callback({ jail, error: err.message });
      return;
    }

    const match = stdout.match(/Banned IP list:\s*(.*)/);
    const banned = match && match[1]
      ? match[1].split(/\s+/).filter(Boolean)
      : [];

    callback({
      jail,
      bannedCount: banned.length,
      banned
    });
  });
};

// Endpoint para desbanear una IP
app.post('/api/unban', express.json(), (req, res) => {
  const { jail, ip } = req.body;
  if (!jail || !ip) return res.status(400).json({ error: "Falta jail o IP" });

  exec(`fail2ban-client set ${jail} unbanip ${ip}`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ success: true, jail, ip });
  });
});

// Start
app.post('/api/service-start', (req, res) => {
  exec('systemctl start fail2ban', () => {
    res.json({ success: true })
  })
})

// Stop
app.post('/api/service-stop', (req, res) => {
  exec('systemctl stop fail2ban', () => {
    res.json({ success: true })
  })
})

// Restart
app.post('/api/service-restart', (req, res) => {
  exec('systemctl restart fail2ban', () => {
    res.json({ success: true })
  })
})

// Estado Fail2Ban con detalle
app.get('/api/service-status', (req, res) => {

  exec('systemctl is-active fail2ban', (err, stdout) => {

    const state = stdout?.trim()

    // funcionando
    if (state === 'active') {
      return res.json({ status: 'running', message: '' })
    }

    if (state === 'inactive') {
      return res.json({ status: 'stopped', message: 'Servicio detenido' })
    }

    // ?? estado REAL de error con log completo
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
//Archivo jail
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
const globalNotifiedIPs = new Set(); // IPs ya notificadas globalmente

io.on('connection', (socket) => {

const lastBanned = {}; // para guardar IPs del ciclo anterior

const sendStatus = () => {
  getJails((jails) => {

    if (jails.length === 0) {
      socket.emit('status', []);
      return;
    }

    const statusArray = [];
    let remaining = jails.length;

    jails.forEach(jail => {
      getJailStatus(jail, (data) => {

        // comprobar IPs nuevas (solo las que no se han notificado antes)
        const prev = lastBanned[jail.jail] || [];
        const newIPs = data.banned.filter(ip => {
          const alreadyNotified = globalNotifiedIPs.has(`${jail.jail}:${ip}`);
          if (!alreadyNotified) {
            globalNotifiedIPs.add(`${jail.jail}:${ip}`);
          }
          return !alreadyNotified && !prev.includes(ip);
        });
        
        if (newIPs.length > 0) {
          socket.emit('alert', { jail: jail.jail, ips: newIPs });
        }

        lastBanned[jail.jail] = data.banned;

        statusArray.push(data);
        remaining--;

        if (remaining === 0) {
          socket.emit('status', statusArray);
        }

      });
    });

  });
};

//numero de jails
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

const formatDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const normalizeTimestamp = (raw) => {
  if (!raw) return null

  const line = raw.replace(/^[^:]+:/, '').trim()

  const isoMatch = line.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})(?:[ T]([0-9]{2}:[0-9]{2}:[0-9]{2})(?:[.,][0-9]+)?)?/) 
  if (isoMatch) {
    const date = new Date(`${isoMatch[1]}T${isoMatch[2] || '00:00:00'}`)
    if (!Number.isNaN(date.valueOf())) {
      return formatDateTime(date)
    }
  }

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

// Loc con comando sudo zgrep "Ban" /var/log/fail2ban.log*
app.get('/api/fail2ban-bans', (req, res) => {

  exec(`zgrep "Ban" /var/log/fail2ban.log*`, (err, stdout) => {

    if (err) {
      return res.status(500).json({
        error: err.message,
        data: []
      })
    }

    // parseo básico de logs
    const lines = stdout.split('\n').filter(Boolean)

    const bans = lines.map(line => {

      // ejemplo línea:
      // 2026-04-15 00:22:33,123 fail2ban.actions [1234]: NOTICE [sshd] Ban 1.2.3.4
      // o con formato syslog:
      // Apr 15 00:22:33 hostname fail2ban.actions [1234]: NOTICE [sshd] Ban 1.2.3.4

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


  // enviar al conectar
  sendStatus();

  // enviar cada 5s
  const interval = setInterval(sendStatus, 5000);
  socket.on('refresh', () => sendStatus());
  socket.on('disconnect', () => clearInterval(interval));
});

server.listen(3000, () => {
  console.log('Fail2Ban API corriendo en puerto 3000');
});