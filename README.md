# 🛡️ Fail2Ban Dashboard

Panel web para monitorizar y gestionar **Fail2Ban** en tiempo real.
Incluye frontend moderno (Vue 3) y backend (Node.js) que se comunican con el sistema para mostrar IPs baneadas, jails activos y estadísticas.

---

## ✨ Características

* 📊 Dashboard con estadísticas de ataques
* 🚫 Lista de IPs baneadas en tiempo real
* 🌍 País de origen de cada IP
* 🔄 Actualización automática
* 📈 Gráficos de actividad
* 🟢 Detección de jails activos
* ⚙️ Visualización de configuración `jail.local`
* ✏️ Edición de configuración desde la web
* 🔄 Reinicio de Fail2Ban desde la interfaz
* 🔔 Alertas push
* 🧠 Historial de eventos

---

## 🏗️ Estructura del proyecto

```
fail2ban-dashboard/
├── frontend/   # Vue 3 + Vite
└── backend/    # Node.js + Express
```

---

## ⚙️ Requisitos

* Linux con Fail2Ban instalado
* Node.js 18+
* npm
* Permisos sudo para ejecutar comandos de Fail2Ban

---

## 🚀 Instalación

### 1. Clonar repositorio

```
git clone https://github.com/TU_USUARIO/fail2ban-dashboard.git
cd fail2ban-dashboard
```

---

### 2. Backend

```
cd backend
npm install
```

Crear archivo `.env` (opcional):

```
PORT=3000
```

Iniciar backend:

```
node index.js
```

o con PM2:

```
pm2 start index.js --name fail2ban-backend
```

---

### 3. Frontend

```
cd ../frontend
npm install
npm run build
```

Esto generará la carpeta:

```
frontend/dist
```

---

## 🌐 Despliegue con Nginx / Apache

Copiar el frontend compilado:

```
cp -r dist/* /var/www/html/
```

o configurar virtualhost apuntando a:

```
frontend/dist
```

---

## ▶️ Desarrollo

### Backend

```
cd backend
npm run dev
```

### Frontend

```
cd frontend
npm run dev
```

Acceder:

```
http://localhost:5173
```

---

## 🔐 Permisos Fail2Ban

El backend necesita ejecutar comandos como:

```
fail2ban-client status
fail2ban-client status sshd
```

Si ejecutas como usuario no root, añade permisos sudo:

```
sudo visudo
```

Añadir:

```
www-data ALL=(ALL) NOPASSWD: /usr/bin/fail2ban-client
```

---

## 📡 API Endpoints

* `/api/status` → estado general
* `/api/banned` → IPs baneadas
* `/api/jails` → jails activos
* `/api/config` → configuración jail.local
* `/api/restart` → reiniciar fail2ban

---

## 🧪 Ejecución en producción

Recomendado usar:

```
pm2
nginx
```

Ejemplo PM2:

```
pm2 start backend/index.js --name fail2ban-dashboard
pm2 save
pm2 startup
```

---

## 🔄 Actualizar desde Git

```
git pull
cd frontend
npm run build
pm2 restart fail2ban-backend
```

---

## 🖥️ Capturas

Dashboard en tiempo real con IPs bloqueadas y estadísticas.

---

## 🛠️ Tecnologías

* Vue 3
* Vite
* TailwindCSS
* Node.js
* Express
* Chart.js
* Fail2Ban

---

## 📄 Licencia

MIT

---

## 👨‍💻 Autor

Fail2Ban Dashboard — proyecto personal para monitorización de seguridad SSH.
