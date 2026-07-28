# Tutorial de Bloom — Cómo funciona cada parte de la app

Este tutorial explica, parte por parte, cómo está armada Bloom hoy y cómo interactúan
esas partes entre sí. Si sos nuevo en el proyecto, léelo en orden: cada sección se apoya
en la anterior.

## 0. Panorama general

Bloom es hoy una app muy chica con tres capas:

```
Navegador (index.html)  --HTTP-->  Servidor Express (server.js)  --SQL-->  PostgreSQL (Railway)
                                              │
                                          db.js (pool de conexión)
```

- **Frontend**: `index.html` — una landing estática (HTML + CSS, sin JS todavía).
- **Backend**: `server.js` — un servidor Express que sirve el HTML y expone una API.
- **Base de datos**: `db.js` + PostgreSQL — conexión a una base de datos alojada en Railway.
- **Configuración**: `package.json` (dependencias) y `.env` (credenciales).

No hay todavía funcionalidad de negocio real (registro de hábitos, usuarios, etc.) — eso
es el próximo paso según `PROPUESTA_BLOOM.md`. Lo que existe hoy es el "esqueleto" técnico:
un servidor que responde y que ya sabe hablar con la base de datos.

---

## 1. Frontend — `index.html`

Es una única página HTML con CSS embebido en el `<style>` del `<head>`. No usa ningún
framework ni JavaScript.

Estructura:
```html
<div class="container">
    <div class="emoji">🌸</div>
    <h1>Bloom</h1>
    <p>Tu compañera de bienestar digital...</p>
    <button class="btn">Comenzar</button>
</div>
```

Puntos clave:
- El `<div class="container">` es la tarjeta blanca centrada en pantalla; el centrado se
  logra con `display: flex; justify-content: center; align-items: center;` en el `body`.
- La paleta rosa/coral (`#FFD1DC` de fondo, `#F5B7B1` para título y botón) es una decisión
  de branding deliberada (ver `PROPUESTA_BLOOM.md`, sección 4): busca transmitir calma en
  vez de "vigilancia", coherente con el enfoque no punitivo del producto.
- El botón `.btn` es **decorativo por ahora**: no tiene `onclick` ni `href`. Al hacer clic
  no pasa nada. Cuando se agregue lógica de registro/login, este botón es el punto de
  entrada natural.
- `express.static(__dirname)` (ver sección 2) es lo que hace que este archivo sea visible
  en el navegador — no hay un router de frontend todavía.

Cómo verlo: abrí el navegador en `http://localhost:3000` una vez que el servidor esté
corriendo (sección 5), o simplemente abrí el archivo `index.html` directamente con doble
clic (sin servidor) si solo querés ver el diseño.

---

## 2. Backend — `server.js`

Es el punto de entrada del servidor (`"main": "server.js"` en `package.json`). Usa
**Express**, el framework de Node más común para levantar servidores HTTP con rutas.

```js
require('dotenv').config();       // carga variables desde .env
const express = require('express');
const path = require('path');
const pool = require('./db');     // conexión a PostgreSQL (sección 3)

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));   // sirve index.html y cualquier archivo estático

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Bloom corriendo en el puerto ${PORT}`);
});
```

Qué hace cada parte:
- `app.use(express.static(__dirname))`: convierte cualquier archivo de la carpeta del
  proyecto (como `index.html`) en accesible por URL directamente. Por eso no hace falta
  una ruta explícita para servir CSS/imágenes si se agregan más adelante.
- `GET /`: responde explícitamente con `index.html` al entrar a la raíz del sitio.
- `GET /api/health`: es un **endpoint de diagnóstico** ("health check"). No es una
  funcionalidad de producto — sirve para verificar que el servidor está vivo *y* que
  puede hablar con la base de datos. Hace `SELECT NOW()` (la hora actual del servidor de
  Postgres) y la devuelve en JSON. Si la base de datos falla, responde con status 500 y el
  mensaje de error.
- `app.listen(PORT, ...)`: arranca el servidor. `PORT` viene de la variable de entorno
  `PORT` (Railway la define automáticamente en producción) o cae a `3000` en local.

Probarlo: con el servidor corriendo, entrar a `http://localhost:3000/api/health` en el
navegador debería devolver algo como:
```json
{"status":"ok","dbTime":"2026-07-28T..."}
```

