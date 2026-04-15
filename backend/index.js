import express from 'express';
import { exec } from 'child_process';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import axios from "axios"

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
io.on('connection', (socket) => {

const lastBanned = {}; // para guardar IPs ya notificadas

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

        // comprobar IPs nuevas
        const prev = lastBanned[jail.jail] || [];
        const newIPs = data.banned.filter(ip => !prev.includes(ip));
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
//Geolocalizacion de ip
export async function getCountry(ip) {
  const res = await axios.get(`http://ip-api.com/json/${ip}`)
  return {
    country: res.data.country,
    code: res.data.countryCode.toLowerCase()
  }
}

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