---

## 3. Base de datos — `db.js` + PostgreSQL

```js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
```

Qué hace:
- Usa `pg`, el driver oficial de PostgreSQL para Node.
- Crea un **pool de conexiones** en vez de abrir una conexión nueva por cada consulta.
  Un pool reutiliza conexiones abiertas, lo cual es más eficiente si el servidor recibe
  varias peticiones a la vez.
- `connectionString: process.env.DATABASE_URL`: la URL completa de conexión (usuario,
  contraseña, host, puerto, nombre de la base) se lee desde una variable de entorno, nunca
  hardcodeada en el código. Esto es clave para no subir credenciales al repositorio.
- `ssl: { rejectUnauthorized: false }`: habilita conexión cifrada (SSL), necesaria porque
  Railway expone la base de datos por internet, no en la misma red local.
- `module.exports = pool` expone ese pool para que otros archivos (hoy solo `server.js`)
  puedan hacer consultas con `pool.query(...)`.

Hoy no hay tablas ni esquema definidos todavía — la conexión funciona, pero no hay
modelo de datos (usuarios, hábitos, registros) implementado. Ese es el siguiente paso
lógico según la hoja de ruta de `PROPUESTA_BLOOM.md` (Fase 1).

---

## 4. Configuración — `package.json` y `.env`

### `package.json`
```json
{
  "name": "bloom-app",
  "version": "0.1.0",
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.12.0",
    "dotenv": "^16.4.5"
  }
}
```
- `"scripts": { "start": "node server.js" }` define el comando `npm start`, que ejecuta
  el servidor.
- Las tres dependencias son exactamente las que se usan en `server.js`/`db.js`:
  **Express** (servidor HTTP), **pg** (cliente de PostgreSQL) y **dotenv** (variables de
  entorno).

### `.env` (no se sube al repositorio — está en `.gitignore`)
Contiene las variables de entorno reales, típicamente:
```
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/basededatos
PORT=3000
```
`dotenv` lee este archivo al arrancar (`require('dotenv').config()`) y carga esos valores
en `process.env`. En producción (Railway), estas variables se configuran directamente en
el panel de la plataforma, no mediante un archivo `.env`.

---

## 5. Cómo correr la app en local

1. Instalar las dependencias (una sola vez, o cada vez que cambie `package.json`):
   ```
   npm install
   ```
2. Crear un archivo `.env` en la raíz del proyecto con al menos:
   ```
   DATABASE_URL=<tu cadena de conexión a Postgres>
   ```
3. Arrancar el servidor:
   ```
   npm start
   ```
4. Abrir `http://localhost:3000` en el navegador para ver la landing, y
   `http://localhost:3000/api/health` para verificar la conexión a la base de datos.

Si no tenés acceso a una base de datos Postgres a mano, el servidor igual arranca y sirve
`index.html`; solo `/api/health` fallará con error 500.

---

## 6. Despliegue — Railway

Según `PROPUESTA_BLOOM.md`, la app está desplegada en Railway (servicio
"empowering-serenity"), que aloja tanto el backend Express como la base de datos
PostgreSQL en la misma plataforma. Railway define automáticamente la variable `PORT` y
permite referenciar la URL de la base de datos entre servicios
(`${{Postgres.DATABASE_URL}}`), evitando configurar infraestructura desde cero.

---

## 7. Qué falta (próximos pasos técnicos)

Siguiendo la hoja de ruta del proyecto:
- Definir el esquema de datos (tablas de usuarios, hábitos, registros de tiempo).
- Agregar rutas de API más allá de `/api/health` (por ejemplo `/api/habitos`,
  `/api/usuarios`).
- Conectar el botón "Comenzar" del frontend a un flujo real (registro/login).
- Eventualmente migrar el frontend a un framework de UI (ej. React) si la cantidad de
  pantallas crece, manteniendo Express como backend/API.

Para el contexto de producto (por qué existe Bloom, público objetivo, modelo de negocio),
ver `PROPUESTA_BLOOM.md`. Para una evaluación crítica del estado del proyecto, ver
`DOCUMENTACION.md`.
